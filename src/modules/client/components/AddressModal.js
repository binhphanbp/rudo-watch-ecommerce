import api from '../../../shared/services/api.js';
import Swal from 'sweetalert2';

// Toast
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  },
});

class AddressModal {
  constructor(onSelectCallback) {
    this.onSelectCallback = onSelectCallback; // Callback khi chọn địa chỉ
    this.addresses = [];
    this.provinces = [];
    this.wards = [];
    this.selectedAddress = null;
    this.isAddMode = false;
    this.isEditMode = false;
    this.editingAddressId = null;

    this.createModal();
    this.attachEventListeners();
    this.loadProvinces();
  }

  createModal() {
    const modalHTML = `
      <div id="address-modal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 hidden">
        <div class="flex items-center justify-center min-h-screen p-4">
          <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <!-- Header -->
            <div class="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between z-10">
              <h3 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span id="modal-title">Chọn địa chỉ giao hàng</span>
              </h3>
              <button id="close-address-modal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Content -->
            <div class="overflow-y-auto max-h-[calc(90vh-140px)] px-6 py-4">
              <!-- Address List View -->
              <div id="address-list-view">
                <div class="mb-4">
                  <button id="add-new-address-btn" class="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    Thêm địa chỉ mới
                  </button>
                </div>
                <div id="addresses-container" class="space-y-3">
                  <!-- Addresses will be rendered here -->
                </div>
              </div>

              <!-- Add/Edit Address Form -->
              <div id="address-form-view" class="hidden">
                <form id="address-form" class="space-y-4">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Họ và tên <span class="text-red-500">*</span>
                      </label>
                      <input type="text" id="addr-receiver-name" required
                        class="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Nguyễn Văn A" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Số điện thoại <span class="text-red-500">*</span>
                      </label>
                      <input type="tel" id="addr-receiver-phone" required
                        class="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="0382832609" />
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Tỉnh/Thành phố <span class="text-red-500">*</span>
                      </label>
                      <select id="addr-province" required
                        class="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer">
                        <option value="">Chọn Tỉnh/TP</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Phường/Xã <span class="text-red-500">*</span>
                      </label>
                      <select id="addr-ward" required disabled
                        class="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer disabled:opacity-50">
                        <option value="">Chọn Phường/Xã</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Địa chỉ cụ thể <span class="text-red-500">*</span>
                    </label>
                    <input type="text" id="addr-street" required
                      class="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Số nhà, tên đường..." />
                  </div>

                  <div class="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <input type="checkbox" id="addr-is-default" class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer" />
                    <label for="addr-is-default" class="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                      Đặt làm địa chỉ mặc định
                    </label>
                  </div>

                  <div class="flex gap-3">
                    <button type="button" id="cancel-address-form-btn"
                      class="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all">
                      Hủy
                    </button>
                    <button type="submit"
                      class="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all">
                      <span id="submit-btn-text">Lưu địa chỉ</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  attachEventListeners() {
    // Close modal
    document
      .getElementById('close-address-modal')
      .addEventListener('click', () => this.hide());
    document.getElementById('address-modal').addEventListener('click', (e) => {
      if (e.target.id === 'address-modal') this.hide();
    });

    // Add new address
    document
      .getElementById('add-new-address-btn')
      .addEventListener('click', () => this.showAddForm());

    // Cancel form
    document
      .getElementById('cancel-address-form-btn')
      .addEventListener('click', () => this.showList());

    // Submit form
    document
      .getElementById('address-form')
      .addEventListener('submit', (e) => this.handleSubmitForm(e));

    // Province change
    document
      .getElementById('addr-province')
      .addEventListener('change', (e) => this.handleProvinceChange(e));
  }

  async loadProvinces() {
    try {
      const response = await fetch('https://provinces.open-api.vn/api/p/');
      const data = await response.json();
      this.provinces = data.sort((a, b) => a.name.localeCompare(b.name));

      const select = document.getElementById('addr-province');
      select.innerHTML =
        '<option value="">Chọn Tỉnh/TP</option>' +
        this.provinces
          .map(
            (p) =>
              `<option value="${p.code}" data-name="${p.name}">${p.name}</option>`
          )
          .join('');
    } catch (err) {
      console.error('Lỗi load provinces:', err);
    }
  }

  async handleProvinceChange(e) {
    const provinceCode = e.target.value;
    const wardSelect = document.getElementById('addr-ward');

    if (!provinceCode) {
      wardSelect.disabled = true;
      wardSelect.innerHTML = '<option value="">Chọn Phường/Xã</option>';
      return;
    }

    try {
      const response = await fetch(
        `https://provinces.open-api.vn/api/p/${provinceCode}?depth=3`
      );
      const data = await response.json();

      // Collect all wards from all districts
      this.wards = [];
      data.districts?.forEach((district) => {
        district.wards?.forEach((ward) => {
          this.wards.push({
            code: ward.code,
            name: ward.name,
            districtName: district.name,
          });
        });
      });

      this.wards.sort((a, b) => a.name.localeCompare(b.name));

      wardSelect.disabled = false;
      wardSelect.innerHTML =
        '<option value="">Chọn Phường/Xã</option>' +
        this.wards
          .map(
            (w) =>
              `<option value="${w.code}" data-name="${w.name}" data-district="${w.districtName}">${w.name} (${w.districtName})</option>`
          )
          .join('');
    } catch (err) {
      console.error('Lỗi load wards:', err);
      wardSelect.disabled = true;
    }
  }

  async loadAddresses() {
    try {
      const res = await api.get('/addresses');
      console.log('API Response Addresses:', res.data);

      // Handle nested response structure
      if (res.data && res.data.data && Array.isArray(res.data.data.data)) {
        this.addresses = res.data.data.data;
      } else if (res.data && Array.isArray(res.data.data)) {
        this.addresses = res.data.data;
      } else if (Array.isArray(res.data)) {
        this.addresses = res.data;
      } else {
        this.addresses = [];
      }

      // Ensure only one default address
      const defaultAddresses = this.addresses.filter((a) => a.is_default);
      if (defaultAddresses.length > 1) {
        console.warn('⚠️ Multiple default addresses found');
        this.addresses = this.addresses.map((a, idx) => ({
          ...a,
          is_default:
            idx === this.addresses.findIndex((addr) => addr.is_default) ? 1 : 0,
        }));
      } else if (defaultAddresses.length === 0 && this.addresses.length > 0) {
        this.addresses[0].is_default = 1;
      }

      this.renderAddresses();
    } catch (err) {
      console.error('Lỗi load addresses:', err);
      Toast.fire({ icon: 'error', title: 'Lỗi tải danh sách địa chỉ' });
    }
  }

  renderAddresses() {
    const container = document.getElementById('addresses-container');

    if (!this.addresses.length) {
      container.innerHTML = `
        <div class="text-center py-8 text-gray-500 dark:text-gray-400">
          <svg class="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          <p>Chưa có địa chỉ giao hàng</p>
          <p class="text-sm mt-1">Nhấn "Thêm địa chỉ mới" để thêm</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.addresses
      .map((addr) => {
        const fullAddress = [addr.street, addr.ward, addr.province]
          .filter(Boolean)
          .join(', ');
        const receiverInfo =
          addr.receiver_name || addr.receiver_phone
            ? `<div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
             ${addr.receiver_name || ''} ${
                addr.receiver_phone ? `- ${addr.receiver_phone}` : ''
              }
           </div>`
            : '';
        const defaultBadge = addr.is_default
          ? `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">Mặc định</span>`
          : '';

        return `
        <div class="flex items-start gap-3 p-4 rounded-xl border ${
          addr.is_default
            ? 'border-blue-300 dark:border-blue-700 bg-blue-50/30 dark:bg-blue-900/10'
            : 'border-gray-200 dark:border-slate-700'
        } hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-all cursor-pointer group" data-address-id="${
          addr.id
        }">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              <div class="font-medium text-slate-900 dark:text-white">${fullAddress}</div>
              ${defaultBadge}
            </div>
            ${receiverInfo}
          </div>
          <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button type="button" class="text-sm font-medium text-blue-500 hover:underline" onclick="window.addressModal.editAddress('${
              addr.id
            }')">
              Sửa
            </button>
            <button type="button" class="text-sm font-medium text-red-500 hover:underline" onclick="window.addressModal.deleteAddress('${
              addr.id
            }')">
              Xóa
            </button>
          </div>
        </div>
      `;
      })
      .join('');

    // Add click event to select address
    container.querySelectorAll('[data-address-id]').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON') {
          const addressId = el.getAttribute('data-address-id');
          this.selectAddress(addressId);
        }
      });
    });
  }

  selectAddress(addressId) {
    const address = this.addresses.find(
      (a) => String(a.id) === String(addressId)
    );
    if (!address) return;

    this.selectedAddress = address;
    if (this.onSelectCallback) {
      this.onSelectCallback(address);
    }
    this.hide();
    Toast.fire({ icon: 'success', title: 'Đã chọn địa chỉ giao hàng' });
  }

  async setAsDefault(addressId) {
    const address = this.addresses.find(
      (a) => String(a.id) === String(addressId)
    );
    if (!address || address.is_default) return;

    try {
      Swal.showLoading();

      const updatePromises = [];

      // Update old default to 0
      const oldDefault = this.addresses.find(
        (a) => a.is_default && String(a.id) !== String(addressId)
      );
      if (oldDefault) {
        updatePromises.push(
          api.put(`/addresses/${oldDefault.id}`, {
            ...oldDefault,
            is_default: 0,
          })
        );
      }

      // Update new default to 1
      updatePromises.push(
        api.put(`/addresses/${addressId}`, {
          ...address,
          is_default: 1,
        })
      );

      await Promise.all(updatePromises);
      await this.loadAddresses();

      Swal.close();
      Toast.fire({ icon: 'success', title: 'Đã đặt làm địa chỉ mặc định' });
    } catch (err) {
      console.error('Lỗi set default:', err);
      Swal.close();
      Toast.fire({ icon: 'error', title: 'Lỗi cập nhật địa chỉ' });
    }
  }

  showAddForm() {
    this.isAddMode = true;
    this.isEditMode = false;
    this.editingAddressId = null;

    document.getElementById('modal-title').textContent = 'Thêm địa chỉ mới';
    document.getElementById('submit-btn-text').textContent = 'Lưu địa chỉ';
    document.getElementById('address-list-view').classList.add('hidden');
    document.getElementById('address-form-view').classList.remove('hidden');

    // Reset form
    document.getElementById('address-form').reset();
    document.getElementById('addr-ward').disabled = true;
  }

  async editAddress(addressId) {
    const address = this.addresses.find(
      (a) => String(a.id) === String(addressId)
    );
    if (!address) return;

    this.isAddMode = false;
    this.isEditMode = true;
    this.editingAddressId = addressId;

    document.getElementById('modal-title').textContent = 'Sửa địa chỉ';
    document.getElementById('submit-btn-text').textContent = 'Cập nhật';
    document.getElementById('address-list-view').classList.add('hidden');
    document.getElementById('address-form-view').classList.remove('hidden');

    // Fill form with address data
    document.getElementById('addr-receiver-name').value =
      address.receiver_name || '';
    document.getElementById('addr-receiver-phone').value =
      address.receiver_phone || '';
    document.getElementById('addr-street').value = address.street || '';
    document.getElementById('addr-is-default').checked = address.is_default
      ? true
      : false;

    // Set province
    const provinceSelect = document.getElementById('addr-province');
    const provinceOption = Array.from(provinceSelect.options).find(
      (opt) => opt.getAttribute('data-name') === address.province
    );
    if (provinceOption) {
      provinceSelect.value = provinceOption.value;
      await this.handleProvinceChange({ target: provinceSelect });

      // Set ward
      const wardSelect = document.getElementById('addr-ward');
      const wardOption = Array.from(wardSelect.options).find(
        (opt) => opt.getAttribute('data-name') === address.ward
      );
      if (wardOption) {
        wardSelect.value = wardOption.value;
      }
    }
  }

  async deleteAddress(addressId) {
    const address = this.addresses.find(
      (a) => String(a.id) === String(addressId)
    );
    if (!address) return;

    const result = await Swal.fire({
      title: 'Xóa địa chỉ?',
      text: 'Bạn có chắc muốn xóa địa chỉ này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
    });

    if (!result.isConfirmed) return;

    try {
      Swal.showLoading();
      await api.delete(`/addresses/${addressId}`);
      await this.loadAddresses();
      Swal.close();
      Toast.fire({ icon: 'success', title: 'Đã xóa địa chỉ' });
    } catch (err) {
      console.error('Lỗi xóa địa chỉ:', err);
      Swal.close();
      Toast.fire({ icon: 'error', title: 'Lỗi xóa địa chỉ' });
    }
  }

  async handleSubmitForm(e) {
    e.preventDefault();

    const receiverName = document
      .getElementById('addr-receiver-name')
      .value.trim();
    const receiverPhone = document
      .getElementById('addr-receiver-phone')
      .value.trim();
    const street = document.getElementById('addr-street').value.trim();
    const provinceSelect = document.getElementById('addr-province');
    const wardSelect = document.getElementById('addr-ward');
    const province =
      provinceSelect.options[provinceSelect.selectedIndex]?.getAttribute(
        'data-name'
      ) || '';
    const ward =
      wardSelect.options[wardSelect.selectedIndex]?.getAttribute('data-name') ||
      '';
    const isDefault = document.getElementById('addr-is-default').checked
      ? 1
      : 0;

    if (!street || !province) {
      Toast.fire({ icon: 'warning', title: 'Vui lòng điền đầy đủ thông tin' });
      return;
    }

    const user = JSON.parse(localStorage.getItem('user')) || {};
    const userId = user.id;
    if (!userId) {
      Toast.fire({ icon: 'error', title: 'Vui lòng đăng nhập' });
      return;
    }

    const addressData = {
      user_id: userId,
      receiver_name: receiverName,
      receiver_phone: receiverPhone,
      street,
      ward,
      province,
      is_default: isDefault,
    };

    try {
      Swal.showLoading();

      if (this.isEditMode) {
        // Update existing address
        await api.put(`/addresses/${this.editingAddressId}`, addressData);
      } else {
        // Create new address
        await api.post('/addresses', addressData);
      }

      await this.loadAddresses();
      Swal.close();
      this.showList();
      Toast.fire({
        icon: 'success',
        title: this.isEditMode ? 'Đã cập nhật địa chỉ' : 'Đã thêm địa chỉ mới',
      });
    } catch (err) {
      console.error('Lỗi lưu địa chỉ:', err);
      Swal.close();
      Toast.fire({ icon: 'error', title: 'Lỗi lưu địa chỉ' });
    }
  }

  showList() {
    document.getElementById('address-list-view').classList.remove('hidden');
    document.getElementById('address-form-view').classList.add('hidden');
    document.getElementById('modal-title').textContent =
      'Chọn địa chỉ giao hàng';
  }

  async show() {
    await this.loadAddresses();
    this.showList();
    document.getElementById('address-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  hide() {
    document.getElementById('address-modal').classList.add('hidden');
    document.body.style.overflow = '';
  }

  getDefaultAddress() {
    return (
      this.addresses.find((a) => a.is_default) || this.addresses[0] || null
    );
  }
}

// Initialize function for easy use
export const initAddressModal = (onSelectCallback) => {
  return new AddressModal(onSelectCallback);
};

export default AddressModal;

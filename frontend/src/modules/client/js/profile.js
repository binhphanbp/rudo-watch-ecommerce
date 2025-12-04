import { formatCurrency } from '../../../shared/utils/format.js';
import { ProductCard } from '../components/ProductCard.js';
import api from '../../../shared/services/api.js';

import Swal, { Toast } from '../../../shared/utils/swal.js';

// API Provinces Vietnam
const PROVINCES_API = 'https://provinces.open-api.vn/api';

// Cache dữ liệu
let provincesCache = null;
let districtsCache = {};
let wardsCache = {};


// 1. SWITCH TAB LOGIC
window.switchProfileTab = (tabId) => {
  // Ẩn hết content
  document
    .querySelectorAll('.profile-content')
    .forEach((el) => el.classList.add('hidden'));
  // Hiện content cần thiết
  document.getElementById(`tab-${tabId}`).classList.remove('hidden');

  // Update nút active bên sidebar
  document.querySelectorAll('.profile-tab-btn').forEach((btn) => {
    btn.classList.remove(
      'bg-blue-50',
      'text-blue-600',
      'dark:bg-blue-900/20',
      'dark:text-blue-400'
    );
    btn.classList.add('text-slate-600', 'dark:text-slate-300'); // Reset về màu thường
  });

  const buttons = document.querySelectorAll('.profile-tab-btn');
  const index = ['info', 'orders', 'wishlist', 'settings'].indexOf(tabId);
  if (index >= 0) {
    buttons[index].classList.remove('text-slate-600', 'dark:text-slate-300');
    buttons[index].classList.add(
      'bg-blue-50',
      'text-blue-600',
      'dark:bg-blue-900/20',
      'dark:text-blue-400'
    );
  }
};

// Render đầy đủ thông tin người dùng
const renderInfo = () => {
  const user = JSON.parse(localStorage.getItem('user'));

  const nameInput = document.getElementById('username');
  const phoneInput = document.getElementById('phone');
  const emailInput = document.getElementById('email');
  const addressInput = document.getElementById('address');
  const sidebarName = document.getElementById('sidebar-name');
  const membershipEl = document.getElementById('membership');
  const avatarPreview = document.getElementById('avatar-preview');

  if (!user) return; // Không có user, giữ nguyên giá trị mặc định

  const displayName = user.fullname || user.name || 'Người dùng';

  if (nameInput) nameInput.value = displayName;
  if (phoneInput) phoneInput.value = user.phone || '';
  if (emailInput) emailInput.value = user.email || '';
  if (addressInput)
    addressInput.value = user.address || localStorage.getItem('address') || '';

  if (sidebarName) sidebarName.textContent = displayName;
  if (membershipEl)
    membershipEl.textContent = user.role === 1 ? 'Quản trị viên' : 'Thành viên';

  if (avatarPreview) {
    const avatarUrl = user?.avatar
      ? user.avatar.startsWith('http')
        ? user.avatar
        : `http://localhost/rudo-watch-ecommerce-api/backend/${user.avatar}`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(
        displayName || 'User'
      )}&background=random&color=fff`;
    avatarPreview.src = avatarUrl;
  }
  // Render danh sách địa chỉ giao hàng
  renderAddresses();
};


// Load danh sách đơn hàng từ API
const loadOrdersFromAPI = async () => {
  try {
    const res = await api.get('/orders');
    const orders = res.data?.data || res.data || [];
    renderOrders(orders);
  } catch (err) {
    console.error('Lỗi load đơn hàng:', err);
    const container = document.getElementById('order-list');
    if (container) {
      container.innerHTML = `<tr><td colspan="6" class="text-center text-red-500 py-4">Lỗi tải đơn hàng: ${err.message}</td></tr>`;
    }
  }
};

// Render danh sách đơn hàng
const renderOrders = (orders = []) => {
  const container = document.getElementById('order-list');
  if (!container) return;

  const getStatusBadge = (status) => {
    if (status === 'shipping' || status === 'processing')
      return `<span class="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">Đang giao</span>`;
    if (status === 'completed' || status === 'delivered')
      return `<span class="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">Hoàn thành</span>`;
    if (status === 'cancelled' || status === 'canceled')
      return `<span class="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">Đã hủy</span>`;
    if (status === 'pending')
      return `<span class="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">Chờ xử lý</span>`;
    return '';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (!orders.length) {
    container.innerHTML = `<tr><td colspan="6" class="text-center text-gray-500 py-4">Chưa có đơn hàng nào</td></tr>`;
    return;
  }

  container.innerHTML = orders
    .map(
      (order) => {
        const orderId = `#RD${String(order.id).padStart(4, '0')}`;
        const orderDate = formatDate(order.created_at);
        const products = order.order_detail || order.items || [];
        const productNames = products.map(item => item.product_name || item.name || 'Sản phẩm').join(', ') || 'N/A';
        const total = parseFloat(order.total) || 0;
        const status = order.status || 'pending';

        return `
          <tr class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <td class="py-4 font-bold text-[#0A2A45] dark:text-blue-400">${orderId}</td>
            <td class="py-4 text-gray-500">${orderDate}</td>
            <td class="py-4 max-w-[200px] truncate text-slate-900 dark:text-white font-medium">${productNames}</td>
            <td class="py-4 font-bold">${formatCurrency(total)}</td>
            <td class="py-4">${getStatusBadge(status)}</td>
            <td class="py-4 text-right">
              <button class="text-sm font-bold text-blue-600 hover:underline">Chi tiết</button>
            </td>
          </tr>
        `;
      }
    )
    .join('');
};

// Load danh sách sản phẩm yêu thích từ API
const loadWishlistFromAPI = async () => {
  try {
    const res = await api.get('/favorites');
    const favorites = res.data?.data || res.data || [];

    // Nếu API trả về chỉ có product_id, cần load thông tin sản phẩm
    if (favorites.length > 0 && favorites[0].product_id && !favorites[0].name) {
      const productIds = favorites.map(f => f.product_id);
      const productsRes = await Promise.all(
        productIds.map(id => api.get(`/products/${id}`).catch(() => null))
      );
      const products = productsRes
        .filter(Boolean)
        .map(res => res.data?.data || res.data)
        .filter(Boolean);
      renderWishlist(products);
    } else {
      renderWishlist(favorites);
    }
  } catch (err) {
    console.error('Lỗi load sản phẩm yêu thích:', err);
    const container = document.getElementById('wishlist-grid');
    if (container) {
      container.innerHTML = `<div class="col-span-full text-center py-10 text-red-500">Lỗi tải sản phẩm yêu thích: ${err.message}</div>`;
    }
  }
};

// Render danh sách sản phẩm yêu thích
const renderWishlist = (wishlist = []) => {
  const container = document.getElementById('wishlist-grid');
  if (!container) return;

  if (!wishlist.length) {
    container.innerHTML = `<div class="col-span-full text-center py-10 text-gray-500">Danh sách yêu thích trống.</div>`;
    return;
  }

  container.innerHTML = wishlist
    .map((p) => {
      // Render ProductCard string
      let cardHTML = ProductCard(p);
      // Thay nút tim thành nút xóa (hoặc active tim)
      return cardHTML.replace(
        'text-gray-400 hover:text-red-500',
        'text-red-500 fill-current'
      );
    })
    .join('');
};

// -------------------------
// ENABLE EDIT INFO MODE
// -------------------------
window.enableEditInfo = () => {
  const usernameInput = document.getElementById('username');
  const phoneInput = document.getElementById('phone');
  const saveBtn = document.getElementById('save-info-btn');
  const editIcon = document.getElementById('edit-info-icon');

  if (usernameInput) {
    usernameInput.disabled = false;
    usernameInput.classList.remove('text-gray-500');
    usernameInput.classList.add('text-slate-900', 'dark:text-white');
  }

  if (phoneInput) {
    phoneInput.disabled = false;
    phoneInput.classList.remove('text-gray-500');
    phoneInput.classList.add('text-slate-900', 'dark:text-white');
  }

  if (saveBtn) {
    saveBtn.classList.remove('hidden');
  }

  if (editIcon) {
    editIcon.classList.add('hidden');
  }
};

// -------------------------
// DISABLE EDIT INFO MODE
// -------------------------
const disableEditInfo = () => {
  const usernameInput = document.getElementById('username');
  const phoneInput = document.getElementById('phone');
  const saveBtn = document.getElementById('save-info-btn');
  const editIcon = document.getElementById('edit-info-icon');

  if (usernameInput) {
    usernameInput.disabled = true;
    usernameInput.classList.remove('text-slate-900', 'dark:text-white');
    usernameInput.classList.add('text-gray-500');
  }

  if (phoneInput) {
    phoneInput.disabled = true;
    phoneInput.classList.remove('text-slate-900', 'dark:text-white');
    phoneInput.classList.add('text-gray-500');
  }

  if (saveBtn) {
    saveBtn.classList.add('hidden');
  }

  if (editIcon) {
    editIcon.classList.remove('hidden');
  }
};

// -------------------------
// UPDATE HEADER USER NAME
// -------------------------
const updateHeaderUserName = (newName) => {
  // Tìm element chứa tên user trong header dropdown
  // Tìm avatar link trước, sau đó tìm dropdown menu gần đó
  const avatarLink = document.querySelector('header a[href="/profile.html"]');
  if (avatarLink) {
    // Tìm parent container chứa dropdown
    const userDropdownContainer = avatarLink.closest('.relative.group');
    if (userDropdownContainer) {
      // Tìm element chứa tên user trong dropdown
      const userNameElement = userDropdownContainer.querySelector('div.px-4.py-3 p');
      if (userNameElement) {
        userNameElement.textContent = newName;
      }
    }
  }

  // Cập nhật avatar nếu avatar là từ ui-avatars (không phải upload)
  const avatarImg = document.querySelector('header a[href="/profile.html"] img');
  if (avatarImg && avatarImg.src.includes('ui-avatars.com')) {
    // Cập nhật avatar URL với tên mới
    const newAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(newName)}&background=random&color=fff`;
    avatarImg.src = newAvatarUrl;
  }
};

// ACTIONS
window.saveInfo = async () => {
  const usernameInput = document.getElementById('username');
  const phoneInput = document.getElementById('phone');
  const username = usernameInput?.value?.trim();
  const phone = phoneInput?.value?.trim();

  if (!username) {
    Toast.fire({ icon: 'warning', title: 'Vui lòng nhập họ và tên' });
    return;
  }

  try {
    Swal.showLoading();
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const user_id = user.id;

    if (!user_id) {
      Swal.close();
      Toast.fire({ icon: 'error', title: 'Vui lòng đăng nhập' });
      return;
    }

    await api.put(`user/update/${user_id}`, {
      fullname: username,
      phone: phone
    });

    // Cập nhật localStorage
    const updatedUser = { ...user, fullname: username, phone: phone };
    localStorage.setItem('user', JSON.stringify(updatedUser));

    // Cập nhật UI
    const sidebarName = document.getElementById('sidebar-name');
    if (sidebarName) sidebarName.textContent = username;

    // Cập nhật tên user trên header
    updateHeaderUserName(username);

    Swal.close();
    Toast.fire({ icon: 'success', title: 'Thông tin tài khoản đã được cập nhật!' });

    // Tắt chế độ edit
    disableEditInfo();
  } catch (err) {
    console.error('Lỗi cập nhật thông tin:', err);
    Swal.close();
    const errorMsg = err?.response?.data?.message || err?.message || 'Cập nhật thông tin thất bại';
    Toast.fire({ icon: 'error', title: errorMsg });
  }
};

window.changePassword = () => {
  Swal.fire({
    icon: 'success',
    title: 'Thành công',
    text: 'Mật khẩu đã được thay đổi. Vui lòng đăng nhập lại.',
    showConfirmButton: true,
    confirmButtonColor: '#0A2A45',
  });
};

window.handleLogout = () => {
  Swal.fire({
    title: 'Đăng xuất?',
    text: 'Bạn có chắc muốn đăng xuất khỏi tài khoản?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'Đăng xuất',
    cancelButtonText: 'Hủy',
  }).then((result) => {
    if (result.isConfirmed) {
      window.location.href = '/login.html'; // Chuyển về trang login
    }
  });
};

// Xóa tất cả sản phẩm yêu thích
window.clearWishlist = async () => {
  const result = await Swal.fire({
    title: 'Xác nhận xóa',
    text: 'Bạn có chắc muốn xóa tất cả sản phẩm yêu thích?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Xóa tất cả',
    cancelButtonText: 'Hủy'
  });

  if (!result.isConfirmed) return;

  try {
    Swal.showLoading();
    await api.delete('/favorites');
    await loadWishlistFromAPI();
    Swal.close();
    Toast.fire({ icon: 'success', title: 'Đã xóa tất cả sản phẩm yêu thích' });
  } catch (err) {
    console.error('Lỗi xóa sản phẩm yêu thích:', err);
    Swal.close();
    const errorMsg = err?.response?.data?.message || err?.message || 'Xóa sản phẩm yêu thích thất bại';
    Toast.fire({ icon: 'error', title: errorMsg });
  }
};

// -------------------------
// ĐỊA CHỈ GIAO HÀNG
// -------------------------
let isAddOpen = false;
let isEditOpen = false;

// State lưu tạm danh sách địa chỉ
let allAddresses = [];

// -------------------------
// LẤY DANH SÁCH ĐỊA CHỈ
// -------------------------
const loadAddressesFromAPI = async (showLoading = true) => {
  try {
    if (showLoading) {
      Swal.showLoading();
    }
    const res = await api.get('/addresses');
    console.log('API Response Addresses:', res.data);

    // Xử lý cấu trúc API (Laravel style: data.data)
    if (res.data && res.data.data && Array.isArray(res.data.data.data)) {
      allAddresses = res.data.data.data;
    } else if (res.data && Array.isArray(res.data.data)) {
      allAddresses = res.data.data;
    } else if (Array.isArray(res.data)) {
      allAddresses = res.data;
    } else {
      allAddresses = [];
    }

    // Chuẩn hóa id và selected về kiểu string/bool để nhất quán
    allAddresses = allAddresses.map((a, idx) => ({
      ...a,
      id: String(a.id ?? a._id ?? a.uuid ?? Date.now() + idx),
      selected: Boolean(a.selected),
    }));

    renderAddresses();
    if (showLoading) {
      Swal.close();
    }
  } catch (err) {
    console.error('Lỗi API addresses:', err);
    if (showLoading) {
      Swal.close();
    }
    const container = document.getElementById('address-list');
    if (container)
      container.innerHTML = `<div class="text-center text-red-500">Lỗi tải địa chỉ: ${err.message}</div>`;
  }
};

// -------------------------
// RENDER DANH SÁCH
// -------------------------
const renderAddresses = () => {
  const container = document.getElementById('address-list');
  if (!container) return;

  if (!allAddresses.length) {
    container.innerHTML = `<div class="text-sm text-gray-500">Chưa có địa chỉ. Vui lòng thêm bên dưới.</div>`;
    return;
  }

  container.innerHTML = allAddresses
    .map((addr) => {
      const checked = addr.is_default ? 'checked' : '';
      const text = [addr.street, addr.ward, addr.province].filter(Boolean).join(', ');
      const receiverInfo = addr.receiver_name || addr.receiver_phone
        ? `<div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Người nhận: ${addr.receiver_name || ''}${addr.receiver_phone ? ` - ${addr.receiver_phone}` : ''}</div>`
        : '';
      const defaultBadge = addr.is_default
        ? `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">Mặc định</span>`
        : '';
      return `
        <div class="flex items-start gap-3 p-4 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/40 ${addr.is_default ? 'border-blue-300 dark:border-blue-700 bg-blue-50/30 dark:bg-blue-900/10' : ''}">
          <input type="radio" name="delivery-address" class="mt-1" ${checked} onchange="selectAddress('${addr.id}')" />
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <div class="font-medium text-slate-900 dark:text-white">${text}</div>
              ${defaultBadge}
            </div>
            ${receiverInfo}
          </div>
          <div class="flex gap-2">
            <button type="button" class="text-sm font-medium text-blue-500 hover:underline" onclick="openEditById('${addr.id}')">Sửa</button>
            <button type="button" class="text-sm font-medium text-red-500 hover:underline" onclick="deleteAddress('${addr.id}')">Xóa</button>
          </div>
        </div>
      `;
    })
    .join('');
};

// -------------------------
// CHỌN ĐỊA CHỈ MẶC ĐỊNH
// -------------------------
window.selectAddress = async (id) => {
  const selectedAddr = allAddresses.find(a => String(a.id) === String(id));
  if (!selectedAddr) return;

  // Nếu địa chỉ đã là mặc định, không làm gì
  if (selectedAddr.is_default) {
    return;
  }

  // Nếu địa chỉ chưa phải mặc định, hiển thị alert xác nhận
  const result = await Swal.fire({
    title: 'Đặt làm địa chỉ mặc định?',
    text: 'Bạn có muốn đổi sang địa chỉ này làm mặc định không?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#0A2A45',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Đồng ý',
    cancelButtonText: 'Hủy'
  });
  if (!result.isConfirmed) {
    // Nếu hủy, reset lại radio button về địa chỉ mặc định hiện tại
    const defaultAddr = allAddresses.find(a => a.is_default);
    if (defaultAddr) {
      // Tìm radio button của địa chỉ mặc định bằng cách kiểm tra onchange attribute
      const radios = document.querySelectorAll('input[name="delivery-address"]');
      radios.forEach(radio => {
        if (radio.getAttribute('onchange')?.includes(`'${defaultAddr.id}'`)) {
          radio.checked = true;
        }
      });
    } else {
      // Nếu không có địa chỉ mặc định, bỏ chọn tất cả
      document.querySelectorAll('input[name="delivery-address"]').forEach(r => r.checked = false);
    }
    return;
  }

  // Đồng ý đổi mặc định
  try {
    Swal.showLoading();
    // Set is_default = 0 cho địa chỉ mặc định cũ (nếu có)
    const oldDefaultAddr = allAddresses.find(a => a.is_default && String(a.id) !== String(id));
    const updatePromises = [];

    if (oldDefaultAddr) {
      // Cập nhật địa chỉ cũ: set is_default = 0, giữ nguyên các trường khác
      updatePromises.push(
        api.put(`/addresses/${oldDefaultAddr.id}`, {
          street: oldDefaultAddr.street,
          ward: oldDefaultAddr.ward,
          province: oldDefaultAddr.province,
          receiver_name: oldDefaultAddr.receiver_name,
          receiver_phone: oldDefaultAddr.receiver_phone,
          is_default: 0
        })
      );
    }

    // Cập nhật địa chỉ mới: set is_default = 1, giữ nguyên các trường khác
    updatePromises.push(
      api.put(`/addresses/${id}`, {
        street: selectedAddr.street,
        ward: selectedAddr.ward,
        province: selectedAddr.province,
        receiver_name: selectedAddr.receiver_name,
        receiver_phone: selectedAddr.receiver_phone,
        is_default: 1
      })
    );

    await Promise.all(updatePromises);

    // Reload danh sách từ API (không hiển thị loading vì đã có ở trên)
    await loadAddressesFromAPI(false);
    Swal.close();
    Toast.fire({ icon: 'success', title: 'Đã đặt làm địa chỉ mặc định' });
  } catch (err) {
    console.error('Lỗi cập nhật địa chỉ mặc định:', err);
    Swal.close();
    const errorMsg = err?.response?.data?.message || err?.message || 'Cập nhật địa chỉ mặc định thất bại';
    Toast.fire({ icon: 'error', title: errorMsg });

    // Reset lại radio button về địa chỉ mặc định hiện tại
    const defaultAddr = allAddresses.find(a => a.is_default);
    if (defaultAddr) {
      const radios = document.querySelectorAll('input[name="delivery-address"]');
      radios.forEach(radio => {
        if (radio.getAttribute('onchange')?.includes(`'${defaultAddr.id}'`)) {
          radio.checked = true;
        }
      });
    }
  }
};


// -------------------------
// MỞ FORM EDIT
// -------------------------
window.openEditById = async (id) => {
  const addr = allAddresses.find(a => String(a.id) === String(id));
  if (!addr) {
    Toast.fire({ icon: 'error', title: 'Không tìm thấy địa chỉ' });
    return;
  }

  // Load provinces trước
  await populateProvinces('edit-addr');

  // Điền đầy đủ thông tin vào form edit
  const idEl = document.getElementById('edit-addr-id');
  const streetEl = document.getElementById('edit-addr-street');
  const provinceEl = document.getElementById('edit-addr-province');
  const districtEl = document.getElementById('edit-addr-district');
  const wardEl = document.getElementById('edit-addr-ward');
  const nameEl = document.getElementById('edit-addr-name');
  const phoneEl = document.getElementById('edit-addr-phone');

  if (idEl) idEl.value = addr.id || '';
  if (streetEl) streetEl.value = addr.street || '';
  if (nameEl) nameEl.value = addr.receiver_name || '';
  if (phoneEl) phoneEl.value = addr.receiver_phone || '';

  // Set tỉnh/thành phố
  if (provinceEl && addr.province) {
    // Tìm option có text matching với province
    const options = Array.from(provinceEl.options);
    const matchingOption = options.find(opt => opt.textContent === addr.province || opt.value === addr.province);
    if (matchingOption) {
      provinceEl.value = matchingOption.value;
      const provinceCode = matchingOption.dataset.code;
      if (provinceCode) {
        await populateDistricts(provinceCode, 'edit-addr');
        // Nếu có ward, cố gắng set district và ward
        if (addr.ward && districtEl) {
          const districtOptions = Array.from(districtEl.options);
          // Tìm district matching (có thể cần load wards sau)
          // Tạm thời set ward value nếu có
        }
      }
    } else {
      // Nếu không tìm thấy trong dropdown, set value trực tiếp (fallback)
      provinceEl.value = addr.province;
    }
  }

  // Set ward (nếu có)
  if (wardEl && addr.ward) {
    // Ward sẽ được set sau khi load districts và wards
    // Tạm thời set value
    setTimeout(async () => {
      if (districtEl && districtEl.value) {
        const selectedDistrict = districtEl.options[districtEl.selectedIndex];
        const districtCode = selectedDistrict?.dataset.code;
        if (districtCode) {
          await populateWards(districtCode, 'edit-addr');
          // Set ward value
          const wardOptions = Array.from(wardEl.options);
          const matchingWard = wardOptions.find(opt => opt.textContent === addr.ward || opt.value === addr.ward);
          if (matchingWard) {
            wardEl.value = matchingWard.value;
          } else {
            wardEl.value = addr.ward;
          }
        }
      }
    }, 500);
  }

  const section = document.getElementById('edit-address-section');
  if (section) {
    section.classList.remove('hidden');
    isEditOpen = true;
    section.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

window.editAddress = (id) => {
  if (isAddOpen) {
    Swal.fire({
      title: 'Đang thêm địa chỉ',
      text: 'Mọi thay đổi sẽ không được lưu. Tiếp tục?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0A2A45',
      confirmButtonText: 'OK',
      cancelButtonText: 'Hủy',
    }).then((r) => {
      if (r.isConfirmed) {
        cancelAddAddress();
        openEditById(id);
      }
    });
    return;
  }
  openEditById(id);
};

// -------------------------
// CẬP NHẬT ĐỊA CHỈ
// -------------------------
window.updateAddress = async (event) => {
  event.preventDefault();
  const id = document.getElementById('edit-addr-id')?.value;
  const street = document.getElementById('edit-addr-street')?.value?.trim();
  const wardSelect = document.getElementById('edit-addr-ward');
  const provinceSelect = document.getElementById('edit-addr-province');
  const ward = wardSelect?.value?.trim() || '';
  const province = provinceSelect?.value?.trim() || '';
  const receiver_name = document.getElementById('edit-addr-name')?.value?.trim();
  const receiver_phone = document.getElementById('edit-addr-phone')?.value?.trim();

  if (!id || !street || !province) {
    Toast.fire({ icon: 'warning', title: 'Vui lòng nhập tối thiểu Tên đường và Tỉnh/Thành phố' });
    return;
  }

  try {
    Swal.showLoading();
    await api.put(`/addresses/${id}`, {
      street,
      ward,
      province,
      receiver_name,
      receiver_phone
    });

    // Reload danh sách từ API để đảm bảo dữ liệu mới nhất (không hiển thị loading vì đã có ở trên)
    await loadAddressesFromAPI(false);
    Swal.close();
    cancelEditAddress();
    Toast.fire({ icon: 'success', title: 'Đã cập nhật địa chỉ' });
  } catch (err) {
    console.error('Lỗi cập nhật địa chỉ:', err);
    Swal.close();
    const errorMsg = err?.response?.data?.message || err?.message || 'Cập nhật địa chỉ thất bại';
    Toast.fire({ icon: 'error', title: errorMsg });
  }
};

// -------------------------
// THÊM ĐỊA CHỈ MỚI
// -------------------------
window.addAddress = async (event) => {
  event.preventDefault();

  const street = document.getElementById('addr-street')?.value?.trim();
  const wardSelect = document.getElementById('addr-ward');
  const provinceSelect = document.getElementById('addr-province');
  const ward = wardSelect?.value?.trim() || '';
  const province = provinceSelect?.value?.trim() || '';
  const receiver_name = document.getElementById('addr-name')?.value?.trim();
  const receiver_phone = document.getElementById('addr-phone')?.value?.trim();

  // Lấy user_id từ localStorage (hoặc từ token)
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const user_id = user.id;
  if (!user_id) {
    Toast.fire({ icon: 'error', title: 'Vui lòng đăng nhập' });
    return;
  }

  if (!street || !province) {
    Toast.fire({ icon: 'warning', title: 'Vui lòng nhập tối thiểu Tên đường và Tỉnh/Thành phố' });
    return;
  }

  try {
    Swal.showLoading();
    const res = await api.post('/addresses', {
      user_id,
      street,
      ward,
      province,
      receiver_name,
      receiver_phone,
      is_default: 0
    });

    // Reload danh sách từ API để đảm bảo dữ liệu mới nhất (không hiển thị loading vì đã có ở trên)
    await loadAddressesFromAPI(false);
    Swal.close();
    cancelAddAddress();
    Toast.fire({ icon: 'success', title: 'Đã thêm địa chỉ giao hàng' });
  } catch (err) {
    console.error('Lỗi thêm địa chỉ:', err.response?.data || err.message);
    Swal.close();
    Toast.fire({ icon: 'error', title: 'Lỗi thêm địa chỉ: ' + (err.response?.data?.message || err.message) });
  }
};


// -------------------------
// HÀM SHOW/CANCEL FORM ADD
// -------------------------

window.openAddAddress = () => {
  if (isEditOpen) {
    Swal.fire({
      title: 'Đang sửa địa chỉ',
      text: 'Mọi thay đổi sẽ không được lưu. Tiếp tục?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0A2A45',
      confirmButtonText: 'OK',
      cancelButtonText: 'Hủy',
    }).then((r) => {
      if (r.isConfirmed) {
        cancelEditAddress();
        showAddForm();
      }
    });
    return;
  }
  showAddForm();
};

window.cancelAddAddress = () => {
  const section = document.getElementById('add-address-section');
  if (section) section.classList.add('hidden');
  isAddOpen = false;
  // Reset form
  document.getElementById('addr-street')?.value && (document.getElementById('addr-street').value = '');
  document.getElementById('addr-province')?.value && (document.getElementById('addr-province').value = '');
  document.getElementById('addr-district')?.value && (document.getElementById('addr-district').value = '');
  document.getElementById('addr-district')?.disabled && (document.getElementById('addr-district').disabled = true);
  document.getElementById('addr-ward')?.value && (document.getElementById('addr-ward').value = '');
  document.getElementById('addr-ward')?.disabled && (document.getElementById('addr-ward').disabled = true);
  document.getElementById('addr-name')?.value && (document.getElementById('addr-name').value = '');
  document.getElementById('addr-phone')?.value && (document.getElementById('addr-phone').value = '');
  // Reset dropdowns
  const provinceSelect = document.getElementById('addr-province');
  const districtSelect = document.getElementById('addr-district');
  const wardSelect = document.getElementById('addr-ward');
  if (provinceSelect) provinceSelect.selectedIndex = 0;
  if (districtSelect) {
    districtSelect.innerHTML = '<option value="">-- Chọn Quận/Huyện --</option>';
    districtSelect.disabled = true;
  }
  if (wardSelect) {
    wardSelect.innerHTML = '<option value="">-- Chọn Phường/Xã --</option>';
    wardSelect.disabled = true;
  }
};

// -------------------------
// CANCEL EDIT
// -------------------------
window.cancelEditAddress = () => {
  const section = document.getElementById('edit-address-section');
  if (section) section.classList.add('hidden');
  isEditOpen = false;
  // Reset form
  document.getElementById('edit-addr-id')?.value && (document.getElementById('edit-addr-id').value = '');
  document.getElementById('edit-addr-street')?.value && (document.getElementById('edit-addr-street').value = '');
  document.getElementById('edit-addr-province')?.value && (document.getElementById('edit-addr-province').value = '');
  document.getElementById('edit-addr-district')?.value && (document.getElementById('edit-addr-district').value = '');
  document.getElementById('edit-addr-district')?.disabled && (document.getElementById('edit-addr-district').disabled = true);
  document.getElementById('edit-addr-ward')?.value && (document.getElementById('edit-addr-ward').value = '');
  document.getElementById('edit-addr-ward')?.disabled && (document.getElementById('edit-addr-ward').disabled = true);
  document.getElementById('edit-addr-name')?.value && (document.getElementById('edit-addr-name').value = '');
  document.getElementById('edit-addr-phone')?.value && (document.getElementById('edit-addr-phone').value = '');
  // Reset dropdowns
  const provinceSelect = document.getElementById('edit-addr-province');
  const districtSelect = document.getElementById('edit-addr-district');
  const wardSelect = document.getElementById('edit-addr-ward');
  if (provinceSelect) provinceSelect.selectedIndex = 0;
  if (districtSelect) {
    districtSelect.innerHTML = '<option value="">-- Chọn Quận/Huyện --</option>';
    districtSelect.disabled = true;
  }
  if (wardSelect) {
    wardSelect.innerHTML = '<option value="">-- Chọn Phường/Xã --</option>';
    wardSelect.disabled = true;
  }
};

// -------------------------
// XÓA ĐỊA CHỈ
// -------------------------
window.deleteAddress = async (id) => {
  const result = await Swal.fire({
    title: 'Xác nhận xóa',
    text: 'Bạn có chắc muốn xóa địa chỉ này?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Xóa',
    cancelButtonText: 'Hủy'
  });

  if (!result.isConfirmed) return;
  Swal.showLoading();
  try {
    await api.delete(`/addresses/${id}`);
    // Reload danh sách từ API (không hiển thị loading vì đã có ở trên)
    await loadAddressesFromAPI(false);
    Swal.close();
    Toast.fire({ icon: 'success', title: 'Đã xóa địa chỉ' });
  } catch (err) {
    console.error('Lỗi xóa địa chỉ:', err);
    const errorMsg = err?.response?.data?.message || err?.message || 'Xóa địa chỉ thất bại';
    Toast.fire({ icon: 'error', title: errorMsg });
  }
};



// -------------------------
// ĐỔI EMAIL
// -------------------------
window.changeEmail = async (event) => {
  event.preventDefault();
  const input = document.getElementById('new-email');
  const email = input?.value?.trim();
  if (!email) {
    Toast.fire({ icon: 'warning', title: 'Vui lòng nhập Email mới' });
    return;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    Toast.fire({ icon: 'error', title: 'Email không hợp lệ' });
    return;
  }

  try {
    const res = await api.put('user/update', { email });
    const updated = res?.data?.user;
    if (updated) {
      localStorage.setItem('user', JSON.stringify(updated));
      // cập nhật UI
      const emailInput = document.getElementById('email');
      if (emailInput) emailInput.value = updated.email || email;
      Toast.fire({ icon: 'success', title: 'Đã cập nhật Email' });
    } else {
      Toast.fire({ icon: 'success', title: 'Đã gửi yêu cầu cập nhật Email' });
    }
  } catch (err) {
    const msg = err?.response?.data?.error || 'Cập nhật email thất bại';
    Toast.fire({ icon: 'error', title: msg });
  }
};

// -------------------------
// PROVINCES API FUNCTIONS
// -------------------------

// Load danh sách tỉnh/thành phố
const loadProvinces = async () => {
  if (provincesCache) return provincesCache;

  try {
    const response = await fetch(`${PROVINCES_API}/v2/`);
    const data = await response.json();
    provincesCache = data;
    return data;
  } catch (err) {
    console.error('Lỗi load tỉnh/thành phố:', err);
    return [];
  }
};

// Load danh sách quận/huyện theo tỉnh
const loadDistricts = async (provinceCode) => {
  if (districtsCache[provinceCode]) return districtsCache[provinceCode];

  try {
    const response = await fetch(`${PROVINCES_API}/p/${provinceCode}?depth=2`);
    const data = await response.json();
    // API có thể trả về districts trong data hoặc data.districts
    const districts = data.districts || (Array.isArray(data) ? data : []);
    districtsCache[provinceCode] = districts;
    return districts;
  } catch (err) {
    console.error('Lỗi load quận/huyện:', err);
    return [];
  }
};

// Load danh sách phường/xã theo quận/huyện
const loadWards = async (districtCode) => {
  if (wardsCache[districtCode]) return wardsCache[districtCode];

  try {
    const response = await fetch(`${PROVINCES_API}/d/${districtCode}?depth=2`);
    const data = await response.json();
    // API có thể trả về wards trong data hoặc data.wards
    const wards = data.wards || (Array.isArray(data) ? data : []);
    wardsCache[districtCode] = wards;
    return wards;
  } catch (err) {
    console.error('Lỗi load phường/xã:', err);
    return [];
  }
};

// Populate tỉnh/thành phố vào select
const populateProvinces = async (prefix = 'addr') => {
  const select = document.getElementById(`${prefix}-province`);
  if (!select) return;

  const provinces = await loadProvinces();
  select.innerHTML = '<option value="">-- Chọn Tỉnh/Thành phố --</option>';

  provinces.forEach(province => {
    const option = document.createElement('option');
    option.value = province.name;
    option.textContent = province.name;
    option.dataset.code = province.code;
    select.appendChild(option);
  });
};

// Populate quận/huyện vào select
const populateDistricts = async (provinceCode, prefix = 'addr') => {
  const select = document.getElementById(`${prefix}-district`);
  if (!select) return;

  select.disabled = true;
  select.innerHTML = '<option value="">-- Đang tải... --</option>';

  const districts = await loadDistricts(provinceCode);
  select.innerHTML = '<option value="">-- Chọn Quận/Huyện --</option>';

  if (districts.length > 0) {
    select.disabled = false;
    districts.forEach(district => {
      const option = document.createElement('option');
      option.value = district.name;
      option.textContent = district.name;
      option.dataset.code = district.code;
      select.appendChild(option);
    });
  } else {
    select.innerHTML = '<option value="">-- Không có dữ liệu --</option>';
  }
};

// Populate phường/xã vào select
const populateWards = async (districtCode, prefix = 'addr') => {
  const select = document.getElementById(`${prefix}-ward`);
  if (!select) return;

  select.disabled = true;
  select.innerHTML = '<option value="">-- Đang tải... --</option>';

  const wards = await loadWards(districtCode);
  select.innerHTML = '<option value="">-- Chọn Phường/Xã --</option>';

  if (wards.length > 0) {
    select.disabled = false;
    wards.forEach(ward => {
      const option = document.createElement('option');
      option.value = ward.name;
      option.textContent = ward.name;
      select.appendChild(option);
    });
  } else {
    select.innerHTML = '<option value="">-- Không có dữ liệu --</option>';
  }
};

// Xử lý khi chọn tỉnh/thành phố
window.onProvinceChange = async (formType = 'add') => {
  const prefix = formType === 'edit' ? 'edit-addr' : 'addr';
  const provinceSelect = document.getElementById(`${prefix}-province`);
  const districtSelect = document.getElementById(`${prefix}-district`);
  const wardSelect = document.getElementById(`${prefix}-ward`);

  if (!provinceSelect || !districtSelect || !wardSelect) return;

  const selectedOption = provinceSelect.options[provinceSelect.selectedIndex];
  const provinceCode = selectedOption?.dataset.code;

  // Reset quận/huyện và phường/xã
  districtSelect.innerHTML = '<option value="">-- Chọn Quận/Huyện --</option>';
  districtSelect.disabled = true;
  wardSelect.innerHTML = '<option value="">-- Chọn Phường/Xã --</option>';
  wardSelect.disabled = true;

  if (provinceCode) {
    await populateDistricts(provinceCode, prefix);
  }
};

// Xử lý khi chọn quận/huyện
window.onDistrictChange = async (formType = 'add') => {
  const prefix = formType === 'edit' ? 'edit-addr' : 'addr';
  const districtSelect = document.getElementById(`${prefix}-district`);
  const wardSelect = document.getElementById(`${prefix}-ward`);

  if (!districtSelect || !wardSelect) return;

  const selectedOption = districtSelect.options[districtSelect.selectedIndex];
  const districtCode = selectedOption?.dataset.code;

  // Reset phường/xã
  wardSelect.innerHTML = '<option value="">-- Chọn Phường/Xã --</option>';
  wardSelect.disabled = true;

  if (districtCode) {
    await populateWards(districtCode, prefix);
  }
};

// Load provinces khi mở form add
const showAddForm = () => {
  const section = document.getElementById('add-address-section');
  if (section) {
    section.classList.remove('hidden');
    isAddOpen = true;
    populateProvinces('addr');
    section.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  loadOrdersFromAPI();
  loadWishlistFromAPI();
  loadAddressesFromAPI();
  renderInfo();

  // Highlight tab đầu tiên
  const firstBtn = document.querySelector('.profile-tab-btn');
  if (firstBtn) {
    firstBtn.classList.remove('text-slate-600', 'dark:text-slate-300');
    firstBtn.classList.add(
      'bg-blue-50',
      'text-blue-600',
      'dark:bg-blue-900/20',
      'dark:text-blue-400'
    );
  }
});

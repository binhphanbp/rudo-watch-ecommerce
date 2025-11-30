import { formatCurrency } from '../../../shared/utils/format.js';
import { ProductCard } from '../components/ProductCard.js';
import api from '../../../shared/services/api.js';

import Swal, { Toast } from '../../../shared/utils/swal.js';

// Mock data orders
const orders = [
  {
    id: '#RD1023',
    date: '20/11/2025',
    product: 'Rolex Yacht-Master 42',
    total: 35250000,
    status: 'shipping',
  },
  {
    id: '#RD1020',
    date: '15/10/2025',
    product: 'Apple Watch Ultra 2, Tissot PRX',
    total: 39500000,
    status: 'completed',
  },
  {
    id: '#RD0998',
    date: '01/09/2025',
    product: 'Hublot Classic Fusion',
    total: 21000000,
    status: 'cancelled',
  },
];

// MOCK DATA WISHLIST
const wishlist = [
  {
    id: 2,
    name: 'Hublot Big Bang Unico',
    brand: 'Hublot',
    price: 45000000,
    image: '/images/products/hublot-bigbang.png',
    colors: ['#000'],
  },
  {
    id: 4,
    name: 'Tissot PRX Powermatic',
    brand: 'Tissot',
    price: 18000000,
    image:
      'https://www.tissotwatches.com/media/catalog/product/t/1/t137_407_11_041_00_1.png?im=Resize=(800,800)',
    colors: ['#1E3A8A'],
  },
];

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


// RENDER ORDERS
const renderOrders = () => {
  const container = document.getElementById('order-list');

  const getStatusBadge = (status) => {
    if (status === 'shipping')
      return `<span class="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">Đang giao</span>`;
    if (status === 'completed')
      return `<span class="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">Hoàn thành</span>`;
    if (status === 'cancelled')
      return `<span class="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">Đã hủy</span>`;
    return '';
  };

  container.innerHTML = orders
    .map(
      (order) => `
        <tr class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <td class="py-4 font-bold text-[#0A2A45] dark:text-blue-400">${order.id
        }</td>
            <td class="py-4 text-gray-500">${order.date}</td>
            <td class="py-4 max-w-[200px] truncate text-slate-900 dark:text-white font-medium">${order.product
        }</td>
            <td class="py-4 font-bold">${formatCurrency(order.total)}</td>
            <td class="py-4">${getStatusBadge(order.status)}</td>
            <td class="py-4 text-right">
                <button class="text-sm font-bold text-blue-600 hover:underline">Chi tiết</button>
            </td>
        </tr>
    `
    )
    .join('');
};

// RENDER WISHLIST
const renderWishlist = () => {
  const container = document.getElementById('wishlist-grid');
  // Tận dụng component ProductCard, nhưng có thể custom thêm nút xóa tim
  container.innerHTML = wishlist
    .map((p) => {
      // Render ProductCard string
      let cardHTML = ProductCard(p);
      // Hack: Thay nút tim thành nút xóa (hoặc active tim)
      return cardHTML.replace(
        'text-gray-400 hover:text-red-500',
        'text-red-500 fill-current'
      );
    })
    .join('');
};

// ACTIONS
window.saveInfo = () => {
  Swal.fire({
    icon: 'success',
    title: 'Thành công',
    text: 'Thông tin tài khoản đã được cập nhật!',
    timer: 2000,
    showConfirmButton: false,
  });
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

window.clearWishlist = () => {
  const container = document.getElementById('wishlist-grid');
  container.innerHTML = `<div class="col-span-full text-center py-10 text-gray-500">Danh sách yêu thích trống.</div>`;
};

// -------------------------
// ĐỊA CHỈ GIAO HÀNG
// -------------------------
let isAddOpen = false;
let isEditOpen = false;
// Mock data demo 1-2 địa chỉ
const mockAddresses = [
  {
    id: 'ADDR001',
    street: '12 Nguyễn Huệ',
    ward: 'Bến Nghé',
    district: 'Quận 1',
    province: 'TP. Hồ Chí Minh',
    country: 'Việt Nam',
  },
  {
    id: 'ADDR002',
    street: '45 Lê Lợi',
    ward: 'Phú Nhuận',
    district: 'Phú Nhuận',
    province: 'TP. Hồ Chí Minh',
    country: 'Việt Nam',
  },
];

const getAddressKey = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const uid = user?.id || 'guest';
  return `addresses_${uid}`;
};

const getSelectedAddressKey = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const uid = user?.id || 'guest';
  return `selected_address_${uid}`;
};

const loadAddresses = () => {
  try {
    const raw = localStorage.getItem(getAddressKey());
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

const saveAddresses = (list) => {
  localStorage.setItem(getAddressKey(), JSON.stringify(list));
};

const ensureInitialAddresses = () => {
  const list = loadAddresses();
  if (!list || list.length === 0) {
    saveAddresses(mockAddresses);
  }
};

const renderAddresses = () => {
  const container = document.getElementById('address-list');
  if (!container) return;

  const addresses = loadAddresses();
  const selectedId = localStorage.getItem(getSelectedAddressKey());

  if (!addresses.length) {
    container.innerHTML = `<div class="text-sm text-gray-500">Chưa có địa chỉ. Vui lòng thêm bên dưới.</div>`;
    return;
  }

  container.innerHTML = addresses
    .map((addr) => {
      const id = addr.id;
      const checked = String(selectedId) === String(id) ? 'checked' : '';
      const text = [
        addr.street,
        addr.ward,
        addr.district,
        addr.province,
        addr.country,
      ]
        .filter(Boolean)
        .join(', ');
      return `
        <div class="flex items-start gap-3 p-4 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/40">
          <input type="radio" name="delivery-address" class="mt-1" ${checked} onchange="selectAddress('${id}')" />
          <div class="flex-1">
            <div class="font-medium text-slate-900 dark:text-white">${text}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">Mã: ${id}</div>
          </div>
          <button type="button" class="text-sm font-medium text-blue-500" onclick="editAddress('${id}')">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </button>
        </div>
      `;
    })
    .join('');
};

window.selectAddress = (id) => {
  localStorage.setItem(getSelectedAddressKey(), String(id));
};

const openEditById = (id) => {
  const list = loadAddresses();
  const addr = list.find((a) => String(a.id) === String(id));
  if (!addr) return;
  const section = document.getElementById('edit-address-section');
  const idEl = document.getElementById('edit-addr-id');
  const streetEl = document.getElementById('edit-addr-street');
  const wardEl = document.getElementById('edit-addr-ward');
  const districtEl = document.getElementById('edit-addr-district');
  const provinceEl = document.getElementById('edit-addr-province');
  const countryEl = document.getElementById('edit-addr-country');

  if (idEl) idEl.value = addr.id;
  if (streetEl) streetEl.value = addr.street || '';
  if (wardEl) wardEl.value = addr.ward || '';
  if (districtEl) districtEl.value = addr.district || '';
  if (provinceEl) provinceEl.value = addr.province || '';
  if (countryEl) countryEl.value = addr.country || '';

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

window.cancelEditAddress = () => {
  const section = document.getElementById('edit-address-section');
  if (section) section.classList.add('hidden');
  isEditOpen = false;
  ['edit-addr-id', 'edit-addr-street', 'edit-addr-ward', 'edit-addr-district', 'edit-addr-province', 'edit-addr-country']
    .forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
};

window.updateAddress = (event) => {
  event.preventDefault();
  const id = document.getElementById('edit-addr-id')?.value;
  const street = document.getElementById('edit-addr-street')?.value?.trim();
  const ward = document.getElementById('edit-addr-ward')?.value?.trim();
  const district = document.getElementById('edit-addr-district')?.value?.trim();
  const province = document.getElementById('edit-addr-province')?.value?.trim();
  const country = document.getElementById('edit-addr-country')?.value?.trim();

  if (!id) return;
  if (!street || !province || !country) {
    Toast.fire({ icon: 'warning', title: 'Vui lòng nhập tối thiểu Tên đường, Tỉnh/Thành phố và Quốc gia' });
    return;
  }

  const list = loadAddresses();
  const idx = list.findIndex((a) => String(a.id) === String(id));
  if (idx >= 0) {
    list[idx] = { id, street, ward, district, province, country };
    saveAddresses(list);
    renderAddresses();
    cancelEditAddress();
    Toast.fire({ icon: 'success', title: 'Đã cập nhật địa chỉ' });
  }
};

window.addAddress = (event) => {
  event.preventDefault();
  const street = document.getElementById('addr-street')?.value?.trim();
  const ward = document.getElementById('addr-ward')?.value?.trim();
  const district = document.getElementById('addr-district')?.value?.trim();
  const province = document.getElementById('addr-province')?.value?.trim();
  const country = document.getElementById('addr-country')?.value?.trim();

  if (!street || !province || !country) {
    Toast.fire({ icon: 'warning', title: 'Vui lòng nhập tối thiểu Tên đường, Tỉnh/Thành phố và Quốc gia' });
    return;
  }

  const addresses = loadAddresses();
  const newAddr = {
    id: Date.now().toString(),
    street,
    ward,
    district,
    province,
    country,
  };
  addresses.push(newAddr);
  saveAddresses(addresses);
  localStorage.setItem(getSelectedAddressKey(), newAddr.id);

  // Clear form
  ['addr-street', 'addr-ward', 'addr-district', 'addr-province', 'addr-country'].forEach((i) => {
    const el = document.getElementById(i);
    if (el) el.value = '';
  });

  renderAddresses();
  Toast.fire({ icon: 'success', title: 'Đã thêm địa chỉ giao hàng' });
  cancelAddAddress();
};

// Hiển thị/đóng form thêm địa chỉ
const showAddForm = () => {
  const section = document.getElementById('add-address-section');
  if (section) {
    section.classList.remove('hidden');
    isAddOpen = true;
    section.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

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
  ['addr-street', 'addr-ward', 'addr-district', 'addr-province', 'addr-country'].forEach((i) => {
    const el = document.getElementById(i);
    if (el) el.value = '';
  });
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

document.addEventListener('DOMContentLoaded', () => {
  renderOrders();
  renderWishlist();
  ensureInitialAddresses();
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

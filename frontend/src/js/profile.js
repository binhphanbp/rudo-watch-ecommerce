import { formatCurrency } from '../utils/format.js';
import { ProductCard } from '../components/ProductCard.js';

import Swal, { Toast } from '../utils/swal.js';

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
            <td class="py-4 font-bold text-[#0A2A45] dark:text-blue-400">${
              order.id
            }</td>
            <td class="py-4 text-gray-500">${order.date}</td>
            <td class="py-4 max-w-[200px] truncate text-slate-900 dark:text-white font-medium">${
              order.product
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

document.addEventListener('DOMContentLoaded', () => {
  renderOrders();
  renderWishlist();

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

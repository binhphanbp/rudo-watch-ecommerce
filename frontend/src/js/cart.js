import { formatCurrency } from '../utils/format.js';
import CartService from '../services/cart.js'; // <--- Import Service để lấy dữ liệu
import Swal from '../utils/swal.js';

// Hàm vẽ giao diện (Render)
const renderCart = () => {
  // 1. Lấy dữ liệu mới nhất từ Service (LocalStorage)
  const cartData = CartService.getCart();

  const listContainer = document.getElementById('cart-list');
  const mainWrapper = document.getElementById('cart-wrapper');
  const emptyState = document.getElementById('empty-cart');

  // Cập nhật số lượng trên Header (đề phòng)
  const totalQty = cartData.reduce((s, i) => s + i.quantity, 0);
  const countEl = document.getElementById('cart-count');
  if (countEl) countEl.textContent = totalQty;

  // 2. Nếu giỏ hàng trống -> Hiện màn hình Empty
  if (cartData.length === 0) {
    if (mainWrapper) mainWrapper.classList.add('hidden');
    if (emptyState) {
      emptyState.classList.remove('hidden');
      emptyState.classList.add('flex');
    }
    return;
  }

  // 3. Nếu có hàng -> Vẽ ra HTML
  if (listContainer) {
    listContainer.innerHTML = cartData
      .map(
        (item) => `
            <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm group hover:border-blue-200 dark:hover:border-blue-500/30 transition-colors">
                <div class="flex flex-col md:grid md:grid-cols-12 gap-4 items-center">
                    
                    <div class="w-full md:col-span-6 flex items-center gap-4">
                        <div class="w-20 h-20 shrink-0 bg-gray-50 dark:bg-slate-700 rounded-lg p-2 overflow-hidden">
                            <img src="${
                              item.image
                            }" class="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal">
                        </div>
                        <div>
                            <h3 class="font-bold text-slate-900 dark:text-white line-clamp-1">
                                <a href="/product-detail.html?id=${
                                  item.id
                                }" class="hover:text-blue-500">${item.name}</a>
                            </h3>
                            <div class="md:hidden font-bold text-[#0A2A45] dark:text-blue-400 mt-1">
                                ${formatCurrency(item.price)}
                            </div>
                        </div>
                    </div>

                    <div class="hidden md:block md:col-span-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                        ${formatCurrency(item.price)}
                    </div>

                    <div class="w-full md:col-span-2 flex justify-center">
                        <div class="flex items-center border border-gray-200 dark:border-slate-600 rounded-lg">
                            <button onclick="updateQuantity(${
                              item.id
                            }, -1)" class="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">-</button>
                            <input type="text" value="${
                              item.quantity
                            }" readonly class="w-10 h-8 text-center text-sm font-bold bg-transparent border-x border-gray-200 dark:border-slate-600 focus:outline-none">
                            <button onclick="updateQuantity(${
                              item.id
                            }, 1)" class="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">+</button>
                        </div>
                    </div>

                    <div class="w-full md:col-span-2 flex items-center justify-between md:justify-end gap-4">
                        <span class="font-bold text-[#0A2A45] dark:text-blue-400">
                            ${formatCurrency(item.price * item.quantity)}
                        </span>
                        
                        <button onclick="confirmRemove(${
                          item.id
                        })" class="text-gray-300 hover:text-red-500 transition-colors p-2" title="Xóa">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        </button>
                    </div>

                </div>
            </div>
        `
      )
      .join('');
  }

  updateSummary(cartData);
};

// Tính tổng tiền
const updateSummary = (cartData) => {
  const total = cartData.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const subtotalEl = document.getElementById('subtotal-price');
  const totalEl = document.getElementById('total-price');

  if (subtotalEl) subtotalEl.textContent = formatCurrency(total);
  if (totalEl) totalEl.textContent = formatCurrency(total);
};

// === CÁC HÀM GLOBAL (Gắn vào window để HTML gọi được onclick) ===

// 1. Cập nhật số lượng: Gọi sang Service xử lý
window.updateQuantity = (id, change) => {
  CartService.updateQuantity(id, change);
  renderCart(); // Vẽ lại giao diện sau khi cập nhật
};

// 2. Xóa: Hỏi xong mới gọi Service xóa
window.confirmRemove = (id) => {
  Swal.fire({
    title: 'Xóa sản phẩm?',
    text: 'Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Xóa ngay',
    cancelButtonText: 'Hủy',
  }).then((result) => {
    if (result.isConfirmed) {
      CartService.remove(id); // Gọi Service xóa
      renderCart(); // Vẽ lại

      Swal.fire({
        icon: 'success',
        title: 'Đã xóa!',
        showConfirmButton: false,
        timer: 1000,
      });
    }
  });
};

// 3. Thanh toán
window.checkout = () => {
  const token = localStorage.getItem('token');

  if (!token) {
    Swal.fire({
      icon: 'info',
      title: 'Yêu cầu đăng nhập',
      text: 'Bạn cần đăng nhập để tiến hành thanh toán.',
      showCancelButton: true,
      confirmButtonText: 'Đăng nhập ngay',
      cancelButtonText: 'Để sau',
    }).then((res) => {
      if (res.isConfirmed) window.location.href = '/login.html';
    });
    return;
  }

  // Nếu đã đăng nhập -> Sau này sẽ gọi API Order ở đây
  Swal.fire({
    icon: 'success',
    title: 'Đặt hàng thành công!',
    text: '(Tính năng API Order sẽ cập nhật sau)',
  }).then(() => {
    CartService.clear(); // Xóa giỏ hàng sau khi mua
    renderCart();
  });
};

// Khởi chạy khi load trang
document.addEventListener('DOMContentLoaded', () => {
  renderCart();
});

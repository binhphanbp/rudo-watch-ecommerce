import { formatCurrency } from '../utils/format.js';
import Swal, { Toast } from '../utils/swal.js';

let cartData = [
  {
    id: 1,
    name: 'Rolex Yacht-Master 42',
    info: 'Vàng 18k, 42mm',
    price: 35250000,
    image: '/images/products/yatch-master.png',
    quantity: 1,
  },
  {
    id: 3,
    name: 'Apple Watch Ultra 2',
    info: 'Titanium, Dây cam',
    price: 21990000,
    image: '/images/products/yatch-master.png',
    quantity: 2,
  },
  {
    id: 4,
    name: 'Tissot PRX Powermatic 80',
    info: 'Xanh Navy, Thép 316L',
    price: 18500000,
    image: '/images/products/yatch-master.png',
    quantity: 1,
  },
];

const renderCart = () => {
  const listContainer = document.getElementById('cart-list');
  const mainWrapper = document.getElementById('cart-wrapper');
  const emptyState = document.getElementById('empty-cart');

  document.getElementById('cart-count').textContent = cartData.reduce(
    (s, i) => s + i.quantity,
    0
  );

  if (cartData.length === 0) {
    mainWrapper.classList.add('hidden');
    emptyState.classList.remove('hidden');
    emptyState.classList.add('flex');
    return;
  }

  listContainer.innerHTML = cartData
    .map(
      (item) => `
        <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm group hover:border-blue-200 dark:hover:border-blue-500/30 transition-colors">
            <div class="flex flex-col md:grid md:grid-cols-12 gap-4 items-center">
                
                <div class="w-full md:col-span-6 flex items-center gap-4">
                    <div class="w-20 h-20 shrink-0 bg-gray-50 dark:bg-slate-700 rounded-lg p-2 overflow-hidden">
                        <img src="${
                          item.image
                        }" class="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal hover:scale-110 transition-transform">
                    </div>
                    <div>
                        <h3 class="font-bold text-slate-900 dark:text-white line-clamp-1">${
                          item.name
                        }</h3>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">${
                          item.info
                        }</p>
                        <div class="md:hidden font-bold text-[#0A2A45] dark:text-blue-400">
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

  updateSummary();
};

const updateSummary = () => {
  const total = cartData.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  document.getElementById('subtotal-price').textContent = formatCurrency(total);
  document.getElementById('total-price').textContent = formatCurrency(total);
};

// === CÁC HÀM GLOBAL  ===
window.updateQuantity = (id, change) => {
  const item = cartData.find((p) => p.id === id);
  if (item) {
    if (item.quantity + change > 0) {
      item.quantity += change;
      renderCart();
    } else {
      // Nếu giảm về 0 thì hỏi xóa
      window.confirmRemove(id);
    }
  }
};

// Hàm xóa (SweetAlert2)
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
    background: document.documentElement.classList.contains('dark')
      ? '#1e293b'
      : '#fff',
    color: document.documentElement.classList.contains('dark')
      ? '#fff'
      : '#000',
  }).then((result) => {
    if (result.isConfirmed) {
      cartData = cartData.filter((p) => p.id !== id);
      renderCart();

      Toast.fire({
        icon: 'success',
        title: 'Đã xóa sản phẩm thành công',
      });
    }
  });
};

window.checkout = () => {
  Swal.fire({
    title: 'Đang xử lý...',
    text: 'Chuyển hướng đến trang thanh toán',
    icon: 'info',
    timer: 2000,
    showConfirmButton: false,
  });
};

// Xử lý mã giảm giá
document.getElementById('btn-apply-coupon').addEventListener('click', () => {
  const code = document.getElementById('coupon-input').value;
  if (code.trim() === '') {
    Toast.fire({ icon: 'error', title: 'Vui lòng nhập mã giảm giá' });
    return;
  }
  // Giả lập check code
  Toast.fire({
    icon: 'success',
    title: `Đã áp dụng mã: ${code}`,
  });
});

document.addEventListener('DOMContentLoaded', () => {
  renderCart();
});

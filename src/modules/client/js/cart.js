import { formatCurrency } from '../../../shared/utils/format.js';
import CartService from '../../../shared/services/cart.js'; // <--- Import Service để lấy dữ liệu
import api from '../../../shared/services/api.js';
import Swal from '../../../shared/utils/swal.js';
import { initVoucherModal } from '../components/VoucherModal.js';

console.log('Cart JS loaded');

// State quản lý voucher
let appliedVoucher = null;
let voucherModal = null;
// Hàm vẽ giao diện (Render)
const renderCart = () => {
  console.log('Rendering cart...');
  // 1. Lấy dữ liệu mới nhất từ Service (LocalStorage)
  const cartData = CartService.getCart();

  const listContainer = document.getElementById('cart-list');
  const mainWrapper = document.getElementById('cart-wrapper');
  const emptyState = document.getElementById('empty-cart');

  // Cập nhật số lượng sản phẩm
  const totalQty = cartData.reduce((s, i) => s + i.quantity, 0);

  // Cập nhật badge trên Header
  const headerCountEl = document.getElementById('cart-count');
  if (headerCountEl) headerCountEl.textContent = totalQty;

  // Cập nhật số lượng trong trang Cart
  const cartTotalEl = document.getElementById('cart-total-items');
  if (cartTotalEl) cartTotalEl.textContent = totalQty;

  // Xóa tất cả thông báo cảnh báo cũ
  document
    .querySelectorAll('.cart-warning-message')
    .forEach((el) => el.remove());

  // 2. Nếu giỏ hàng trống -> Hiện màn hình Empty
  if (cartData.length === 0) {
    if (mainWrapper) mainWrapper.classList.add('hidden');
    if (emptyState) {
      emptyState.classList.remove('hidden');
      emptyState.classList.add('flex');
      emptyState.innerHTML = `
        <div class="text-center flex flex-col justify-center items-center w-full">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-36 h-36 text-gray-400 dark:text-gray-600 mb-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
          <h3 class="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">Giỏ hàng của bạn còn trống!</h3>
          <p class="text-gray-500 dark:text-gray-400 mb-6">Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm</p>
          <a
            href="/products.html"
            class="px-6 py-3 bg-[#0A2A45] dark:bg-blue-600 text-white font-bold rounded-lg hover:opacity-90 transition-opacity inline-block"
          >
            Xem các sản phẩm khác
          </a>
        </div>`;
    }
    // Reset summary khi cart trống
    const subtotalEl = document.getElementById('subtotal-price');
    const totalEl = document.getElementById('total-price');
    if (subtotalEl) subtotalEl.textContent = formatCurrency(0);
    if (totalEl) totalEl.textContent = formatCurrency(0);
    return;
  }

  // 3. Nếu có hàng -> Hiển thị main wrapper và ẩn empty state
  if (mainWrapper) mainWrapper.classList.remove('hidden');
  if (emptyState) {
    emptyState.classList.add('hidden');
    emptyState.classList.remove('flex');
  }

  // 3. Nếu có hàng -> Vẽ ra HTML
  if (listContainer) {
    listContainer.innerHTML = cartData
      .map(
        (item) => `
            <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm group hover:border-blue-200 dark:hover:border-blue-500/30 transition-colors" id="cart-item-${item.id
          }" data-stock="${item.stock || 999}">
                <div class="flex flex-col md:grid md:grid-cols-12 gap-4 items-center">
                    
                    <div class="w-full md:col-span-6 flex items-center gap-4">
                        <div class="w-20 h-20 shrink-0 bg-gray-50 dark:bg-slate-700 rounded-lg p-2 overflow-hidden">
                            <img src="${item.image
          }" class="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal">
                        </div>
                        <div>
                            <h3 class="font-bold text-slate-900 dark:text-white line-clamp-1">
                                <a href="/product-detail.html?id=${item.product_id || item.id.split('_')[0]
          }" class="hover:text-blue-500">${item.name}</a>
                            </h3>
                            ${item.variant_name || item.color || item.size
            ? `
                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                ${item.variant_name ||
            [item.color, item.size]
              .filter(Boolean)
              .join(', ')
            }
                            </p>
                            `
            : ''
          }
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
                            <button onclick="updateQuantity('${item.id
          }', -1)" class="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">-</button>
                            <input type="text" value="${item.quantity
          }" readonly class="w-10 h-8 text-center text-sm font-bold bg-transparent border-x border-gray-200 dark:border-slate-600 focus:outline-none">
                            <button onclick="updateQuantity('${item.id
          }', 1)" class="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">+</button>
                        </div>
                    </div>

                    <div class="w-full md:col-span-2 flex items-center justify-between md:justify-end gap-4">
                        <span class="font-bold text-[#0A2A45] dark:text-blue-400">
                            ${formatCurrency(item.price * item.quantity)}
                        </span>
                        
                        <button onclick="confirmRemove('${item.id
          }')" class="text-gray-300 hover:text-red-500 transition-colors p-2" title="Xóa">
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
  const subtotal = cartData.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Load voucher from localStorage
  const storedVoucher = localStorage.getItem('applied_voucher');
  if (storedVoucher) {
    try {
      appliedVoucher = JSON.parse(storedVoucher);
    } catch (e) {
      appliedVoucher = null;
      localStorage.removeItem('applied_voucher');
    }
  }

  // Calculate discount
  let discount = 0;
  if (appliedVoucher) {
    discount = appliedVoucher.discount_amount || 0;
  }
  
  const total = subtotal - discount;

  // Update UI
  const subtotalEl = document.getElementById('subtotal-price');
  const discountEl = document.getElementById('discount-price');
  const totalEl = document.getElementById('total-price');

  if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
  if (discountEl) {
    if (discount > 0) {
      discountEl.textContent = `- ${formatCurrency(discount)}`;
      discountEl.parentElement.classList.remove('hidden');
    } else {
      discountEl.parentElement.classList.add('hidden');
    }
  }
  if (totalEl) totalEl.textContent = formatCurrency(total);

  // Render voucher info if applied
  renderVoucherInfo();
};

// Render voucher info card
const renderVoucherInfo = () => {
  const voucherInfo = document.getElementById('voucher-info');
  if (!voucherInfo) return;

  if (!appliedVoucher) {
    voucherInfo.classList.add('hidden');
    voucherInfo.innerHTML = '';
    return;
  }

  voucherInfo.classList.remove('hidden');
  voucherInfo.innerHTML = `
    <div class="relative flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl shadow-sm">
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <svg class="w-6 h-6 text-green-600 dark:text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <div class="flex-1 min-w-0">
          <div class="font-semibold text-base text-slate-900 dark:text-white">
            Đã áp dụng mã: ${appliedVoucher.code}
          </div>
          <div class="text-sm font-medium text-green-600 dark:text-green-400">
            Giảm ${formatCurrency(appliedVoucher.discount_amount)}
          </div>
        </div>
      </div>
      <button 
        onclick="removeVoucher()"
        class="ml-3 p-2 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-lg transition-all group flex-shrink-0"
        title="Xóa mã giảm giá">
        <svg class="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  `;
};

// Remove voucher
window.removeVoucher = () => {
  appliedVoucher = null;
  localStorage.removeItem('applied_voucher');
  
  renderCart();
  
  Swal.fire({
    icon: 'info',
    title: 'Đã xóa mã giảm giá',
    timer: 1500,
    showConfirmButton: false,
    toast: true,
    position: 'top-end'
  });
};

// === CÁC HÀM GLOBAL (Gắn vào window để HTML gọi được onclick) ===

// 1. Cập nhật số lượng: Gọi sang Service xử lý
window.updateQuantity = (id, change) => {
  const result = CartService.updateQuantity(id, change);

  if (!result.success) {
    // Hiển thị cảnh báo
    const itemElement = document.getElementById(`cart-item-${id}`);
    if (itemElement && result.message) {
      // Xóa cảnh báo cũ nếu có
      const oldWarning = itemElement.querySelector('.cart-warning-message');
      if (oldWarning) oldWarning.remove();

      // Tạo cảnh báo mới
      const warningDiv = document.createElement('div');
      warningDiv.className =
        'cart-warning-message col-span-12 mt-2 text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-3 py-2 rounded-lg';
      warningDiv.textContent = result.message;

      itemElement
        .querySelector('.flex.flex-col.md\\:grid')
        .appendChild(warningDiv);

      // Tự động ẩn sau 5 giây
      setTimeout(() => {
        warningDiv.remove();
      }, 5000);
    }
    return;
  }

  renderCart(); // Vẽ lại giao diện sau khi cập nhật thành công
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

      Swal.fire({
        icon: 'success',
        title: 'Đã xóa!',
        showConfirmButton: false,
        timer: 1000,
      });

      // Vẽ lại sau khi đóng popup
      setTimeout(() => {
        renderCart();
      }, 100);
    }
  });
};

// 3. Thanh toán - Redirect to checkout page
window.checkout = () => {
  const cartData = CartService.getCart();

  if (cartData.length === 0) {
    Swal.fire({
      icon: 'info',
      title: 'Giỏ hàng trống',
      text: 'Vui lòng thêm sản phẩm vào giỏ hàng trước.',
    });
    return;
  }

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

  // Lưu voucher vào localStorage để dùng ở trang checkout
  if (appliedVoucher) {
    localStorage.setItem('applied_voucher', JSON.stringify(appliedVoucher));
  }

  // Redirect to checkout page
  window.location.href = '/checkout.html';
};

// 4. Áp dụng mã giảm giá (DEMO VERSION)
window.applyVoucher = async () => {
  const input = document.getElementById('coupon-input');
  const button = document.getElementById('btn-apply-coupon');
  const voucherCode = input?.value?.trim().toUpperCase();

  if (!voucherCode) {
    Swal.fire({
      icon: 'warning',
      title: 'Thiếu mã giảm giá',
      text: 'Vui lòng nhập mã giảm giá.',
    });
    return;
  }

  // Hiển thị loading
  const originalText = button.textContent;
  button.textContent = 'Đang kiểm tra...';
  button.disabled = true;

  try {
    // Tính tổng đơn hàng
    const cartData = CartService.getCart();
    const subtotal = cartData.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Gọi API lấy danh sách vouchers và tìm voucher theo code
    const response = await api.get('/vouchers');
    const result = response.data;
    console.log('Vouchers response:', result);

    // Parse response: {status, data: {data: [...]}}
    const vouchers = result.data?.data || result.data || [];
    const voucherData = vouchers.find(v => v.code === voucherCode);

    if (!voucherData) {
      Swal.fire({
        icon: 'error',
        title: 'Mã không tồn tại',
        text: 'Mã giảm giá không tồn tại trong hệ thống.',
      });
      return;
    }

    // ==================== VALIDATE VOUCHER ====================
    if (!voucherData.start_at) {
    Swal.fire({
        icon: 'error',
        title: 'Mã chưa có hiệu lực',
        text: 'Mã giảm giá này chưa được thiết lập ngày bắt đầu, vui lòng liên hệ quản trị viên.',
    });
    return;
    } 
    const startDate = new Date(voucherData.start_at);
    const now = new Date();

    // Kiểm tra xem ngày có hợp lệ không (tránh lỗi parse date)
    if (isNaN(startDate.getTime())) {
        Swal.fire({
            icon: 'error',
            title: 'Lỗi dữ liệu voucher',
            text: 'Ngày bắt đầu không hợp lệ trong hệ thống.',
        });
        return;
    }
    
    // 1. Check Start At (Ngày bắt đầu) - Voucher chưa đến ngày bắt đầu
    if (startDate > now) {
      Swal.fire({
        icon: 'error',
        title: 'Mã chưa có hiệu lực',
        text: 'Mã giảm giá này chưa đến thời gian sử dụng. Vui lòng đợi đến ngày bắt đầu.',
      });
      return;
    }
    
    // 2. Check Expired At (Ngày hết hạn)
    if (voucherData.expired_at) {
      const expiredDate = new Date(voucherData.expired_at);
      if (expiredDate < now) {
        Swal.fire({
          icon: 'error',
          title: 'Mã đã hết hạn',
          text: 'Mã giảm giá này đã hết hạn sử dụng.',
        });
        return;
      }
    }

    // Dòng debug:
    console.log('Voucher Data:', voucherData);
    // console.log(voucherData.is_not_started) // Có thể xóa hoặc comment dòng này

    

    // 3. Check Usage Limit (Số lượt sử dụng)
    if (voucherData.usage_limit !== null && voucherData.usage_limit <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Mã đã hết lượt',
        text: 'Mã giảm giá này đã hết lượt sử dụng.',
      });
      return;
    }

    // ==================== TÍNH TOÁN VÀ ÁP DỤNG ====================

    // Tính discount
    let discountAmount = 0;
    if (voucherData.type === 'percent') {
      discountAmount = Math.round(subtotal * (voucherData.discount / 100));
    } else if (voucherData.type === 'money') {
      discountAmount = voucherData.amount || 0;
    }
    discountAmount = Math.min(discountAmount, subtotal);
    const finalTotal = subtotal - discountAmount;

    // Áp dụng voucher thành công
    appliedVoucher = {
      code: voucherCode,
      voucher_id: voucherData.id,
      discount_amount: discountAmount,
      final_total: finalTotal,
      type: voucherData.type,
      discount: voucherData.discount,
      amount: voucherData.amount,
      description: `Giảm ${voucherData.type === 'percent' ? voucherData.discount + '%' : formatCurrency(voucherData.amount)}`,
    };

    updateSummary(cartData);

    // Hiển thị thông báo voucher UI
    const voucherInfo = document.getElementById('voucher-info');
    if (voucherInfo) {
      const discountAmount = appliedVoucher.discount_amount || 0;
      const description = appliedVoucher.description || '';

      voucherInfo.innerHTML = `
          <div class="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            <div>
              <p class="text-sm font-bold text-green-800 dark:text-green-200">${voucherCode}</p>
              <p class="text-xs text-green-600 dark:text-green-400">
                ${description} - Tiết kiệm ${formatCurrency(discountAmount)}
                </p>
              </div>
            </div>
              <button onclick="removeVoucher()" class="text-red-500 hover:text-red-700 transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
        </div>
        `;
      voucherInfo.classList.remove('hidden');
    }

    // Disable input và button
    input.disabled = true;
    button.classList.add('hidden');

    Swal.fire({
      icon: 'success',
      title: 'Áp dụng thành công!',
      html: `
        <p class="text-gray-700 mb-2">${appliedVoucher.description}</p>
        <p class="text-green-600 font-bold text-lg">Tiết kiệm ${formatCurrency(
        discountAmount
      )}</p>
        `,
      timer: 3000,
      showConfirmButton: false,
    });
  } catch (error) {
    console.error('❌ Voucher error:', error);

    // Clear voucher khi apply fail
    appliedVoucher = null;
    localStorage.removeItem('applied_voucher');

    // Clear UI
    const voucherInfo = document.getElementById('voucher-info');
    if (voucherInfo) {
      voucherInfo.innerHTML = '';
      voucherInfo.classList.add('hidden');
    }

    // Update lại summary để bỏ discount
    const cartData = CartService.getCart();
    updateSummary(cartData);

    let errorMessage = 'Không thể áp dụng mã giảm giá. Vui lòng thử lại.';

    if (error.response?.data) {
      const errorData = error.response.data;
      errorMessage =
        errorData.message ||
        errorData.error ||
        errorData.data?.message ||
        errorMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }

    Swal.fire({
      icon: 'error',
      title: 'Không thể áp dụng mã',
      text: errorMessage,
    });
  } finally {
    button.textContent = originalText;
    button.disabled = false;
  }
};

// 5. Xóa voucher
window.removeVoucher = () => {
  appliedVoucher = null;
  localStorage.removeItem('applied_voucher');

  const cartData = CartService.getCart();
  updateSummary(cartData);

  const voucherInfo = document.getElementById('voucher-info');
  if (voucherInfo) {
    voucherInfo.classList.add('hidden');
    voucherInfo.innerHTML = '';
  }

  const input = document.getElementById('coupon-input');
  const button = document.getElementById('btn-apply-coupon');
  if (input) {
    input.value = '';
    input.disabled = false;
  }
  if (button) {
    button.classList.remove('hidden');
  }

  Swal.fire({
    icon: 'info',
    title: 'Đã xóa mã giảm giá',
    timer: 1500,
    showConfirmButton: false,
  });
};

// Khởi chạy khi load trang
document.addEventListener('DOMContentLoaded', async () => {
  // Load voucher từ localStorage (KHÔNG XÓA)
  const storedVoucher = localStorage.getItem('applied_voucher');
  if (storedVoucher) {
    try {
      appliedVoucher = JSON.parse(storedVoucher);
    } catch (e) {
      console.error('❌ Invalid voucher data in localStorage:', e);
      localStorage.removeItem('applied_voucher');
      appliedVoucher = null;
    }
  }

  // Sync cart từ API nếu đã đăng nhập (để có stock/price mới nhất)
  const token = localStorage.getItem('token');
  if (token) {
    await CartService.syncFromAPI();
  }

  renderCart();

  // Khởi tạo VoucherModal với callback lưu voucher vào localStorage
  voucherModal = initVoucherModal((voucher) => {
    appliedVoucher = voucher;
    localStorage.setItem('applied_voucher', JSON.stringify(voucher));
    const cartData = CartService.getCart();
    updateSummary(cartData);
    renderVoucherInfo();
  });
  
  console.log('✅ VoucherModal initialized:', voucherModal);
  
  // Gắn hàm mở modal vào window
  window.openVoucherModal = () => {
    console.log('🔵 openVoucherModal called');
    try {
      if (!voucherModal) {
        console.error('❌ voucherModal is null!');
        return;
      }
      const cartData = CartService.getCart();
      const subtotal = cartData.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      console.log('💰 Subtotal:', subtotal);
      voucherModal.show(subtotal);
    } catch (error) {
      console.error('❌ Error opening voucher modal:', error);
    }
  };

  // Gắn sự kiện cho nút áp dụng voucher
  const applyBtn = document.getElementById('btn-apply-coupon');
  if (applyBtn) {
    applyBtn.addEventListener('click', applyVoucher);
  }

  // Cho phép nhấn Enter trong input voucher
  const couponInput = document.getElementById('coupon-input');
  if (couponInput) {
    couponInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        applyVoucher();
      }
    });
  }
});

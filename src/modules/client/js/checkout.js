import { formatCurrency } from '../../../shared/utils/format.js';
import CartService from '../../../shared/services/cart.js';
import Swal from '../../../shared/utils/swal.js';
import api from '../../../shared/services/api.js';
import { createOrder } from '../../../shared/services/order.js';

console.log('Checkout JS loaded');

// Vietnam provinces API data
// let provincesData = [];
let districtsData = [];
let wardsData = [];

// Shipping methods data
let shippingMethods = [];
let selectedShippingMethod = null;

// Load shipping methods from API
const loadShippingMethods = async () => {
  try {
    const response = await api.get('/shipping-methods');
    const result = response.data;

    console.log('API Response:', result);
    if (result.status === 'success' && result.data) {
      shippingMethods = result.data;
      console.log('Shipping Methods:', shippingMethods);
      renderShippingMethods();
    }
  } catch (error) {
    console.error('Error loading shipping methods:', error);
    Swal.fire({
      icon: 'error',
      title: 'Lỗi tải phương thức vận chuyển',
      text: 'Không thể tải danh sách vận chuyển. Vui lòng thử lại.',
    });
  }
};

// Render shipping methods
const renderShippingMethods = () => {
  const container = document.getElementById('shipping-methods');
  if (!container) return;

  if (shippingMethods.length === 0) {
    container.innerHTML =
      '<p class="text-center text-gray-500 py-4">Không có phương thức vận chuyển.</p>';
    return;
  }

  container.innerHTML = shippingMethods
    .map((method, index) => {
      const isChecked = index === 0 ? 'checked' : '';
      console.log('Method:', method);
      // Try both cost and price fields
      const price = Number(method.cost || method.price) || 0;
      const priceText = price === 0 ? 'Miễn phí' : formatCurrency(price);

      return `
        <label
          class="flex items-start gap-3 p-4 border-2 border-gray-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-all has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/20"
        >
          <input
            type="radio"
            name="shipping"
            value="${method.id}"
            data-price="${price}"
            ${isChecked}
            onchange="updateShippingCost(${method.id}, ${price})"
            class="mt-1 w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <div class="font-bold text-slate-900 dark:text-white">
                ${method.name}
              </div>
              <div class="text-lg font-bold text-blue-600 dark:text-blue-400">
                ${priceText}
              </div>
            </div>
          </div>
        </label>
      `;
    })
    .join('');

  // Set default shipping method
  if (shippingMethods.length > 0) {
    selectedShippingMethod = shippingMethods[0];
    updateOrderSummary();
  }
};

// Update shipping cost when selection changes
window.updateShippingCost = (methodId, price) => {
  selectedShippingMethod = shippingMethods.find((m) => m.id == methodId);
  updateOrderSummary();
};

const PROVINCES_API_URL = 'https://esgoo.net/api-tinhthanh-new/4/0.htm';
let provincesData = null;
let wardsCache = {};

// 1. Load danh sách Tỉnh/Thành phố
const loadProvinces = async () => {
  // Nếu đã có cache, sử dụng cache
  if (provincesData) return provincesData;

  try {
    const response = await fetch(PROVINCES_API_URL);
    if (!response.ok) {
      throw new Error(`Lỗi HTTP! Status: ${response.status}`);
    }

    const jsonResponse = await response.json();
    // API esgoo.net trả về dữ liệu Tỉnh trong thuộc tính 'data'
    provincesData = jsonResponse.data || [];

    const provinceSelect = document.getElementById('province');
    // Kiểm tra xem select có tồn tại không
    if (!provinceSelect) {
      console.error("Không tìm thấy phần tử select ID 'province'");
      return;
    }

    provinceSelect.innerHTML = '<option value="">Chọn Tỉnh/TP</option>';

    provincesData.forEach((province) => {
      // Sử dụng ID hoặc CODE của tỉnh để làm value. Dùng CODE ('01') dễ tra cứu hơn
      provinceSelect.innerHTML += `<option value="${province.code}" data-id="${province.id}">${province.name}</option>`;
    });

    return provincesData;
  } catch (error) {
    console.error('Lỗi load tỉnh/thành phố:', error);
    return [];
  }
};

// 2. Load Phường/Xã (Quận/Huyện đã sáp nhập) khi Tỉnh/Thành phố thay đổi
// Hàm này thay thế cho cả loadDistricts và loadWards cũ.
// Nó lấy dữ liệu từ trường 'data2' trong dữ liệu Tỉnh đã tải.
const loadWards = async (provinceCode) => {
  // Tên hàm vẫn là loadWards nhưng logic là tải Phường/Xã/Quận/Huyện theo Tỉnh.
  if (!provincesData) {
    // Đảm bảo dữ liệu Tỉnh đã được tải
    await loadProvinces();
  }

  // Nếu đã có cache Phường/Xã cho tỉnh này, sử dụng cache
  if (wardsCache[provinceCode]) return wardsCache[provinceCode];

  const districtSelect = document.getElementById('district'); // Giữ lại để reset
  const wardSelect = document.getElementById('ward');

  // Vô hiệu hóa và reset District/Ward (Vì cấp District không dùng)
  if (districtSelect) {
    districtSelect.innerHTML = '<option value="">(Không dùng)</option>';
    districtSelect.disabled = true;
  }

  if (!wardSelect) {
    console.error("Không tìm thấy phần tử select ID 'ward'");
    return [];
  }

  wardSelect.innerHTML = '<option value="">-- Đang tải... --</option>';
  wardSelect.disabled = true;

  try {
    // Tìm tỉnh tương ứng và lấy mảng data2
    const province = provincesData.find((p) => p.code === provinceCode);
    const wardsList =
      province && Array.isArray(province.data2) ? province.data2 : [];

    // Lưu vào cache
    wardsCache[provinceCode] = wardsList;

    wardSelect.innerHTML =
      '<option value="">Chọn Phường/Xã/Quận/Huyện</option>';

    if (wardsList.length > 0) {
      wardSelect.disabled = false;

      wardsList.forEach((ward) => {
        // Dùng full_name để hiển thị tên đầy đủ của Phường/Xã/Quận/Huyện
        wardSelect.innerHTML += `<option value="${ward.full_name}" data-code="${ward.code}">${ward.full_name}</option>`;
      });
    }

    return wardsList;
  } catch (error) {
    console.error(
      `Lỗi load Phường/Xã/Quận/Huyện cho mã tỉnh ${provinceCode}:`,
      error
    );
    return [];
  }
};

// ** Hàm loadDistricts bị loại bỏ và thay thế bằng logic trong loadWards **
// const loadDistricts = async (provinceCode) => { ... }

// Event listeners for address dropdowns
// Ví dụ về cách bạn có thể xử lý sự kiện:
document.addEventListener('DOMContentLoaded', () => {
  loadProvinces();

  const provinceSelect = document.getElementById('province');
  if (provinceSelect) {
    provinceSelect.addEventListener('change', async (event) => {
      const provinceCode = event.target.value;

      const wardSelect = document.getElementById('ward');
      if (wardSelect) {
        // Reset ward khi tỉnh thay đổi
        wardSelect.innerHTML =
          '<option value="">Chọn Phường/Xã/Quận/Huyện</option>';
        wardSelect.disabled = true;
      }

      if (provinceCode) {
        await loadWards(provinceCode); // Gọi loadWards với Mã Tỉnh
      }
    });
  }

  // Không cần listener cho district nữa
});

// Render cart items in order summary
const renderOrderSummary = () => {
  // Kiểm tra xem có phải chế độ "Mua ngay" không
  const buyNowMode = sessionStorage.getItem('buy_now_mode') === 'true';
  let cartData;

  if (buyNowMode) {
    // Lấy sản phẩm "Mua ngay" từ sessionStorage
    const buyNowItem = sessionStorage.getItem('buy_now_item');
    if (buyNowItem) {
      cartData = [JSON.parse(buyNowItem)];
      console.log('🛒 Buy now mode - single item:', cartData);
    } else {
      console.warn('Buy now mode but no item found');
      cartData = CartService.getCart();
    }
  } else {
    // Chế độ bình thường - lấy từ giỏ hàng
    cartData = CartService.getCart();
  }

  const orderItemsContainer = document.getElementById('order-items');
  const subtotalEl = document.getElementById('subtotal');
  const totalEl = document.getElementById('total');

  console.log('Cart data in renderOrderSummary:', cartData);

  if (!cartData || cartData.length === 0) {
    console.warn('Cart is empty, redirecting...');
    Swal.fire({
      icon: 'info',
      title: 'Giỏ hàng trống',
      text: 'Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán.',
      confirmButtonText: 'Về trang chủ',
    }).then(() => {
      window.location.href = '/index.html';
    });
    return;
  }

  console.log('✅ Cart has', cartData.length, 'items');

  // Render items
  if (orderItemsContainer) {
    orderItemsContainer.innerHTML = cartData
      .map(
        (item) => `
        <div class="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-slate-700">
          <div class="relative">
            <div class="w-16 h-16 bg-gray-50 dark:bg-slate-700 rounded-lg p-2">
              <img src="${
                item.image
              }" class="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal">
            </div>
            <span class="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">${
              item.quantity
            }</span>
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="font-medium text-sm text-slate-900 dark:text-white line-clamp-2">${
              item.name
            }</h4>
            <p class="text-sm font-bold text-blue-600 dark:text-blue-400 mt-1">${formatCurrency(
              item.price
            )}</p>
          </div>
        </div>
      `
      )
      .join('');
  }

  updateOrderSummary();
};

// Update order summary with shipping cost
const updateOrderSummary = () => {
  // Kiểm tra chế độ "Mua ngay"
  const buyNowMode = sessionStorage.getItem('buy_now_mode') === 'true';
  let cartData;

  if (buyNowMode) {
    const buyNowItem = sessionStorage.getItem('buy_now_item');
    cartData = buyNowItem ? [JSON.parse(buyNowItem)] : [];
  } else {
    cartData = CartService.getCart();
  }

  const subtotalEl = document.getElementById('subtotal');
  const shippingEl = document.getElementById('shipping');
  const totalEl = document.getElementById('total');
  const voucherRow = document.getElementById('voucher-discount-row');
  const voucherCodeDisplay = document.getElementById('voucher-code-display');
  const voucherDiscountAmount = document.getElementById(
    'voucher-discount-amount'
  );

  // Calculate totals
  const subtotal = cartData.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shippingCost = selectedShippingMethod
    ? Number(selectedShippingMethod.cost || selectedShippingMethod.price) || 0
    : 0;

  // Lấy voucher discount từ localStorage
  let voucherDiscount = 0;
  let voucherCode = '';
  const appliedVoucher = localStorage.getItem('applied_voucher');
  if (appliedVoucher) {
    try {
      const voucherData = JSON.parse(appliedVoucher);
      voucherDiscount = voucherData.discount_amount || 0;
      voucherCode = voucherData.code || '';
    } catch (e) {
      console.warn('Failed to parse voucher:', e);
    }
  }

  const total = subtotal + shippingCost - voucherDiscount;

  if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
  if (shippingEl) {
    shippingEl.textContent =
      shippingCost === 0 ? 'Miễn phí' : formatCurrency(shippingCost);
  }

  // Hiển thị voucher discount nếu có
  if (
    voucherDiscount > 0 &&
    voucherRow &&
    voucherCodeDisplay &&
    voucherDiscountAmount
  ) {
    voucherRow.classList.remove('hidden');
    voucherCodeDisplay.textContent = voucherCode;
    voucherDiscountAmount.textContent = `-${formatCurrency(voucherDiscount)}`;
  } else if (voucherRow) {
    voucherRow.classList.add('hidden');
  }

  if (totalEl) totalEl.textContent = formatCurrency(total);
};

// Handle checkout submission
window.handleCheckout = async () => {
  const token = localStorage.getItem('token');

  if (!token) {
    Swal.fire({
      icon: 'warning',
      title: 'Yêu cầu đăng nhập',
      text: 'Bạn cần đăng nhập để tiến hành thanh toán.',
      showCancelButton: true,
      confirmButtonText: 'Đăng nhập ngay',
      cancelButtonText: 'Hủy',
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = '/login.html';
      }
    });
    return;
  }

  // Get form data
  const fullname = document.getElementById('fullname').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const email = document.getElementById('email').value.trim();
  const province = document.getElementById('province');
  const district = document.getElementById('district');
  const ward = document.getElementById('ward');
  const address = document.getElementById('address').value.trim();
  const note = document.getElementById('note').value.trim();
  const payment = document.querySelector('input[name="payment"]:checked').value;

  // Validation
  if (!fullname || !phone || !province.value || !ward.value || !address) {
    Swal.fire({
      icon: 'error',
      title: 'Thiếu thông tin',
      text: 'Vui lòng điền đầy đủ thông tin giao hàng (các trường có dấu *).',
    });
    return;
  }

  // Phone validation
  const phoneRegex = /^(0|\+84)[0-9]{9}$/;
  if (!phoneRegex.test(phone)) {
    Swal.fire({
      icon: 'error',
      title: 'Số điện thoại không hợp lệ',
      text: 'Vui lòng nhập đúng định dạng số điện thoại.',
    });
    return;
  }

  // Get selected address text
  const provinceName = province.options[province.selectedIndex].text;
  const districtName = district.options[district.selectedIndex].text;
  const wardName = ward.options[ward.selectedIndex].text;
  const fullAddress = `${address}, ${wardName}, ${districtName}, ${provinceName}`;

  // Get cart data - kiểm tra chế độ "Mua ngay"
  const buyNowMode = sessionStorage.getItem('buy_now_mode') === 'true';
  let cartData;

  if (buyNowMode) {
    const buyNowItem = sessionStorage.getItem('buy_now_item');
    cartData = buyNowItem ? [JSON.parse(buyNowItem)] : [];
    console.log('🛒 Buy now checkout - single item:', cartData);
  } else {
    cartData = CartService.getCart();
    console.log('🛒 Normal checkout - cart items:', cartData);
  }

  if (!cartData || cartData.length === 0) {
    Swal.fire({
      icon: 'error',
      title: 'Giỏ hàng trống',
      text: 'Giỏ hàng của bạn đã bị xóa. Vui lòng thêm sản phẩm lại.',
      confirmButtonText: 'Về trang chủ',
    }).then(() => {
      window.location.href = '/index.html';
    });
    return;
  }

  const subtotal = cartData.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shippingCost = selectedShippingMethod
    ? Number(selectedShippingMethod.cost || selectedShippingMethod.price) || 0
    : 0;
  const total = subtotal + shippingCost;

  // Validate shipping method
  if (!selectedShippingMethod) {
    Swal.fire({
      icon: 'error',
      title: 'Thiếu thông tin',
      text: 'Vui lòng chọn phương thức vận chuyển.',
    });
    return;
  }

  // Prepare order data - try multiple possible field names
  const orderData = {
    address: fullAddress,
    shipping_address: fullAddress,
    phone: phone,
    phone_number: phone,
    payment_method: payment,
    shipping_method_id: Number(selectedShippingMethod.id),
    items: cartData.map((item) => {
      // Parse item.id which is in format "productId_variantId" or just "productId"
      let productId, variantId;

      if (typeof item.id === 'string' && item.id.includes('_')) {
        const parts = item.id.split('_');
        productId = Number(parts[0]);
        variantId = Number(parts[1]);
      } else {
        productId = Number(item.id) || Number(item.product_id);
        variantId = Number(item.variant_id) || productId;
      }

      return {
        product_id: productId,
        variant_id: variantId,
        quantity: Number(item.quantity),
        price: Number(item.price),
      };
    }),
  };

  // Add optional fields only if they have values
  if (email) {
    orderData.email = email;
  }
  if (note) {
    orderData.note = note;
  }

  // Thêm voucher vào order data nếu có
  const appliedVoucher = localStorage.getItem('applied_voucher');
  if (appliedVoucher) {
    try {
      const voucherData = JSON.parse(appliedVoucher);
      if (voucherData.code) {
        orderData.voucher_code = voucherData.code;
      }
    } catch (e) {
      console.warn('Failed to parse applied voucher:', e);
    }
  }

  console.log('Order Data being sent:', JSON.stringify(orderData, null, 2));

  // Show loading
  Swal.fire({
    title: 'Đang xử lý...',
    text: 'Vui lòng đợi trong giây lát',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  try {
    // Step 1: Validate cart (chỉ check local nếu chưa đăng nhập)
    console.log('Validating cart...');
    if (token) {
      try {
        const validation = await CartService.validateForCheckout();
        if (!validation.valid) {
          Swal.fire({
            icon: 'error',
            title: 'Giỏ hàng có vấn đề',
            html: validation.errors.map((err) => `• ${err}`).join('<br>'),
            confirmButtonText: 'Quay lại giỏ hàng',
          }).then(() => {
            window.location.href = '/cart.html';
          });
          return;
        }
      } catch (validateError) {
        console.warn('Validation failed, continue anyway:', validateError);
      }
    }

    // Step 2: Sync cart lên server (nếu có token)
    if (token) {
      try {
        await CartService.syncToAPI();
        console.log('Cart synced successfully');
      } catch (syncError) {
        console.warn('Cart sync failed, continue anyway:', syncError);
      }
    }

    // Step 3: Call API to create order using service
    console.log('Creating order with data:', orderData);
    const result = await createOrder(orderData);
    console.log('Order created successfully:', result);

    // If payment method is bank, redirect to payment page
    if (payment === 'bank') {
      // Try multiple ways to get order_id from response
      const orderId =
        result?.id ||
        result?.order_id ||
        result?.data?.id ||
        result?.data?.order_id ||
        (result?.data && typeof result.data === 'object' && result.data.id);

      console.log('Payment method is bank, orderId:', orderId);

      if (orderId) {
        Swal.close();
        // Redirect to payment bank page
        window.location.href = `/payment-bank.html?order_id=${orderId}`;
        return;
      } else {
        console.error('Cannot find order_id in response:', result);
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: 'Không thể lấy mã đơn hàng. Vui lòng thử lại.',
        });
        return;
      }
    }

    // Success
    const orderInfo = result;
    const productsHtml = cartData
      .map((item) => {
        const variantInfo =
          item.variant_name ||
          (item.color || item.size
            ? `(${[item.color, item.size].filter(Boolean).join(', ')})`
            : '');
        return `
        <div class="flex justify-between items-start py-2 border-b border-gray-200">
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-800">${
              item.name
            } ${variantInfo}</p>
            <p class="text-xs text-gray-500">${formatCurrency(item.price)} x ${
          item.quantity
        }</p>
          </div>
          <p class="text-sm font-bold text-gray-800">${formatCurrency(
            item.price * item.quantity
          )}</p>
        </div>
      `;
      })
      .join('');

    Swal.fire({
      icon: 'success',
      title: 'Đặt hàng thành công!',
      html: `
        <div class="text-left space-y-3">
          <p class="text-gray-600">Cảm ơn bạn đã đặt hàng tại <strong>Rudo Watch</strong>!</p>
          <p class="text-gray-600">Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất để xác nhận đơn hàng.</p>
          
          <!-- Thông tin đơn hàng -->
          <div class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p class="font-semibold text-blue-900 dark:text-blue-100 mb-2">📦 Thông tin đơn hàng</p>
            ${
              orderInfo.order_code || orderInfo.id
                ? `<p class="text-sm text-gray-700 dark:text-gray-300">Mã đơn hàng: <strong class="text-blue-600">#${
                    orderInfo.order_code || orderInfo.id
                  }</strong></p>`
                : ''
            }
            
            <!-- Địa chỉ giao hàng -->
            <div class="mt-3">
              <p class="text-xs font-semibold text-gray-600 mb-1">🏠 Giao đến:</p>
              <p class="text-sm text-gray-700">${fullname}</p>
              <p class="text-sm text-gray-700">${phone}</p>
              <p class="text-sm text-gray-700">${fullAddress}</p>
            </div>
            
            <!-- Danh sách sản phẩm -->
            <div class="mt-3">
              <p class="text-xs font-semibold text-gray-600 mb-2">🛍️ Sản phẩm đã đặt:</p>
              <div class="max-h-48 overflow-y-auto">
                ${productsHtml}
              </div>
            </div>
            
            <!-- Tổng thanh toán -->
            <div class="mt-3 pt-3 border-t border-gray-300">
              <div class="flex justify-between text-sm text-gray-700">
                <span>Tạm tính:</span>
                <strong>${formatCurrency(subtotal)}</strong>
              </div>
              <div class="flex justify-between text-sm text-gray-700 mt-1">
                <span>Vận chuyển (${selectedShippingMethod.name}):</span>
                <strong>${
                  shippingCost === 0 ? 'Miễn phí' : formatCurrency(shippingCost)
                }</strong>
              </div>
              <div class="flex justify-between text-sm text-gray-700 mt-1">
                <span>Thanh toán:</span>
                <strong>${
                  payment === 'cod'
                    ? 'COD (Thanh toán khi nhận hàng)'
                    : payment === 'bank'
                    ? 'Chuyển khoản ngân hàng'
                    : 'Thanh toán thẻ'
                }</strong>
              </div>
              <div class="flex justify-between text-base font-bold text-gray-900 dark:text-white mt-3 pt-2 border-t border-gray-400">
                <span>Tổng cộng:</span>
                <strong class="text-blue-600 text-lg">${formatCurrency(
                  total
                )}</strong>
              </div>
            </div>
            
            ${
              note
                ? `
            <div class="mt-3 pt-3 border-t border-gray-300">
              <p class="text-xs font-semibold text-gray-600 mb-1">💬 Ghi chú:</p>
              <p class="text-sm text-gray-700 italic">"${note}"</p>
            </div>
            `
                : ''
            }
          </div>
          
          <p class="text-xs text-gray-500 text-center mt-4">
            ✨ Bạn có thể xem lại đơn hàng trong mục "Đơn hàng của tôi"
          </p>
        </div>
      `,
      confirmButtonText: 'Về trang chủ',
      width: '600px',
    }).then(() => {
      // Clear cart and voucher after successful order
      CartService.clear();
      localStorage.removeItem('applied_voucher');

      // Clear buy now data if in buy now mode
      sessionStorage.removeItem('buy_now_item');
      sessionStorage.removeItem('buy_now_mode');

      window.location.href = '/index.html';
    });
  } catch (error) {
    console.error('Checkout error:', error);
    console.error('Error details:', error.message);
    console.error('Error response:', error.response?.data);

    // Xác định loại lỗi cụ thể
    let errorTitle = 'Đặt hàng thất bại';
    let errorMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
    let errorIcon = 'error';

    if (error.response) {
      // Lỗi từ server (4xx, 5xx)
      const status = error.response.status;
      const data = error.response.data;

      if (status === 401) {
        errorTitle = 'Phiên đăng nhập hết hạn';
        errorMessage = 'Vui lòng đăng nhập lại để tiếp tục đặt hàng.';
        errorIcon = 'warning';
      } else if (status === 400) {
        errorTitle = 'Thông tin không hợp lệ';
        errorMessage =
          data.message ||
          data.error ||
          'Vui lòng kiểm tra lại thông tin đơn hàng.';
      } else if (status === 422) {
        errorTitle = 'Dữ liệu không hợp lệ';
        const errors = data.errors || data.data?.errors;
        if (errors && typeof errors === 'object') {
          errorMessage = Object.values(errors).flat().join('<br>');
        } else {
          errorMessage = data.message || 'Vui lòng kiểm tra lại thông tin.';
        }
      } else if (status >= 500) {
        errorTitle = 'Lỗi máy chủ';
        errorMessage = 'Server đang gặp sự cố. Vui lòng thử lại sau ít phút.';
      } else {
        errorMessage = data.message || data.error || error.message;
      }
    } else if (error.request) {
      // Không nhận được response (network error)
      errorTitle = 'Không thể kết nối server';
      errorMessage = `
        <p class="mb-2">Vui lòng kiểm tra:</p>
        <ul class="text-left list-disc list-inside text-sm">
          <li>Kết nối Internet của bạn</li>
          <li>Server backend có đang hoạt động không</li>
          <li>Thử tải lại trang và đặt hàng lại</li>
        </ul>
      `;
      errorIcon = 'warning';
    } else {
      errorMessage = error.message || errorMessage;
    }

    Swal.fire({
      icon: errorIcon,
      title: errorTitle,
      html: `
        <div class="text-left space-y-2">
          <div class="text-gray-700">${errorMessage}</div>
          ${
            error.response?.status === 401
              ? `
          <div class="mt-4">
            <button onclick="window.location.href='/login.html'" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Đăng nhập ngay
            </button>
          </div>
          `
              : ''
          }
          <div class="text-xs text-gray-500 mt-4 p-3 bg-gray-50 rounded border border-gray-200">
            <p class="font-semibold mb-1">💡 Gợi ý xử lý:</p>
            <ul class="list-disc list-inside space-y-1">
              <li>Kiểm tra lại thông tin đã điền</li>
              <li>Đảm bảo đã chọn phương thức vận chuyển</li>
              <li>Thử tải lại trang nếu lỗi vẫn tiếp diễn</li>
              <li>Liên hệ hotline nếu cần hỗ trợ</li>
            </ul>
          </div>
        </div>
      `,
      confirmButtonText: error.response?.status === 401 ? 'Đóng' : 'Thử lại',
      showCancelButton: true,
      cancelButtonText: 'Về giỏ hàng',
    }).then((result) => {
      if (result.isDismissed && result.dismiss === 'cancel') {
        window.location.href = '/cart.html';
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Checkout page loaded');

  // Kiểm tra chế độ "Mua ngay"
  const buyNowMode = sessionStorage.getItem('buy_now_mode') === 'true';
  let initialCart;

  if (buyNowMode) {
    const buyNowItem = sessionStorage.getItem('buy_now_item');
    initialCart = buyNowItem ? [JSON.parse(buyNowItem)] : [];
    console.log('🛒 Buy now mode - checking item:', initialCart);
  } else {
    initialCart = CartService.getCart();
    console.log('🛒 Normal mode - cart items:', initialCart.length);
  }

  if (initialCart.length === 0) {
    console.warn('Cart is empty on page load');
    Swal.fire({
      icon: 'info',
      title: 'Giỏ hàng trống',
      text: 'Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán.',
      confirmButtonText: 'Về trang chủ',
    }).then(() => {
      window.location.href = '/index.html';
    });
    return;
  }

  // Clear old vouchers that are not from cart page
  const appliedVoucher = localStorage.getItem('applied_voucher');
  if (appliedVoucher) {
    try {
      const voucherData = JSON.parse(appliedVoucher);
      // Validate voucher has required fields
      if (!voucherData.discount_amount || !voucherData.code) {
        console.warn('Invalid voucher data, clearing');
        localStorage.removeItem('applied_voucher');
      }
    } catch (e) {
      console.warn('Failed to parse voucher, clearing');
      localStorage.removeItem('applied_voucher');
    }
  }

  // Sync cart từ API để có stock/price mới nhất (không blocking)
  // Skip sync nếu đang ở chế độ "Mua ngay"
  const token = localStorage.getItem('token');
  if (token && !buyNowMode) {
    try {
      await CartService.syncFromAPI();
      console.log('✅ Cart synced from API');
    } catch (error) {
      console.warn('⚠️ Cart sync failed, continue with local:', error);
    }
  }

  // Load provinces trước, sau đó mới điền form
  await loadProvinces();
  loadShippingMethods();
  renderOrderSummary();
  
  // Tự động điền thông tin user và địa chỉ (sau khi provinces đã load)
  await loadUserInfoAndAddress();
});

// ==================== AUTO-FILL USER INFO ====================

/**
 * Tự động điền thông tin user và địa chỉ vào form
 */
const loadUserInfoAndAddress = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('No token, skipping auto-fill');
    return;
  }

  try {
    // Lấy thông tin user
    const userRes = await api.get('/user/profile');
    const user = userRes.data?.data?.user || userRes.data?.user || userRes.data?.data || userRes.data;
    
    // Lấy địa chỉ mặc định
    let defaultAddress = null;
    try {
      const addressRes = await api.get('/addresses/default');
      defaultAddress = addressRes.data?.data || addressRes.data;
    } catch (e) {
      console.log('No default address found, will use user info only');
    }

    // Điền thông tin vào form
    fillCheckoutForm(user, defaultAddress);
  } catch (error) {
    console.warn('Failed to load user info:', error);
    // Fallback: dùng localStorage
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user) {
      fillCheckoutForm(user, null);
    }
  }
};

/**
 * Điền thông tin vào form checkout
 */
const fillCheckoutForm = (user, defaultAddress) => {
  if (!user) return;

  // Điền thông tin cơ bản
  const fullnameInput = document.getElementById('fullname');
  const phoneInput = document.getElementById('phone');
  const emailInput = document.getElementById('email');
  const addressInput = document.getElementById('address');
  const provinceSelect = document.getElementById('province');
  const wardSelect = document.getElementById('ward');

  // Điền tên (ưu tiên từ address, sau đó từ user)
  if (fullnameInput) {
    const name = defaultAddress?.receiver_name || defaultAddress?.name || user.fullname || user.name || '';
    if (name && !fullnameInput.value) {
      fullnameInput.value = name;
    }
  }

  // Điền SĐT (ưu tiên từ address, sau đó từ user)
  if (phoneInput) {
    const phone = defaultAddress?.receiver_phone || defaultAddress?.phone || user.phone || '';
    if (phone && !phoneInput.value) {
      phoneInput.value = phone;
    }
  }

  // Điền email
  if (emailInput && user.email && !emailInput.value) {
    emailInput.value = user.email;
  }

  // Điền địa chỉ nếu có
  if (defaultAddress) {
    // Địa chỉ cụ thể
    if (addressInput && !addressInput.value) {
      if (defaultAddress.street) {
        addressInput.value = defaultAddress.street;
      } else if (defaultAddress.detail) {
        addressInput.value = defaultAddress.detail;
      }
    }

    // Tỉnh/Thành phố và Phường/Xã
    if (provinceSelect && defaultAddress.province) {
      // Đợi provinces load xong (sau khi loadProvinces() chạy)
      const trySetProvince = () => {
        if (provincesData && provincesData.length > 0) {
          // Tìm province theo tên
          const province = provincesData.find(p => 
            p.name === defaultAddress.province || 
            p.name.includes(defaultAddress.province) ||
            defaultAddress.province.includes(p.name)
          );
          
          if (province && province.code) {
            provinceSelect.value = province.code;
            if (provinceSelect.value) {
              // Trigger change event để load wards
              provinceSelect.dispatchEvent(new Event('change'));
              
              // Sau khi load wards xong, set ward
              setTimeout(() => {
                if (wardSelect && defaultAddress.ward) {
                  // Load wards cho province này
                  loadWards(province.code).then(() => {
                    // Tìm ward theo tên
                    const wardOptions = wardSelect.options;
                    for (let i = 0; i < wardOptions.length; i++) {
                      const optionText = wardOptions[i].text;
                      const optionValue = wardOptions[i].value;
                      if (optionText.includes(defaultAddress.ward) || 
                          optionValue === defaultAddress.ward ||
                          optionText === defaultAddress.ward ||
                          defaultAddress.ward.includes(optionText)) {
                        wardSelect.value = optionValue;
                        wardSelect.disabled = false;
                        break;
                      }
                    }
                  });
                }
              }, 800);
            }
          }
        } else {
          // Nếu provinces chưa load xong, thử lại sau 200ms
          setTimeout(trySetProvince, 200);
        }
      };
      
      // Bắt đầu thử sau 500ms để đảm bảo loadProvinces đã chạy
      setTimeout(trySetProvince, 500);
    }
  } else if (user) {
    // Nếu không có default address, chỉ điền thông tin cơ bản từ user
    if (fullnameInput && !fullnameInput.value && user.fullname) {
      fullnameInput.value = user.fullname;
    }
    if (phoneInput && !phoneInput.value && user.phone) {
      phoneInput.value = user.phone;
    }
  }
};

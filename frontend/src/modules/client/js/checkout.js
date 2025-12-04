import { formatCurrency } from '../../../shared/utils/format.js';
import CartService from '../../../shared/services/cart.js';
import Swal from '../../../shared/utils/swal.js';

console.log('Checkout JS loaded');

// Vietnam provinces API data
let provincesData = [];
let districtsData = [];
let wardsData = [];

// Shipping methods data
let shippingMethods = [];
let selectedShippingMethod = null;

// Load shipping methods from API
const loadShippingMethods = async () => {
  try {
    const response = await fetch(
      'https://rudo-watch-be.onrender.com/api/v1/shipping-methods'
    );
    const result = await response.json();

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

// Load provinces on page load
const loadProvinces = async () => {
  try {
    const response = await fetch('https://provinces.open-api.vn/api/p/');
    provincesData = await response.json();

    const provinceSelect = document.getElementById('province');
    provinceSelect.innerHTML = '<option value="">Chọn Tỉnh/TP</option>';

    provincesData.forEach((province) => {
      provinceSelect.innerHTML += `<option value="${province.code}">${province.name}</option>`;
    });
  } catch (error) {
    console.error('Error loading provinces:', error);
  }
};

// Load districts when province changes
const loadDistricts = async (provinceCode) => {
  try {
    const response = await fetch(
      `https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`
    );
    const data = await response.json();
    districtsData = data.districts || [];

    const districtSelect = document.getElementById('district');
    const wardSelect = document.getElementById('ward');

    districtSelect.innerHTML = '<option value="">Chọn Quận/Huyện</option>';
    wardSelect.innerHTML = '<option value="">Chọn Phường/Xã</option>';
    wardSelect.disabled = true;

    if (districtsData.length > 0) {
      districtSelect.disabled = false;
      districtsData.forEach((district) => {
        districtSelect.innerHTML += `<option value="${district.code}">${district.name}</option>`;
      });
    }
  } catch (error) {
    console.error('Error loading districts:', error);
  }
};

// Load wards when district changes
const loadWards = async (districtCode) => {
  try {
    const response = await fetch(
      `https://provinces.open-api.vn/api/d/${districtCode}?depth=2`
    );
    const data = await response.json();
    wardsData = data.wards || [];

    const wardSelect = document.getElementById('ward');
    wardSelect.innerHTML = '<option value="">Chọn Phường/Xã</option>';

    if (wardsData.length > 0) {
      wardSelect.disabled = false;
      wardsData.forEach((ward) => {
        wardSelect.innerHTML += `<option value="${ward.code}">${ward.name}</option>`;
      });
    }
  } catch (error) {
    console.error('Error loading wards:', error);
  }
};

// Event listeners for address dropdowns
document.getElementById('province')?.addEventListener('change', (e) => {
  const provinceCode = e.target.value;
  if (provinceCode) {
    loadDistricts(provinceCode);
  } else {
    document.getElementById('district').disabled = true;
    document.getElementById('ward').disabled = true;
  }
});

document.getElementById('district')?.addEventListener('change', (e) => {
  const districtCode = e.target.value;
  if (districtCode) {
    loadWards(districtCode);
  } else {
    document.getElementById('ward').disabled = true;
  }
});

// Render cart items in order summary
const renderOrderSummary = () => {
  const cartData = CartService.getCart();
  const orderItemsContainer = document.getElementById('order-items');
  const subtotalEl = document.getElementById('subtotal');
  const totalEl = document.getElementById('total');

  if (cartData.length === 0) {
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
  const cartData = CartService.getCart();
  const subtotalEl = document.getElementById('subtotal');
  const shippingEl = document.getElementById('shipping');
  const totalEl = document.getElementById('total');

  // Calculate totals
  const subtotal = cartData.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shippingCost = selectedShippingMethod
    ? Number(selectedShippingMethod.cost || selectedShippingMethod.price) || 0
    : 0;
  const total = subtotal + shippingCost;

  if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
  if (shippingEl) {
    shippingEl.textContent =
      shippingCost === 0 ? 'Miễn phí' : formatCurrency(shippingCost);
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
  if (
    !fullname ||
    !phone ||
    !province.value ||
    !district.value ||
    !ward.value ||
    !address
  ) {
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

  // Get cart data
  const cartData = CartService.getCart();
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
    // Step 1: Sync localStorage cart to database first
    console.log('Syncing cart to server...');
    console.log('Cart Data from localStorage:', cartData);

    // Debug each item
    const syncItems = cartData.map((item) => {
      console.log('Processing item:', item);
      const syncItem = {
        product_id: Number(item.id) || Number(item.product_id),
        variant_id:
          Number(item.variant_id) || Number(item.id) || Number(item.product_id),
        quantity: Number(item.quantity),
      };
      console.log('Sync item:', syncItem);
      return syncItem;
    });

    console.log('Final sync items:', syncItems);

    const syncResponse = await fetch(
      'https://rudo-watch-be.onrender.com/api/v1/cart/sync',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: syncItems,
        }),
      }
    );

    if (!syncResponse.ok) {
      const syncError = await syncResponse.json();
      console.error('Cart sync failed:', syncError);
      // Continue anyway, maybe cart already synced
    } else {
      console.log('Cart synced successfully');
    }

    // Step 2: Call API to create order
    const response = await fetch(
      'https://rudo-watch-be.onrender.com/api/v1/orders',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      }
    );

    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response data:', result);

    if (!response.ok) {
      // Log detailed error
      console.error('API Error:', result);
      const errorMessage =
        result.message || result.error || JSON.stringify(result);
      throw new Error(errorMessage);
    }

    // Success
    const orderInfo = result.data || result;
    Swal.fire({
      icon: 'success',
      title: 'Đặt hàng thành công!',
      html: `
        <div class="text-left space-y-2">
          <p class="text-gray-600">Cảm ơn bạn đã đặt hàng tại <strong>Rudo Watch</strong>!</p>
          <p class="text-gray-600">Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất để xác nhận đơn hàng.</p>
          <div class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p class="font-semibold text-blue-900 dark:text-blue-100">Thông tin đơn hàng:</p>
            ${
              orderInfo.order_code
                ? `<p class="text-sm text-gray-700 dark:text-gray-300">Mã đơn hàng: <strong class="text-blue-600">#${orderInfo.order_code}</strong></p>`
                : ''
            }
            <p class="text-sm text-gray-700 dark:text-gray-300">Tạm tính: <strong>${formatCurrency(
              subtotal
            )}</strong></p>
            <p class="text-sm text-gray-700 dark:text-gray-300">Vận chuyển: <strong>${
              selectedShippingMethod.name
            } - ${
        shippingCost === 0 ? 'Miễn phí' : formatCurrency(shippingCost)
      }</strong></p>
            <p class="text-sm text-gray-700 dark:text-gray-300">Thanh toán: <strong>${
              payment === 'cod'
                ? 'COD'
                : payment === 'bank'
                ? 'Chuyển khoản'
                : 'Thẻ'
            }</strong></p>
            <p class="text-sm font-bold text-gray-900 dark:text-white mt-2">Tổng cộng: <strong class="text-blue-600">${formatCurrency(
              total
            )}</strong></p>
          </div>
        </div>
      `,
      confirmButtonText: 'Về trang chủ',
    }).then(() => {
      // Clear cart after successful order
      CartService.clear();
      window.location.href = '/index.html';
    });
  } catch (error) {
    console.error('Checkout error:', error);
    console.error('Error details:', error.message);

    Swal.fire({
      icon: 'error',
      title: 'Đặt hàng thất bại',
      html: `
        <div class="text-left">
          <p class="text-gray-600 mb-2">${
            error.message || 'Đã có lỗi xảy ra. Vui lòng thử lại sau.'
          }</p>
          <div class="text-xs text-gray-500 mt-3 p-2 bg-gray-100 rounded">
            <p class="font-semibold mb-1">Thông tin debug:</p>
            <p>Kiểm tra Console (F12) để xem chi tiết lỗi</p>
          </div>
        </div>
      `,
      confirmButtonText: 'Đóng',
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  loadProvinces();
  loadShippingMethods();
  renderOrderSummary();
});

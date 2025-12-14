import { formatCurrency } from '../../../shared/utils/format.js';
import { ProductCard } from '../components/ProductCard.js';
import api from '../../../shared/services/api.js';
import favoritesService from '../../../shared/services/favorites.js';

import Swal, { Toast } from '../../../shared/utils/swal.js';

// API Provinces Vietnam
const PROVINCES_API = 'https://provinces.open-api.vn/api';

// Cache dữ liệu
let provincesCache = null;
let districtsCache = {};
let wardsCache = {};

// 1. SWITCH TAB LOGIC
window.switchProfileTab = (tabId) => {
  console.log(`🔄 Switching to tab: ${tabId}`);

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

  // Reload orders khi switch sang tab orders (refresh data)
  if (tabId === 'orders') {
    const orderList = document.getElementById('order-list');
    const hasOrders =
      orderList && orderList.querySelector('tr')?.getAttribute('data-order-id');
    if (!hasOrders) {
      console.log('📦 Reloading orders on tab switch');
      loadOrdersFromAPI();
    }
  }
};

// Load thông tin user từ API
const loadUserProfile = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('⚠️ No token found, redirecting to login');
      window.location.href = '/login.html';
      return;
    }

    const res = await api.get('/user/profile');
    console.log('👤 User profile API response:', res.data);

    // Response format: { status: 'success', statusCode: 200, data: { user: {...} } }
    const user =
      res.data?.data?.user || res.data?.user || res.data?.data || res.data;

    if (user) {
      // Cập nhật localStorage
      localStorage.setItem('user', JSON.stringify(user));

      // Cập nhật header nếu có function
      if (window.updateHeaderUserInfo) {
        window.updateHeaderUserInfo(user);
      }

      // Render thông tin
      renderInfo(user);
    } else {
      console.error('❌ No user data in response');
    }
  } catch (err) {
    console.error('❌ Lỗi load profile:', err);

    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login.html';
      return;
    }

    // Fallback: dùng localStorage nếu API fail
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user) {
      renderInfo(user);
    }
  }
};

// Render đầy đủ thông tin người dùng
const renderInfo = (user = null) => {
  // Nếu không có user, lấy từ localStorage (fallback)
  if (!user) {
    user = JSON.parse(localStorage.getItem('user') || 'null');
  }

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

  // Check if user is admin (support multiple formats)
  const isAdmin = user.role === 'admin' || user.role === 1 || user.role === '1';
  if (membershipEl)
    membershipEl.textContent = isAdmin ? 'Quản trị viên' : 'Thành viên';

  // Show Dashboard link for admin
  const dashboardLink = document.getElementById('admin-dashboard-link');
  if (dashboardLink && isAdmin) {
    dashboardLink.classList.remove('hidden');
  }

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

// Handle avatar upload
window.handleAvatarUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith('image/')) {
    Toast.fire({ icon: 'error', title: 'Vui lòng chọn file ảnh' });
    return;
  }

  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    Toast.fire({
      icon: 'error',
      title: 'Kích thước ảnh không được vượt quá 2MB',
    });
    return;
  }

  try {
    Swal.showLoading();

    const user = JSON.parse(localStorage.getItem('user')) || {};
    const formData = new FormData();
    formData.append('avatar', file);

    // Upload avatar
    const res = await api.post(`/user/upload-avatar/${user.id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Update user in localStorage
    const updatedUser = {
      ...user,
      avatar: res.data.data.avatar || res.data.avatar,
    };
    localStorage.setItem('user', JSON.stringify(updatedUser));

    // Update avatar preview
    const avatarPreview = document.getElementById('avatar-preview');
    if (avatarPreview) {
      avatarPreview.src = URL.createObjectURL(file);
    }

    // Update header avatar
    const headerAvatar = document.querySelector(
      'header a[href="/profile.html"] img'
    );
    if (headerAvatar) {
      headerAvatar.src = URL.createObjectURL(file);
    }

    Swal.close();
    Toast.fire({ icon: 'success', title: 'Cập nhật ảnh đại diện thành công!' });
  } catch (err) {
    console.error('Error uploading avatar:', err);
    Swal.close();
    const errorMsg =
      err?.response?.data?.message || err?.message || 'Tải ảnh lên thất bại';
    Toast.fire({ icon: 'error', title: errorMsg });
  }
};

// Load danh sách đơn hàng từ API
const loadOrdersFromAPI = async () => {
  const container = document.getElementById('order-list');

  try {
    console.log('🔄 Loading orders from API...');

    // Kiểm tra token
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('⚠️ No token found, redirecting to login');
      window.location.href = '/login.html';
      return;
    }

    const res = await api.get('/orders');
    console.log('📦 Orders API response:', res.data);

    // API trả về: { data: { orders: [...], pagination: {...} } }
    const orders =
      res.data?.data?.orders ||
      res.data?.orders ||
      res.data?.data ||
      res.data ||
      [];
    console.log('✅ Parsed orders:', orders);
    renderOrders(orders);
  } catch (err) {
    console.error('❌ Lỗi load đơn hàng:', err);
    console.error('Error details:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
    });

    if (container) {
      let errorMessage = 'Không thể tải đơn hàng';

      if (err.response?.status === 401) {
        errorMessage = 'Phiên đăng nhập hết hạn. Đang chuyển hướng...';
        setTimeout(() => {
          window.location.href = '/login.html';
        }, 1500);
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      container.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-8">
            <div class="text-red-500 mb-2">
              <i class="fas fa-exclamation-circle text-2xl"></i>
            </div>
            <p class="text-red-600 dark:text-red-400">${errorMessage}</p>
          </td>
        </tr>
      `;
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
    if (
      status === 'completed' ||
      status === 'delivered' ||
      status === 'confirmed'
    )
      return `<span class="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">Hoàn thành</span>`;
    if (status === 'cancelled' || status === 'canceled')
      return `<span class="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">Đã hủy</span>`;
    if (status === 'pending')
      return `<span class="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">Chờ xử lý</span>`;
    return `<span class="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400">${status}</span>`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (!orders || !Array.isArray(orders) || orders.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-8">
          <div class="text-gray-400 mb-2">
            <i class="fas fa-shopping-bag text-3xl"></i>
          </div>
          <p class="text-gray-500 dark:text-gray-400">Chưa có đơn hàng nào</p>
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = orders
    .map((order) => {
      const orderId = `#RD${String(order.id).padStart(4, '0')}`;
      const orderDate = formatDate(order.created_at);
      const products = order.order_detail || order.items || [];
      const productCount = products.length;
      const productNames = products
        .slice(0, 2)
        .map((item) => item.product_name || item.name || 'Sản phẩm')
        .join(', ');
      const moreCount = productCount > 2 ? ` +${productCount - 2}` : '';
      const total = parseFloat(order.total) || 0;
      const status = order.status || 'pending';
      const canReview =
        status === 'completed' ||
        status === 'delivered' ||
        status === 'confirmed';

      return `
          <tr class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors" data-order-id="${
            order.id
          }">
            <td class="py-4 font-bold text-[#0A2A45] dark:text-blue-400">${orderId}</td>
            <td class="py-4 text-gray-500">${orderDate}</td>
            <td class="py-4 max-w-[200px] truncate text-slate-900 dark:text-white font-medium">${productNames}${moreCount}</td>
            <td class="py-4 font-bold">${formatCurrency(total)}</td>
            <td class="py-4">${getStatusBadge(status)}</td>
            <td class="py-4 text-center">
              <button 
                onclick="showOrderDetail(${order.id})"
                class="text-sm font-bold text-blue-600 hover:text-blue-700 dark:hover:text-blue-400 underline"
              >
                Chi tiết
              </button>
              ${
                canReview
                  ? `
                <button 
                  onclick="showReviewOptions(${order.id})"
                  class="ml-2 text-sm font-bold text-green-600 hover:text-green-700 dark:hover:text-green-400 underline"
                >
                  Đánh giá
                </button>
              `
                  : ''
              }
            </td>
          </tr>
        `;
    })
    .join('');
};

// Show order detail modal
window.showOrderDetail = async (orderId) => {
  try {
    Swal.showLoading();
    const res = await api.get(`/orders/${orderId}`);
    const order = res.data?.data || res.data;
    console.log('📦 Order detail data:', order);
    console.log('👤 Fullname fields:', {
      fullname: order.fullname,
      full_name: order.full_name,
      name: order.name,
      receiver_name: order.receiver_name,
    });
    console.log('📞 Phone fields:', {
      phone_number: order.phone_number,
      phone: order.phone,
      receiver_phone: order.receiver_phone,
    });
    Swal.close();

    const modal = document.getElementById('order-detail-modal');
    const content = document.getElementById('order-detail-content');

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
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const products = order.order_detail || order.items || [];
    const subtotal = parseFloat(order.subtotal) || 0;
    const shippingCost = parseFloat(order.shipping_cost) || 0;
    const total = parseFloat(order.total) || 0;

    // Parse address nếu là JSON string
    let addressInfo = {};
    if (order.address && typeof order.address === 'string') {
      try {
        // Thử parse nếu là JSON
        addressInfo = JSON.parse(order.address);
      } catch (e) {
        // Nếu không phải JSON, giữ nguyên string
        addressInfo.fullAddress = order.address;
      }
    } else if (typeof order.address === 'object') {
      addressInfo = order.address;
    }

    // Extract thông tin từ addressInfo hoặc order trực tiếp
    const receiverName =
      addressInfo.name ||
      addressInfo.fullname ||
      order.fullname ||
      order.full_name ||
      order.receiver_name ||
      order.name;
    const receiverPhone =
      addressInfo.phone ||
      addressInfo.phone_number ||
      order.phone_number ||
      order.phone ||
      order.receiver_phone;
    const receiverAddress =
      addressInfo.fullAddress ||
      addressInfo.street ||
      addressInfo.address ||
      order.shipping_address ||
      order.address;

    content.innerHTML = `
      <div class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 class="font-bold mb-2 text-sm text-gray-500 dark:text-gray-400">MÃ ĐƠN HÀNG</h4>
            <p class="text-lg font-bold text-[#0A2A45] dark:text-blue-400">#RD${String(
              order.id
            ).padStart(4, '0')}</p>
          </div>
          <div>
            <h4 class="font-bold mb-2 text-sm text-gray-500 dark:text-gray-400">NGÀY ĐẶT</h4>
            <p class="text-lg">${formatDate(order.created_at)}</p>
          </div>
          <div>
            <h4 class="font-bold mb-2 text-sm text-gray-500 dark:text-gray-400">TRẠNG THÁI</h4>
            <div>${getStatusBadge(order.status)}</div>
          </div>
          <div>
            <h4 class="font-bold mb-2 text-sm text-gray-500 dark:text-gray-400">PHƯƠNG THỨC THANH TOÁN</h4>
            <p class="text-lg">${
              order.payment_method === 'COD'
                ? 'Thanh toán khi nhận hàng'
                : order.payment_method
            }</p>
          </div>
        </div>
        
        <div class="border-t border-gray-200 dark:border-slate-700 pt-6">
          <h4 class="font-bold mb-4">Thông tin giao hàng</h4>
          <div class="space-y-2 text-sm">
            <p><span class="text-gray-500 dark:text-gray-400">Người nhận:</span> <span class="font-medium">${
              receiverName || 'N/A'
            }</span></p>
            <p><span class="text-gray-500 dark:text-gray-400">Số điện thoại:</span> <span class="font-medium">${
              receiverPhone || 'N/A'
            }</span></p>
            <p><span class="text-gray-500 dark:text-gray-400">Địa chỉ:</span> <span class="font-medium">${
              receiverAddress || 'N/A'
            }</span></p>
            ${
              order.note
                ? `<p><span class="text-gray-500 dark:text-gray-400">Ghi chú:</span> <span class="font-medium">${order.note}</span></p>`
                : ''
            }
          </div>
        </div>
        
        <div class="border-t border-gray-200 dark:border-slate-700 pt-6">
          <h4 class="font-bold mb-4">Sản phẩm đã đặt</h4>
          <div class="space-y-3">
            ${products
              .map(
                (item) => `
              <div class="flex gap-4 p-4 bg-gray-50 dark:bg-slate-900 rounded-xl">
                <div class="flex-1">
                  <h5 class="font-bold mb-1">${
                    item.product_name || item.name || 'Sản phẩm'
                  }</h5>
                  ${
                    item.variant_name
                      ? `<p class="text-sm text-gray-500">Phiên bản: ${item.variant_name}</p>`
                      : ''
                  }
                  <p class="text-sm text-gray-500">Số lượng: ${
                    item.quantity
                  }</p>
                  ${
                    order.status === 'completed' || order.status === 'delivered'
                      ? `
                    <a 
                      href="/product-detail.html?id=${item.product_id}&order_id=${orderId}#reviews" 
                      class="inline-block mt-2 text-xs font-bold text-green-600 hover:text-green-700 dark:hover:text-green-400 underline"
                    >
                      ⭐ Đánh giá sản phẩm này
                    </a>
                  `
                      : ''
                  }
                </div>
                <div class="text-right">
                  <p class="font-bold">${formatCurrency(
                    parseFloat(item.price) * parseInt(item.quantity)
                  )}</p>
                  <p class="text-sm text-gray-500">${formatCurrency(
                    parseFloat(item.price)
                  )} x ${item.quantity}</p>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
        
        <div class="border-t border-gray-200 dark:border-slate-700 pt-6">
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500 dark:text-gray-400">Tạm tính:</span>
              <span class="font-medium">${formatCurrency(subtotal)}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500 dark:text-gray-400">Phí vận chuyển:</span>
              <span class="font-medium">${formatCurrency(shippingCost)}</span>
            </div>
            <div class="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-slate-700">
              <span>Tổng cộng:</span>
              <span class="text-[#0A2A45] dark:text-blue-400">${formatCurrency(
                total
              )}</span>
            </div>
          </div>
        </div>
        
        ${
          order.status === 'pending'
            ? `
          <div class="flex gap-3 pt-4">
            <button
              onclick="cancelOrder(${order.id})"
              class="flex-1 px-6 py-3 border border-red-600 text-red-600 rounded-xl font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Hủy đơn hàng
            </button>
          </div>
        `
            : ''
        }
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  } catch (err) {
    console.error('Error loading order detail:', err);
    Swal.close();
    Toast.fire({ icon: 'error', title: 'Không thể tải chi tiết đơn hàng' });
  }
};

// Close order detail modal
window.closeOrderModal = () => {
  const modal = document.getElementById('order-detail-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
};

// Cancel order
window.cancelOrder = async (orderId) => {
  const result = await Swal.fire({
    title: 'Hủy đơn hàng?',
    text: 'Bạn có chắc muốn hủy đơn hàng này?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Hủy đơn hàng',
    cancelButtonText: 'Đóng',
  });

  if (!result.isConfirmed) return;

  try {
    Swal.showLoading();
    await api.put(`/orders/${orderId}`, { status: 'cancelled' });
    await loadOrdersFromAPI();
    closeOrderModal();
    Swal.close();
    Toast.fire({ icon: 'success', title: 'Đã hủy đơn hàng thành công' });
  } catch (err) {
    console.error('Error canceling order:', err);
    Swal.close();
    Toast.fire({ icon: 'error', title: 'Không thể hủy đơn hàng' });
  }
};

// Show review options - cho phép user chọn sản phẩm trong đơn hàng để đánh giá
window.showReviewOptions = async (orderId) => {
  try {
    Swal.showLoading();
    const res = await api.get(`/orders/${orderId}`);
    const order = res.data?.data || res.data;
    const products = order.order_detail || order.items || [];
    console.log(products);
    if (!products.length) {
      Swal.close();
      Toast.fire({ icon: 'error', title: 'Đơn hàng không có sản phẩm' });
      return;
    }

    Swal.close();

    // Hiển thị danh sách sản phẩm để chọn
    const { value: productId } = await Swal.fire({
      title: 'Chọn sản phẩm để đánh giá',
      html: `
        <div class="space-y-3 max-h-96 overflow-y-auto">
          ${products
            .map(
              (item) => `
            <div class="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer" data-product-id="${
              item.product_id
            }">
              <input type="radio" name="product" value="${
                item.product_id
              }" id="product-${item.product_id}" class="w-4 h-4">
              <label for="product-${
                item.product_id
              }" class="flex-1 text-left cursor-pointer">
                <div class="font-bold">${
                  item.product_name || item.name || 'Sản phẩm'
                }</div>
                ${
                  item.variant_name
                    ? `<div class="text-sm text-gray-500">${item.variant_name}</div>`
                    : ''
                }
              </label>
            </div>
          `
            )
            .join('')}
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Tiếp tục',
      cancelButtonText: 'Hủy',
      preConfirm: () => {
        const selected = document.querySelector(
          'input[name="product"]:checked'
        );
        if (!selected) {
          Swal.showValidationMessage('Vui lòng chọn sản phẩm');
          return false;
        }
        return selected.value;
      },
      didOpen: () => {
        // Click vào div cũng chọn radio
        document.querySelectorAll('[data-product-id]').forEach((div) => {
          div.addEventListener('click', (e) => {
            const radio = div.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
          });
        });
      },
    });

    if (productId) {
      // Chuyển đến trang chi tiết sản phẩm, tab reviews
      window.location.href = `/product-detail.html?id=${productId}&order_id=${orderId}#reviews`;
    }
  } catch (err) {
    console.error('Error loading order for review:', err);
    Swal.close();
    Toast.fire({ icon: 'error', title: 'Không thể tải thông tin đơn hàng' });
  }
};

// Load danh sách sản phẩm yêu thích từ API
const loadWishlistFromAPI = async () => {
  try {
    // Lấy danh sách favorite IDs từ API
    const favoriteIds = await favoritesService.getFavorites();

    if (!Array.isArray(favoriteIds) || favoriteIds.length === 0) {
      renderWishlist([]);
      return;
    }

    // Load thông tin chi tiết của từng sản phẩm
    const productsRes = await Promise.all(
      favoriteIds.map((id) => api.get(`/products/${id}`).catch(() => null))
    );

    const products = productsRes
      .filter(Boolean)
      .map((res) => res.data?.data || res.data)
      .filter(Boolean);

    renderWishlist(products);
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
  const clearBtn = document.getElementById('clear-wishlist-btn');
  if (!container) return;

  if (!wishlist.length) {
    container.innerHTML = `
      <div class="col-span-full text-center py-20">
        <svg class="w-20 h-20 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <p class="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">Danh sách yêu thích trống</p>
        <p class="text-gray-400 dark:text-gray-500 text-sm mb-6">Hãy thêm những sản phẩm bạn yêu thích vào đây</p>
        <a href="/products.html" class="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
          Khám phá sản phẩm
        </a>
      </div>
    `;
    if (clearBtn) clearBtn.classList.add('hidden');
    return;
  }

  if (clearBtn) clearBtn.classList.remove('hidden');

  container.innerHTML = wishlist
    .map((p) => {
      // Render ProductCard string
      return ProductCard(p);
    })
    .join('');

  // Update favorite buttons after rendering
  setTimeout(() => {
    if (window.updateFavoriteButtons) {
      window.updateFavoriteButtons();
    }
  }, 100);
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
      const userNameElement =
        userDropdownContainer.querySelector('div.px-4.py-3 p');
      if (userNameElement) {
        userNameElement.textContent = newName;
      }
    }
  }

  // Cập nhật avatar nếu avatar là từ ui-avatars (không phải upload)
  const avatarImg = document.querySelector(
    'header a[href="/profile.html"] img'
  );
  if (avatarImg && avatarImg.src.includes('ui-avatars.com')) {
    // Cập nhật avatar URL với tên mới
    const newAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      newName
    )}&background=random&color=fff`;
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

    await api.put(`/user/update`, {
      fullname: username,
      phone: phone,
    });

    const profileRes = await api.get('/user/profile');
    const updatedUser =
      profileRes.data?.data?.user ||
      profileRes.data?.user ||
      profileRes.data?.data ||
      profileRes.data;

    if (updatedUser) {
      localStorage.setItem('user', JSON.stringify(updatedUser));

      const sidebarName = document.getElementById('sidebar-name');
      if (sidebarName)
        sidebarName.textContent =
          updatedUser.fullname || updatedUser.name || username;

      if (window.updateHeaderUserInfo) {
        window.updateHeaderUserInfo(updatedUser);
      } else {
        updateHeaderUserName(
          updatedUser.fullname || updatedUser.name || username
        );
      }

      renderInfo(updatedUser);
    } else {
      const updatedUser = { ...user, fullname: username, phone: phone };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      const sidebarName = document.getElementById('sidebar-name');
      if (sidebarName) sidebarName.textContent = username;

      if (window.updateHeaderUserInfo) {
        window.updateHeaderUserInfo(updatedUser);
      } else {
        updateHeaderUserName(username);
      }
    }

    Swal.close();
    Toast.fire({
      icon: 'success',
      title: 'Thông tin tài khoản đã được cập nhật!',
    });

    disableEditInfo();
  } catch (err) {
    console.error('Lỗi cập nhật thông tin:', err);
    Swal.close();
    const errorMsg =
      err?.response?.data?.message ||
      err?.message ||
      'Cập nhật thông tin thất bại';
    Toast.fire({ icon: 'error', title: errorMsg });
  }
};

window.changePassword = async () => {
  const currentPassword = document.getElementById('current-password')?.value;
  const newPassword = document.getElementById('new-password')?.value;
  const confirmPassword = document.getElementById('confirm-password')?.value;

  if (!currentPassword || !newPassword || !confirmPassword) {
    Toast.fire({ icon: 'warning', title: 'Vui lòng điền đầy đủ thông tin' });
    return;
  }

  if (newPassword.length < 6) {
    Toast.fire({
      icon: 'warning',
      title: 'Mật khẩu mới phải có ít nhất 6 ký tự',
    });
    return;
  }

  if (newPassword !== confirmPassword) {
    Toast.fire({ icon: 'warning', title: 'Mật khẩu xác nhận không khớp' });
    return;
  }

  try {
    Swal.showLoading();
    const user = JSON.parse(localStorage.getItem('user')) || {};
    await api.put(`/user/change-password/${user.id}`, {
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    Swal.close();
    document.getElementById('change-password-form').reset();
    Swal.fire({
      icon: 'success',
      title: 'Thành công',
      text: 'Mật khẩu đã được thay đổi thành công!',
      showConfirmButton: true,
      confirmButtonColor: '#0A2A45',
    });
  } catch (err) {
    console.error('Lỗi đổi mật khẩu:', err);
    Swal.close();
    const errorMsg =
      err?.response?.data?.message || err?.message || 'Đổi mật khẩu thất bại';
    Toast.fire({ icon: 'error', title: errorMsg });
  }
};

window.deleteAccount = async () => {
  const result = await Swal.fire({
    title: 'Xóa tài khoản?',
    html: `
      <p class="mb-4">Hành động này sẽ xóa vĩnh viễn tài khoản của bạn và tất cả dữ liệu liên quan.</p>
      <p class="text-red-600 font-bold">Bạn không thể hoàn tác hành động này!</p>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Xóa tài khoản',
    cancelButtonText: 'Hủy bỏ',
    input: 'text',
    inputPlaceholder: 'Nhập "XOA TAI KHOAN" để xác nhận',
    inputValidator: (value) => {
      if (value !== 'XOA TAI KHOAN') {
        return 'Vui lòng nhập chính xác để xác nhận';
      }
    },
  });

  if (!result.isConfirmed) return;

  try {
    Swal.showLoading();
    const user = JSON.parse(localStorage.getItem('user')) || {};

    await api.delete(`/user/delete/${user.id}`);
    localStorage.clear();
    Swal.close();
    Swal.fire({
      icon: 'success',
      title: 'Tài khoản đã được xóa',
      text: 'Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi.',
      confirmButtonColor: '#0A2A45',
    }).then(() => {
      window.location.href = '/';
    });
  } catch (err) {
    console.error('Lỗi xóa tài khoản:', err);
    Swal.close();
    const errorMsg =
      err?.response?.data?.message || err?.message || 'Xóa tài khoản thất bại';
    Toast.fire({ icon: 'error', title: errorMsg });
  }
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
      window.location.href = '/login.html';
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
    cancelButtonText: 'Hủy',
  });

  if (!result.isConfirmed) return;

  try {
    Swal.showLoading();
    const success = await favoritesService.clearAll();
    if (success) {
      await loadWishlistFromAPI();
      if (window.updateFavoriteButtons) {
        window.updateFavoriteButtons();
      }
      Swal.close();
      Toast.fire({
        icon: 'success',
        title: 'Đã xóa tất cả sản phẩm yêu thích',
      });
    } else {
      throw new Error('Clear failed');
    }
  } catch (err) {
    console.error('Lỗi xóa sản phẩm yêu thích:', err);
    Swal.close();
    const errorMsg =
      err?.response?.data?.message ||
      err?.message ||
      'Xóa sản phẩm yêu thích thất bại';
    Toast.fire({ icon: 'error', title: errorMsg });
  }
};

// -------------------------
// ĐỊA CHỈ GIAO HÀNG
// -------------------------
let isAddOpen = false;
let isEditOpen = false;

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

    // FIX: Đảm bảo chỉ có 1 địa chỉ mặc định
    const defaultAddresses = allAddresses.filter((a) => a.is_default);
    if (defaultAddresses.length > 1) {
      console.warn('⚠️ Phát hiện nhiều hơn 1 địa chỉ mặc định, đang fix...');
      // Giữ địa chỉ mặc định đầu tiên, bỏ mặc định các địa chỉ còn lại
      allAddresses = allAddresses.map((a, idx) => ({
        ...a,
        is_default:
          idx === allAddresses.findIndex((addr) => addr.is_default) ? 1 : 0,
      }));
    } else if (defaultAddresses.length === 0 && allAddresses.length > 0) {
      // Nếu không có địa chỉ nào mặc định, set địa chỉ đầu tiên làm mặc định
      console.log('ℹ️ Không có địa chỉ mặc định, set địa chỉ đầu làm mặc định');
      allAddresses[0].is_default = 1;
    }

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
      const text = [addr.street, addr.ward, addr.province]
        .filter(Boolean)
        .join(', ');
      const receiverInfo =
        addr.receiver_name || addr.receiver_phone
          ? `<div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Người nhận: ${
              addr.receiver_name || ''
            }${addr.receiver_phone ? ` - ${addr.receiver_phone}` : ''}</div>`
          : '';
      const defaultBadge = addr.is_default
        ? `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">Mặc định</span>`
        : '';
      return `
        <div class="flex items-start gap-3 p-4 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/40 ${
          addr.is_default
            ? 'border-blue-300 dark:border-blue-700 bg-blue-50/30 dark:bg-blue-900/10'
            : ''
        }">
          <input type="radio" name="delivery-address" class="mt-1" ${checked} onchange="selectAddress('${
        addr.id
      }')" />
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <div class="font-medium text-slate-900 dark:text-white">${text}</div>
              ${defaultBadge}
            </div>
            ${receiverInfo}
          </div>
          <div class="flex gap-2">
            <button type="button" class="text-sm font-medium text-blue-500 hover:underline" onclick="openEditById('${
              addr.id
            }')">Sửa</button>
            <button type="button" class="text-sm font-medium text-red-500 hover:underline" onclick="deleteAddress('${
              addr.id
            }')">Xóa</button>
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
  const selectedAddr = allAddresses.find((a) => String(a.id) === String(id));
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
    cancelButtonText: 'Hủy',
  });
  if (!result.isConfirmed) {
    // Nếu hủy, reset lại radio button về địa chỉ mặc định hiện tại
    const defaultAddr = allAddresses.find((a) => a.is_default);
    if (defaultAddr) {
      // Tìm radio button của địa chỉ mặc định bằng cách kiểm tra onchange attribute
      const radios = document.querySelectorAll(
        'input[name="delivery-address"]'
      );
      radios.forEach((radio) => {
        if (radio.getAttribute('onchange')?.includes(`'${defaultAddr.id}'`)) {
          radio.checked = true;
        }
      });
    } else {
      // Nếu không có địa chỉ mặc định, bỏ chọn tất cả
      document
        .querySelectorAll('input[name="delivery-address"]')
        .forEach((r) => (r.checked = false));
    }
    return;
  }

  // Đồng ý đổi mặc định
  try {
    Swal.showLoading();
    // Set is_default = 0 cho địa chỉ mặc định cũ (nếu có)
    const oldDefaultAddr = allAddresses.find(
      (a) => a.is_default && String(a.id) !== String(id)
    );
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
          is_default: 0,
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
        is_default: 1,
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
    const errorMsg =
      err?.response?.data?.message ||
      err?.message ||
      'Cập nhật địa chỉ mặc định thất bại';
    Toast.fire({ icon: 'error', title: errorMsg });

    // Reset lại radio button về địa chỉ mặc định hiện tại
    const defaultAddr = allAddresses.find((a) => a.is_default);
    if (defaultAddr) {
      const radios = document.querySelectorAll(
        'input[name="delivery-address"]'
      );
      radios.forEach((radio) => {
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
// Cần đảm bảo rằng các hàm loadWardsDirectly và populateWards đã được định nghĩa đúng như hướng dẫn trước.

window.openEditById = async (id) => {
  const addr = allAddresses.find((a) => String(a.id) === String(id));
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
  // const districtEl = document.getElementById('edit-addr-district'); // ĐÃ XÓA: Bỏ tham chiếu đến District
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
    const matchingOption = options.find(
      (opt) => opt.textContent === addr.province || opt.value === addr.province
    );

    let provinceCode = null; // Khởi tạo biến provinceCode

    if (matchingOption) {
      provinceEl.value = matchingOption.value;
      provinceCode = matchingOption.dataset.code; // Lấy provinceCode
    } else {
      // Fallback: Nếu không tìm thấy trong dropdown, set value trực tiếp
      provinceEl.value = addr.province;
    }

    // 1. Tải Phường/Xã ngay lập tức sau khi có provinceCode
    if (provinceCode) {
      // ĐÃ THAY ĐỔI: Thay thế populateDistricts bằng populateWards
      await populateWards(provinceCode, 'edit-addr');
    }
  }

  // 2. Set ward (nếu có)
  if (wardEl && addr.ward) {
    // ĐÃ SỬA: Không cần setTimeout và không cần kiểm tra districtEl
    // Ward đã được load trong logic ở trên (await populateWards)

    // Set ward value
    const wardOptions = Array.from(wardEl.options);
    const matchingWard = wardOptions.find(
      (opt) => opt.textContent === addr.ward || opt.value === addr.ward
    );

    if (matchingWard) {
      wardEl.value = matchingWard.value;
    } else {
      wardEl.value = addr.ward;
      // Nếu vẫn không tìm thấy, có thể là lỗi đồng bộ dữ liệu hoặc API,
      // nên bạn có thể cân nhắc hiển thị thông báo lỗi ở đây.
    }
  }

  // Xóa các đoạn code liên quan đến việc set District đã bị ẩn
  // BỎ QUA:
  // if (addr.ward && districtEl) { ... }
  // if (wardEl && addr.ward) { setTimeout(async () => { ... }) }

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
  const receiver_name = document
    .getElementById('edit-addr-name')
    ?.value?.trim();
  const receiver_phone = document
    .getElementById('edit-addr-phone')
    ?.value?.trim();

  if (!id || !street || !province) {
    Toast.fire({
      icon: 'warning',
      title: 'Vui lòng nhập tối thiểu Tên đường và Tỉnh/Thành phố',
    });
    return;
  }

  try {
    Swal.showLoading();
    await api.put(`/addresses/${id}`, {
      street,
      ward,
      province,
      receiver_name,
      receiver_phone,
    });

    // Reload danh sách từ API để đảm bảo dữ liệu mới nhất (không hiển thị loading vì đã có ở trên)
    await loadAddressesFromAPI(false);
    Swal.close();
    cancelEditAddress();
    Toast.fire({ icon: 'success', title: 'Đã cập nhật địa chỉ' });
  } catch (err) {
    console.error('Lỗi cập nhật địa chỉ:', err);
    Swal.close();
    const errorMsg =
      err?.response?.data?.message ||
      err?.message ||
      'Cập nhật địa chỉ thất bại';
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
    Toast.fire({
      icon: 'warning',
      title: 'Vui lòng nhập tối thiểu Tên đường và Tỉnh/Thành phố',
    });
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
      is_default: 0,
    });

    // Reload danh sách từ API để đảm bảo dữ liệu mới nhất (không hiển thị loading vì đã có ở trên)
    await loadAddressesFromAPI(false);
    Swal.close();
    cancelAddAddress();
    Toast.fire({ icon: 'success', title: 'Đã thêm địa chỉ giao hàng' });
  } catch (err) {
    console.error('Lỗi thêm địa chỉ:', err.response?.data || err.message);
    Swal.close();
    Toast.fire({
      icon: 'error',
      title:
        'Lỗi thêm địa chỉ: ' + (err.response?.data?.message || err.message),
    });
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
  document.getElementById('addr-street')?.value &&
    (document.getElementById('addr-street').value = '');
  document.getElementById('addr-province')?.value &&
    (document.getElementById('addr-province').value = '');
  document.getElementById('addr-district')?.value &&
    (document.getElementById('addr-district').value = '');
  document.getElementById('addr-district')?.disabled &&
    (document.getElementById('addr-district').disabled = true);
  document.getElementById('addr-ward')?.value &&
    (document.getElementById('addr-ward').value = '');
  document.getElementById('addr-ward')?.disabled &&
    (document.getElementById('addr-ward').disabled = true);
  document.getElementById('addr-name')?.value &&
    (document.getElementById('addr-name').value = '');
  document.getElementById('addr-phone')?.value &&
    (document.getElementById('addr-phone').value = '');
  // Reset dropdowns
  const provinceSelect = document.getElementById('addr-province');
  const districtSelect = document.getElementById('addr-district');
  const wardSelect = document.getElementById('addr-ward');
  if (provinceSelect) provinceSelect.selectedIndex = 0;
  if (districtSelect) {
    districtSelect.innerHTML =
      '<option value="">-- Chọn Quận/Huyện --</option>';
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
  document.getElementById('edit-addr-id')?.value &&
    (document.getElementById('edit-addr-id').value = '');
  document.getElementById('edit-addr-street')?.value &&
    (document.getElementById('edit-addr-street').value = '');
  document.getElementById('edit-addr-province')?.value &&
    (document.getElementById('edit-addr-province').value = '');
  document.getElementById('edit-addr-district')?.value &&
    (document.getElementById('edit-addr-district').value = '');
  document.getElementById('edit-addr-district')?.disabled &&
    (document.getElementById('edit-addr-district').disabled = true);
  document.getElementById('edit-addr-ward')?.value &&
    (document.getElementById('edit-addr-ward').value = '');
  document.getElementById('edit-addr-ward')?.disabled &&
    (document.getElementById('edit-addr-ward').disabled = true);
  document.getElementById('edit-addr-name')?.value &&
    (document.getElementById('edit-addr-name').value = '');
  document.getElementById('edit-addr-phone')?.value &&
    (document.getElementById('edit-addr-phone').value = '');
  // Reset dropdowns
  const provinceSelect = document.getElementById('edit-addr-province');
  const districtSelect = document.getElementById('edit-addr-district');
  const wardSelect = document.getElementById('edit-addr-ward');
  if (provinceSelect) provinceSelect.selectedIndex = 0;
  if (districtSelect) {
    districtSelect.innerHTML =
      '<option value="">-- Chọn Quận/Huyện --</option>';
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
    cancelButtonText: 'Hủy',
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
    const errorMsg =
      err?.response?.data?.message || err?.message || 'Xóa địa chỉ thất bại';
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
    const res = await api.put('/user/update', { email });
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
const PROVINCES_API_URL = 'https://esgoo.net/api-tinhthanh-new/4/0.htm';
// Giả định provincesCache đã được định nghĩa ở phạm vi global, ví dụ: let provincesCache = null;

const loadProvinces = async () => {
  if (provincesCache) return provincesCache;

  try {
    // 1. Thay thế URL API
    const response = await fetch(PROVINCES_API_URL);

    // Kiểm tra trạng thái HTTP response
    if (!response.ok) {
      throw new Error(`Lỗi HTTP! Status: ${response.status}`);
    }

    const jsonResponse = await response.json();

    // 2. Lấy danh sách tỉnh/thành phố từ thuộc tính 'data' (thường gặp trong cấu trúc API này).
    // Nếu không có thuộc tính 'data', sẽ trả về toàn bộ response.
    const provincesList = jsonResponse.data || jsonResponse;

    // Lưu cache và trả về
    provincesCache = provincesList;
    console.log(provincesList);
    return provincesList;
  } catch (err) {
    console.error('Lỗi load tỉnh/thành phố:', err);
    return [];
  }
};
// Load danh sách quận/huyện theo tỉnh
// const loadDistricts = async (provinceCode) => {
//   if (districtsCache[provinceCode]) return districtsCache[provinceCode];

//   try {
//     const response = await fetch(`${PROVINCES_API}/p/${provinceCode}?depth=2`);
//     const data = await response.json();
//     // API có thể trả về districts trong data hoặc data.districts
//     const districts = data.districts || (Array.isArray(data) ? data : []);
//     districtsCache[provinceCode] = districts;
//     return districts;
//   } catch (err) {
//     console.error('Lỗi load quận/huyện:', err);
//     return [];
//   }
// };

// **Sử dụng cache đã có từ loadProvinces**
// let provincesCache = null;
// const wardsCache = {}; // Cache wards theo province code

// Hàm cũ loadWards không cần nữa vì ta đã load hết trong loadProvinces
// const WARDS_API_BASE = 'https://esgoo.net/api-tinhthanh-new/5/';

/**
 * Lấy danh sách Phường/Xã/Quận/Huyện trực thuộc Tỉnh/Thành phố
 * từ dữ liệu đã tải sẵn trong provincesCache.
 *
 * @param {string} provinceCode Mã code của Tỉnh/Thành phố (vd: '01')
 * @returns {Array} Mảng các Phường/Xã/Quận/Huyện.
 */
const loadWardsDirectly = async (provinceCode) => {
  // Đảm bảo provincesCache đã được tải
  if (!provincesCache) {
    await loadProvinces();
  }

  if (wardsCache[provinceCode]) return wardsCache[provinceCode];

  try {
    // Tìm tỉnh/thành phố tương ứng trong provincesCache
    const province = provincesCache.find((p) => p.code === provinceCode);

    if (province && Array.isArray(province.data2)) {
      const wardsList = province.data2;
      // Lưu vào wardsCache để lần sau không cần tìm lại
      wardsCache[provinceCode] = wardsList;
      return wardsList;
    } else {
      console.error(
        `Không tìm thấy dữ liệu wards cho mã tỉnh ${provinceCode} hoặc data2 không hợp lệ.`
      );
      return [];
    }
  } catch (err) {
    console.error('Lỗi khi trích xuất phường/xã:', err);
    return [];
  }
};

// Populate tỉnh/thành phố vào select
const populateProvinces = async (prefix = 'addr') => {
  const select = document.getElementById(`${prefix}-province`);
  if (!select) return;

  const provinces = await loadProvinces();
  select.innerHTML = '<option value="">-- Chọn Tỉnh/Thành phố --</option>';

  provinces.forEach((province) => {
    const option = document.createElement('option');
    option.value = province.name;
    option.textContent = province.name;
    option.dataset.code = province.code;
    select.appendChild(option);
  });
};

// Populate quận/huyện vào select
// const populateDistricts = async (provinceCode, prefix = 'addr') => {
//   const select = document.getElementById(`${prefix}-district`);
//   if (!select) return;

//   select.disabled = true;
//   select.innerHTML = '<option value="">-- Đang tải... --</option>';

//   const districts = await loadDistricts(provinceCode);
//   select.innerHTML = '<option value="">-- Chọn Quận/Huyện --</option>';

//   if (districts.length > 0) {
//     select.disabled = false;
//     districts.forEach((district) => {
//       const option = document.createElement('option');
//       option.value = district.name;
//       option.textContent = district.name;
//       option.dataset.code = district.code;
//       select.appendChild(option);
//     });
//   } else {
//     select.innerHTML = '<option value="">-- Không có dữ liệu --</option>';
//   }
// };

// Populate phường/xã vào select
// Populate phường/xã vào select
const populateWards = async (provinceCode, prefix = 'addr') => {
  const select = document.getElementById(`${prefix}-ward`);
  if (!select) return;

  select.disabled = true;
  select.innerHTML = '<option value="">-- Đang tải... --</option>';

  // Thay thế loadWards cũ bằng loadWardsDirectly, truyền vào provinceCode
  const wards = await loadWardsDirectly(provinceCode);
  select.innerHTML = '<option value="">-- Chọn Phường/Xã --</option>';

  if (wards.length > 0) {
    select.disabled = false;
    wards.forEach((ward) => {
      const option = document.createElement('option');
      // Do API này có vẻ gom tất cả Phường/Xã/Quận/Huyện vào data2
      // nên ta sẽ hiển thị tên cấp hành chính và dùng ID/CODE để phân biệt nếu cần sau này.
      option.value = ward.full_name; // Dùng full_name để hiển thị đầy đủ
      option.textContent = ward.full_name;
      option.dataset.code = ward.code; // Quan trọng để lấy code
      select.appendChild(option);
    });
  } else {
    select.innerHTML = '<option value="">-- Không có dữ liệu --</option>';
  }
};

// Xử lý khi chọn tỉnh/thành phố (giữ nguyên logic bạn đã sửa, nhưng đảm bảo biến provinceCode được truyền đúng)
window.onProvinceChange = async (formType = 'add') => {
  const prefix = formType === 'edit' ? 'edit-addr' : 'addr';
  const provinceSelect = document.getElementById(`${prefix}-province`);
  // const districtSelect = document.getElementById(`${prefix}-district`); // Bỏ qua district
  const wardSelect = document.getElementById(`${prefix}-ward`);

  if (!provinceSelect || /*!districtSelect ||*/ !wardSelect) return;

  const selectedOption = provinceSelect.options[provinceSelect.selectedIndex];
  // Lấy mã code của Tỉnh/Thành phố
  const provinceCode = selectedOption?.dataset.code;

  // Reset phường/xã
  wardSelect.innerHTML = '<option value="">-- Chọn Phường/Xã --</option>';
  wardSelect.disabled = true;

  if (provinceCode) {
    // Gọi hàm Populate Wards với provinceCode
    await populateWards(provinceCode, prefix);
  }
};

// Xử lý khi chọn quận/huyện
// window.onDistrictChange = async (formType = 'add') => {
//   const prefix = formType === 'edit' ? 'edit-addr' : 'addr';
//   const districtSelect = document.getElementById(`${prefix}-district`);
//   const wardSelect = document.getElementById(`${prefix}-ward`);

//   if (!districtSelect || !wardSelect) return;

//   const selectedOption = districtSelect.options[districtSelect.selectedIndex];
//   const districtCode = selectedOption?.dataset.code;

//   // Reset phường/xã
//   wardSelect.innerHTML = '<option value="">-- Chọn Phường/Xã --</option>';
//   wardSelect.disabled = true;

//   if (districtCode) {
//     await populateWards(districtCode, prefix);
//   }
// };

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
  console.log('🚀 Profile page loaded');
  console.log('📍 Current URL:', window.location.href);
  console.log('🔑 Token exists:', !!localStorage.getItem('token'));

  // Show loading state cho orders
  const orderList = document.getElementById('order-list');
  if (orderList) {
    console.log('✅ Found order-list element');
    orderList.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-8">
          <div class="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p class="mt-2 text-gray-500">Đang tải đơn hàng...</p>
        </td>
      </tr>
    `;
  } else {
    console.error('❌ order-list element not found!');
  }

  // Load data
  loadUserProfile(); // Load user profile từ API
  loadOrdersFromAPI();
  loadWishlistFromAPI();
  loadAddressesFromAPI();

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

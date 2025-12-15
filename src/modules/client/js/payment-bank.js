import { formatCurrency } from '../../../shared/utils/format.js';
import Swal from '../../../shared/utils/swal.js';
import api from '../../../shared/services/api.js';

console.log('Payment Bank JS loaded');

let paymentData = null;
let orderId = null;
let checkStatusInterval = null;

// Get order_id from URL
const getOrderIdFromURL = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('order_id') || urlParams.get('id');
  return id ? parseInt(id) : null;
};

// Create payment QR code
const createPayment = async () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    showError('Bạn cần đăng nhập để thanh toán');
    return;
  }

  if (!orderId) {
    showError('Không tìm thấy mã đơn hàng');
    return;
  }

  try {
    console.log('Creating payment for order_id:', orderId);
    const response = await api.post('/payments/create', {
      order_id: orderId
    });

    console.log('Payment response:', response);
    console.log('Response data:', response.data);
    console.log('Response data.status:', response.data?.status);
    console.log('Response data.data:', response.data?.data);
    console.log('Response data.data.data:', response.data?.data?.data);

    // Handle different response structures (including nested data)
    // Response class wraps: { status, statusCode, data: {...} }
    // PaymentController returns: { status, statusCode, data: { order_id, ... } }
    // So final structure: { status, statusCode, data: { status, statusCode, data: { order_id, ... } } }
    
    let paymentResponseData = null;
    
    // Priority 1: Check for double-nested structure (Response class wraps PaymentController response)
    if (response.data?.data?.data && response.data.data.data.order_id) {
      paymentResponseData = response.data.data.data;
      console.log('Using double-nested structure: response.data.data.data');
    }
    // Priority 2: Check for single nested structure
    else if (response.data?.data && response.data.data.order_id) {
      paymentResponseData = response.data.data;
      console.log('Using single-nested structure: response.data.data');
    }
    // Priority 3: Check for flat structure
    else if (response.data?.order_id) {
      paymentResponseData = response.data;
      console.log('Using flat structure: response.data');
    }

    console.log('Payment response data:', paymentResponseData);

    // Check if we have valid payment data
    if (paymentResponseData && paymentResponseData.order_id) {
      paymentData = paymentResponseData;
      console.log('Payment data set successfully:', paymentData);
      renderPaymentInfo();
      startStatusCheck();
    } else {
      console.error('Invalid payment response structure:', response.data);
      console.error('Payment response data:', paymentResponseData);
      const errorMsg = response.data?.data?.error 
        || response.data?.error 
        || response.data?.message
        || 'Không thể tạo mã thanh toán. Vui lòng kiểm tra lại.';
      showError(errorMsg);
    }
  } catch (error) {
    console.error('Create payment error:', error);
    console.error('Error response:', error.response);
    console.error('Error response data:', error.response?.data);
    
    let errorMessage = 'Không thể tạo mã thanh toán. Vui lòng thử lại.';
    
    if (error.response) {
      // Server responded with error
      const errorData = error.response.data;
      errorMessage = errorData?.data?.error 
        || errorData?.error 
        || errorData?.message
        || `Lỗi ${error.response.status}: ${error.response.statusText}`;
    } else if (error.request) {
      // Request was made but no response received
      errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
    } else {
      // Error setting up request
      errorMessage = error.message || errorMessage;
    }
    
    showError(errorMessage);
  }
};

// Render payment information
const renderPaymentInfo = () => {
  if (!paymentData) {
    console.error('Payment data is null or undefined');
    return;
  }

  console.log('Rendering payment info with data:', paymentData);

  // Hide loading, show payment info
  const loadingState = document.getElementById('loading-state');
  const paymentInfo = document.getElementById('payment-info');
  
  if (loadingState) loadingState.classList.add('hidden');
  if (paymentInfo) paymentInfo.classList.remove('hidden');

  // Set QR code
  const qrImage = document.getElementById('qr-code-image');
  if (qrImage) {
    if (paymentData.qr_code_url && paymentData.qr_code_url.trim() !== '') {
      qrImage.src = paymentData.qr_code_url;
      qrImage.alt = 'QR Code thanh toán';
      qrImage.onerror = () => {
        console.error('Failed to load QR code image');
        qrImage.style.display = 'none';
      };
    } else {
      console.warn('QR code URL is empty, hiding QR code section');
      // Hide QR code section if no URL
      const qrSection = qrImage.closest('.bg-white');
      if (qrSection) {
        qrSection.style.display = 'none';
      }
    }
  }

  // Set bank info (right panel only now)
  const paymentContentCopyEl = document.getElementById('payment-content-copy');
  const orderIdEl = document.getElementById('order-id');

  // Set bank info (right panel)
  const accountNumberRightEl = document.getElementById('account-number-right');
  const bankNameRightEl = document.getElementById('bank-name-right');
  const paymentAmountRightEl = document.getElementById('payment-amount-right');
  const paymentContentRightEl = document.getElementById('payment-content-right');

  const accountNumber = paymentData.account_number || 'N/A';
  const bankName = paymentData.bank_name || 'N/A';
  const amount = formatCurrency(paymentData.amount || 0);
  const paymentContent = paymentData.payment_content || `DH${orderId}`;

  // Set QR amount
  const paymentAmountQrEl = document.getElementById('payment-amount-qr');
  if (paymentAmountQrEl) {
    paymentAmountQrEl.textContent = amount;
  }
  if (paymentContentCopyEl) {
    paymentContentCopyEl.textContent = paymentContent;
  }
  if (orderIdEl) {
    orderIdEl.textContent = `#${paymentData.order_id || orderId}`;
  }

  // Set right panel info
  if (accountNumberRightEl) {
    accountNumberRightEl.textContent = accountNumber;
  }
  if (bankNameRightEl) {
    bankNameRightEl.textContent = bankName;
  }
  if (paymentAmountRightEl) {
    paymentAmountRightEl.textContent = amount;
  }
  if (paymentContentRightEl) {
    paymentContentRightEl.textContent = paymentContent;
  }

  console.log('Payment info rendered successfully');
  
  // Load order details for status
  loadOrderDetails();
};

// Load order details
const loadOrderDetails = async () => {
  try {
    console.log('Loading order details for order_id:', orderId);
    const response = await api.get(`/orders/${orderId}`);
    console.log('Order details response:', response);
    
    // Handle nested response structure
    let order = null;
    if (response.data?.data?.data && response.data.data.data.id) {
      order = response.data.data.data;
      console.log('Using double-nested structure for order');
    } else if (response.data?.data && response.data.data.id) {
      order = response.data.data;
      console.log('Using single-nested structure for order');
    } else if (response.data?.id) {
      order = response.data;
      console.log('Using flat structure for order');
    }
    
    console.log('Order data:', order);
    
    if (order) {
      const statusEl = document.getElementById('order-status');
      const statusText = getStatusText(order.status);
      if (statusEl) statusEl.textContent = statusText;
      
      if (order.created_at) {
        const createdDate = new Date(order.created_at);
        const createdEl = document.getElementById('order-created');
        if (createdEl) createdEl.textContent = createdDate.toLocaleString('vi-VN');
      }

      // Check if already paid - check both payment_status and is_paid
      const paymentStatus = (order.payment_status || '').toLowerCase();
      const isPaid = paymentStatus === 'paid' || order.is_paid === true;
      
      console.log('Order payment status:', paymentStatus, 'isPaid:', isPaid);
      
      if (isPaid) {
        showPaymentSuccess();
      }
    }
  } catch (error) {
    console.error('Load order details error:', error);
    console.error('Error response:', error.response);
  }
};

// Get status text
const getStatusText = (status) => {
  const statusMap = {
    'pending': 'Chờ xác nhận',
    'confirmed': 'Đã xác nhận',
    'processing': 'Đang xử lý',
    'shipping': 'Đang giao hàng',
    'delivered': 'Đã giao hàng',
    'cancelled': 'Đã hủy'
  };
  return statusMap[status] || status;
};

// Check payment status
window.checkPaymentStatus = async () => {
  if (!orderId) return;

  try {
    Swal.fire({
      title: 'Đang kiểm tra...',
      text: 'Vui lòng đợi trong giây lát',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const response = await api.get(`/payments/status/${orderId}`);
    console.log('Payment status response:', response);
    console.log('Response data:', response.data);
    console.log('Response data.data:', response.data?.data);
    console.log('Response data.data.data:', response.data?.data?.data);

    // Handle nested response structure
    let statusData = null;
    
    // Check for double-nested structure
    if (response.data?.data?.data && response.data.data.data.order_id) {
      statusData = response.data.data.data;
      console.log('Using double-nested structure for status');
    }
    // Check for single-nested structure
    else if (response.data?.data && response.data.data.order_id) {
      statusData = response.data.data;
      console.log('Using single-nested structure for status');
    }
    // Check for flat structure
    else if (response.data?.order_id) {
      statusData = response.data;
      console.log('Using flat structure for status');
    }

    console.log('Payment status data:', statusData);

    // Check payment status - can be is_paid or payment_status === 'paid'
    const isPaid = statusData?.is_paid === true 
      || statusData?.payment_status === 'paid'
      || statusData?.payment_status === 'Paid';

    if (isPaid) {
      Swal.close();
      showPaymentSuccess();
    } else {
      Swal.fire({
        icon: 'info',
        title: 'Chưa thanh toán',
        html: `
          <div class="text-left space-y-2">
            <p>Đơn hàng chưa được thanh toán.</p>
            <p class="text-sm text-gray-600">Trạng thái: <strong>${statusData?.payment_status || 'unpaid'}</strong></p>
            <p class="text-sm text-gray-600">Vui lòng kiểm tra lại sau khi chuyển khoản.</p>
          </div>
        `,
        confirmButtonText: 'Đã hiểu',
      });
    }
  } catch (error) {
    console.error('Check payment status error:', error);
    console.error('Error response:', error.response);
    Swal.fire({
      icon: 'error',
      title: 'Lỗi kiểm tra',
      text: error.response?.data?.data?.error 
        || error.response?.data?.error 
        || 'Không thể kiểm tra trạng thái thanh toán',
      confirmButtonText: 'Đóng',
    });
  }
};

// Show payment success
const showPaymentSuccess = () => {
  Swal.fire({
    icon: 'success',
    title: 'Thanh toán thành công!',
    html: `
      <div class="text-center space-y-4">
        <p class="text-gray-600">Đơn hàng của bạn đã được thanh toán thành công.</p>
        <p class="text-gray-600">Chúng tôi sẽ xử lý đơn hàng trong thời gian sớm nhất.</p>
        <div class="mt-4">
          <a href="/profile.html" class="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Xem đơn hàng của tôi
          </a>
        </div>
      </div>
    `,
    confirmButtonText: 'Về trang chủ',
    showCancelButton: true,
    cancelButtonText: 'Ở lại trang này',
  }).then((result) => {
    if (result.isConfirmed) {
      window.location.href = '/index.html';
    }
  });

  // Stop checking status
  if (checkStatusInterval) {
    clearInterval(checkStatusInterval);
    checkStatusInterval = null;
  }
};

// Start auto-check payment status
const startStatusCheck = () => {
  // Check every 30 seconds
  checkStatusInterval = setInterval(async () => {
    try {
      const response = await api.get(`/payments/status/${orderId}`);
      
      // Handle nested response structure
      let statusData = null;
      if (response.data?.data?.data && response.data.data.data.order_id) {
        statusData = response.data.data.data;
      } else if (response.data?.data && response.data.data.order_id) {
        statusData = response.data.data;
      } else if (response.data?.order_id) {
        statusData = response.data;
      }

      // Check payment status
      const isPaid = statusData?.is_paid === true 
        || statusData?.payment_status === 'paid'
        || statusData?.payment_status === 'Paid';

      if (isPaid) {
        showPaymentSuccess();
      }
    } catch (error) {
      console.error('Auto check payment status error:', error);
    }
  }, 30000); // 30 seconds
};

// Download QR code
window.downloadQRCode = () => {
  if (!paymentData?.qr_code_url) return;

  const link = document.createElement('a');
  link.href = paymentData.qr_code_url;
  link.download = `qr-code-${orderId}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  Swal.fire({
    icon: 'success',
    title: 'Đã tải mã QR',
    text: 'Mã QR đã được tải về máy của bạn',
    timer: 2000,
    showConfirmButton: false,
  });
};

// Show error
const showError = (message) => {
  document.getElementById('loading-state').classList.add('hidden');
  document.getElementById('payment-info').classList.add('hidden');
  document.getElementById('error-state').classList.remove('hidden');
  document.getElementById('error-message').textContent = message;
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Payment Bank page loaded');

  // Get order_id from URL
  orderId = getOrderIdFromURL();

  if (!orderId) {
    showError('Không tìm thấy mã đơn hàng trong URL. Vui lòng quay lại trang thanh toán.');
    return;
  }

  // Check authentication
  const token = localStorage.getItem('token');
  if (!token) {
    Swal.fire({
      icon: 'warning',
      title: 'Yêu cầu đăng nhập',
      text: 'Bạn cần đăng nhập để thanh toán.',
      confirmButtonText: 'Đăng nhập ngay',
      showCancelButton: true,
      cancelButtonText: 'Hủy',
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.href)}`;
      } else {
        window.location.href = '/checkout.html';
      }
    });
    return;
  }

  // Create payment
  createPayment();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (checkStatusInterval) {
    clearInterval(checkStatusInterval);
  }
});


import Swal from '../../../shared/utils/swal.js';
import api from '../../../shared/services/api.js';
import { Header } from '../components/Header.js';
import { Footer } from '../components/Footer.js';

/**
 * Forgot Password Page
 * Gửi email reset password cho user
 */

// Render Header & Footer
document.getElementById('header-section').innerHTML = Header();
document.getElementById('footer-section').innerHTML = Footer();

const form = document.getElementById('forgot-password-form');
const submitBtn = document.getElementById('submit-btn');
const btnText = document.getElementById('btn-text');
const btnLoading = document.getElementById('btn-loading');
const successMessage = document.getElementById('success-message');

// Handle form submit
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();

  // Validate email
  if (!email) {
    Swal.fire({
      icon: 'error',
      title: 'Thiếu thông tin',
      text: 'Vui lòng nhập địa chỉ email',
    });
    return;
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    Swal.fire({
      icon: 'error',
      title: 'Email không hợp lệ',
      text: 'Vui lòng nhập địa chỉ email đúng định dạng',
    });
    return;
  }

  try {
    // Show loading
    submitBtn.disabled = true;
    btnText.classList.add('hidden');
    btnLoading.classList.remove('hidden');

    console.log('📧 Sending forgot password request for:', email);

    // Show loading alert
    Swal.fire({
      title: 'Đang gửi email...',
      html: 'Vui lòng đợi, hệ thống đang gửi mã xác thực đến email của bạn. Quá trình này có thể mất 30-60 giây.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // Call API
    const response = await api.post('/forgot-password/send-code', { email });

    console.log('✅ Forgot password response:', response.data);

    // Store email for reset page
    localStorage.setItem('reset_email', email);

    // Close loading and show success alert
    Swal.close();
    Swal.fire({
      icon: 'success',
      title: 'Email đã được gửi!',
      html: `
        <p>${response.data.message || 'Chúng tôi đã gửi mã xác thực đến:'}</p>
        <p class="font-bold text-[#0A2A45] mt-2">${email}</p>
        <p class="text-sm text-gray-600 mt-2">Mã có hiệu lực trong 10 phút. Vui lòng kiểm tra hộp thư (có thể ở mục Spam)</p>
      `,
      confirmButtonText: 'Tiếp tục đặt lại mật khẩu',
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = `/reset-password.html?email=${encodeURIComponent(
          email
        )}`;
      }
    });
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    console.error('📊 Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.response?.data?.message,
      fullError: error.response,
    });

    let errorMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
    let errorTitle = 'Không thể gửi email';

    if (error.response?.status === 400) {
      // Invalid Email
      errorMessage = 'Email không hợp lệ hoặc không tồn tại trong hệ thống.';
    } else if (error.response?.status === 403) {
      // Account Locked
      errorTitle = 'Tài khoản bị khóa';
      errorMessage =
        'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ với quản trị viên để được hỗ trợ.';
    } else if (error.response?.status === 404) {
      errorMessage = 'Email này chưa được đăng ký trong hệ thống.';
    } else if (error.response?.status === 429) {
      errorTitle = 'Quá nhiều yêu cầu';
      errorMessage =
        'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.';
    } else if (error.response?.status === 500) {
      // Server Error - Email Service Failed
      errorTitle = 'Lỗi hệ thống';
      errorMessage =
        error.response?.data?.error ||
        'Hệ thống gửi email đang gặp sự cố. Vui lòng thử lại sau ít phút hoặc liên hệ quản trị viên.';
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    }

    Swal.fire({
      icon: 'error',
      title: errorTitle,
      text: errorMessage,
    });

    // Reset button
    submitBtn.disabled = false;
    btnText.classList.remove('hidden');
    btnLoading.classList.add('hidden');
  }
});

// Resend email function (if user clicks "Gửi lại")
window.resendEmail = async () => {
  successMessage.classList.add('hidden');
  form.classList.remove('hidden');

  Swal.fire({
    icon: 'info',
    title: 'Gửi lại email',
    text: 'Nhập lại email để gửi link mới',
  });
};

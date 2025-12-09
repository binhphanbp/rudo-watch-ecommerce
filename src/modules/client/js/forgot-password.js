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

    // Call API
    const response = await api.post('/auth/forgot-password', { email });

    console.log('✅ Forgot password response:', response.data);

    // Hide form, show success message
    form.classList.add('hidden');
    successMessage.classList.remove('hidden');

    // Show success alert
    Swal.fire({
      icon: 'success',
      title: 'Email đã được gửi!',
      html: `
        <p>Chúng tôi đã gửi link đặt lại mật khẩu đến:</p>
        <p class="font-bold text-blue-600 mt-2">${email}</p>
        <p class="text-sm text-gray-600 mt-2">Vui lòng kiểm tra hộp thư (có thể ở mục Spam)</p>
      `,
      confirmButtonText: 'Đã hiểu',
    });
  } catch (error) {
    console.error('❌ Forgot password error:', error);

    let errorMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';

    if (error.response?.status === 404) {
      errorMessage = 'Email này chưa được đăng ký trong hệ thống.';
    } else if (error.response?.status === 429) {
      errorMessage = 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.';
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }

    Swal.fire({
      icon: 'error',
      title: 'Không thể gửi email',
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

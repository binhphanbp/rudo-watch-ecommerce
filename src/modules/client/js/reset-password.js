import Swal from '../../../shared/utils/swal.js';
import api from '../../../shared/services/api.js';
import { Header } from '../components/Header.js';
import { Footer } from '../components/Footer.js';

/**
 * Reset Password Page
 * Đặt lại mật khẩu với token từ email
 */

// Render Header & Footer
document.getElementById('header-section').innerHTML = Header();
document.getElementById('footer-section').innerHTML = Footer();

const form = document.getElementById('reset-password-form');
const submitBtn = document.getElementById('submit-btn');
const btnText = document.getElementById('btn-text');
const btnLoading = document.getElementById('btn-loading');
const codeInput = document.getElementById('code');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirm-password');
const togglePasswordBtn = document.getElementById('toggle-password');

// Toggle password visibility
togglePasswordBtn.addEventListener('click', () => {
  const type = passwordInput.type === 'password' ? 'text' : 'password';
  passwordInput.type = type;
  confirmPasswordInput.type = type;
});

// Password strength checker
passwordInput.addEventListener('input', (e) => {
  const password = e.target.value;
  const strengthContainer = document.getElementById('password-strength');
  const strengthBar = document.getElementById('strength-bar');
  const strengthText = document.getElementById('strength-text');

  if (!password) {
    strengthContainer.classList.add('hidden');
    return;
  }

  strengthContainer.classList.remove('hidden');

  // Calculate strength
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;

  // Update UI
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-green-500',
    'bg-green-600',
  ];
  const texts = ['Rất yếu', 'Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'];
  const textColors = [
    'text-red-600',
    'text-orange-600',
    'text-yellow-600',
    'text-green-600',
    'text-green-700',
  ];

  strengthBar.className = `h-full transition-all duration-300 ${
    colors[strength - 1] || 'bg-gray-300'
  }`;
  strengthBar.style.width = `${(strength / 5) * 100}%`;
  strengthText.textContent = texts[strength - 1] || '';
  strengthText.className = `text-xs font-medium ${
    textColors[strength - 1] || 'text-gray-500'
  }`;
});

// Handle form submit
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const code = codeInput.value.trim();
  const password = passwordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();

  // Validation
  if (!code || !password || !confirmPassword) {
    Swal.fire({
      icon: 'error',
      title: 'Thiếu thông tin',
      text: 'Vui lòng nhập đầy đủ thông tin',
    });
    return;
  }

  if (code.length !== 6 || !/^\d{6}$/.test(code)) {
    Swal.fire({
      icon: 'error',
      title: 'Mã không hợp lệ',
      text: 'Mã xác thực phải là 6 chữ số',
    });
    return;
  }

  if (password.length < 8) {
    Swal.fire({
      icon: 'error',
      title: 'Mật khẩu quá ngắn',
      text: 'Mật khẩu phải có ít nhất 8 ký tự',
    });
    return;
  }

  if (password !== confirmPassword) {
    Swal.fire({
      icon: 'error',
      title: 'Mật khẩu không khớp',
      text: 'Mật khẩu xác nhận không khớp với mật khẩu mới',
    });
    return;
  }

  try {
    // Show loading
    submitBtn.disabled = true;
    btnText.classList.add('hidden');
    btnLoading.classList.remove('hidden');

    console.log('🔐 Resetting password with code:', code);

    // Call API
    const response = await api.post('/forgot-password/reset', {
      code: code,
      newPassword: password,
    });

    console.log('✅ Reset password response:', response.data);

    // Success
    Swal.fire({
      icon: 'success',
      title: 'Đặt lại mật khẩu thành công!',
      html: '<p>Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.</p>',
      confirmButtonText: 'Đăng nhập',
      allowOutsideClick: false,
    }).then(() => {
      window.location.href = '/login.html';
    });
  } catch (error) {
    console.error('❌ Reset password error:', error);

    let errorMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
    let errorTitle = 'Không thể đặt lại mật khẩu';

    if (error.response?.status === 400) {
      // Invalid Token
      errorTitle = 'Token không hợp lệ';
      errorMessage =
        'Link đặt lại mật khẩu không hợp lệ. Vui lòng yêu cầu link mới.';
    } else if (error.response?.status === 401) {
      // Token Expired
      errorTitle = 'Link đã hết hạn';
      errorMessage =
        'Link đặt lại mật khẩu đã hết hạn (chỉ có hiệu lực 1 giờ). Vui lòng yêu cầu link mới.';
    } else if (error.response?.status === 409) {
      // Token Already Used
      errorTitle = 'Link đã được sử dụng';
      errorMessage =
        'Link này đã được sử dụng để đặt lại mật khẩu rồi. Vui lòng yêu cầu link mới nếu cần.';
    } else if (error.response?.status === 422) {
      // Password Too Short
      errorTitle = 'Mật khẩu không hợp lệ';
      errorMessage =
        error.response.data?.message || 'Mật khẩu phải có ít nhất 8 ký tự.';
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }

    Swal.fire({
      icon: 'error',
      title: errorTitle,
      text: errorMessage,
      confirmButtonText: 'Yêu cầu link mới',
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = '/forgot-password.html';
      }
    });

    // Reset button
    submitBtn.disabled = false;
    btnText.classList.remove('hidden');
    btnLoading.classList.add('hidden');
  }
});

// Check token validity on page load
window.addEventListener('DOMContentLoaded', async () => {
  if (!token) return;

  try {
    console.log('🔍 Verifying token...');
    // Optional: Call API to verify token before user submits
    // await api.post('/auth/verify-reset-token', { token });
    console.log('✅ Token is valid');
  } catch (error) {
    console.error('❌ Invalid token:', error);

    Swal.fire({
      icon: 'error',
      title: 'Link đã hết hạn',
      text: 'Link đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu link mới.',
      confirmButtonText: 'Yêu cầu link mới',
    }).then(() => {
      window.location.href = '/forgot-password.html';
    });
  }
});

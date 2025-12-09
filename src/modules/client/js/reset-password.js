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

// Get token from URL
const params = new URLSearchParams(window.location.search);
const token = params.get('token');

// Check if token exists
if (!token) {
  Swal.fire({
    icon: 'error',
    title: 'Link không hợp lệ',
    text: 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
    confirmButtonText: 'Về trang đăng nhập',
  }).then(() => {
    window.location.href = '/login.html';
  });
}

const form = document.getElementById('reset-password-form');
const submitBtn = document.getElementById('submit-btn');
const btnText = document.getElementById('btn-text');
const btnLoading = document.getElementById('btn-loading');
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

  const password = passwordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();

  // Validation
  if (!password || !confirmPassword) {
    Swal.fire({
      icon: 'error',
      title: 'Thiếu thông tin',
      text: 'Vui lòng nhập đầy đủ thông tin',
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

    console.log('🔐 Resetting password with token:', token);

    // Call API
    const response = await api.post('/auth/reset-password', {
      token,
      password,
      password_confirmation: confirmPassword,
    });

    console.log('✅ Reset password response:', response.data);

    // Success
    Swal.fire({
      icon: 'success',
      title: 'Đặt lại mật khẩu thành công!',
      text: 'Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.',
      confirmButtonText: 'Đăng nhập',
      allowOutsideClick: false,
    }).then(() => {
      window.location.href = '/login.html';
    });
  } catch (error) {
    console.error('❌ Reset password error:', error);

    let errorMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';

    if (error.response?.status === 400 || error.response?.status === 422) {
      errorMessage =
        'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu link mới.';
    } else if (error.response?.status === 404) {
      errorMessage = 'Token không tồn tại. Vui lòng yêu cầu link mới.';
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }

    Swal.fire({
      icon: 'error',
      title: 'Không thể đặt lại mật khẩu',
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

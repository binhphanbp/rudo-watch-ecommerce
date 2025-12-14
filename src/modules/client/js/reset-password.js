import Swal from '../../../shared/utils/swal.js';
import api from '../../../shared/services/api.js';

/**
 * Reset Password Page - 3 Step Flow
 * Step 1: Verify code → get token
 * Step 2: Reset password with token
 */

// DOM elements
const step1Container = document.getElementById('step1-container');
const step2Container = document.getElementById('step2-container');
const verifyForm = document.getElementById('verify-form');
const resetForm = document.getElementById('reset-form');
const verifyBtn = document.getElementById('verify-btn');
const verifyBtnText = document.getElementById('verify-btn-text');
const verifyBtnLoading = document.getElementById('verify-btn-loading');
const resetBtn = document.getElementById('reset-btn');
const resetBtnText = document.getElementById('reset-btn-text');
const resetBtnLoading = document.getElementById('reset-btn-loading');
const backBtn = document.getElementById('back-btn');

// Store token after verification
let resetToken = null;
let userEmail = null;

// Toggle password visibility
window.togglePass = function (inputId, btn) {
  const input = document.getElementById(inputId);
  const svg = btn.querySelector('svg');

  if (input.type === 'password') {
    input.type = 'text';
    svg.innerHTML = `
      <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    `;
  } else {
    input.type = 'password';
    svg.innerHTML = `
      <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    `;
  }
};

// Auto-fill email from URL params or localStorage
const urlParams = new URLSearchParams(window.location.search);
const emailFromUrl = urlParams.get('email');
const emailFromStorage = localStorage.getItem('reset_email');

const emailInput = document.getElementById('email');
if (emailFromUrl) {
  emailInput.value = emailFromUrl;
  userEmail = emailFromUrl;
  localStorage.setItem('reset_email', emailFromUrl);
} else if (emailFromStorage) {
  emailInput.value = emailFromStorage;
  userEmail = emailFromStorage;
} else {
  // Redirect to forgot-password if no email
  Swal.fire({
    icon: 'warning',
    title: 'Thiếu thông tin',
    text: 'Vui lòng gửi yêu cầu quên mật khẩu trước',
    confirmButtonText: 'Đến trang quên mật khẩu',
  }).then(() => {
    window.location.href = '/forgot-password.html';
  });
}

// Step 1: Verify code
verifyForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const code = document.getElementById('code').value.trim().toUpperCase();

  // Validate code
  if (!code || code.length !== 6) {
    Swal.fire({
      icon: 'error',
      title: 'Mã không hợp lệ',
      text: 'Vui lòng nhập mã xác thực 6 ký tự',
    });
    return;
  }

  try {
    // Show loading
    verifyBtn.disabled = true;
    verifyBtnText.classList.add('hidden');
    verifyBtnLoading.classList.remove('hidden');

    console.log('🔍 Verifying code:', { email: userEmail, code });

    // Call verify API
    const response = await api.post('/forgot-password/verify-code', {
      email: userEmail,
      code: code,
    });

    console.log('✅ Verification response:', response.data);
    console.log(
      '📝 Full response structure:',
      JSON.stringify(response.data, null, 2)
    );

    // Store token - check multiple possible locations
    resetToken = response.data.data?.token || response.data.token;

    if (!resetToken) {
      console.error('❌ Token not found in response:', response.data);
      throw new Error('Token không tìm thấy trong phản hồi từ server');
    }

    console.log('🔐 Token stored:', resetToken);

    // Show success and move to step 2
    Swal.fire({
      icon: 'success',
      title: 'Xác thực thành công!',
      text: 'Vui lòng nhập mật khẩu mới',
      timer: 1500,
      showConfirmButton: false,
    });

    // Switch to step 2
    step1Container.classList.add('hidden');
    step2Container.classList.remove('hidden');
  } catch (error) {
    console.error('❌ Verify code error:', error);

    let errorMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
    let errorTitle = 'Không thể xác thực';

    if (error.response?.status === 400) {
      errorTitle = 'Mã xác thực không hợp lệ';
      errorMessage =
        error.response?.data?.message ||
        'Mã xác thực không đúng hoặc đã hết hạn. Vui lòng kiểm tra lại email hoặc yêu cầu mã mới.';
    } else if (error.response?.status === 404) {
      errorMessage = 'Email không tồn tại trong hệ thống.';
    } else if (error.response?.status === 429) {
      errorTitle = 'Quá nhiều yêu cầu';
      errorMessage = 'Bạn đã thử quá nhiều lần. Vui lòng đợi 15 phút.';
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }

    Swal.fire({
      icon: 'error',
      title: errorTitle,
      text: errorMessage,
    });

    // Reset button
    verifyBtn.disabled = false;
    verifyBtnText.classList.remove('hidden');
    verifyBtnLoading.classList.add('hidden');
  }
});

// Step 2: Reset password
resetForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const password = document.getElementById('password').value;
  const passwordConfirm = document.getElementById(
    'password_confirmation'
  ).value;

  // Validate password
  if (!password || password.length < 6) {
    Swal.fire({
      icon: 'error',
      title: 'Mật khẩu không hợp lệ',
      text: 'Mật khẩu phải có ít nhất 6 ký tự',
    });
    return;
  }

  // Validate password confirmation
  if (password !== passwordConfirm) {
    Swal.fire({
      icon: 'error',
      title: 'Mật khẩu không khớp',
      text: 'Mật khẩu xác nhận không khớp với mật khẩu mới',
    });
    return;
  }

  try {
    // Show loading
    resetBtn.disabled = true;
    resetBtnText.classList.add('hidden');
    resetBtnLoading.classList.remove('hidden');

    console.log('🔑 Resetting password with token:', {
      email: userEmail,
      token: resetToken,
      tokenLength: resetToken?.length,
      hasToken: !!resetToken,
    });

    // Validate token before sending
    if (!resetToken) {
      throw new Error('Token không hợp lệ. Vui lòng xác thực lại mã code.');
    }

    // Call reset API with token
    const response = await api.post('/forgot-password/reset', {
      email: userEmail,
      token: resetToken,
      new_password: password,
    });

    console.log('✅ Reset password response:', response.data);

    // Clear stored data
    localStorage.removeItem('reset_email');
    resetToken = null;

    // Show success and redirect
    Swal.fire({
      icon: 'success',
      title: 'Đặt lại mật khẩu thành công!',
      html: `
        <p>Mật khẩu của bạn đã được cập nhật.</p>
        <p class="text-sm text-gray-600 mt-2">Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.</p>
      `,
      confirmButtonText: 'Đến trang đăng nhập',
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = '/login.html';
      }
    });
  } catch (error) {
    console.error('❌ Reset password error:', error);
    console.error('📊 Error response:', error.response?.data);
    console.error('🔐 Token being used:', resetToken);

    let errorMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
    let errorTitle = 'Không thể đặt lại mật khẩu';

    if (error.response?.status === 400 || error.response?.status === 401) {
      errorTitle = 'Token không hợp lệ';
      errorMessage =
        error.response?.data?.message ||
        'Token đã hết hạn hoặc không hợp lệ. Vui lòng thử lại từ đầu.';
    } else if (error.response?.status === 422) {
      const errors = error.response?.data?.errors;
      if (errors) {
        const errorList = Object.values(errors)
          .flat()
          .map((err) => `• ${err}`)
          .join('<br>');
        errorMessage = `<div class="text-left text-sm">${errorList}</div>`;
      } else {
        errorMessage = error.response?.data?.message || 'Dữ liệu không hợp lệ';
      }
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }

    Swal.fire({
      icon: 'error',
      title: errorTitle,
      html: errorMessage,
    });

    // Reset button
    resetBtn.disabled = false;
    resetBtnText.classList.remove('hidden');
    resetBtnLoading.classList.add('hidden');
  }
});

// Back to step 1
backBtn.addEventListener('click', () => {
  step2Container.classList.add('hidden');
  step1Container.classList.remove('hidden');
  resetToken = null;
  document.getElementById('password').value = '';
  document.getElementById('password_confirmation').value = '';
});

// Auto-format code input
document.getElementById('code').addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/\s/g, '').toUpperCase();
});

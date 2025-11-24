import Swal, { Toast } from '../utils/swal.js'; // Import từ utils chuẩn

// --- HELPER VALIDATION ---
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// --- UI LOGIC: TABS & PASS TOGGLE ---
window.switchTab = (tab) => {
  const loginForm = document.getElementById('login-form');
  const regForm = document.getElementById('register-form');
  const btnLogin = document.getElementById('tab-login');
  const btnReg = document.getElementById('tab-register');
  const title = document.getElementById('form-title');
  const subtitle = document.getElementById('form-subtitle');

  // Reset forms
  loginForm.reset();
  regForm.reset();

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    regForm.classList.add('hidden');

    btnLogin.classList.replace('text-gray-400', 'text-[#0A2A45]');
    btnLogin.classList.replace('dark:text-gray-300', 'dark:text-blue-400');
    btnLogin.classList.replace('border-transparent', 'border-[#0A2A45]');
    btnLogin.classList.add('dark:border-blue-400');

    btnReg.classList.replace('text-[#0A2A45]', 'text-gray-400');
    btnReg.classList.replace('dark:text-blue-400', 'dark:text-gray-300');
    btnReg.classList.replace('border-[#0A2A45]', 'border-transparent');
    btnReg.classList.remove('dark:border-blue-400');

    title.textContent = 'Chào mừng trở lại!';
    subtitle.textContent = 'Vui lòng đăng nhập để tiếp tục';
  } else {
    regForm.classList.remove('hidden');
    loginForm.classList.add('hidden');

    btnReg.classList.replace('text-gray-400', 'text-[#0A2A45]');
    btnReg.classList.replace('dark:text-gray-300', 'dark:text-blue-400');
    btnReg.classList.replace('border-transparent', 'border-[#0A2A45]');
    btnReg.classList.add('dark:border-blue-400');

    btnLogin.classList.replace('text-[#0A2A45]', 'text-gray-400');
    btnLogin.classList.replace('dark:text-blue-400', 'dark:text-gray-300');
    btnLogin.classList.replace('border-[#0A2A45]', 'border-transparent');
    btnLogin.classList.remove('dark:border-blue-400');

    title.textContent = 'Tạo tài khoản mới';
    subtitle.textContent = 'Điền thông tin để tham gia cùng chúng tôi';
  }
};

window.togglePass = (inputId, btn) => {
  const input = document.getElementById(inputId);
  const icon = btn.querySelector('svg');

  if (input.type === 'password') {
    input.type = 'text';
    // Icon Eye Slash
    icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />`;
  } else {
    input.type = 'password';
    // Icon Eye
    icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />`;
  }
};

// --- MAIN LOGIC: LOGIN ---
window.handleLogin = (e) => {
  e.preventDefault(); // Chặn reload trang
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value;

  // 1. Validate
  if (!email || !pass) {
    Toast.fire({ icon: 'warning', title: 'Vui lòng điền đầy đủ thông tin!' });
    return;
  }
  if (!isValidEmail(email)) {
    Toast.fire({ icon: 'error', title: 'Email không hợp lệ!' });
    return;
  }

  // 2. Call API (Simulated)
  Swal.fire({
    title: 'Đang đăng nhập...',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
    timer: 1000,
  }).then(() => {
    // Giả lập thành công
    Swal.fire({
      icon: 'success',
      title: 'Chào mừng trở lại!',
      text: 'Đăng nhập thành công.',
      showConfirmButton: false,
      timer: 1500,
    }).then(() => {
      localStorage.setItem('isLoggedIn', 'true');
      window.location.href = '/';
    });
  });
};

// --- MAIN LOGIC: REGISTER ---
window.handleRegister = (e) => {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass = document.getElementById('reg-pass').value;
  const confirmPass = document.getElementById('reg-pass-confirm').value;
  const terms = document.getElementById('reg-terms').checked;

  // 1. Validate Empty
  if (!name || !email || !pass || !confirmPass) {
    Toast.fire({ icon: 'warning', title: 'Vui lòng điền đầy đủ thông tin!' });
    return;
  }

  // 2. Validate Email
  if (!isValidEmail(email)) {
    Toast.fire({ icon: 'error', title: 'Email không hợp lệ!' });
    return;
  }

  // 3. Validate Password Length
  if (pass.length < 6) {
    Toast.fire({ icon: 'info', title: 'Mật khẩu phải từ 6 ký tự trở lên.' });
    return;
  }

  // 4. Validate Confirm Pass
  if (pass !== confirmPass) {
    Toast.fire({ icon: 'error', title: 'Mật khẩu nhập lại không khớp!' });
    return;
  }

  // 5. Validate Terms
  if (!terms) {
    Toast.fire({ icon: 'warning', title: 'Bạn chưa đồng ý điều khoản!' });
    return;
  }

  // 6. Call API (Simulated)
  Swal.fire({
    title: 'Đang tạo tài khoản...',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
    timer: 1500,
  }).then(() => {
    Swal.fire({
      icon: 'success',
      title: 'Đăng ký thành công!',
      text: 'Vui lòng đăng nhập để tiếp tục.',
      confirmButtonColor: '#0A2A45',
      confirmButtonText: 'Đăng nhập ngay',
    }).then(() => {
      switchTab('login');
    });
  });
};

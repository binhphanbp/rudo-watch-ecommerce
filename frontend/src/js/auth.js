import api from '../services/api.js';
import Swal, { Toast } from '../utils/swal.js';

// --- 1. HELPER VALIDATION ---
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) =>
  /^(0?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/.test(phone);

// --- 2. UI LOGIC (TABS & PASSWORD) ---

// Chuyển đổi giữa Đăng nhập & Đăng ký
window.switchTab = (tab) => {
  const loginForm = document.getElementById('login-form');
  const regForm = document.getElementById('register-form');
  const btnLogin = document.getElementById('tab-login');
  const btnReg = document.getElementById('tab-register');
  const title = document.getElementById('form-title');
  const subtitle = document.getElementById('form-subtitle');

  // Reset form để xóa dữ liệu cũ
  if (loginForm) loginForm.reset();
  if (regForm) regForm.reset();

  if (tab === 'login') {
    // Hiện Login
    loginForm.classList.remove('hidden');
    regForm.classList.add('hidden');

    // Style Tab Active
    btnLogin.className =
      'flex-1 py-3 text-sm font-bold uppercase tracking-wider text-[#0A2A45] dark:text-blue-400 border-b-2 border-[#0A2A45] dark:border-blue-400 transition-all';
    btnReg.className =
      'flex-1 py-3 text-sm font-bold uppercase tracking-wider text-gray-400 border-b-2 border-transparent hover:text-gray-600 dark:hover:text-gray-300 transition-all';

    title.textContent = 'Chào mừng trở lại!';
    subtitle.textContent = 'Vui lòng đăng nhập để tiếp tục';
  } else {
    // Hiện Register
    regForm.classList.remove('hidden');
    loginForm.classList.add('hidden');

    // Style Tab Active
    btnReg.className =
      'flex-1 py-3 text-sm font-bold uppercase tracking-wider text-[#0A2A45] dark:text-blue-400 border-b-2 border-[#0A2A45] dark:border-blue-400 transition-all';
    btnLogin.className =
      'flex-1 py-3 text-sm font-bold uppercase tracking-wider text-gray-400 border-b-2 border-transparent hover:text-gray-600 dark:hover:text-gray-300 transition-all';

    title.textContent = 'Tạo tài khoản mới';
    subtitle.textContent = 'Điền thông tin để tham gia cùng chúng tôi';
  }
};

// Ẩn/Hiện mật khẩu
window.togglePass = (inputId, btn) => {
  const input = document.getElementById(inputId);
  const icon = btn.querySelector('svg');

  if (input.type === 'password') {
    input.type = 'text';
    // Icon Eye Slash (Gạch chéo)
    icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />`;
  } else {
    input.type = 'password';
    // Icon Eye (Mắt thường)
    icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />`;
  }
};

// --- 3. XỬ LÝ ĐĂNG KÝ (REGISTER) ---
window.handleRegister = async (e) => {
  e.preventDefault();
  console.log('🚀 Đang xử lý đăng ký...');

  // Lấy dữ liệu từ Form
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const phone = document.getElementById('reg-phone').value.trim(); // <--- Mới thêm
  const password = document.getElementById('reg-pass').value;
  const confirmPass = document.getElementById('reg-pass-confirm').value;
  const terms = document.getElementById('reg-terms').checked;

  // Validate Frontend
  if (!name || !email || !phone || !password || !confirmPass) {
    return Toast.fire({
      icon: 'warning',
      title: 'Vui lòng điền đầy đủ thông tin!',
    });
  }
  if (!isValidEmail(email)) {
    return Toast.fire({ icon: 'error', title: 'Email không hợp lệ!' });
  }
  if (!isValidPhone(phone)) {
    return Toast.fire({
      icon: 'error',
      title: 'Số điện thoại không hợp lệ (10 số)!',
    });
  }
  if (password.length < 6) {
    return Toast.fire({
      icon: 'info',
      title: 'Mật khẩu phải từ 6 ký tự trở lên.',
    });
  }
  if (password !== confirmPass) {
    return Toast.fire({
      icon: 'error',
      title: 'Mật khẩu nhập lại không khớp!',
    });
  }
  if (!terms) {
    return Toast.fire({
      icon: 'warning',
      title: 'Bạn chưa đồng ý điều khoản!',
    });
  }

  // Gọi API
  try {
    Swal.showLoading();

    const response = await api.post('/register', {
      fullname: name,
      email: email,
      phone: phone, // Gửi thêm trường phone
      password: password,
      password_confirmation: confirmPass,
    });

    console.log('✅ Đăng ký thành công:', response);

    Swal.fire({
      icon: 'success',
      title: 'Thành công!',
      text: 'Tài khoản đã được tạo. Vui lòng đăng nhập.',
      confirmButtonColor: '#0A2A45',
    }).then(() => {
      window.switchTab('login');
    });
  } catch (err) {
    console.error('❌ Lỗi Đăng ký:', err);

    let msg = 'Đăng ký thất bại!';

    // Xử lý thông báo lỗi từ Backend PHP
    if (err.response && err.response.data) {
      const resData = err.response.data;

      // Trường hợp 1: Lỗi trong object 'data.error' (như ảnh bạn gửi)
      if (resData.data && resData.data.error) {
        msg = resData.data.error;
      }
      // Trường hợp 2: Lỗi validate Laravel (errors: { email: [...] })
      else if (resData.errors) {
        const firstKey = Object.keys(resData.errors)[0];
        msg = resData.errors[firstKey][0];
      }
      // Trường hợp 3: Lỗi message chung
      else if (resData.message) {
        msg = resData.message;
      }
    }

    Swal.fire({
      icon: 'error',
      title: 'Lỗi',
      text: msg,
    });
  }
};

// --- 4. XỬ LÝ ĐĂNG NHẬP (LOGIN) ---
window.handleLogin = async (e) => {
  e.preventDefault();
  console.log('🚀 Đang xử lý đăng nhập...');

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-pass').value;

  if (!email || !password) {
    return Toast.fire({
      icon: 'warning',
      title: 'Vui lòng nhập đủ email và mật khẩu',
    });
  }

  try {
    Swal.showLoading();
    const res = await api.post('/login', { email, password });
    console.log('✅ Đăng nhập thành công:', res.data);

    // Backend trả về cấu trúc có thể là { data: { user, token } } hoặc trực tiếp
    const data = res.data.data || res.data;
    const { user, token } = data;

    if (!token) throw new Error('Không nhận được Token từ server');

    // Lưu vào LocalStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    Swal.fire({
      icon: 'success',
      title: 'Đăng nhập thành công',
      timer: 1500,
      showConfirmButton: false,
    }).then(() => {
      window.location.href = '/'; // Chuyển hướng về trang chủ
    });
  } catch (err) {
    console.error('❌ Lỗi Đăng nhập:', err);

    let msg = 'Email hoặc mật khẩu không đúng!';
    if (err.response && err.response.data && err.response.data.message) {
      msg = err.response.data.message;
    }

    Swal.fire({
      icon: 'error',
      title: 'Đăng nhập thất bại',
      text: msg,
    });
  }
};

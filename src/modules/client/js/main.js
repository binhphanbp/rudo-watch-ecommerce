import { Header } from '../components/Header.js';
import { Footer } from '../components/Footer.js';
import CartService from '../../../shared/services/cart.js';
import favoritesService from '../../../shared/services/favorites.js';
import api from '../../../shared/services/api.js';
import '../components/ChatWidget.js'; // AI Chatbot Widget
import '../components/FloatingActions.js'; // Floating Action Buttons (Phone, Messenger, Back to Top)

// === 1. THEME CONTROLLER (Chế độ Sáng/Tối) ===
const themeController = {
  init() {
    // Lấy theme đã lưu hoặc theo hệ thống
    const savedTheme = localStorage.getItem('theme');
    const systemIsDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;

    if (savedTheme === 'dark' || (!savedTheme && systemIsDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  setTheme(mode) {
    if (mode === 'system') {
      localStorage.removeItem('theme');
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      localStorage.setItem('theme', mode);
      if (mode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  },
};

// Gán vào window để nút bấm trong HTML gọi được
window.themeController = themeController;
themeController.init(); // Chạy ngay lập tức để tránh chớp trắng

// === 2. GLOBAL ACTIONS (Gán vào window để Header gọi được) ===

// Bật/Tắt thanh tìm kiếm
window.toggleSearch = () => {
  const searchOverlay = document.getElementById('search-overlay');
  if (searchOverlay) {
    // Toggle class translate để trượt lên/xuống
    if (searchOverlay.classList.contains('-translate-y-full')) {
      searchOverlay.classList.remove('-translate-y-full'); // Hiện
      const input = searchOverlay.querySelector('input');
      if (input) input.focus(); // Auto focus vào ô nhập
    } else {
      searchOverlay.classList.add('-translate-y-full'); // Ẩn
    }
  }
};

// Đăng xuất
window.handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // Reload lại trang để Header cập nhật lại trạng thái
  window.location.href = '/login.html';
};

// === 3. LOGIC GIỎ HÀNG (Cart Counter) ===
const updateCartCount = () => {
  const cart = CartService.getCart();
  const countEl = document.getElementById('cart-count');

  if (countEl) {
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    countEl.textContent = total;

    // Ẩn hiện badge số lượng
    if (total > 0) {
      countEl.classList.remove('hidden');
      countEl.style.display = 'flex';
    } else {
      countEl.classList.add('hidden');
      countEl.style.display = 'none';
    }
  }
};

// Lắng nghe sự kiện 'cart-updated' từ CartService bắn ra
window.addEventListener('cart-updated', updateCartCount);

// === 4. LOGIC SCROLL PROGRESS BAR ===
const initScrollProgress = () => {
  const progressBar = document.getElementById('scroll-progress');
  if (!progressBar) return;

  window.addEventListener('scroll', () => {
    const scrollTop =
      document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;
    const scrolled = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

    progressBar.style.width = `${scrolled}%`;
  });
};

// === 5. FAVORITES TOGGLE ===
window.toggleFavorite = async (productId, buttonElement) => {
  try {
    const isFavorited = await favoritesService.toggleFavorite(productId);

    // Update button UI
    if (buttonElement) {
      if (isFavorited) {
        buttonElement.classList.remove('text-gray-400');
        buttonElement.classList.add('text-red-500', 'fill-current');
      } else {
        buttonElement.classList.add('text-gray-400');
        buttonElement.classList.remove('text-red-500', 'fill-current');
      }
    }

    // Update all favorite buttons for this product on the page
    document
      .querySelectorAll(`.favorite-btn[data-product-id="${productId}"]`)
      .forEach((btn) => {
        if (isFavorited) {
          btn.classList.remove('text-gray-400');
          btn.classList.add('text-red-500', 'fill-current');
        } else {
          btn.classList.add('text-gray-400');
          btn.classList.remove('text-red-500', 'fill-current');
        }
      });
  } catch (err) {
    console.error('Error toggling favorite:', err);
  }
};

// Update all favorite buttons on page based on current favorites
window.updateFavoriteButtons = async () => {
  try {
    const favorites = await favoritesService.getFavorites();
    document.querySelectorAll('.favorite-btn').forEach((btn) => {
      const productId = Number(btn.dataset.productId);
      if (favorites.includes(productId)) {
        btn.classList.remove('text-gray-400');
        btn.classList.add('text-red-500', 'fill-current');
      } else {
        btn.classList.add('text-gray-400');
        btn.classList.remove('text-red-500', 'fill-current');
      }
    });
  } catch (err) {
    console.error('Error updating favorite buttons:', err);
  }
};

// === 6. LOAD USER PROFILE FROM API ===
const loadUserProfile = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return null;
  }

  try {
    const res = await api.get('/user/profile');
    console.log('👤 User profile API response:', res.data);

    // Response format: { status: 'success', statusCode: 200, data: { user: {...} } }
    const user =
      res.data?.data?.user || res.data?.user || res.data?.data || res.data;

    if (user) {
      // Cập nhật localStorage
      localStorage.setItem('user', JSON.stringify(user));

      // Cập nhật header
      updateHeaderUserInfo(user);

      return user;
    }
    return null;
  } catch (err) {
    console.error('❌ Lỗi load profile:', err);

    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Reload header để hiển thị nút đăng nhập
      updateHeaderUserInfo(null);
    }

    return null;
  }
};

// === 7. UPDATE HEADER USER INFO ===
const updateHeaderUserInfo = (user) => {
  // Tìm avatar link
  const avatarLink = document.querySelector('header a[href="/profile.html"]');
  if (!avatarLink) return;

  if (user) {
    // Cập nhật avatar
    const avatarImg = avatarLink.querySelector('img');
    if (avatarImg) {
      const avatarUrl = user?.avatar
        ? user.avatar.startsWith('http')
          ? user.avatar
          : `https://api.rudowatch.store/${user.avatar}`
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(
            user.fullname || user.name || 'User'
          )}&background=random&color=fff`;
      avatarImg.src = avatarUrl;
      avatarImg.alt = user.fullname || user.name || 'Avatar';
    }

    // Cập nhật tên trong dropdown
    const userDropdownContainer = avatarLink.closest('.relative.group');
    if (userDropdownContainer) {
      const userNameElement =
        userDropdownContainer.querySelector('div.px-4.py-3 p');
      if (userNameElement) {
        userNameElement.textContent =
          user.fullname || user.name || 'Người dùng';
      }

      // Cập nhật link admin nếu là admin
      const adminLink = userDropdownContainer.querySelector(
        'a[href="/admin/dashboard.html"]'
      );
      if (user.role === 1) {
        if (!adminLink) {
          const accountLink = userDropdownContainer.querySelector(
            'a[href="/profile.html"]'
          );
          if (accountLink && accountLink.nextElementSibling?.tagName !== 'A') {
            const adminLinkEl = document.createElement('a');
            adminLinkEl.href = '/admin/dashboard.html';
            adminLinkEl.className =
              'block px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-700';
            adminLinkEl.textContent = 'Dashboard';
            accountLink.insertAdjacentElement('afterend', adminLinkEl);
          }
        }
      } else {
        if (adminLink) {
          adminLink.remove();
        }
      }
    }
  } else {
    // Nếu không có user, reload header để hiển thị nút đăng nhập
    const headerContainer = document.querySelector('header .container');
    if (headerContainer) {
      const userSection = avatarLink.closest('.relative.group');
      if (userSection) {
        userSection.outerHTML = `
          <a href="/login.html" class="hover:text-blue-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </a>
        `;
      }
    }
  }
};

// === 8. KHỞI TẠO (Khi DOM load xong) ===
document.addEventListener('DOMContentLoaded', async () => {
  // A. Inject Layout (Header & Footer)
  document.body.insertAdjacentHTML('afterbegin', Header());
  document.body.insertAdjacentHTML('beforeend', Footer());

  // B. Load user profile từ API và cập nhật header
  await loadUserProfile();

  // C. Khởi tạo các tính năng phụ thuộc DOM
  initScrollProgress();
  updateCartCount(); // Cập nhật số giỏ hàng lần đầu

  // D. Sync favorites if logged in
  const token = localStorage.getItem('token');
  if (token) {
    try {
      await favoritesService.syncFromAPI();
    } catch (err) {
      console.error('Error syncing favorites:', err);
    }
  }

  // E. Update favorite buttons after a short delay (wait for products to render)
  setTimeout(() => {
    window.updateFavoriteButtons();
  }, 500);

  // F. Xử lý sự kiện Tìm kiếm (Enter Key)
  const searchInput = document.querySelector('#search-overlay input');
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const keyword = e.target.value.trim();
        if (keyword) {
          // Chuyển trang tìm kiếm
          window.location.href = `/products.html?search=${encodeURIComponent(
            keyword
          )}`;
        }
      }
    });
  }
});

// Export function để các trang khác có thể gọi
window.loadUserProfile = loadUserProfile;
window.updateHeaderUserInfo = updateHeaderUserInfo;

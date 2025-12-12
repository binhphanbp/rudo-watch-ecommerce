import { Header } from '../components/Header.js';
import { Footer } from '../components/Footer.js';
import CartService from '../../../shared/services/cart.js';
import favoritesService from '../../../shared/services/favorites.js';
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
window.toggleFavorite = (productId, buttonElement) => {
  const isFavorited = favoritesService.toggleFavorite(productId);

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
};

// Update all favorite buttons on page based on current favorites
window.updateFavoriteButtons = () => {
  const favorites = favoritesService.getFavorites();
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
};

// === 6. KHỞI TẠO (Khi DOM load xong) ===
document.addEventListener('DOMContentLoaded', async () => {
  // A. Inject Layout (Header & Footer)
  document.body.insertAdjacentHTML('afterbegin', Header());
  document.body.insertAdjacentHTML('beforeend', Footer());
  // B. Khởi tạo các tính năng phụ thuộc DOM
  initScrollProgress();
  updateCartCount(); // Cập nhật số giỏ hàng lần đầu

  // C. Sync favorites if logged in
  const token = localStorage.getItem('token');
  if (token) {
    try {
      await favoritesService.syncFromAPI();
    } catch (err) {
      console.error('Error syncing favorites:', err);
    }
  }

  // D. Update favorite buttons after a short delay (wait for products to render)
  setTimeout(() => {
    window.updateFavoriteButtons();
  }, 500);

  // E. Xử lý sự kiện Tìm kiếm (Enter Key)
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

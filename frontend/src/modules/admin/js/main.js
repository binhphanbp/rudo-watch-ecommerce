import { Sidebar } from "../components/Sidebar.js";
import { Header } from "../components/Header.js";
import CartService from "../../../shared/services/cart.js";
import Swal from "../../../shared/utils/swal.js";

//isAdmin
// const user = JSON.parse(localStorage.getItem('user')) || null;
// const isAdmin = user?.role == 1;
// if(!isAdmin) {
//   window.location.href = '/';
// } 

// === 1. THEME CONTROLLER (Chế độ Sáng/Tối) ===
const themeController = {
  init() {
    // Lấy theme đã lưu hoặc theo hệ thống
    const savedTheme = localStorage.getItem("theme");
    const systemIsDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (savedTheme === "dark" || (!savedTheme && systemIsDark)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  },

  setTheme(mode) {
    if (mode === "system") {
      localStorage.removeItem("theme");
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else {
      localStorage.setItem("theme", mode);
      if (mode === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
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
  const searchOverlay = document.getElementById("search-overlay");
  if (searchOverlay) {
    // Toggle class translate để trượt lên/xuống
    if (searchOverlay.classList.contains("-translate-y-full")) {
      searchOverlay.classList.remove("-translate-y-full"); // Hiện
      const input = searchOverlay.querySelector("input");
      if (input) input.focus(); // Auto focus vào ô nhập
    } else {
      searchOverlay.classList.add("-translate-y-full"); // Ẩn
    }
  }
};

// Đăng xuất (được override bởi Sidebar component)

// === 3. LOGIC GIỎ HÀNG (Cart Counter) ===
const updateCartCount = () => {
  const cart = CartService.getCart();
  const countEl = document.getElementById("cart-count");

  if (countEl) {
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    countEl.textContent = total;

    // Ẩn hiện badge số lượng
    if (total > 0) {
      countEl.classList.remove("hidden");
      countEl.style.display = "flex";
    } else {
      countEl.classList.add("hidden");
      countEl.style.display = "none";
    }
  }
};

// Lắng nghe sự kiện 'cart-updated' từ CartService bắn ra
window.addEventListener("cart-updated", updateCartCount);

// === 4.5. INIT HEADER EVENT HANDLERS (sau khi inject Header) ===
const initHeaderEventHandlers = () => {
  // A. Sidebar Toggle
  document.querySelectorAll(".sidebartoggler").forEach((element) => {
    element.addEventListener("click", function () {
      document.querySelectorAll(".sidebartoggler").forEach((el) => {
        el.checked = true;
      });
      document.getElementById("main-wrapper")?.classList.toggle("show-sidebar");
      document.querySelectorAll(".sidebarmenu").forEach((el) => {
        el.classList.toggle("close");
      });
      const dataTheme = document.body.getAttribute("data-sidebartype");
      if (dataTheme === "full") {
        document.body.setAttribute("data-sidebartype", "mini-sidebar");
      } else {
        document.body.setAttribute("data-sidebartype", "full");
      }
    });
  });

  // B. Dark/Light Mode Toggle
  const setThemeAttributes = (
    theme,
    darkDisplay,
    lightDisplay,
    sunDisplay,
    moonDisplay
  ) => {
    document.documentElement.setAttribute("data-bs-theme", theme);
    const themeLayoutElement = document.getElementById(`${theme}-layout`);
    if (themeLayoutElement) {
      themeLayoutElement.checked = true;
    }

    document
      .querySelectorAll(`.${darkDisplay}`)
      .forEach((el) => (el.style.display = "none"));
    document
      .querySelectorAll(`.${lightDisplay}`)
      .forEach((el) => (el.style.display = "flex"));
    document
      .querySelectorAll(`.${sunDisplay}`)
      .forEach((el) => (el.style.display = "none"));
    document
      .querySelectorAll(`.${moonDisplay}`)
      .forEach((el) => (el.style.display = "flex"));
  };

  document.querySelectorAll(".dark-layout").forEach((element) => {
    element.addEventListener("click", () =>
      setThemeAttributes("dark", "dark-logo", "light-logo", "moon", "sun")
    );
  });

  document.querySelectorAll(".light-layout").forEach((element) => {
    element.addEventListener("click", () =>
      setThemeAttributes("light", "light-logo", "dark-logo", "sun", "moon")
    );
  });

  // C. Dropdown toggles (Bootstrap dropdowns cần data-bs-toggle)
  document
    .querySelectorAll('[id="drop1"], [id="drop2"], [id="dropNotification"]')
    .forEach((element) => {
      element.addEventListener("click", function (e) {
        e.preventDefault();
        const dropdownMenu = this.nextElementSibling;
        if (dropdownMenu && dropdownMenu.classList.contains("dropdown-menu")) {
          // Close other dropdowns first
          document.querySelectorAll(".dropdown-menu.show").forEach((menu) => {
            if (menu !== dropdownMenu) {
              menu.classList.remove("show");
            }
          });
          dropdownMenu.classList.toggle("show");
        }
      });
    });

  // Close dropdowns when clicking outside
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".dropdown")) {
      document.querySelectorAll(".dropdown-menu.show").forEach((menu) => {
        menu.classList.remove("show");
      });
    }
  });
};

// === 4. LOGIC SCROLL PROGRESS BAR ===
const initScrollProgress = () => {
  const progressBar = document.getElementById("scroll-progress");
  if (!progressBar) return;

  window.addEventListener("scroll", () => {
    const scrollTop =
      document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;
    const scrolled = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

    progressBar.style.width = `${scrolled}%`;
  });
};

// === 5. KHỞI TẠO (Khi DOM load xong) ===
document.addEventListener("DOMContentLoaded", () => {
  // A. Inject Sidebar vào aside element
  const sidebarElement = document.getElementById("dashboad_sidebar");
  if (sidebarElement) {
    const sidebarHTML = Sidebar();
    sidebarElement.innerHTML = sidebarHTML;
  } else {
    console.error("Sidebar element not found!");
  }

  // B. Inject Header
  const headerElement = document.getElementById("admin_header");
  if (headerElement) {
    const headerNav = headerElement.querySelector(".with-vertical");
    if (headerNav) {
      headerNav.innerHTML = Header();
    }
  }

  // C. Re-initialize event handlers cho Header (vì Header được inject sau DOMContentLoaded)
  initHeaderEventHandlers();

  // D. Khởi tạo các tính năng phụ thuộc DOM
  initScrollProgress();
  updateCartCount(); // Cập nhật số giỏ hàng lần đầu

  // D. Xử lý sự kiện Tìm kiếm (Enter Key)
  const searchInput = document.querySelector("#search-overlay input");
  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
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

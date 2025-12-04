import logoImg from '../../../assets/images/logo-rudo-watch.svg';
import Swal from '../../../shared/utils/swal.js';

const user = JSON.parse(localStorage.getItem('user')) || {};
const isLoggedIn = !!user && Object.keys(user).length > 0;
const isAdmin = user?.role == 1;

const userAvatar = user?.avatar
  ? user.avatar.startsWith('http')
    ? user.avatar
    : `http://localhost/rudo-watch-ecommerce-api/backend/${user.avatar}`
  : `https://ui-avatars.com/api/?name=${encodeURIComponent(
    user?.fullname || user?.name || 'User'
  )}&background=0A2A45&color=fff`;

const dashboardUserAvatar = document.getElementById('user-profile-img');
if(dashboardUserAvatar) {
  dashboardUserAvatar.src = userAvatar;
}else{console.log('Dashboard user profile image element not found');}


// Admin menu items
const adminMenuItems = [
  {
    title: 'Dashboard',
    icon: 'ti ti-layout-dashboard',
    link: '/admin/dashboard.html',
    active: true
  },
  {
    title: 'Sản phẩm',
    icon: 'ti ti-package',
    link: '#',
    hasDropdown: true,
    children: [
      { title: 'Danh sách sản phẩm', link: '/admin/product-list.html' },
      { title: 'Thêm sản phẩm', link: '/admin/product-add.html' },
    ]
  },

  {
    title: 'Danh mục',
    icon: 'ti ti-package',
    link: '#',
    hasDropdown: true,
    children: [
      { title: 'Danh sách Danh mục', link: '/admin/product-list.html' },
      { title: 'Thêm danh mục', link: '/admin/product-add.html' },
    ]
  },

    {
    title: 'Thương hiệu',
    icon: 'ti ti-package',
    link: '#',
    hasDropdown: true,
    children: [
      { title: 'Danh sách Thương hiệu', link: '/admin/products-category.html' },
      { title: 'Thêm thương hiệu', link: '/admin/products-brand.html' }
    ]
  },

  {
    title: 'Đơn hàng',
    icon: 'ti ti-shopping-cart',
    link: '/admin/orders.html'
  },
  {
    title: 'Người dùng',
    icon: 'ti ti-users',
    link: '/admin/users.html'
  },
  {
    title: 'Bình luận',
    icon: 'ti ti-message-circle',
    link: '/admin/comments.html'
  },
  {
    title: 'Bài viết',
    icon: 'ti ti-news',
    link: '#',
    hasDropdown: true,
    children: [
      { title: 'Danh sách bài viết', link: '/admin/posts.html' },
      { title: 'Thêm bài viết', link: '/admin/posts/add.html' },
      { title: 'Danh mục bài viết', link: '/admin/post-categories.html' }
    ]
  },
  {
    title: 'Mã giảm giá',
    icon: 'ti ti-ticket',
    link: '/admin/vouchers.html'
  },
  {
    title: 'Cài đặt',
    icon: 'ti ti-settings',
    link: '/admin/settings.html'
  }
];

window.handleLogout = () => {
  Swal.fire({
    title: 'Đăng xuất?',
    text: 'Bạn có chắc muốn đăng xuất?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Đăng xuất',
    cancelButtonText: 'Hủy'
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login.html';
    }
  });
};

// Hàm lấy chữ đầu và chữ cuối của tên
const getInitials = (fullname) => {
  if (!fullname) return 'AD';
  const nameParts = fullname.trim().split(/\s+/);
  if (nameParts.length === 1) {
    return nameParts[0].charAt(0).toUpperCase();
  }
  return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
};

export function Sidebar() {
  const dashboardItem = adminMenuItems[0]; // Dashboard
  const managementItems = adminMenuItems.slice(1); // Các items còn lại
  const userInitials = getInitials(user?.fullname || user?.name || 'Admin');

  const dashboardHTML = `
    <li class="sidebar-item">
      <a
        class="sidebar-link ${dashboardItem.active ? 'active' : ''}"
        href="${dashboardItem.link}"
        aria-expanded="false"
      >
        <span>
          <i class="${dashboardItem.icon}"></i>
        </span>
        <span class="hide-menu">${dashboardItem.title}</span>
      </a>
    </li>
  `;

  const managementHTML = managementItems.map((item, index) => {
    if (item.hasDropdown && item.children) {
      return `
        <li class="sidebar-item">
          <a
            class="sidebar-link has-arrow"
            href="javascript:void(0)"
            aria-expanded="false"
            onclick="toggleSubmenu(${index + 1})"
          >
            <span>
              <i class="${item.icon}"></i>
            </span>
            <span class="hide-menu">${item.title}</span>
          </a>
          <ul
            id="submenu-${index + 1}"
            aria-expanded="false"
            class="collapse first-level"
          >
            ${item.children.map(child => `
              <li class="sidebar-item">
                <a href="${child.link}" class="sidebar-link">
                  <div class="round-16 d-flex align-items-center justify-content-center">
                    <i class="ti ti-circle"></i>
                  </div>
                  <span class="hide-menu">${child.title}</span>
                </a>
              </li>
            `).join('')}
          </ul>
        </li>
      `;
    } else {
      return `
        <li class="sidebar-item">
          <a
            class="sidebar-link"
            href="${item.link}"
            aria-expanded="false"
          >
            <span>
              <i class="${item.icon}"></i>
            </span>
            <span class="hide-menu">${item.title}</span>
          </a>
        </li>
      `;
    }
  }).join('');

  return `
    <div>
      <!-- Brand Logo -->
      <div class="brand-logo d-flex align-items-center justify-content-between">
        <a href="/admin/dashboard.html" class="text-nowrap logo-img">
              <img
                src="/src/assets/images/logo-rudo-admin.svg"
            width="120"
                class="dark-logo"
            alt="Rudo Watch Logo"
              />
            <a
              href="javascript:void(0)"
              class="sidebartoggler ms-auto text-decoration-none fs-5 d-block d-xl-none"
          onclick="toggleSidebar()"
            >
              <i class="ti ti-x"></i>
            </a>
          </div>

      <!-- Sidebar Navigation -->
      <nav class="sidebar-nav scroll-sidebar" data-simplebar="init">
            <div class="simplebar-wrapper" style="margin: 0px -24px">
              <div class="simplebar-height-auto-observer-wrapper">
                <div class="simplebar-height-auto-observer"></div>
              </div>
              <div class="simplebar-mask">
                <div class="simplebar-offset" style="right: 0px; bottom: 0px">
                  <div
                    class="simplebar-content-wrapper"
                    tabindex="0"
                    role="region"
                    aria-label="scrollable content"
                    style="height: 100%; overflow: hidden scroll"
                  >
                    <div class="simplebar-content" style="padding: 0px 24px">
                      <ul id="sidebarnav">
                    <!-- Dashboard Section -->
                        <li class="nav-small-cap">
                          <i class="ti ti-dots nav-small-cap-icon fs-4"></i>
                      <span class="hide-menu">Trang chủ</span>
                        </li>
                    ${dashboardHTML}
                    
                    <!-- Management Section -->
                        <li class="nav-small-cap">
                          <i class="ti ti-dots nav-small-cap-icon fs-4"></i>
                      <span class="hide-menu">Quản lý</span>
                        </li>
                    ${managementHTML}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
      </nav>

      <!-- User Profile Section -->
      <div class="fixed-profile p-3 mx-4 mb-2 bg-secondary-subtle rounded mt-3">
        <div class="hstack gap-3">
          <div class="john-img">
            <div
              class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
              style="width: 40px; height: 40px; background: linear-gradient(135deg, #0A2A45 0%, #1e40af 100%); font-size: 14px;"
            >
              ${userInitials}
            </div>
            </div>
          <div class="john-title grow">
            <h6 class="mb-0 fs-4 fw-semibold">${userInitials}</h6>
            <span class="fs-2 text-muted">${isAdmin ? 'Quản trị viên' : 'Người dùng'}</span>
              </div>
              <button
                class="border-0 bg-transparent text-primary ms-auto"
                tabindex="0"
                type="button"
                aria-label="logout"
            onclick="handleLogout()"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
            data-bs-title="Đăng xuất"
              >
                <i class="ti ti-power fs-6"></i>
              </button>
            </div>
        </div>
    `;
}

// Toggle sidebar submenu
window.toggleSubmenu = (index) => {
  const submenu = document.getElementById(`submenu-${index}`);
  if (submenu) {
    const isExpanded = submenu.classList.contains('show');
    // Close all submenus
    document.querySelectorAll('.first-level').forEach(menu => {
      menu.classList.remove('show');
    });
    // Toggle current submenu
    if (!isExpanded) {
      submenu.classList.add('show');
    }
  }
};

// Toggle sidebar on mobile
window.toggleSidebar = () => {
  const mainWrapper = document.getElementById('main-wrapper');
  if (mainWrapper) {
    mainWrapper.classList.toggle('show-sidebar');
  }
};


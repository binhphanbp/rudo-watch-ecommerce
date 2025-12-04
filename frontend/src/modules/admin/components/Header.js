export function Header() {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const displayName = user.fullname || user.name || "Người dùng";
  const userRole = user.role === 1 ? "Quản trị viên" : "Thành viên";
  const userEmail = user.email || "";
  const userAvatar = user?.avatar
    ? user.avatar.startsWith("http")
      ? user.avatar
      : `http://localhost/rudo-watch-ecommerce-api/backend/${user.avatar}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user?.fullname || user?.name || "User"
      )}&background=random&color=fff`;
  return `
<nav class="navbar navbar-expand-lg p-0">
   <ul class="navbar-nav">
      <li class="nav-item nav-icon-hover-bg rounded-circle ms-n2">
         <a
            class="nav-link sidebartoggler"
            id="headerCollapse"
            href="javascript:void(0)"
            >
         <i class="ti ti-menu-2"></i>
         </a>
      </li>
   </ul>
   <div class="d-block d-lg-none py-4">
      <a href="../main/index.html" class="text-nowrap logo-img">
      <img
         src="/src/assets/images/logo-rudo-watch-horizontal.svg"
         class="dark-logo"
         width="100"
         alt="Logo-Dark"
         />
      <img
         src="/src/assets/images/logo-rudo-watch.svg"
         class="light-logo"
         width="100"
         alt="Logo-light"
         style="display: none"
         />
      </a>
   </div>
   <a
      class="navbar-toggler nav-icon-hover-bg rounded-circle p-0 mx-0 border-0"
      href="javascript:void(0)"
      data-bs-toggle="collapse"
      data-bs-target="#navbarNav"
      aria-controls="navbarNav"
      aria-expanded="false"
      aria-label="Toggle navigation"
      >
   <i class="ti ti-dots fs-7"></i>
   </a>
   <div
      class="collapse navbar-collapse justify-content-end"
      id="navbarNav"
      >
      <div class="d-flex align-items-center justify-content-between">
         <a
            href="javascript:void(0)"
            class="nav-link nav-icon-hover-bg rounded-circle mx-0 ms-n1 d-flex d-lg-none align-items-center justify-content-center sidebartoggler"
            >
         <i class="ti ti-align-justified fs-7"></i>
         </a>
         <ul
            class="navbar-nav flex-row ms-auto align-items-center justify-content-center"
            >
            <!-- ------------------------------- -->
            <!-- start language Dropdown -->
            <!-- ------------------------------- -->
            <li class="nav-item nav-icon-hover-bg rounded-circle">
               <a
                  class="nav-link moon dark-layout"
                  href="javascript:void(0)"
                  style="display: flex"
                  >
               <i class="ti ti-moon moon" style="display: flex"></i>
               </a>
               <a
                  class="nav-link sun light-layout"
                  href="javascript:void(0)"
                  style="display: none"
                  >
               <i class="ti ti-sun sun" style="display: none"></i>
               </a>
            </li>
            
            <!-- ------------------------------- -->
            <!-- end language Dropdown -->
            <!-- ------------------------------- -->
            <!-- ------------------------------- -->
            <!-- start notification Dropdown -->
            <!-- ------------------------------- -->
            <li
               class="nav-item nav-icon-hover-bg rounded-circle dropdown"
               >
               <a
                  class="nav-link position-relative dropdown-toggle"
                  href="javascript:void(0)"
                  id="dropNotification"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  >
                  <i class="ti ti-bell-ringing"></i>
                  <div
                     class="notification bg-primary rounded-circle"
                     ></div>
               </a>
               <div
                  class="dropdown-menu content-dd dropdown-menu-end dropdown-menu-animate-up"
                  aria-labelledby="dropNotification"
                  >
                  <div
                     class="d-flex align-items-center justify-content-between py-3 px-7"
                     >
                     <h5 class="mb-0 fs-5 fw-semibold">Thông báo</h5>
                     <span
                        class="badge text-bg-primary rounded-4 px-3 py-1 lh-sm"
                        >0 mới</span
                        >
                  </div>
                  <div class="message-body" style="max-height: 300px; overflow-y: auto;">
                     <div class="py-6 px-7 text-center text-body-secondary">
                        <i class="ti ti-bell-off fs-6 d-block mb-2"></i>
                        Không có thông báo mới
                     </div>
                  </div>
                  <div class="py-6 px-7 mb-1">
                     <button class="btn btn-outline-primary w-100">
                     Xem tất cả thông báo
                     </button>
                  </div>
               </div>
            </li>
            <!-- ------------------------------- -->
            <!-- end notification Dropdown -->
            <!-- ------------------------------- -->
            <!-- ------------------------------- -->
            <!-- start profile Dropdown -->
            <!-- ------------------------------- -->
            <li class="nav-item dropdown">
               <a class="nav-link pe-0" href="javascript:void(0)" id="drop1" data-bs-toggle="dropdown" aria-expanded="false">
                  <div class="d-flex align-items-center">
                     <div class="user-profile-img">
                        <img src="${userAvatar}" class="rounded-circle" width="35" height="35" alt="avatar">
                     </div>
                  </div>
               </a>
               <div class="dropdown-menu content-dd dropdown-menu-end dropdown-menu-animate-up" aria-labelledby="drop1">
                  <div class="profile-dropdown position-relative">
                     <div class="py-3 px-7 pb-0">
                        <h5 class="mb-0 fs-5 fw-semibold">Thông tin tài khoản</h5>
                     </div>
                     <div class="d-flex align-items-center py-9 mx-7 border-bottom">
                        <img src="${userAvatar}" class="rounded-circle" width="80" height="80" alt="avatar">
                        <div class="ms-3">
                           <h5 class="mb-1 fs-3">${displayName}</h5>
                           <span class="mb-1 d-block">${userRole}</span>
                           <p class="mb-0 d-flex align-items-center gap-2">
                              <i class="ti ti-mail fs-4"></i> ${userEmail}
                           </p>
                        </div>
                     </div>
                     <div class="message-body">
                        <a href="/profile.html" class="py-8 px-7 mt-8 d-flex align-items-center">
                           <span class="d-flex align-items-center justify-content-center text-bg-light rounded-1 p-6">
                           <img src="https://bootstrapdemos.adminmart.com/modernize/dist/assets/images/svgs/icon-account.svg" alt="modernize-img" width="24" height="24">
                           </span>
                           <div class="w-100 ps-3">
                              <h6 class="mb-1 fs-3 fw-semibold lh-base">Hồ sơ của tôi</h6>
                              <span class="fs-2 d-block text-body-secondary">Cài đặt tài khoản</span>
                           </div>
                        </a>
                     </div>
                     <div class="d-grid py-4 px-7 pt-8">
                        <a href="/login.html" class="btn btn-outline-primary" id="header-logout-btn">Đăng xuất</a>
                     </div>
                  </div>
               </div>
            </li>
            <!-- ------------------------------- -->
            <!-- end profile Dropdown -->
            <!-- ------------------------------- -->
         </ul>
      </div>
   </div>
</nav>
`;
}

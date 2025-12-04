/**
 * Admin Authentication Guard
 * File này dùng để kiểm tra quyền admin trước khi cho phép truy cập các trang admin
 */

import Swal from "../../../shared/utils/swal.js";

const ADMIN_LOGIN_URL = "/src/pages/admin/login.html";
const HOME_URL = "/";

/**
 * Kiểm tra người dùng đã đăng nhập và có quyền admin
 * @returns {Object|null} User object nếu là admin, null nếu không
 */
export const checkAdminAuth = () => {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  console.log("🔐 Checking admin auth...");
  console.log("Token:", token ? "exists" : "missing");
  console.log("User string:", userStr);

  // Chưa đăng nhập
  if (!token || !userStr) {
    console.log("❌ No token or user data");
    return null;
  }

  try {
    const user = JSON.parse(userStr);
    console.log("User parsed:", user);
    console.log("User role:", user.role, "Type:", typeof user.role);

    // Kiểm tra role admin (role == 1, dùng == để so sánh cả string và number)
    if (user.role != 1) {
      console.log("❌ User is not admin");
      return null;
    }

    console.log("✅ User is admin");
    return user;
  } catch (e) {
    console.error("Error parsing user data:", e);
    return null;
  }
};

/**
 * Bảo vệ trang admin - redirect nếu không có quyền
 * @param {Object} options - Tùy chọn
 * @param {boolean} options.showAlert - Có hiển thị thông báo không (default: true)
 * @param {string} options.redirectUrl - URL redirect khi không có quyền
 */
export const requireAdmin = (options = {}) => {
  const { showAlert = true, redirectUrl = ADMIN_LOGIN_URL } = options;

  const admin = checkAdminAuth();

  if (!admin) {
    const token = localStorage.getItem("token");

    if (showAlert) {
      if (!token) {
        // Chưa đăng nhập
        Swal.fire({
          icon: "warning",
          title: "Chưa đăng nhập",
          text: "Vui lòng đăng nhập để tiếp tục",
          confirmButtonText: "Đăng nhập",
          allowOutsideClick: false,
        }).then(() => {
          window.location.href = redirectUrl;
        });
      } else {
        // Đã đăng nhập nhưng không phải admin
        Swal.fire({
          icon: "error",
          title: "Không có quyền truy cập",
          text: "Bạn không có quyền truy cập trang quản trị",
          confirmButtonText: "Về trang chủ",
          allowOutsideClick: false,
        }).then(() => {
          window.location.href = HOME_URL;
        });
      }
    } else {
      // Không hiện alert, redirect ngay
      const target = token ? HOME_URL : redirectUrl;
      window.location.href = target;
    }

    return false;
  }

  return true;
};

/**
 * Lấy thông tin admin hiện tại
 * @returns {Object|null} Admin user object
 */
export const getCurrentAdmin = () => {
  return checkAdminAuth();
};

/**
 * Đăng xuất admin
 */
export const logoutAdmin = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = ADMIN_LOGIN_URL;
};

// Auto-check khi import (chạy ngay lập tức)
// Uncomment dòng dưới nếu muốn tự động check mỗi khi import file này
// requireAdmin();

export default {
  checkAdminAuth,
  requireAdmin,
  getCurrentAdmin,
  logoutAdmin,
};

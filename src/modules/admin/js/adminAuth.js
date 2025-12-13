import Swal from "../../../shared/utils/swal.js";

const ADMIN_LOGIN_URL = "/login.html";
const HOME_URL = "/index.html";

export const checkAdminAuth = () => {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  // Chưa đăng nhập
  if (!token || !userStr) {
    console.log("No token or user data");
    return null;
  }

  try {
    const user = JSON.parse(userStr);

    // QUAN TRỌNG: Kiểm tra role phải là admin (hỗ trợ cả string và number)
    // Backend có thể trả về role = 1 (admin) hoặc role = 'admin'
    const isAdmin = user.role === 'admin' || user.role === 1 || user.role === '1';
    
    if (!isAdmin) {
      console.log("User is not admin, role:", user.role, typeof user.role);
      return null;
    }

    return user;
  } catch (e) {
    console.error("Error parsing user data:", e);
    return null;
  }
};

export const getCurrentAdmin = () => {
  return checkAdminAuth();
};

export const requireAdmin = (options = {}) => {
  const { showAlert = true, redirectUrl = ADMIN_LOGIN_URL } = options;

  const admin = checkAdminAuth();

  if (!admin) {
    const token = localStorage.getItem("token");

    // QUAN TRỌNG: Dừng page render ngay bằng cách hide body
    document.body.style.display = 'none';

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

  // Nếu là admin, hiện lại body
  document.body.style.display = '';
  // Nếu là admin, hiện lại body
  document.body.style.display = '';
  return true;
};


/**
 * Đăng xuất admin
 */
export const logoutAdmin = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = ADMIN_LOGIN_URL;
};


export default {
  checkAdminAuth,
  requireAdmin,
  getCurrentAdmin,
  logoutAdmin,
};

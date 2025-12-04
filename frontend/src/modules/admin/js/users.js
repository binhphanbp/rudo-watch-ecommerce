import api from "../../../shared/services/api.js";
import Swal, { Toast } from "../../../shared/utils/swal.js";

// Swal helpers
const SwalHelper = {
  success: (message) => Toast.fire({ icon: "success", title: message }),
  error: (message) => Toast.fire({ icon: "error", title: message }),
  confirm: async (message) => {
    const result = await Swal.fire({
      title: "Xác nhận",
      text: message,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Đồng ý",
      cancelButtonText: "Hủy",
    });
    return result.isConfirmed;
  },
};

let state = {
  users: [],
  pagination: {
    current_page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0,
  },
  filters: {
    search: "",
    role: "",
    status: "",
  },
};

// --- 1. GỌI API LẤY DANH SÁCH USERS ---
const fetchUsers = async () => {
  try {
    showLoading(true);

    const params = new URLSearchParams();
    params.append("page", state.pagination.current_page);
    params.append("limit", state.pagination.per_page);

    if (state.filters.search) {
      params.append("search", state.filters.search);
    }
    if (state.filters.role !== "") {
      params.append("role", state.filters.role);
    }
    if (state.filters.status !== "") {
      params.append("status", state.filters.status);
    }

    const res = await api.get(`/users?${params.toString()}`);
    console.log("API Response:", res);

    if (res.data && res.data.users) {
      state.users = res.data.users || [];
      state.pagination = res.data.pagination || state.pagination;
    } else if (res.data && res.data.data) {
      state.users = res.data.data.users || res.data.data || [];
      state.pagination =
        res.data.data.pagination || res.data.pagination || state.pagination;
    }

    renderUsersTable();
    renderPagination();
  } catch (error) {
    console.error("Error fetching users:", error);

    // Xử lý các loại lỗi khác nhau
    if (error.response) {
      const status = error.response.status;
      const message =
        error.response.data?.error || error.response.data?.message;

      if (status === 401) {
        SwalHelper.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/src/pages/admin/login.html";
      } else if (status === 403) {
        SwalHelper.error("Bạn không có quyền truy cập chức năng này");
      } else {
        SwalHelper.error(message || "Không thể tải danh sách người dùng");
      }
    } else {
      SwalHelper.error("Lỗi kết nối server. Vui lòng thử lại");
    }
  } finally {
    showLoading(false);
  }
};

// --- 2. RENDER BẢNG USERS ---
const renderUsersTable = () => {
  const tbody = document.getElementById("users-tbody");
  if (!tbody) return;

  if (state.users.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4">
          <p class="text-muted">Không có người dùng nào</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = state.users
    .map(
      (user) => `
    <tr>
      <td class="ps-0">
        <div class="d-flex align-items-center gap-2">
          <div class="rounded-circle bg-primary-subtle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
            <span class="fw-semibold text-primary">${getInitials(
              user.fullname
            )}</span>
          </div>
          <div>
            <h6 class="mb-0 fw-semibold">${user.fullname || "N/A"}</h6>
            <span class="fs-2 text-muted">${user.email}</span>
          </div>
        </div>
      </td>
      <td>${user.phone || "-"}</td>
      <td>
        <span class="badge ${
          user.role === 1
            ? "bg-danger-subtle text-danger"
            : "bg-primary-subtle text-primary"
        }">
          ${user.role_name || (user.role === 1 ? "Admin" : "User")}
        </span>
      </td>
      <td>
        <span class="badge ${
          user.status === 1
            ? "bg-success-subtle text-success"
            : "bg-warning-subtle text-warning"
        }">
          ${user.status_name || (user.status === 1 ? "Hoạt động" : "Bị khóa")}
        </span>
      </td>
      <td>${formatDate(user.created_at)}</td>
      <td>
        <div class="dropdown">
          <a class="text-decoration-none" href="javascript:void(0)" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="ti ti-dots fs-4"></i>
          </a>
          <ul class="dropdown-menu dropdown-menu-end">
            <li>
              <a class="dropdown-item d-flex align-items-center gap-2" href="javascript:void(0)" onclick="viewUser(${
                user.id
              })">
                <i class="ti ti-eye fs-5"></i> Xem chi tiết
              </a>
            </li>
            <li>
              <a class="dropdown-item d-flex align-items-center gap-2" href="javascript:void(0)" onclick="toggleUserStatus(${
                user.id
              }, ${user.status})">
                <i class="ti ti-${
                  user.status === 1 ? "lock" : "lock-open"
                } fs-5"></i> 
                ${user.status === 1 ? "Khóa tài khoản" : "Mở khóa"}
              </a>
            </li>
            <li>
              <a class="dropdown-item d-flex align-items-center gap-2" href="javascript:void(0)" onclick="changeUserRole(${
                user.id
              }, ${user.role})">
                <i class="ti ti-user-cog fs-5"></i> 
                ${user.role === 1 ? "Hạ xuống User" : "Nâng lên Admin"}
              </a>
            </li>
          </ul>
        </div>
      </td>
    </tr>
  `
    )
    .join("");
};

// --- 3. RENDER PHÂN TRANG ---
const renderPagination = () => {
  const paginationEl = document.getElementById("users-pagination");
  if (!paginationEl) return;

  const { current_page, total_pages } = state.pagination;

  if (total_pages <= 1) {
    paginationEl.innerHTML = "";
    return;
  }

  let html = `
    <nav aria-label="Page navigation">
      <ul class="pagination justify-content-center mb-0">
        <li class="page-item ${current_page === 1 ? "disabled" : ""}">
          <a class="page-link" href="javascript:void(0)" onclick="goToPage(${
            current_page - 1
          })">
            <i class="ti ti-chevron-left"></i>
          </a>
        </li>
  `;

  for (let i = 1; i <= total_pages; i++) {
    if (
      i === 1 ||
      i === total_pages ||
      (i >= current_page - 2 && i <= current_page + 2)
    ) {
      html += `
        <li class="page-item ${i === current_page ? "active" : ""}">
          <a class="page-link" href="javascript:void(0)" onclick="goToPage(${i})">${i}</a>
        </li>
      `;
    } else if (i === current_page - 3 || i === current_page + 3) {
      html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
  }

  html += `
        <li class="page-item ${current_page === total_pages ? "disabled" : ""}">
          <a class="page-link" href="javascript:void(0)" onclick="goToPage(${
            current_page + 1
          })">
            <i class="ti ti-chevron-right"></i>
          </a>
        </li>
      </ul>
    </nav>
  `;

  paginationEl.innerHTML = html;

  // Hiển thị thông tin tổng số
  const infoEl = document.getElementById("users-info");
  if (infoEl) {
    const start = (current_page - 1) * state.pagination.per_page + 1;
    const end = Math.min(
      current_page * state.pagination.per_page,
      state.pagination.total
    );
    infoEl.textContent = `Hiển thị ${start} - ${end} / ${state.pagination.total} người dùng`;
  }
};

// --- 4. CÁC HÀM XỬ LÝ ---

// Chuyển trang
window.goToPage = (page) => {
  if (page < 1 || page > state.pagination.total_pages) return;
  state.pagination.current_page = page;
  fetchUsers();
};

// Xem chi tiết user
window.viewUser = async (userId) => {
  try {
    const res = await api.get(`/users/${userId}`);
    const user = res.data.data || res.data;

    Swal.fire({
      title: "Thông tin người dùng",
      html: `
        <div class="text-start">
          <p><strong>ID:</strong> ${user.id}</p>
          <p><strong>Họ tên:</strong> ${user.fullname}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Điện thoại:</strong> ${user.phone || "-"}</p>
          <p><strong>Vai trò:</strong> ${
            user.role_name || (user.role === 1 ? "Admin" : "User")
          }</p>
          <p><strong>Trạng thái:</strong> ${
            user.status_name || (user.status === 1 ? "Hoạt động" : "Bị khóa")
          }</p>
          <p><strong>Ngày tạo:</strong> ${formatDate(user.created_at)}</p>
        </div>
      `,
      confirmButtonText: "Đóng",
    });
  } catch (error) {
    SwalHelper.error("Không thể tải thông tin người dùng");
  }
};

// Khóa/Mở khóa user
window.toggleUserStatus = async (userId, currentStatus) => {
  const newStatus = currentStatus === 1 ? 0 : 1;
  const action = newStatus === 0 ? "khóa" : "mở khóa";

  const confirm = await SwalHelper.confirm(
    `Bạn có chắc muốn ${action} tài khoản này?`
  );
  if (!confirm) return;

  try {
    await api.put(`/users/${userId}/status`, { status: newStatus });
    SwalHelper.success(`Đã ${action} tài khoản thành công`);
    fetchUsers();
  } catch (error) {
    SwalHelper.error(`Không thể ${action} tài khoản`);
  }
};

// Thay đổi role user
window.changeUserRole = async (userId, currentRole) => {
  const newRole = currentRole === 1 ? 0 : 1;
  const action = newRole === 1 ? "nâng lên Admin" : "hạ xuống User";

  const confirm = await SwalHelper.confirm(`Bạn có chắc muốn ${action}?`);
  if (!confirm) return;

  try {
    await api.put("/user/update-role", { user_id: userId, role: newRole });
    SwalHelper.success(`Đã ${action} thành công`);
    fetchUsers();
  } catch (error) {
    SwalHelper.error(`Không thể thay đổi vai trò`);
  }
};

// Tìm kiếm
window.searchUsers = () => {
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    state.filters.search = searchInput.value.trim();
    state.pagination.current_page = 1;
    fetchUsers();
  }
};

// Lọc theo role
window.filterByRole = (role) => {
  state.filters.role = role;
  state.pagination.current_page = 1;
  fetchUsers();
};

// Lọc theo status
window.filterByStatus = (status) => {
  state.filters.status = status;
  state.pagination.current_page = 1;
  fetchUsers();
};

// --- 5. HELPER FUNCTIONS ---
const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const showLoading = (show) => {
  const loader = document.getElementById("users-loader");
  const table = document.getElementById("users-table");
  if (loader) loader.style.display = show ? "block" : "none";
  if (table) table.style.opacity = show ? "0.5" : "1";
};

// --- 6. KHỞI TẠO ---
document.addEventListener("DOMContentLoaded", () => {
  fetchUsers();

  // Bắt sự kiện Enter cho ô tìm kiếm
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        searchUsers();
      }
    });
  }
});

export { fetchUsers };

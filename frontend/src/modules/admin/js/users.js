import api from "../../../shared/services/api.js";
import Swal, { Toast } from "../../../shared/utils/swal.js";

// Swal helpers
const SwalHelper = {
  success: (msg) => Toast.fire({ icon: "success", title: msg }),
  error: (msg) => Toast.fire({ icon: "error", title: msg }),
  confirm: (msg) =>
    Swal.fire({
      title: "Xác nhận",
      text: msg,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Đồng ý",
      cancelButtonText: "Hủy",
    }).then((r) => r.isConfirmed),
};

// State
const state = {
  users: [],
  pagination: { current_page: 1, per_page: 10, total: 0, total_pages: 0 },
  filters: { search: "", role: "", status: "" },
};

// Cache DOM elements
let $tbody, $pagination, $info, $loader, $table, $searchInput;

// --- 1. GỌI API ---
const fetchUsers = async () => {
  try {
    $loader && ($loader.style.display = "block");
    $table && ($table.style.opacity = "0.5");

    const { current_page, per_page } = state.pagination;
    const { search, role, status } = state.filters;

    // Build URL nhanh
    let url = `/users?page=${current_page}&limit=${per_page}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (role !== "") url += `&role=${role}`;
    if (status !== "") url += `&status=${status}`;

    const res = await api.get(url);
    const data = res.data?.data || res.data;

    state.users = data?.users || [];
    state.pagination = data?.pagination || state.pagination;

    render();
  } catch (e) {
    handleError(e);
  } finally {
    $loader && ($loader.style.display = "none");
    $table && ($table.style.opacity = "1");
  }
};

// --- 2. RENDER ---
const render = () => {
  renderTable();
  renderPagination();
};

const renderTable = () => {
  if (!$tbody) return;

  if (!state.users.length) {
    $tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">Không có người dùng nào</td></tr>`;
    return;
  }

  // Build HTML một lần với template literals
  $tbody.innerHTML = state.users
    .map(
      (u) => `
    <tr>
      <td class="ps-0">
        <div class="d-flex align-items-center gap-2">
          <div class="rounded-circle bg-primary-subtle d-flex align-items-center justify-content-center" style="width:40px;height:40px">
            <span class="fw-semibold text-primary">${getInitials(
              u.fullname
            )}</span>
          </div>
          <div>
            <h6 class="mb-0 fw-semibold">${u.fullname || "N/A"}</h6>
            <span class="fs-2 text-muted">${u.email}</span>
          </div>
        </div>
      </td>
      <td>${u.phone || "-"}</td>
      <td><span class="badge ${
        u.role === 1
          ? "bg-danger-subtle text-danger"
          : "bg-primary-subtle text-primary"
      }">${u.role_name || (u.role === 1 ? "Admin" : "User")}</span></td>
      <td><span class="badge ${
        u.status === 1
          ? "bg-success-subtle text-success"
          : "bg-warning-subtle text-warning"
      }">${
        u.status_name || (u.status === 1 ? "Hoạt động" : "Bị khóa")
      }</span></td>
      <td>${formatDate(u.created_at)}</td>
      <td>
        <div class="dropdown">
          <a href="#" data-bs-toggle="dropdown"><i class="ti ti-dots fs-4"></i></a>
          <ul class="dropdown-menu dropdown-menu-end">
            <li><a class="dropdown-item" href="#" data-action="view" data-id="${
              u.id
            }"><i class="ti ti-eye fs-5 me-2"></i>Xem</a></li>
            <li><a class="dropdown-item" href="#" data-action="status" data-id="${
              u.id
            }" data-status="${u.status}"><i class="ti ti-${
        u.status === 1 ? "lock" : "lock-open"
      } fs-5 me-2"></i>${u.status === 1 ? "Khóa" : "Mở khóa"}</a></li>
            <li><a class="dropdown-item" href="#" data-action="role" data-id="${
              u.id
            }" data-role="${u.role}"><i class="ti ti-user-cog fs-5 me-2"></i>${
        u.role === 1 ? "Hạ User" : "Nâng Admin"
      }</a></li>
          </ul>
        </div>
      </td>
    </tr>`
    )
    .join("");
};

const renderPagination = () => {
  if (!$pagination) return;

  const { current_page: p, total_pages: t, per_page, total } = state.pagination;

  if (t <= 1) {
    $pagination.innerHTML = "";
    $info && ($info.textContent = "");
    return;
  }

  // Build pagination HTML
  let html = `<nav><ul class="pagination justify-content-center mb-0">
    <li class="page-item ${
      p === 1 ? "disabled" : ""
    }"><a class="page-link" href="#" data-page="${
    p - 1
  }"><i class="ti ti-chevron-left"></i></a></li>`;

  for (let i = 1; i <= t; i++) {
    if (i === 1 || i === t || (i >= p - 2 && i <= p + 2)) {
      html += `<li class="page-item ${
        i === p ? "active" : ""
      }"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
    } else if (i === p - 3 || i === p + 3) {
      html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
  }

  html += `<li class="page-item ${
    p === t ? "disabled" : ""
  }"><a class="page-link" href="#" data-page="${
    p + 1
  }"><i class="ti ti-chevron-right"></i></a></li></ul></nav>`;

  $pagination.innerHTML = html;

  // Info
  if ($info) {
    const start = (p - 1) * per_page + 1;
    const end = Math.min(p * per_page, total);
    $info.textContent = `Hiển thị ${start}-${end}/${total}`;
  }
};

// --- 3. EVENT HANDLERS ---
const handleError = (e) => {
  if (e.response?.status === 401) {
    SwalHelper.error("Phiên hết hạn");
    localStorage.clear();
    location.href = "/src/pages/admin/login.html";
  } else {
    SwalHelper.error(e.response?.data?.message || "Lỗi kết nối");
  }
};

const handleTableClick = async (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  e.preventDefault();
  const { action, id, status, role } = btn.dataset;

  if (action === "view") {
    const res = await api.get(`/users/${id}`);
    const u = res.data?.data || res.data;
    Swal.fire({
      title: "Thông tin",
      html: `<div class="text-start"><p><b>ID:</b> ${u.id}</p><p><b>Tên:</b> ${
        u.fullname
      }</p><p><b>Email:</b> ${u.email}</p><p><b>SĐT:</b> ${
        u.phone || "-"
      }</p><p><b>Role:</b> ${
        u.role === 1 ? "Admin" : "User"
      }</p><p><b>Trạng thái:</b> ${
        u.status === 1 ? "Hoạt động" : "Khóa"
      }</p></div>`,
    });
  } else if (action === "status") {
    const newStatus = +status === 1 ? 0 : 1;
    if (
      await SwalHelper.confirm(`${newStatus ? "Mở khóa" : "Khóa"} tài khoản?`)
    ) {
      await api.put(`/users/${id}/status`, { status: newStatus });
      SwalHelper.success("Thành công");
      fetchUsers();
    }
  } else if (action === "role") {
    const newRole = +role === 1 ? 0 : 1;
    if (await SwalHelper.confirm(`${newRole ? "Nâng Admin" : "Hạ User"}?`)) {
      await api.put("/user/update-role", { user_id: id, role: newRole });
      SwalHelper.success("Thành công");
      fetchUsers();
    }
  }
};

const handlePaginationClick = (e) => {
  const btn = e.target.closest("[data-page]");
  if (!btn || btn.parentElement.classList.contains("disabled")) return;

  e.preventDefault();
  const page = +btn.dataset.page;
  if (page >= 1 && page <= state.pagination.total_pages) {
    state.pagination.current_page = page;
    fetchUsers();
  }
};

// --- 4. HELPERS ---
const getInitials = (name) => {
  if (!name) return "?";
  const p = name.split(" ");
  return p.length > 1
    ? (p[0][0] + p[p.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
};

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "-");

// --- 5. PUBLIC ---
window.searchUsers = () => {
  state.filters.search = $searchInput?.value.trim() || "";
  state.pagination.current_page = 1;
  fetchUsers();
};

window.filterByRole = (r) => {
  state.filters.role = r;
  state.pagination.current_page = 1;
  fetchUsers();
};

window.filterByStatus = (s) => {
  state.filters.status = s;
  state.pagination.current_page = 1;
  fetchUsers();
};

// --- 6. INIT ---
document.addEventListener("DOMContentLoaded", () => {
  // Cache DOM một lần
  $tbody = document.getElementById("users-tbody");
  $pagination = document.getElementById("users-pagination");
  $info = document.getElementById("users-info");
  $loader = document.getElementById("users-loader");
  $table = document.getElementById("users-table");
  $searchInput = document.getElementById("search-input");

  // Event delegation - 1 listener cho tất cả
  $tbody?.addEventListener("click", handleTableClick);
  $pagination?.addEventListener("click", handlePaginationClick);
  $searchInput?.addEventListener(
    "keypress",
    (e) => e.key === "Enter" && searchUsers()
  );

  fetchUsers();
});

export { fetchUsers };

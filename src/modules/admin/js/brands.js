import api, { getImageUrl } from "../../../shared/services/api.js";
import Swal from "../../../shared/utils/swal.js";

// Toast notification
const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

// State
let brands = [];
let editingId = null;
let selectedLogo = null;

// DOM Elements
const brandTableBody = document.getElementById("brandTableBody");
const brandForm = document.getElementById("brandForm");
const brandNameInput = document.getElementById("brandName");
const brandLogoInput = document.getElementById("brandLogo");
const brandStatusSelect = document.getElementById("brandStatus");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");
const logoPreview = document.getElementById("logoPreview");
const removeLogo = document.getElementById("removeLogo");

// ==================== API CALLS ====================

/**
 * Lấy danh sách tất cả thương hiệu
 */
async function fetchBrands() {
  try {
    const response = await api.get("/brands");
    brands = response.data.data || response.data || [];
    renderBrandsTable();
  } catch (error) {
    console.error("Lỗi khi lấy thương hiệu:", error);
    Toast.fire({
      icon: "error",
      title: "Không thể tải danh sách thương hiệu",
    });
  }
}

/**
 * Tạo thương hiệu mới
 */
async function createBrand(formData) {
  try {
    const response = await api.post("/brands", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    Toast.fire({
      icon: "success",
      title: response.data.message || "Tạo thương hiệu thành công",
    });
    resetForm();
    fetchBrands();
  } catch (error) {
    console.error("Lỗi khi tạo thương hiệu:", error);
    const errorMsg =
      error.response?.data?.error ||
      error.response?.data?.errors?.name ||
      "Không thể tạo thương hiệu";
    Toast.fire({
      icon: "error",
      title: errorMsg,
    });
  }
}

/**
 * Cập nhật thương hiệu
 */
async function updateBrand(id, formData) {
  try {
    // Sử dụng POST với _method=PUT để hỗ trợ upload file (PHP không đọc được $_FILES từ PUT)
    formData.append("_method", "PUT");
    const response = await api.post(`/brands/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    Toast.fire({
      icon: "success",
      title: response.data.message || "Cập nhật thương hiệu thành công",
    });
    resetForm();
    fetchBrands();
  } catch (error) {
    console.error("Lỗi khi cập nhật thương hiệu:", error);
    const errorMsg =
      error.response?.data?.error || "Không thể cập nhật thương hiệu";
    Toast.fire({
      icon: "error",
      title: errorMsg,
    });
  }
}

/**
 * Xóa thương hiệu
 */
async function deleteBrand(id, confirm = false) {
  try {
    const url = confirm ? `/brands/${id}?confirm=true` : `/brands/${id}`;
    const response = await api.delete(url);
    const resData = response.data.data || response.data;

    // Nếu cần xác nhận (có sản phẩm liên quan)
    if (resData.requires_confirmation) {
      const result = await Swal.fire({
        title: "Xác nhận xóa",
        html: `<p>${resData.message}</p>`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Xóa tất cả",
        cancelButtonText: "Hủy",
      });

      if (result.isConfirmed) {
        await deleteBrand(id, true);
      }
      return;
    }

    // Xóa thành công
    Toast.fire({
      icon: "success",
      title: resData.message || "Xóa thương hiệu thành công",
    });
    fetchBrands();
  } catch (error) {
    console.error("Lỗi khi xóa thương hiệu:", error);
    const errorMsg =
      error.response?.data?.error ||
      error.response?.data?.data?.error ||
      "Không thể xóa thương hiệu";
    Toast.fire({
      icon: "error",
      title: errorMsg,
    });
  }
}

// ==================== RENDER ====================

/**
 * Render bảng thương hiệu
 */
function renderBrandsTable() {
  if (!brandTableBody) return;

  if (brands.length === 0) {
    brandTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 text-muted">
          <i class="ti ti-building-store fs-1 d-block mb-2"></i>
          Chưa có thương hiệu nào
        </td>
      </tr>
    `;
    return;
  }

  brandTableBody.innerHTML = brands
    .map(
      (brand, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>
        ${
          brand.logo
            ? `<img src="${getImageUrl(brand.logo)}" alt="${escapeHtml(
                brand.name
              )}" class="rounded" style="width: 40px; height: 40px; object-fit: contain;">`
            : `<div class="bg-light rounded d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                <i class="ti ti-photo text-muted"></i>
              </div>`
        }
      </td>
      <td>
        <span class="fw-semibold">${escapeHtml(brand.name)}</span>
      </td>
      <td>
        <code>${escapeHtml(brand.slug)}</code>
      </td>
      <td>
        <span class="badge ${
          brand.status == 1
            ? "bg-success-subtle text-success"
            : "bg-danger-subtle text-danger"
        }">
          ${brand.status == 1 ? "Hiển thị" : "Ẩn"}
        </span>
      </td>
      <td>${formatDate(brand.created_at)}</td>
      <td>
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-outline-primary" onclick="editBrand(${
            brand.id
          })" title="Sửa">
            <i class="ti ti-edit"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="confirmDelete(${
            brand.id
          }, '${escapeHtml(brand.name)}')" title="Xóa">
            <i class="ti ti-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `
    )
    .join("");
}

// ==================== FORM HANDLERS ====================

/**
 * Xử lý submit form
 */
function handleFormSubmit(e) {
  e.preventDefault();

  const name = brandNameInput.value.trim();
  const status = parseInt(brandStatusSelect.value);

  if (!name) {
    Toast.fire({
      icon: "warning",
      title: "Vui lòng nhập tên thương hiệu",
    });
    brandNameInput.focus();
    return;
  }

  const formData = new FormData();
  formData.append("name", name);
  formData.append("status", status);

  if (selectedLogo) {
    formData.append("logo", selectedLogo);
  }

  if (editingId) {
    updateBrand(editingId, formData);
  } else {
    createBrand(formData);
  }
}

/**
 * Chuyển sang chế độ sửa
 */
window.editBrand = function (id) {
  console.log(brands)
  const brand = brands.find((b) => b.id == id);
  console.log(brand)
  if (!brand) return;

  editingId = id;
  brandNameInput.value = brand.name;
  brandStatusSelect.value = brand.status;

  // Hiển thị logo hiện tại nếu có
  if (brand.logo) {
    const previewImg = logoPreview.querySelector("img");
    previewImg.src = getImageUrl(brand.logo);
    logoPreview.classList.remove("d-none");
  } else {
    logoPreview.classList.add("d-none");
  }

  formTitle.textContent = "Sửa thương hiệu";
  submitBtn.innerHTML = '<i class="ti ti-check me-1"></i> Cập nhật';
  cancelBtn.classList.remove("d-none");

  brandNameInput.focus();
};

/**
 * Xác nhận xóa thương hiệu
 */
window.confirmDelete = function (id, name) {
  Swal.fire({
    title: "Xác nhận xóa?",
    html: `Bạn có chắc muốn xóa thương hiệu <strong>${name}</strong>?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Xóa",
    cancelButtonText: "Hủy",
  }).then((result) => {
    if (result.isConfirmed) {
      deleteBrand(id);
    }
  });
};

/**
 * Reset form về trạng thái ban đầu
 */
function resetForm() {
  editingId = null;
  selectedLogo = null;
  brandForm.reset();
  logoPreview.classList.add("d-none");
  formTitle.textContent = "Thêm thương hiệu";
  submitBtn.innerHTML = '<i class="ti ti-plus me-1"></i> Tạo ngay';
  cancelBtn.classList.add("d-none");
}

/**
 * Xử lý khi chọn file logo
 */
function handleLogoChange(e) {
  const file = e.target.files[0];
  if (file) {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      Toast.fire({
        icon: "error",
        title: "Vui lòng chọn file ảnh",
      });
      brandLogoInput.value = "";
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      Toast.fire({
        icon: "error",
        title: "Kích thước ảnh tối đa 2MB",
      });
      brandLogoInput.value = "";
      return;
    }

    selectedLogo = file;

    // Preview
    const reader = new FileReader();
    reader.onload = function (e) {
      const previewImg = logoPreview.querySelector("img");
      previewImg.src = e.target.result;
      logoPreview.classList.remove("d-none");
    };
    reader.readAsDataURL(file);
  }
}

/**
 * Xóa logo đã chọn
 */
function handleRemoveLogo() {
  selectedLogo = null;
  brandLogoInput.value = "";
  logoPreview.classList.add("d-none");
}

// ==================== UTILITIES ====================

/**
 * Escape HTML để tránh XSS
 */
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Format ngày tháng
 */
function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ==================== INIT ====================

document.addEventListener("DOMContentLoaded", () => {
  // Fetch data
  fetchBrands();

  // Form submit
  if (brandForm) {
    brandForm.addEventListener("submit", handleFormSubmit);
  }

  // Cancel button
  if (cancelBtn) {
    cancelBtn.addEventListener("click", resetForm);
  }

  // Logo change
  if (brandLogoInput) {
    brandLogoInput.addEventListener("change", handleLogoChange);
  }

  // Remove logo button
  if (removeLogo) {
    removeLogo.addEventListener("click", handleRemoveLogo);
  }
});

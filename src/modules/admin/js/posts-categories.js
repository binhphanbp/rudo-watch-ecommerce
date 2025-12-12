import api from "../../../shared/services/api.js";
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
let categories = [];
let editingId = null;

// DOM Elements
const categoryTableBody = document.getElementById("categoryTableBody");
const categoryForm = document.getElementById("categoryForm");
const categoryNameInput = document.getElementById("categoryName");
const categoryStatusSelect = document.getElementById("categoryStatus");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");

// ==================== API CALLS ====================

/**
 * Lấy danh sách tất cả danh mục
 */
async function fetchCategories() {
	try {
		const response = await api.get("/post-categories");
		categories = response.data.data || response.data || [];
		renderCategoriesTable();
	} catch (error) {
		console.error("Lỗi khi lấy danh mục:", error);
		Toast.fire({
			icon: "error",
			title: "Không thể tải danh sách danh mục",
		});
	}
}

/**
 * Tạo danh mục mới
 */
async function createCategory(form) {
	try {
		const response = await api.post("/post-categories", {
			"name": form.name,
			"slug": form.slug
		});
		Toast.fire({
			icon: "success",
			title: response.data.message || "Tạo danh mục thành công",
		});
		resetForm();
		fetchCategories();
	} catch (error) {
		console.error("Lỗi khi tạo danh mục:", error);
		const errorMsg =
			error.response?.data?.error ||
			error.response?.data?.errors?.name ||
			"Không thể tạo danh mục";
		Toast.fire({
			icon: "error",
			title: errorMsg,
		});
	}
}

/**
 * Cập nhật danh mục
 */
async function updateCategory(id, data) {
	try {
		const response = await api.put(`/post-categories/${id}`, data);
		Toast.fire({
			icon: "success",
			title: response.data.message || "Cập nhật danh mục thành công",
		});
		resetForm();
		fetchCategories();
	} catch (error) {
		console.error("Lỗi khi cập nhật danh mục:", error);
		const errorMsg =
			error.response?.data?.error || "Không thể cập nhật danh mục";
		Toast.fire({
			icon: "error",
			title: errorMsg,
		});
	}
}

/**
 * Xóa danh mục
 */
async function deleteCategory(id, confirm = false) {
	try {
		const url = confirm
			? `/post-categories/${id}?confirm=true`
			: `/post-categories/${id}`;
		const response = await api.delete(url);
		if (response.data.requires_confirmation) {
			const result = await Swal.fire({
				title: "Xác nhận xóa",
				html: `<p>${response.data.message}</p>`,
				icon: "warning",
				showCancelButton: true,
				confirmButtonColor: "#d33",
				cancelButtonColor: "#3085d6",
				confirmButtonText: "Xóa tất cả",
				cancelButtonText: "Hủy",
			});

			if (result.isConfirmed) {
				await deleteCategory(id, true);
			}
			return;
		}

		Toast.fire({
			icon: "success",
			title: response.data.message || "Xóa danh mục thành công",
		});
		fetchCategories();
	} catch (error) {
		console.error("Lỗi khi xóa danh mục:", error);
		const errorMsg = error.response?.data?.error || "Không thể xóa danh mục";
		Toast.fire({
			icon: "error",
			title: errorMsg,
		});
	}
}

// ==================== RENDER ====================

/**
 * Render bảng danh mục
 */
function renderCategoriesTable() {
	if (!categoryTableBody) return;

	if (categories.length === 0) {
		categoryTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-4 text-muted">
          <i class="ti ti-folder-off fs-1 d-block mb-2"></i>
          Chưa có danh mục nào
        </td>
      </tr>
    `;
		return;
	}

	categoryTableBody.innerHTML = categories
		.map(
			(category, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>
        <span class="fw-semibold">${escapeHtml(category.name)}</span>
      </td>
      <td>
        <code>${escapeHtml(category.slug)}</code>
      </td>
      <td>${formatDate(category.created_at)}</td>
      <td>
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-outline-primary" onclick="editCategory(${category.id
				})" title="Sửa">
            <i class="ti ti-edit"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="confirmDelete(${category.id
				}, '${escapeHtml(category.name)}')" title="Xóa">
            <i class="ti ti-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `
		)
		.join("");
}

function generateSlug(str) {
	return str
		.normalize("NFD")                   
		.replace(/[\u0300-\u036f]/g, "")      
		.toLowerCase()                     
		.replace(/[^a-z0-9\s-]/g, "")         
		.replace(/\s+/g, "-")                
		.replace(/-+/g, "-")                
		.replace(/^-+|-+$/g, "");            
}
// ==================== FORM HANDLERS ====================

/**
 * Xử lý submit form
 */
function handleFormSubmit(e) {
	e.preventDefault();

	const name = categoryNameInput.value.trim();
	const slug = generateSlug(name);

	if (!name) {
		Toast.fire({
			icon: "warning",
			title: "Vui lòng nhập tên danh mục",
		});
		categoryNameInput.focus();
		return;
	}

	const data = { name, slug };
	console.log(data);

	if (editingId) {
		updateCategory(editingId, data);
	} else {
		createCategory(data);
	}
}

/**
 * Chuyển sang chế độ sửa
 */
window.editCategory = function (id) {
	const category = categories.find((c) => c.id === id);
	if (!category) return;

	editingId = id;
	categoryNameInput.value = category.name;
	// categoryStatusSelect.value = category.status;

	formTitle.textContent = "Sửa danh mục";
	submitBtn.innerHTML = '<i class="ti ti-check me-1"></i> Cập nhật';
	cancelBtn.classList.remove("d-none");

	categoryNameInput.focus();
};

/**
 * Xác nhận xóa danh mục
 */
window.confirmDelete = function (id, name) {
	Swal.fire({
		title: "Xác nhận xóa?",
		html: `Bạn có chắc muốn xóa danh mục <strong>${name}</strong>?`,
		icon: "warning",
		showCancelButton: true,
		confirmButtonColor: "#d33",
		cancelButtonColor: "#3085d6",
		confirmButtonText: "Xóa",
		cancelButtonText: "Hủy",
	}).then((result) => {
		if (result.isConfirmed) {
			deleteCategory(id);
		}
	});
};

/**
 * Reset form về trạng thái ban đầu
 */
function resetForm() {
	editingId = null;
	categoryForm.reset();
	formTitle.textContent = "Thêm danh mục";
	submitBtn.innerHTML = '<i class="ti ti-plus me-1"></i> Tạo ngay';
	cancelBtn.classList.add("d-none");
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
	fetchCategories();

	// Form submit
	if (categoryForm) {
		categoryForm.addEventListener("submit", handleFormSubmit);
	}

	// Cancel button
	if (cancelBtn) {
		cancelBtn.addEventListener("click", resetForm);
	}
});

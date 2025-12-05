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
let vouchers = [];
let editingId = null;
let isLoading = false;

// DOM Elements
const voucherTableBody = document.getElementById("voucherTableBody");
const voucherForm = document.getElementById("voucherForm");
const voucherCodeInput = document.getElementById("voucherCode");
const voucherTypeSelect = document.getElementById("voucherType");
const voucherDiscountInput = document.getElementById("voucherDiscount");
const voucherMoneyDiscountInput = document.getElementById(
  "voucherMoneyDiscount"
);
const voucherAmountInput = document.getElementById("voucherAmount");
const voucherExpiredAtInput = document.getElementById("voucherExpiredAt");
const discountField = document.getElementById("discountField");
const moneyDiscountField = document.getElementById("moneyDiscountField");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");

// ==================== LOADING HELPERS ====================

/**
 * Hiển thị loading trong table
 */
function showTableLoading() {
  if (!voucherTableBody) return;
  voucherTableBody.innerHTML = `
		<tr>
			<td colspan="8" class="text-center py-4">
				<div class="spinner-border text-primary" role="status">
					<span class="visually-hidden">Đang tải...</span>
				</div>
				<p class="text-muted mt-2 mb-0">Đang tải dữ liệu...</p>
			</td>
		</tr>
	`;
}

/**
 * Bật/tắt loading state cho form
 */
function setFormLoading(loading) {
  if (!voucherForm) return;

  const inputs = voucherForm.querySelectorAll(
    'input, select, button[type="submit"]'
  );
  inputs.forEach((input) => {
    if (input.type === "submit") {
      if (loading) {
        input.disabled = true;
        const originalHTML = input.innerHTML;
        input.dataset.originalHtml = originalHTML;
        input.innerHTML =
          '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Đang xử lý...';
      } else {
        input.disabled = false;
        if (input.dataset.originalHtml) {
          input.innerHTML = input.dataset.originalHtml;
          delete input.dataset.originalHtml;
        }
      }
    } else {
      input.disabled = loading;
    }
  });

  if (cancelBtn) {
    cancelBtn.disabled = loading;
  }
}

/**
 * Bật/tắt loading state cho action buttons trong table
 */
function setActionButtonsLoading(loading, excludeId = null) {
  const actionButtons = document.querySelectorAll("#voucherTableBody button");
  actionButtons.forEach((button) => {
    const row = button.closest("tr");
    if (row) {
      const editBtn = row.querySelector("button.btn-outline-primary");
      const deleteBtn = row.querySelector("button.btn-outline-danger");

      if (loading) {
        if (editBtn) editBtn.disabled = true;
        if (deleteBtn) deleteBtn.disabled = true;
      } else {
        if (editBtn) editBtn.disabled = false;
        if (deleteBtn) deleteBtn.disabled = false;
      }
    }
  });
}

// ==================== API CALLS ====================

/**
 * Lấy danh sách tất cả voucher
 */
async function fetchVouchers() {
  try {
    showTableLoading();
    isLoading = true;
    const response = await api.get("/vouchers");
    vouchers = response.data.data || response.data || [];
    renderVouchersTable();
    isLoading = false;
    return Promise.resolve();
  } catch (error) {
    console.error("Lỗi khi lấy voucher:", error);
    isLoading = false;
    Toast.fire({
      icon: "error",
      title: "Không thể tải danh sách voucher",
    });
    return Promise.reject(error);
  }
}

/**
 * Tạo voucher mới
 */
async function createVoucher(data) {
  try {
    setFormLoading(true);
    isLoading = true;
    const response = await api.post("/vouchers", data);
    Toast.fire({
      icon: "success",
      title: response.data.message || "Tạo voucher thành công",
    });
    resetForm();
    await fetchVouchers();
  } catch (error) {
    console.error("Lỗi khi tạo voucher:", error);
    const errorMsg =
      error.response?.data?.error ||
      error.response?.data?.errors?.code ||
      "Không thể tạo voucher";
    Toast.fire({
      icon: "error",
      title: errorMsg,
    });
  } finally {
    setFormLoading(false);
    isLoading = false;
  }
}

/**
 * Cập nhật voucher
 */
async function updateVoucher(id, data) {
  try {
    setFormLoading(true);
    isLoading = true;
    const response = await api.put(`/vouchers/${id}`, data);
    Toast.fire({
      icon: "success",
      title: response.data.message || "Cập nhật voucher thành công",
    });
    resetForm();
    await fetchVouchers();
  } catch (error) {
    console.error("Lỗi khi cập nhật voucher:", error);
    const errorMsg =
      error.response?.data?.error || "Không thể cập nhật voucher";
    Toast.fire({
      icon: "error",
      title: errorMsg,
    });
  } finally {
    setFormLoading(false);
    isLoading = false;
  }
}

/**
 * Xóa voucher
 */
async function deleteVoucher(id) {
  try {
    setActionButtonsLoading(true, id);
    isLoading = true;
    const response = await api.delete(`/vouchers/${id}`);
    Toast.fire({
      icon: "success",
      title: response.data.message || "Xóa voucher thành công",
    });
    await fetchVouchers();
  } catch (error) {
    console.error("Lỗi khi xóa voucher:", error);
    const errorMsg = error.response?.data?.error || "Không thể xóa voucher";
    Toast.fire({
      icon: "error",
      title: errorMsg,
    });
  } finally {
    setActionButtonsLoading(false);
    isLoading = false;
  }
}

// ==================== RENDER ====================

/**
 * Render danh sách voucher
 */
function renderVouchersTable() {
  if (!voucherTableBody) return;

  if (vouchers.length === 0) {
    voucherTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-4 text-muted">
          <i class="ti ti-ticket-off fs-1 d-block mb-2"></i>
          Chưa có voucher nào
        </td>
      </tr>
    `;
    return;
  }

  voucherTableBody.innerHTML = vouchers
    .map((voucher, index) => {
      const expiredDate = new Date(voucher.expired_at);
      const now = new Date();
      const expiredDateOnly = new Date(
        expiredDate.getFullYear(),
        expiredDate.getMonth(),
        expiredDate.getDate()
      );
      const nowDateOnly = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      const isExpired = expiredDateOnly < nowDateOnly;
      const daysUntilExpiry = Math.ceil(
        (expiredDateOnly - nowDateOnly) / (1000 * 60 * 60 * 24)
      );
      const isExpiringSoon =
        !isExpired && daysUntilExpiry <= 7 && daysUntilExpiry > 0;

      let discountValue = "";
      if (voucher.type === "percent") {
        if (voucher.discount !== null && voucher.discount !== undefined) {
          discountValue = `${voucher.discount}%`;
        } else {
          discountValue =
            '<span class="text-muted">0% <i class="ti ti-alert-circle ms-1" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Chưa có giá trị giảm giá"></i></span>';
        }
      } else {
        if (voucher.discount !== null && voucher.discount !== undefined) {
          discountValue = formatCurrency(voucher.discount);
        } else {
          discountValue =
            '<span class="text-muted">0 đ <i class="ti ti-alert-circle ms-1" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Chưa có giá trị giảm giá"></i></span>';
        }
      }

      const usageLimitStr =
        voucher.usage_limit !== null && voucher.usage_limit !== undefined
          ? String(voucher.usage_limit)
          : "";
      const usageLimitNum = usageLimitStr ? parseInt(usageLimitStr) : 0;
      const isUsable =
        usageLimitStr !== "" && !isNaN(usageLimitNum) && usageLimitNum > 0;

      let alertIcon = "";
      if (!isUsable) {
        alertIcon =
          '<i class="ti ti-alert-circle ms-1 text-danger" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Không thể sử dụng"></i>';
      } else if (isExpired) {
        alertIcon =
          '<i class="ti ti-alert-circle ms-1 text-danger" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Đã hết hạn"></i>';
      } else if (isExpiringSoon) {
        alertIcon =
          '<i class="ti ti-alert-circle ms-1 text-warning" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Sắp hết hạn"></i>';
      }

      return `
						<tr>
						<td>${index + 1}</td>
						<td>
							<code class="fw-semibold">${escapeHtml(voucher.code)}</code>
						</td>
						<td>
							<span class="badge ${
                voucher.type === "percent"
                  ? "bg-info-subtle text-info"
                  : "bg-success-subtle text-success"
              }">
							${voucher.type === "percent" ? "Phần trăm" : "Số tiền"}
							</span>
						</td>
						<td>
							${
                discountValue.includes("<span")
                  ? discountValue
                  : `<span class="fw-semibold">${discountValue}</span>`
              }
						</td>
						<td>
							<span class="${
                isExpired
                  ? "text-danger"
                  : isExpiringSoon
                  ? "text-warning"
                  : !isUsable
                  ? "text-danger"
                  : ""
              }">
							${formatDate(voucher.expired_at)}
							${alertIcon}
							</span>
						</td>
						<td>
							${(() => {
                const usageLimitStr =
                  voucher.usage_limit !== null &&
                  voucher.usage_limit !== undefined
                    ? String(voucher.usage_limit)
                    : "";
                const usageLimitNum = usageLimitStr
                  ? parseInt(usageLimitStr)
                  : 0;
                return usageLimitStr !== "" &&
                  !isNaN(usageLimitNum) &&
                  usageLimitNum > 0
                  ? `<span>${voucher.usage_limit}</span>`
                  : '<span class="text-danger">0 <i class="ti ti-alert-circle ms-1" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Không thể sử dụng"></i></span>';
              })()}
						</td>
						<td>${formatDate(voucher.created_at)}</td>
						<td>
							<div class="d-flex gap-2">
							<button class="btn btn-sm btn-outline-primary" onclick="editVoucher(${
                voucher.id
              })" title="Sửa">
								<i class="ti ti-edit"></i>
							</button>
							<button class="btn btn-sm btn-outline-danger" onclick="confirmDelete(${
                voucher.id
              }, '${escapeHtml(voucher.code)}')" title="Xóa">
								<i class="ti ti-trash"></i>
							</button>
							</div>
						</td>
						</tr>
					`;
    })
    .join("");

  initializeTooltips();
}

/**
 * Khởi tạo Bootstrap tooltips
 */
function initializeTooltips() {
  const tooltipTriggerList = document.querySelectorAll(
    '[data-bs-toggle="tooltip"]'
  );

  const initTooltips = () => {
    if (typeof bootstrap !== "undefined" && bootstrap.Tooltip) {
      tooltipTriggerList.forEach((tooltipTriggerEl) => {
        const existingTooltip = bootstrap.Tooltip.getInstance(tooltipTriggerEl);
        if (existingTooltip) {
          existingTooltip.dispose();
        }
      });
      tooltipTriggerList.forEach((tooltipTriggerEl) => {
        new bootstrap.Tooltip(tooltipTriggerEl);
      });
    } else {
      setTimeout(initTooltips, 100);
    }
  };

  initTooltips();
}

// ==================== FORM HANDLERS ====================

/**
 * Xử lý thay đổi loại voucher
 */
function handleTypeChange() {
  const type = voucherTypeSelect.value;
  if (type === "percent") {
    discountField.classList.remove("d-none");
    moneyDiscountField.classList.add("d-none");
    voucherDiscountInput.required = true;
    voucherMoneyDiscountInput.required = false;
    voucherMoneyDiscountInput.value = "";
  } else {
    discountField.classList.add("d-none");
    moneyDiscountField.classList.remove("d-none");
    voucherDiscountInput.required = false;
    voucherMoneyDiscountInput.required = true;
    voucherDiscountInput.value = "";
  }
}

/**
 * Xử lý submit form
 */
function handleFormSubmit(e) {
  e.preventDefault();

  const code = voucherCodeInput.value.trim().toUpperCase();
  const type = voucherTypeSelect.value;
  const expiredAt = voucherExpiredAtInput.value;

  if (!code) {
    Toast.fire({
      icon: "warning",
      title: "Vui lòng nhập mã voucher",
    });
    voucherCodeInput.focus();
    return;
  }

  if (!expiredAt) {
    Toast.fire({
      icon: "warning",
      title: "Vui lòng chọn ngày hết hạn",
    });
    voucherExpiredAtInput.focus();
    return;
  }

  const expiredDate = new Date(expiredAt);
  const now = new Date();
  const expiredDateOnly = new Date(
    expiredDate.getFullYear(),
    expiredDate.getMonth(),
    expiredDate.getDate()
  );
  const nowDateOnly = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  if (expiredDateOnly <= nowDateOnly) {
    Toast.fire({
      icon: "warning",
      title: "Ngày hết hạn phải sau ngày hiện tại",
    });
    voucherExpiredAtInput.focus();
    return;
  }
  const usageAmount = voucherAmountInput.value.trim();
  const usageAmountNum = parseInt(usageAmount);
  if (!usageAmount || isNaN(usageAmountNum) || usageAmountNum <= 0) {
    Toast.fire({
      icon: "warning",
      title: "Số lượt sử dụng phải lớn hơn 0",
    });
    voucherAmountInput.focus();
    return;
  }

  const data = {
    code,
    type,
    expired_at: expiredAt,
    usage_limit: usageAmountNum, // Số lượt sử dụng
  };

  if (type === "percent") {
    const discount = parseFloat(voucherDiscountInput.value);
    if (!discount || discount <= 0 || discount > 100) {
      Toast.fire({
        icon: "warning",
        title: "Phần trăm giảm giá phải từ 1 đến 100",
      });
      voucherDiscountInput.focus();
      return;
    }
    data.discount = discount;
  } else {
    const moneyDiscount = parseFloat(voucherMoneyDiscountInput.value);
    if (!moneyDiscount || moneyDiscount <= 0) {
      Toast.fire({
        icon: "warning",
        title: "Số tiền giảm giá phải lớn hơn 0",
      });
      voucherMoneyDiscountInput.focus();
      return;
    }
    data.amount = moneyDiscount;
  }

  if (editingId) {
    updateVoucher(editingId, data);
  } else {
    createVoucher(data);
  }
}
/**
 * Chuyển sang chế độ sửa
 */
window.editVoucher = function (id) {
  const voucher = vouchers.find((v) => v.id === id);
  if (!voucher) return;

  editingId = id;
  voucherCodeInput.value = voucher.code;
  voucherTypeSelect.value = voucher.type;

  handleTypeChange();

  if (voucher.type === "percent") {
    voucherDiscountInput.value = voucher.discount || "";
  } else {
    voucherMoneyDiscountInput.value = voucher.amount || "";
  }

  voucherAmountInput.value =
    voucher.usage_limit !== null && voucher.usage_limit !== undefined
      ? String(voucher.usage_limit)
      : "";

  if (voucher.expired_at) {
    const expiredDate = new Date(voucher.expired_at);
    const year = expiredDate.getFullYear();
    const month = String(expiredDate.getMonth() + 1).padStart(2, "0");
    const day = String(expiredDate.getDate()).padStart(2, "0");
    const hours = String(expiredDate.getHours()).padStart(2, "0");
    const minutes = String(expiredDate.getMinutes()).padStart(2, "0");
    voucherExpiredAtInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  formTitle.textContent = "Sửa voucher";
  submitBtn.innerHTML = '<i class="ti ti-check me-1"></i> Cập nhật';
  cancelBtn.classList.remove("d-none");

  voucherCodeInput.focus();
};

/**
 * Xác nhận xóa voucher
 */
window.confirmDelete = function (id, code) {
  Swal.fire({
    title: "Xác nhận xóa?",
    html: `Bạn có chắc muốn xóa voucher <strong>${code}</strong>?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Xóa",
    cancelButtonText: "Hủy",
  }).then((result) => {
    if (result.isConfirmed) {
      deleteVoucher(id);
    }
  });
};

/**
 * Reset form về trạng thái ban đầu
 */
function resetForm() {
  editingId = null;
  voucherForm.reset();
  formTitle.textContent = "Thêm voucher";
  submitBtn.innerHTML = '<i class="ti ti-plus me-1"></i> Tạo ngay';
  cancelBtn.classList.add("d-none");
  handleTypeChange();
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

/**
 * Format tiền tệ
 */
function formatCurrency(amount) {
  if (!amount) return "0";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

// ==================== INIT ====================

document.addEventListener("DOMContentLoaded", () => {
  fetchVouchers();
  if (voucherForm) {
    voucherForm.addEventListener("submit", handleFormSubmit);
  }
  if (voucherTypeSelect) {
    voucherTypeSelect.addEventListener("change", handleTypeChange);
  }
  if (cancelBtn) {
    cancelBtn.addEventListener("click", resetForm);
  }
  const refreshBtn = document.getElementById("refresh-vouchers-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", handleRefresh);
  }
  handleTypeChange();
  initializeTooltips();
});

/**
 * Xử lý refresh danh sách voucher
 */
function handleRefresh() {
  if (isLoading) return; // Prevent multiple simultaneous requests

  const refreshBtn = document.getElementById("refresh-vouchers-btn");
  const reloadIcon = refreshBtn?.querySelector(".reload-icon");
  if (reloadIcon) {
    reloadIcon.classList.add("rotating");
  }
  if (refreshBtn) {
    refreshBtn.disabled = true;
    refreshBtn.style.pointerEvents = "none";
  }

  fetchVouchers().finally(() => {
    if (reloadIcon) {
      reloadIcon.classList.remove("rotating");
    }
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.style.pointerEvents = "auto";
    }
  });
}

import api, { getImageUrl } from "../../../shared/services/api.js";
import Swal, { Toast } from "../../../shared/utils/swal.js";

// Swal helpers
const SwalHelper = {
  success: (msg) => Toast.fire({ icon: "success", title: msg }),
  error: (msg) => Toast.fire({ icon: "error", title: msg }),
  confirm: (title, msg) =>
    Swal.fire({
      title: title,
      text: msg,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Đồng ý",
      cancelButtonText: "Hủy",
    }).then((r) => r.isConfirmed),
};

// Status config
const STATUS_CONFIG = {
  pending: { label: "Chờ xác nhận", class: "status-pending", icon: "ti-clock" },
  confirmed: {
    label: "Đã xác nhận",
    class: "status-confirmed",
    icon: "ti-check",
  },
  processing: {
    label: "Đang xử lý",
    class: "status-processing",
    icon: "ti-package",
  },
  shipping: {
    label: "Đang giao",
    class: "status-shipping",
    icon: "ti-truck-delivery",
  },
  delivered: {
    label: "Hoàn thành",
    class: "status-delivered",
    icon: "ti-circle-check",
  },
  cancelled: { label: "Đã hủy", class: "status-cancelled", icon: "ti-x" },
};

const PAYMENT_STATUS_CONFIG = {
  unpaid: { label: "Chưa TT", class: "payment-unpaid" },
  paid: { label: "Đã TT", class: "payment-paid" },
  refunded: { label: "Đã hoàn", class: "payment-refunded" },
};

const PAYMENT_METHOD_LABELS = {
  cod: "COD",
  banking: "Chuyển khoản",
  momo: "Momo",
};

// State
const state = {
  orders: [],
  statistics: {},
  pagination: { current_page: 1, per_page: 10, total: 0, total_pages: 0 },
  filters: {
    search: "",
    status: "",
    payment_status: "",
    date_from: "",
    date_to: "",
  },
  selectedOrder: null,
};

// Cache DOM elements
let $tbody, $pagination, $info, $loader, $table, $searchInput;
let $filterStatus, $filterPayment, $filterDateFrom, $filterDateTo;
let $orderDetailModal, $updateStatusModal;

// Format helpers
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount || 0);
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatShortDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// --- 1. GỌI API ---
const fetchOrders = async () => {
  try {
    $loader && ($loader.style.display = "block");
    $table && ($table.style.opacity = "0.5");

    const { current_page, per_page } = state.pagination;
    const { search, status, payment_status } = state.filters;

    // Build URL
    let url = `/orders/admin?page=${current_page}&limit=${per_page}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (status) url += `&status=${status}`;
    if (payment_status) url += `&payment_status=${payment_status}`;

    const res = await api.get(url);
    const data = res.data?.data || res.data;

    state.orders = data?.orders || [];
    state.pagination = data?.pagination || state.pagination;

    render();
  } catch (e) {
    handleError(e);
  } finally {
    $loader && ($loader.style.display = "none");
    $table && ($table.style.opacity = "1");
  }
};

const fetchStatistics = async () => {
  try {
    const res = await api.get("/orders/statistics");
    const data = res.data?.data || res.data;
    state.statistics = data;
    renderStatistics();
  } catch (e) {
    console.error("Error fetching statistics:", e);
  }
};

const fetchOrderDetail = async (orderId) => {
  try {
    const res = await api.get(`/orders/${orderId}`);
    const data = res.data?.data || res.data;
    state.selectedOrder = data;
    renderOrderDetail();
    $orderDetailModal.show();
  } catch (e) {
    handleError(e);
  }
};

const updateOrderStatus = async (orderId, status) => {
  try {
    await api.put(`/orders/${orderId}/status`, { status });
    SwalHelper.success("Cập nhật trạng thái thành công");
    fetchOrders();
    fetchStatistics();
  } catch (e) {
    handleError(e);
  }
};

const updatePaymentStatus = async (orderId, paymentStatus) => {
  try {
    await api.put(`/orders/${orderId}/payment-status`, {
      payment_status: paymentStatus,
    });
    SwalHelper.success("Cập nhật trạng thái thanh toán thành công");
    fetchOrders();
  } catch (e) {
    handleError(e);
  }
};

// --- 2. RENDER ---
const render = () => {
  renderTable();
  renderPagination();
};

const renderStatistics = () => {
  const stats = state.statistics.status_stats || {};

  document.getElementById("stat-pending").textContent = stats.pending || 0;
  document.getElementById("stat-confirmed").textContent = stats.confirmed || 0;
  document.getElementById("stat-processing").textContent =
    stats.processing || 0;
  document.getElementById("stat-shipping").textContent = stats.shipping || 0;
  document.getElementById("stat-delivered").textContent = stats.delivered || 0;
  document.getElementById("stat-cancelled").textContent = stats.cancelled || 0;

  // Total revenue
  const revenueEl = document.getElementById("total-revenue");
  if (revenueEl && state.statistics.total_revenue) {
    revenueEl.textContent = `Doanh thu: ${formatCurrency(
      state.statistics.total_revenue
    )}`;
  }
};

const renderTable = () => {
  if (!$tbody) return;

  if (!state.orders.length) {
    $tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">Không có đơn hàng nào</td></tr>`;
    return;
  }

  $tbody.innerHTML = state.orders
    .map((order) => {
      const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
      const paymentConfig =
        PAYMENT_STATUS_CONFIG[order.payment_status] ||
        PAYMENT_STATUS_CONFIG.unpaid;
      const address = order.address || {};
      const customerName =
        order.user_name || address.receiver_name || address.name || "N/A";
      const customerEmail = order.user_email || "";

      return `
    <tr>
      <td class="ps-0">
        <span class="fw-semibold text-primary">#${order.id}</span>
      </td>
      <td>
        <div>
          <h6 class="mb-0 fs-3 fw-semibold">${customerName}</h6>
          <span class="fs-2 text-muted">${customerEmail}</span>
        </div>
      </td>
      <td>
        <span class="badge bg-light text-dark">${
          order.total_items || 0
        } sản phẩm</span>
      </td>
      <td>
        <span class="fw-semibold">${formatCurrency(order.total)}</span>
      </td>
      <td>
        <span class="badge order-status-badge ${paymentConfig.class}">${
        paymentConfig.label
      }</span>
        <div class="fs-2 text-muted mt-1">${
          PAYMENT_METHOD_LABELS[order.payment_method] ||
          order.payment_method ||
          "-"
        }</div>
      </td>
      <td>
        <span class="badge order-status-badge ${statusConfig.class}">
          <i class="ti ${statusConfig.icon} me-1"></i>${statusConfig.label}
        </span>
      </td>
      <td>
        <span class="fs-3">${formatShortDate(order.created_at)}</span>
      </td>
      <td>
        <div class="dropdown">
          <a href="#" data-bs-toggle="dropdown"><i class="ti ti-dots fs-4"></i></a>
          <ul class="dropdown-menu dropdown-menu-end">
            <li><a class="dropdown-item" href="#" data-action="view" data-id="${
              order.id
            }"><i class="ti ti-eye fs-5 me-2"></i>Xem chi tiết</a></li>
            <li><a class="dropdown-item" href="#" data-action="update-status" data-id="${
              order.id
            }" data-status="${order.status}" data-payment="${
        order.payment_status
      }"><i class="ti ti-edit fs-5 me-2"></i>Cập nhật TT</a></li>
            ${
              order.status === "pending"
                ? `<li><a class="dropdown-item" href="#" data-action="confirm" data-id="${order.id}"><i class="ti ti-check fs-5 me-2 text-success"></i>Xác nhận</a></li>`
                : ""
            }
            ${
              ["pending", "confirmed"].includes(order.status)
                ? `<li><a class="dropdown-item text-danger" href="#" data-action="cancel" data-id="${order.id}"><i class="ti ti-x fs-5 me-2"></i>Hủy đơn</a></li>`
                : ""
            }
          </ul>
        </div>
      </td>
    </tr>`;
    })
    .join("");
};

const renderOrderDetail = () => {
  const order = state.selectedOrder;
  if (!order) return;

  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const paymentConfig =
    PAYMENT_STATUS_CONFIG[order.payment_status] || PAYMENT_STATUS_CONFIG.unpaid;
  const address = order.address || {};

  const itemsHtml = (order.items || [])
    .map(
      (item) => `
    <div class="order-detail-item d-flex align-items-center gap-3">
      <img src="${getImageUrl(item.product_image || item.variant_image)}" 
           alt="${item.product_name}" 
           class="rounded" 
           style="width: 60px; height: 60px; object-fit: cover;"
           onerror="this.src='https://placehold.co/60x60?text=No+Image'">
      <div class="flex-grow-1">
        <h6 class="mb-1">${item.product_name || "Sản phẩm"}</h6>
        <div class="fs-2 text-muted">
          SKU: ${item.sku || "-"} | Size: ${item.size || "-"}
        </div>
      </div>
      <div class="text-end">
        <div class="fw-semibold">${formatCurrency(item.price)}</div>
        <div class="fs-2 text-muted">x${item.quantity}</div>
      </div>
      <div class="text-end" style="min-width: 100px;">
        <span class="fw-bold text-primary">${formatCurrency(
          item.subtotal || item.price * item.quantity
        )}</span>
      </div>
    </div>`
    )
    .join("");

  const content = `
    <div class="row mb-4">
      <div class="col-md-6">
        <h6 class="text-muted mb-2">Thông tin đơn hàng</h6>
        <p class="mb-1"><strong>Mã đơn:</strong> #${order.id}</p>
        <p class="mb-1"><strong>Ngày đặt:</strong> ${formatDate(
          order.created_at
        )}</p>
        <p class="mb-1"><strong>Trạng thái:</strong> <span class="badge order-status-badge ${
          statusConfig.class
        }">${statusConfig.label}</span></p>
        <p class="mb-1"><strong>Thanh toán:</strong> <span class="badge order-status-badge ${
          paymentConfig.class
        }">${paymentConfig.label}</span></p>
        <p class="mb-0"><strong>Phương thức:</strong> ${
          PAYMENT_METHOD_LABELS[order.payment_method] ||
          order.payment_method ||
          "-"
        }</p>
      </div>
      <div class="col-md-6">
        <h6 class="text-muted mb-2">Địa chỉ giao hàng</h6>
        <p class="mb-1"><strong>Người nhận:</strong> ${
          address.receiver_name || address.name || "-"
        }</p>
        <p class="mb-1"><strong>SĐT:</strong> ${
          address.receiver_phone || address.phone || "-"
        }</p>
        <p class="mb-0"><strong>Địa chỉ:</strong> ${
          [address.street || address.detail, address.ward, address.province]
            .filter(Boolean)
            .join(", ") || "-"
        }</p>
      </div>
    </div>

    <h6 class="text-muted mb-3">Sản phẩm đặt hàng</h6>
    <div class="border rounded p-3 mb-3">
      ${
        itemsHtml ||
        '<p class="text-muted text-center mb-0">Không có sản phẩm</p>'
      }
    </div>

    <div class="row">
      <div class="col-md-6">
        ${
          order.note
            ? `<p class="mb-0"><strong>Ghi chú:</strong> ${order.note}</p>`
            : ""
        }
      </div>
      <div class="col-md-6">
        <div class="bg-light rounded p-3">
          <div class="d-flex justify-content-between mb-2">
            <span>Tạm tính:</span>
            <span>${formatCurrency(order.total)}</span>
          </div>
          <div class="d-flex justify-content-between mb-2">
            <span>Phí vận chuyển:</span>
            <span>${formatCurrency(0)}</span>
          </div>
          <div class="d-flex justify-content-between mb-2">
            <span>Giảm giá:</span>
            <span class="text-danger">-${formatCurrency(0)}</span>
          </div>
          <hr>
          <div class="d-flex justify-content-between">
            <strong>Tổng cộng:</strong>
            <strong class="text-primary fs-5">${formatCurrency(
              order.total
            )}</strong>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById("order-detail-content").innerHTML = content;
  document.getElementById(
    "orderDetailModalLabel"
  ).textContent = `Chi tiết đơn hàng #${order.id}`;
};

const renderPagination = () => {
  if (!$pagination) return;

  const { current_page: p, total_pages: t, per_page, total } = state.pagination;

  if (t <= 1) {
    $pagination.innerHTML = "";
    $info && ($info.textContent = "");
    return;
  }

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
    $info.textContent = `Hiển thị ${start}-${end}/${total} đơn hàng`;
  }
};

// --- 3. EVENT HANDLERS ---
const handleError = (e) => {
  console.error("Error:", e);
  if (e.response?.status === 401) {
    SwalHelper.error("Phiên đăng nhập hết hạn");
    localStorage.clear();
    location.href = "/src/pages/client/login.html";
  } else if (e.response?.status === 403) {
    SwalHelper.error("Bạn không có quyền thực hiện thao tác này");
  } else {
    SwalHelper.error(
      e.response?.data?.error ||
        e.response?.data?.message ||
        "Lỗi kết nối server"
    );
  }
};

const handleTableClick = async (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  e.preventDefault();
  const { action, id, status, payment } = btn.dataset;

  switch (action) {
    case "view":
      fetchOrderDetail(id);
      break;

    case "update-status":
      document.getElementById("update-order-id").value = id;
      document.getElementById("update-status").value = status || "pending";
      document.getElementById("update-payment-status").value =
        payment || "unpaid";
      $updateStatusModal.show();
      break;

    case "confirm":
      if (
        await SwalHelper.confirm(
          "Xác nhận đơn hàng",
          "Bạn có chắc muốn xác nhận đơn hàng này?"
        )
      ) {
        updateOrderStatus(id, "confirmed");
      }
      break;

    case "cancel":
      if (
        await SwalHelper.confirm(
          "Hủy đơn hàng",
          "Bạn có chắc muốn hủy đơn hàng này?"
        )
      ) {
        updateOrderStatus(id, "cancelled");
      }
      break;
  }
};

const handlePaginationClick = (e) => {
  const link = e.target.closest("[data-page]");
  if (!link) return;

  e.preventDefault();
  const page = parseInt(link.dataset.page);
  if (page > 0 && page <= state.pagination.total_pages) {
    state.pagination.current_page = page;
    fetchOrders();
  }
};

const handleSearch = () => {
  state.filters.search = $searchInput?.value || "";
  state.pagination.current_page = 1;
  fetchOrders();
};

const handleFilterChange = () => {
  state.filters.status = $filterStatus?.value || "";
  state.filters.payment_status = $filterPayment?.value || "";
  state.filters.date_from = $filterDateFrom?.value || "";
  state.filters.date_to = $filterDateTo?.value || "";
  state.pagination.current_page = 1;
  fetchOrders();
};

const handleConfirmUpdateStatus = async () => {
  const orderId = document.getElementById("update-order-id").value;
  const newStatus = document.getElementById("update-status").value;
  const newPaymentStatus = document.getElementById(
    "update-payment-status"
  ).value;

  try {
    // Update order status
    await api.put(`/orders/${orderId}/status`, { status: newStatus });

    // Update payment status
    await api.put(`/orders/${orderId}/payment-status`, {
      payment_status: newPaymentStatus,
    });

    SwalHelper.success("Cập nhật thành công");
    $updateStatusModal.hide();
    fetchOrders();
    fetchStatistics();
  } catch (e) {
    handleError(e);
  }
};

// Export orders to CSV (simple implementation)
window.exportOrders = () => {
  if (!state.orders.length) {
    SwalHelper.error("Không có dữ liệu để xuất");
    return;
  }

  const headers = [
    "Mã đơn",
    "Khách hàng",
    "Email",
    "Tổng tiền",
    "Trạng thái",
    "Thanh toán",
    "Ngày đặt",
  ];
  const rows = state.orders.map((o) => [
    o.id,
    o.user_name || o.address?.receiver_name || "",
    o.user_email || "",
    o.total,
    STATUS_CONFIG[o.status]?.label || o.status,
    PAYMENT_STATUS_CONFIG[o.payment_status]?.label || o.payment_status,
    formatShortDate(o.created_at),
  ]);

  const csvContent =
    "\uFEFF" + // BOM for UTF-8
    [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `orders_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
};

// --- 4. INIT ---
const init = () => {
  // Cache DOM
  $tbody = document.getElementById("orders-tbody");
  $pagination = document.getElementById("orders-pagination");
  $info = document.getElementById("orders-info");
  $loader = document.getElementById("orders-loader");
  $table = document.getElementById("orders-table");
  $searchInput = document.getElementById("search-input");
  $filterStatus = document.getElementById("filter-status");
  $filterPayment = document.getElementById("filter-payment");
  $filterDateFrom = document.getElementById("filter-date-from");
  $filterDateTo = document.getElementById("filter-date-to");

  // Init modals
  const orderDetailModalEl = document.getElementById("orderDetailModal");
  const updateStatusModalEl = document.getElementById("updateStatusModal");
  if (orderDetailModalEl)
    $orderDetailModal = new bootstrap.Modal(orderDetailModalEl);
  if (updateStatusModalEl)
    $updateStatusModal = new bootstrap.Modal(updateStatusModalEl);

  // Event listeners
  $tbody?.addEventListener("click", handleTableClick);
  $pagination?.addEventListener("click", handlePaginationClick);

  // Search
  document
    .getElementById("btn-search")
    ?.addEventListener("click", handleSearch);
  $searchInput?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSearch();
  });

  // Filters
  $filterStatus?.addEventListener("change", handleFilterChange);
  $filterPayment?.addEventListener("change", handleFilterChange);
  $filterDateFrom?.addEventListener("change", handleFilterChange);
  $filterDateTo?.addEventListener("change", handleFilterChange);

  // Update status modal
  document
    .getElementById("btn-confirm-update-status")
    ?.addEventListener("click", handleConfirmUpdateStatus);

  // Print order
  document.getElementById("btn-print-order")?.addEventListener("click", () => {
    const content = document.getElementById("order-detail-content")?.innerHTML;
    if (!content) return;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>In đơn hàng #${state.selectedOrder?.id || ""}</title>
        <link rel="stylesheet" href="/src/modules/admin/styles/main.css" />
        <style>
          body { padding: 20px; font-family: Arial, sans-serif; }
          .order-detail-item { border-bottom: 1px solid #eee; padding: 10px 0; }
          .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <h2>Đơn hàng #${state.selectedOrder?.id || ""}</h2>
        ${content}
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  });

  // Load data
  fetchOrders();
  fetchStatistics();
};

// Start
document.addEventListener("DOMContentLoaded", init);

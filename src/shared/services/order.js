import api from "./api.js";

/**
 * Order Service - Xử lý tất cả API liên quan đến đơn hàng
 */

// === USER ENDPOINTS ===

/**
 * Lấy danh sách đơn hàng của user hiện tại
 * @param {Object} params - { page, limit, status }
 */
export const getMyOrders = async (params = {}) => {
  const { page = 1, limit = 10, status = "" } = params;
  let url = `/orders?page=${page}&limit=${limit}`;
  if (status) url += `&status=${status}`;

  const res = await api.get(url);
  return res.data?.data || res.data;
};

/**
 * Lấy chi tiết một đơn hàng
 * @param {number} orderId
 */
export const getOrderById = async (orderId) => {
  const res = await api.get(`/orders/${orderId}`);
  return res.data?.data || res.data;
};

/**
 * Tạo đơn hàng mới
 * @param {Object} orderData - {
 *   items: [{ variant_id, quantity }],
 *   address: { name, phone, province, ward, street },
 *   payment_method: 'cod' | 'banking' | 'momo',
 *   note: string,
 *   voucher_id: number,
 *   shipping_method_id: number
 * }
 */
export const createOrder = async (orderData) => {
  const res = await api.post("/orders", orderData);
  return res.data?.data || res.data;
};

/**
 * User hủy đơn hàng (chỉ được hủy khi status = pending hoặc confirmed)
 * @param {number} orderId
 */
export const cancelOrder = async (orderId) => {
  const res = await api.put(`/orders/${orderId}/cancel`);
  return res.data?.data || res.data;
};

// === ADMIN ENDPOINTS ===

/**
 * [Admin] Lấy tất cả đơn hàng
 * @param {Object} params - { page, limit, status, search, payment_status }
 */
export const getAllOrders = async (params = {}) => {
  const {
    page = 1,
    limit = 10,
    status = "",
    search = "",
    payment_status = "",
  } = params;

  let url = `/orders/admin?page=${page}&limit=${limit}`;
  if (status) url += `&status=${status}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (payment_status) url += `&payment_status=${payment_status}`;

  const res = await api.get(url);
  return res.data?.data || res.data;
};

/**
 * [Admin] Cập nhật trạng thái đơn hàng
 * @param {number} orderId
 * @param {string} status - 'pending' | 'confirmed' | 'processing' | 'shipping' | 'delivered' | 'cancelled'
 */
export const updateOrderStatus = async (orderId, status) => {
  const res = await api.put(`/orders/${orderId}/status`, { status });
  return res.data?.data || res.data;
};

/**
 * [Admin] Cập nhật trạng thái thanh toán
 * @param {number} orderId
 * @param {string} paymentStatus - 'unpaid' | 'paid' | 'refunded'
 */
export const updatePaymentStatus = async (orderId, paymentStatus) => {
  const res = await api.put(`/orders/${orderId}/payment-status`, {
    payment_status: paymentStatus,
  });
  return res.data?.data || res.data;
};

/**
 * [Admin] Lấy thống kê đơn hàng
 */
export const getOrderStatistics = async () => {
  const res = await api.get("/orders/statistics");
  return res.data?.data || res.data;
};

// === HELPER FUNCTIONS ===

/**
 * Status config cho UI
 */
export const ORDER_STATUS = {
  pending: { label: "Chờ xác nhận", color: "warning", icon: "clock" },
  confirmed: { label: "Đã xác nhận", color: "info", icon: "check" },
  processing: { label: "Đang xử lý", color: "primary", icon: "package" },
  shipping: { label: "Đang giao hàng", color: "secondary", icon: "truck" },
  delivered: { label: "Đã giao hàng", color: "success", icon: "check-circle" },
  cancelled: { label: "Đã hủy", color: "danger", icon: "x-circle" },
};

export const PAYMENT_STATUS = {
  unpaid: { label: "Chưa thanh toán", color: "warning" },
  paid: { label: "Đã thanh toán", color: "success" },
  refunded: { label: "Đã hoàn tiền", color: "danger" },
};

export const PAYMENT_METHODS = {
  cod: { label: "Thanh toán khi nhận hàng", icon: "cash" },
  banking: { label: "Chuyển khoản ngân hàng", icon: "bank" },
  momo: { label: "Ví MoMo", icon: "wallet" },
};

/**
 * Lấy label hiển thị cho status
 * @param {string} status
 */
export const getStatusLabel = (status) => {
  return ORDER_STATUS[status]?.label || status;
};

/**
 * Lấy class CSS cho status badge
 * @param {string} status
 */
export const getStatusClass = (status) => {
  const color = ORDER_STATUS[status]?.color || "secondary";
  return `bg-${color}-subtle text-${color}`;
};

/**
 * Kiểm tra user có thể hủy đơn hàng không
 * @param {string} status
 */
export const canCancelOrder = (status) => {
  return ["pending", "confirmed"].includes(status);
};

/**
 * Kiểm tra admin có thể cập nhật sang trạng thái tiếp theo không
 * @param {string} currentStatus
 * @param {string} newStatus
 */
export const canUpdateStatus = (currentStatus, newStatus) => {
  const statusFlow = [
    "pending",
    "confirmed",
    "processing",
    "shipping",
    "delivered",
  ];
  const currentIndex = statusFlow.indexOf(currentStatus);
  const newIndex = statusFlow.indexOf(newStatus);

  // Không cho phép quay lại trạng thái trước (trừ cancelled)
  if (newStatus === "cancelled") return true;
  if (currentStatus === "cancelled" || currentStatus === "delivered")
    return false;

  return newIndex >= currentIndex;
};

export default {
  getMyOrders,
  getOrderById,
  createOrder,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  getOrderStatistics,
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  getStatusLabel,
  getStatusClass,
  canCancelOrder,
  canUpdateStatus,
};

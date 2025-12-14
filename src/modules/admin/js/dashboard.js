import api, { getImageUrl } from "../../../shared/services/api.js";
import Swal, { Toast } from "../../../shared/utils/swal.js";

// ==================== CONFIG ====================
const STATUS_CONFIG = {
  pending: {
    label: "Chờ xác nhận",
    color: "#ffc107",
    bgClass: "bg-warning-subtle text-warning",
  },
  confirmed: {
    label: "Đã xác nhận",
    color: "#17a2b8",
    bgClass: "bg-info-subtle text-info",
  },
  processing: {
    label: "Đang xử lý",
    color: "#007bff",
    bgClass: "bg-primary-subtle text-primary",
  },
  shipping: {
    label: "Đang giao",
    color: "#6c757d",
    bgClass: "bg-secondary-subtle text-secondary",
  },
  delivered: {
    label: "Hoàn thành",
    color: "#28a745",
    bgClass: "bg-success-subtle text-success",
  },
  cancelled: {
    label: "Đã hủy",
    color: "#dc3545",
    bgClass: "bg-danger-subtle text-danger",
  },
};

// ==================== STATE ====================
const state = {
  statistics: null,
  recentOrders: [],
  topProducts: [],
  revenueChart: null,
  orderStatusChart: null,
  revenuePeriod: 12, // Default to 12 months
};

// ==================== HELPERS ====================
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount || 0);
};

const formatShortCurrency = (amount) => {
  if (amount >= 1000000000) {
    return (amount / 1000000000).toFixed(1) + " tỷ";
  } else if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1) + " tr";
  } else if (amount >= 1000) {
    return (amount / 1000).toFixed(0) + "k";
  }
  return amount?.toString() || "0";
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Chào buổi sáng";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
};

// ==================== API CALLS ====================
const fetchOrderStatistics = async () => {
  try {
    const res = await api.get("/orders/statistics");
    return res.data?.data || res.data;
  } catch (e) {
    console.error("Error fetching order statistics:", e);
    return null;
  }
};

const fetchRecentOrders = async () => {
  try {
    const res = await api.get("/orders/admin?page=1&limit=10");
    const data = res.data?.data || res.data;
    return data?.orders || [];
  } catch (e) {
    console.error("Error fetching recent orders:", e);
    return [];
  }
};

const fetchProducts = async () => {
  try {
    const res = await api.get("/products?limit=100");
    const data = res.data?.data || res.data;
    return data?.data || data || [];
  } catch (e) {
    console.error("Error fetching products:", e);
    return [];
  }
};

const fetchTopProducts = async () => {
  try {
    const res = await api.get("/products/top?limit=5");
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Error fetching top products:", e);
    return [];
  }
};

const fetchUsers = async () => {
  try {
    const res = await api.get("/users?limit=1000");
    const data = res.data?.data || res.data;
    return data?.users || [];
  } catch (e) {
    console.error("Error fetching users:", e);
    return [];
  }
};

const fetchCategories = async () => {
  try {
    const res = await api.get("/categories");
    const data = res.data?.data || res.data;
    return data?.data || data || [];
  } catch (e) {
    console.error("Error fetching categories:", e);
    return [];
  }
};

const fetchBrands = async () => {
  try {
    const res = await api.get("/brands");
    const data = res.data?.data || res.data;
    return data?.data || data || [];
  } catch (e) {
    console.error("Error fetching brands:", e);
    return [];
  }
};

const fetchReviews = async () => {
  try {
    const res = await api.get("/reviews?limit=1000");
    const data = res.data?.data || res.data;
    return data?.data || data || [];
  } catch (e) {
    console.error("Error fetching reviews:", e);
    return [];
  }
};

// ==================== RENDER FUNCTIONS ====================
const renderGreeting = () => {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const greetingEl = document.getElementById("greeting-text");
  const subtextEl = document.getElementById("greeting-subtext");

  if (greetingEl) {
    greetingEl.textContent = `${getGreeting()}, ${user.fullname || "Admin"}!`;
  }
  if (subtextEl) {
    const today = new Date().toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    subtextEl.textContent = `Hôm nay là ${today}`;
  }
};

const renderStatistics = (
  stats,
  products,
  users,
  categories,
  brands,
  reviews
) => {
  // Revenue
  const revenueEl = document.getElementById("stat-revenue");
  if (revenueEl && stats) {
    revenueEl.textContent = formatCurrency(stats.total_revenue || 0);
  }

  // Orders
  const ordersEl = document.getElementById("stat-orders");
  const ordersPendingEl = document.getElementById("stat-orders-pending");
  if (ordersEl && stats?.status_stats) {
    const totalOrders = Object.values(stats.status_stats).reduce(
      (sum, count) => sum + parseInt(count || 0),
      0
    );
    ordersEl.textContent = totalOrders;
  }
  if (ordersPendingEl && stats?.status_stats) {
    ordersPendingEl.querySelector("span").textContent =
      stats.status_stats.pending || 0;
  }

  // Products
  const productsEl = document.getElementById("stat-products");
  const productsActiveEl = document.getElementById("stat-products-active");
  if (productsEl) {
    productsEl.textContent = products.length;
  }
  if (productsActiveEl) {
    const activeProducts = products.filter(
      (p) => p.status === 1 || p.status === "1"
    ).length;
    productsActiveEl.querySelector("span").textContent = activeProducts;
  }

  // Users
  const usersEl = document.getElementById("stat-users");
  const usersNewEl = document.getElementById("stat-users-new");
  if (usersEl) {
    usersEl.textContent = users.length;
  }
  if (usersNewEl) {
    // Count users created this month
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const newUsers = users.filter((u) => {
      const created = new Date(u.created_at);
      return (
        created.getMonth() === thisMonth && created.getFullYear() === thisYear
      );
    }).length;
    usersNewEl.querySelector("span").textContent = newUsers;
  }

  // Categories, Brands, Reviews
  const categoriesEl = document.getElementById("stat-categories");
  const brandsEl = document.getElementById("stat-brands");
  const reviewsEl = document.getElementById("stat-reviews");

  if (categoriesEl) categoriesEl.textContent = categories.length;
  if (brandsEl) brandsEl.textContent = brands.length;
  if (reviewsEl) reviewsEl.textContent = reviews.length;
};

const renderRecentOrders = (orders) => {
  const tbody = document.getElementById("recent-orders-tbody");
  if (!tbody) return;

  if (!orders.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-4 text-muted">
          Chưa có đơn hàng nào
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = orders
    .map((order) => {
      const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
      const address = order.address || {};
      const customerName =
        order.user_name || address.receiver_name || address.name || "N/A";
      const orderLink = `/src/pages/admin/orders.html?orderId=${order.id}`;

      return `
      <tr class="recent-order-item" style="cursor: pointer;" onclick="window.location.href='${orderLink}'">
        <td class="ps-4">
          <a href="${orderLink}" class="text-primary fw-semibold" onclick="event.stopPropagation()">#${
            order.id
          }</a>
        </td>
        <td>
          <a href="${orderLink}" class="text-dark text-decoration-none" onclick="event.stopPropagation()">${customerName}</a>
        </td>
        <td class="fw-semibold">
          <a href="${orderLink}" class="text-dark text-decoration-none" onclick="event.stopPropagation()">${formatCurrency(order.total)}</a>
        </td>
        <td>
          <span class="badge ${statusConfig.bgClass}">
            <span class="status-dot" style="background-color: ${
              statusConfig.color
            }"></span>
            ${statusConfig.label}
          </span>
        </td>
        <td class="text-muted">
          <a href="${orderLink}" class="text-muted text-decoration-none" onclick="event.stopPropagation()">${formatDate(order.created_at)}</a>
        </td>
      </tr>
    `;
    })
    .join("");
};

const renderTopProducts = (products) => {
  const container = document.getElementById("top-products-container");
  if (!container) return;

  // Products đã được sắp xếp theo sold DESC từ API /products/top
  const topProducts = products.slice(0, 5);

  if (!topProducts.length) {
    container.innerHTML = `
      <p class="text-center text-muted py-4">Chưa có sản phẩm nào</p>
    `;
    return;
  }

  container.innerHTML = topProducts
    .map((product, index) => {
      const thumbnail = product.thumbnail;
      let imageUrl = "https://placehold.co/50x50?text=No+Image";

      if (thumbnail) {
        if (Array.isArray(thumbnail) && thumbnail.length > 0) {
          imageUrl = getImageUrl(thumbnail[0]);
        } else if (typeof thumbnail === "string") {
          try {
            const parsed = JSON.parse(thumbnail);
            if (Array.isArray(parsed) && parsed.length > 0) {
              imageUrl = getImageUrl(parsed[0]);
            }
          } catch {
            imageUrl = getImageUrl(thumbnail);
          }
        }
      }

      return `
      <div class="top-product-item d-flex align-items-center gap-3">
        <img 
          src="${imageUrl}" 
          alt="${product.name}" 
          class="rounded"
          style="width: 50px; height: 50px; object-fit: cover;"
          onerror="this.src='https://placehold.co/50x50?text=No+Image'"
        />
        <div class="flex-grow-1">
          <h6 class="mb-0 fs-3 fw-semibold text-truncate" style="max-width: 180px;" title="${
            product.name
          }">
            ${product.name}
          </h6>
          <small class="text-muted">${product.brand_name || "-"}</small>
        </div>
        <div class="text-end">
          <div class="d-flex flex-column align-items-end">
            <span class="fw-semibold text-primary">${formatShortCurrency(
              product.min_price || product.price || 0
            )}</span>
            <small class="text-muted">Đã bán: ${product.sold || 0}</small>
          </div>
        </div>
      </div>
    `;
    })
    .join("");
};

// ==================== CHARTS ====================
const renderRevenueChart = (monthlyStats, period = 12) => {
  const ctx = document.getElementById("revenueChart");
  if (!ctx) return;

  // Destroy existing chart
  if (state.revenueChart) {
    state.revenueChart.destroy();
  }

  // Prepare data
  const labels = [];
  const revenueData = [];
  const orderCountData = [];

  // Generate labels based on period
  const now = new Date();
  for (let i = period - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;
    labels.push(
      date.toLocaleDateString("vi-VN", { month: "short", year: "2-digit" })
    );

    // Find matching data
    const monthData = monthlyStats?.find((m) => m.month === monthKey);
    revenueData.push(monthData ? parseFloat(monthData.revenue) : 0);
    orderCountData.push(monthData ? parseInt(monthData.order_count) : 0);
  }

  state.revenueChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Doanh thu",
          data: revenueData,
          backgroundColor: "rgba(54, 162, 235, 0.8)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
          borderRadius: 6,
          yAxisID: "y",
        },
        {
          label: "Số đơn",
          data: orderCountData,
          type: "line",
          borderColor: "rgba(255, 99, 132, 1)",
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: false,
          yAxisID: "y1",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          position: "top",
          labels: {
            usePointStyle: true,
            padding: 20,
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              if (context.dataset.label === "Doanh thu") {
                return `Doanh thu: ${formatCurrency(context.raw)}`;
              }
              return `Số đơn: ${context.raw}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
        },
        y: {
          type: "linear",
          display: true,
          position: "left",
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return formatShortCurrency(value);
            },
          },
          grid: {
            color: "rgba(0, 0, 0, 0.05)",
          },
        },
        y1: {
          type: "linear",
          display: true,
          position: "right",
          beginAtZero: true,
          grid: {
            drawOnChartArea: false,
          },
        },
      },
    },
  });
};

const renderOrderStatusChart = (statusStats) => {
  const ctx = document.getElementById("orderStatusChart");
  if (!ctx) return;

  // Destroy existing chart
  if (state.orderStatusChart) {
    state.orderStatusChart.destroy();
  }

  const labels = [];
  const data = [];
  const colors = [];

  Object.entries(STATUS_CONFIG).forEach(([key, config]) => {
    const count = parseInt(statusStats?.[key] || 0);
    if (count > 0) {
      labels.push(config.label);
      data.push(count);
      colors.push(config.color);
    }
  });

  // If no data, show placeholder
  if (data.length === 0) {
    labels.push("Chưa có dữ liệu");
    data.push(1);
    colors.push("#e9ecef");
  }

  state.orderStatusChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "65%",
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.raw / total) * 100).toFixed(1);
              return `${context.label}: ${context.raw} (${percentage}%)`;
            },
          },
        },
      },
    },
  });

  // Render custom legend
  const legendContainer = document.getElementById("order-status-legend");
  if (legendContainer) {
    legendContainer.innerHTML = labels
      .map(
        (label, i) => `
      <div class="d-flex align-items-center justify-content-between mb-2">
        <div class="d-flex align-items-center">
          <span class="status-dot" style="background-color: ${colors[i]}"></span>
          <span class="fs-3">${label}</span>
        </div>
        <span class="fw-semibold">${data[i]}</span>
      </div>
    `
      )
      .join("");
  }
};

// ==================== ERROR HANDLER ====================
const handleError = (e) => {
  console.error("Dashboard Error:", e);
  if (e.response?.status === 401) {
    Toast.fire({ icon: "error", title: "Phiên đăng nhập hết hạn" });
    localStorage.clear();
    location.href = "/src/pages/client/login.html";
  }
};

// ==================== INIT ====================
const init = async () => {
  try {
    // Render greeting immediately
    renderGreeting();

    // Fetch all data in parallel
    const [
      orderStats,
      recentOrders,
      products,
      topProducts,
      users,
      categories,
      brands,
      reviews,
    ] = await Promise.all([
      fetchOrderStatistics(),
      fetchRecentOrders(),
      fetchProducts(),
      fetchTopProducts(),
      fetchUsers(),
      fetchCategories(),
      fetchBrands(),
      fetchReviews(),
    ]);

    // Store in state
    state.statistics = orderStats;
    state.recentOrders = recentOrders;
    state.topProducts = topProducts;

    // Render all components
    renderStatistics(orderStats, products, users, categories, brands, reviews);
    renderRecentOrders(recentOrders);
    renderTopProducts(topProducts);
    renderRevenueChart(orderStats?.monthly_stats || [], state.revenuePeriod);
    renderOrderStatusChart(orderStats?.status_stats || {});

    // Setup period filter event listeners
    setupRevenuePeriodFilter();
  } catch (e) {
    handleError(e);
  }
};

// ==================== PERIOD FILTER ====================
const setupRevenuePeriodFilter = () => {
  // Find dropdown items within the revenue chart card
  const revenueChartCard = document.querySelector('#revenueChart')?.closest('.card');
  const dropdownItems = revenueChartCard?.querySelectorAll('[data-period]') || [];
  const dropdownButton = revenueChartCard?.querySelector(
    '.dropdown-toggle[data-bs-toggle="dropdown"]'
  );

  dropdownItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const period = parseInt(item.getAttribute("data-period"));
      state.revenuePeriod = period;

      // Update button text
      if (dropdownButton) {
        dropdownButton.innerHTML = `
          <i class="ti ti-calendar me-1"></i> ${period} tháng
        `;
      }

      // Re-render chart with new period using latest data from state
      const monthlyStats = state.statistics?.monthly_stats || [];
      renderRevenueChart(monthlyStats, period);
    });
  });
};

// Start when DOM is ready
document.addEventListener("DOMContentLoaded", init);

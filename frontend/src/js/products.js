import api, { getImageUrl } from '../services/api.js';
import { ProductCard } from '../components/ProductCard.js';

let allProducts = [];
let state = {
  filtered: [],
  currentPage: 1,
  itemsPerPage: 9,
  sort: 'default',
  filters: {
    category: [],
    brand: [],
    minPrice: null,
    maxPrice: null,
  },
};

// --- 1. GỌI API ---
const initProductsPage = async () => {
  try {
    const res = await api.get('/products');

    console.log('API Response:', res.data); // Debug xem data trả về gì

    let rawData = [];

    // FIX LỖI: Kiểm tra cấu trúc lồng nhau của API (res.data -> data -> data)
    if (res.data && res.data.data && Array.isArray(res.data.data.data)) {
      rawData = res.data.data.data; // Cấu trúc Pagination của Laravel/PHP
    } else if (res.data && Array.isArray(res.data.data)) {
      rawData = res.data.data;
    } else if (Array.isArray(res.data)) {
      rawData = res.data;
    }

    if (rawData.length === 0) {
      console.warn('Không tìm thấy sản phẩm nào trong API');
    }

    // Chuẩn hóa dữ liệu
    allProducts = rawData.map((p) => ({
      id: p.id,
      name: p.name,
      // Ưu tiên price_sale nếu có, nếu không dùng price
      price: Number(p.price_sale || p.price || 0),
      // Nếu có giá gốc cao hơn giá bán thì hiển thị
      originalPrice: p.price && p.price > p.price_sale ? Number(p.price) : null,

      image: getImageUrl(p.image), // Xử lý ảnh

      // Map Category & Brand (Tạm thời map ID nếu API chưa trả về tên)
      // Bạn cần bảo Backend join bảng để trả về "category_name", hiện tại đang trả về ID
      category: p.category_name || (p.category_id == 9 ? 'Nam' : 'Nữ'),
      brand: p.brand_name || (p.brand_id == 1 ? 'Rolex' : 'Khác'),
    }));

    // Xử lý Search từ URL
    const params = new URLSearchParams(window.location.search);
    const keyword = params.get('search');

    if (keyword) {
      state.filtered = allProducts.filter((p) =>
        p.name.toLowerCase().includes(keyword.toLowerCase())
      );
      const breadcrumb = document.getElementById('breadcrumb-name');
      if (breadcrumb) breadcrumb.textContent = `Tìm kiếm: "${keyword}"`;
    } else {
      state.filtered = [...allProducts];
    }

    applyFiltersAndSort();
  } catch (error) {
    console.error('Lỗi API Products:', error);
    const grid = document.getElementById('product-grid');
    if (grid)
      grid.innerHTML = `<p class="col-span-full text-center text-red-500">Lỗi tải dữ liệu: ${error.message}</p>`;
  }
};

// --- 2. LỌC & SẮP XẾP ---
const applyFiltersAndSort = () => {
  let result = [...allProducts];

  if (state.filters.category.length > 0) {
    result = result.filter((p) => state.filters.category.includes(p.category));
  }
  if (state.filters.brand.length > 0) {
    result = result.filter((p) => state.filters.brand.includes(p.brand));
  }
  if (state.filters.minPrice)
    result = result.filter((p) => p.price >= state.filters.minPrice);
  if (state.filters.maxPrice)
    result = result.filter((p) => p.price <= state.filters.maxPrice);

  if (state.sort === 'price-asc') result.sort((a, b) => a.price - b.price);
  if (state.sort === 'price-desc') result.sort((a, b) => b.price - a.price);
  if (state.sort === 'name-asc')
    result.sort((a, b) => a.name.localeCompare(b.name));

  state.filtered = result;
  state.currentPage = 1;
  render();
};

// --- 3. RENDER UI ---
const render = () => {
  const grid = document.getElementById('product-grid');
  const showingCount = document.getElementById('showing-count');
  const pagination = document.getElementById('pagination');

  if (!grid) return;

  if (showingCount) showingCount.textContent = state.filtered.length;

  if (state.filtered.length === 0) {
    grid.innerHTML =
      '<div class="col-span-full py-20 text-center text-gray-500">Không tìm thấy sản phẩm nào.</div>';
    if (pagination) pagination.innerHTML = '';
    return;
  }

  const start = (state.currentPage - 1) * state.itemsPerPage;
  const end = start + state.itemsPerPage;
  const pageData = state.filtered.slice(start, end);

  grid.innerHTML = pageData.map((p) => ProductCard(p)).join('');
  renderPagination(pagination);
};

const renderPagination = (container) => {
  if (!container) return;
  const totalPages = Math.ceil(state.filtered.length / state.itemsPerPage);

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';
  for (let i = 1; i <= totalPages; i++) {
    const activeClass =
      i === state.currentPage
        ? 'bg-[#0A2A45] text-white border-[#0A2A45]'
        : 'bg-white dark:bg-slate-800 border-gray-200 hover:bg-gray-100';

    html += `<button onclick="changePage(${i})" class="px-4 py-2 border rounded mx-1 transition-colors ${activeClass}">${i}</button>`;
  }
  container.innerHTML = html;
};

// --- EVENTS ---
document
  .querySelectorAll('input[name="category"], input[name="brand"]')
  .forEach((input) => {
    input.addEventListener('change', () => {
      state.filters.category = Array.from(
        document.querySelectorAll('input[name="category"]:checked')
      ).map((cb) => cb.value);
      state.filters.brand = Array.from(
        document.querySelectorAll('input[name="brand"]:checked')
      ).map((cb) => cb.value);
      applyFiltersAndSort();
    });
  });

const btnPrice = document.getElementById('btn-apply-price');
if (btnPrice) {
  btnPrice.addEventListener('click', () => {
    const min = document.getElementById('price-min').value;
    const max = document.getElementById('price-max').value;
    state.filters.minPrice = min ? Number(min) : null;
    state.filters.maxPrice = max ? Number(max) : null;
    applyFiltersAndSort();
  });
}

const sortSelect = document.getElementById('sort-select');
if (sortSelect) {
  sortSelect.addEventListener('change', (e) => {
    state.sort = e.target.value;
    applyFiltersAndSort();
  });
}

window.changePage = (page) => {
  state.currentPage = page;
  render();
  document
    .getElementById('product-grid')
    .scrollIntoView({ behavior: 'smooth', block: 'start' });
};

document.addEventListener('DOMContentLoaded', initProductsPage);

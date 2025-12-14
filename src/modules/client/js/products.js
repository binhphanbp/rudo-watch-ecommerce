import api from '../../../shared/services/api.js';
import { ProductCard } from '../components/ProductCard.js';
import Swal from '../../../shared/utils/swal.js';

const state = {
  products: [],
  brands: [],
  categories: [],
  currentPage: 1,
  itemsPerPage: 12,
  totalPages: 1,
  totalProducts: 0,
  filters: {
    categoryId: null,
    brandId: null,
    minPrice: null,
    maxPrice: null,
    search: null,
  },
  sort: 'default',
  loading: false,
};

const initProductsPage = async () => {
  const params = new URLSearchParams(window.location.search);
  const categoryId = params.get('category');
  const brandId = params.get('brand');
  const search = params.get('search');

  if (categoryId) state.filters.categoryId = parseInt(categoryId);
  if (brandId) state.filters.brandId = parseInt(brandId);
  if (search) state.filters.search = search;

  await loadBrands();
  await loadCategories();
  await loadProducts();
  setupEventListeners();
};

const loadBrands = async () => {
  try {
    const res = await api.get('/brands/active');
    console.log('Brands Response:', res.data);

    // API structure: { status, data: { success, data: [...] } }
    if (
      res.data &&
      res.data.data &&
      res.data.data.data &&
      Array.isArray(res.data.data.data)
    ) {
      state.brands = res.data.data.data;
    } else if (res.data && res.data.data && Array.isArray(res.data.data)) {
      state.brands = res.data.data;
    } else {
      state.brands = [];
    }

    console.log('State Brands:', state.brands);
    renderBrands();
  } catch (error) {
    console.error('Lỗi load brands:', error);
  }
};

const loadCategories = async () => {
  try {
    const res = await api.get('/categories/active');
    console.log('Categories Response:', res.data);

    // API structure: { status, data: { success, data: [...] } }
    if (
      res.data &&
      res.data.data &&
      res.data.data.data &&
      Array.isArray(res.data.data.data)
    ) {
      state.categories = res.data.data.data;
    } else if (res.data && res.data.data && Array.isArray(res.data.data)) {
      state.categories = res.data.data;
    } else {
      state.categories = [];
    }

    console.log('State Categories:', state.categories);
    renderCategories();
  } catch (error) {
    console.error('Lỗi load categories:', error);
  }
};

const loadProducts = async () => {
  try {
    state.loading = true;
    showSkeleton();

    const params = new URLSearchParams();
    params.append('page', 1);
    params.append('limit', 100);

    // Only search works on backend
    if (state.filters.search) params.append('search', state.filters.search);

    const res = await api.get(`/products?${params.toString()}`);
    console.log('Products API Response:', res.data);

    let allProducts = [];
    if (
      res.data &&
      res.data.data &&
      res.data.data.data &&
      Array.isArray(res.data.data.data)
    ) {
      allProducts = res.data.data.data;
    } else if (res.data && res.data.data && Array.isArray(res.data.data)) {
      allProducts = res.data.data;
    } else if (Array.isArray(res.data)) {
      allProducts = res.data;
    }
    let filteredProducts = allProducts;
    if (state.filters.categoryId) {
      filteredProducts = filteredProducts.filter(
        (p) => parseInt(p.category_id) === state.filters.categoryId
      );
    }
    if (state.filters.brandId) {
      filteredProducts = filteredProducts.filter(
        (p) => parseInt(p.brand_id) === state.filters.brandId
      );
    }
    if (state.filters.minPrice || state.filters.maxPrice) {
      filteredProducts = filteredProducts.filter((p) => {
        const variants = p.variants || [];
        if (variants.length === 0) return false;

        const prices = variants.map((v) => parseFloat(v.price));
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        if (
          state.filters.minPrice &&
          maxPrice < parseFloat(state.filters.minPrice)
        )
          return false;
        if (
          state.filters.maxPrice &&
          minPrice > parseFloat(state.filters.maxPrice)
        )
          return false;

        return true;
      });
    }

    // CLIENT-SIDE SORTING
    if (state.sort === 'price-asc') {
      filteredProducts.sort((a, b) => {
        const priceA = a.variants?.[0]?.price
          ? parseFloat(a.variants[0].price)
          : 0;
        const priceB = b.variants?.[0]?.price
          ? parseFloat(b.variants[0].price)
          : 0;
        return priceA - priceB;
      });
    } else if (state.sort === 'price-desc') {
      filteredProducts.sort((a, b) => {
        const priceA = a.variants?.[0]?.price
          ? parseFloat(a.variants[0].price)
          : 0;
        const priceB = b.variants?.[0]?.price
          ? parseFloat(b.variants[0].price)
          : 0;
        return priceB - priceA;
      });
    } else if (state.sort === 'name-asc') {
      filteredProducts.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    } else if (state.sort === 'newest') {
      filteredProducts.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
    }
    const total = filteredProducts.length;
    state.totalProducts = total;
    state.totalPages = Math.ceil(total / state.itemsPerPage);

    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    state.products = filteredProducts.slice(startIndex, endIndex);

    console.log('Filtered products:', filteredProducts.length);
    console.log('Showing products:', state.products.length);

    renderProducts();
    renderPagination();
    updateShowingCount();
    updateBreadcrumb();

    state.loading = false;
  } catch (error) {
    console.error('Lỗi load products:', error);
    state.loading = false;
    hideSkeleton();
    showError('Không thể tải danh sách sản phẩm');
  }
};

const renderBrands = () => {
  const container = document.getElementById('brand-filter');
  if (!container) return;

  if (!state.brands || state.brands.length === 0) {
    container.innerHTML =
      '<p class="text-sm text-gray-400 italic">Chưa có thương hiệu</p>';
    return;
  }

  container.innerHTML = state.brands
    .map(
      (brand) => `
    <label class="flex items-center gap-3 cursor-pointer group">
      <input type="checkbox" name="brand" value="${brand.id}" 
        ${state.filters.brandId === brand.id ? 'checked' : ''}
        class="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
      <span class="group-hover:text-blue-500 transition-colors">${
        brand.name
      }</span>
    </label>
  `
    )
    .join('');
};

const renderCategories = () => {
  const container = document.getElementById('category-filter');
  if (!container) return;

  if (!state.categories || state.categories.length === 0) {
    container.innerHTML =
      '<p class="text-sm text-gray-400 italic">Chưa có danh mục</p>';
    return;
  }

  container.innerHTML = state.categories
    .map(
      (cat) => `
    <label class="flex items-center gap-3 cursor-pointer group">
      <input type="checkbox" name="category" value="${cat.id}"
        ${state.filters.categoryId === cat.id ? 'checked' : ''}
        class="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
      <span class="group-hover:text-blue-500 transition-colors">${
        cat.name
      }</span>
    </label>
  `
    )
    .join('');
};

const renderProducts = () => {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  hideSkeleton();

  if (state.products.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-20 text-center">
        <svg class="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
        </svg>
        <p class="text-xl font-medium text-gray-500 mb-2">Không tìm thấy sản phẩm</p>
        <p class="text-sm text-gray-400">Thử điều chỉnh bộ lọc hoặc tìm kiếm khác</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = state.products.map((p) => ProductCard(p)).join('');
  grid.style.display = 'grid';
};

const renderPagination = () => {
  const container = document.getElementById('pagination');
  if (!container || state.totalPages <= 1) {
    if (container) container.innerHTML = '';
    return;
  }

  let html = '';

  if (state.currentPage > 1) {
    html += `<button onclick="changePage(${state.currentPage - 1})" 
      class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
      </svg>
    </button>`;
  }

  const maxVisible = 5;
  let startPage = Math.max(1, state.currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(state.totalPages, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  if (startPage > 1) {
    html += `<button onclick="changePage(1)" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">1</button>`;
    if (startPage > 2) html += `<span class="px-2 text-gray-400">...</span>`;
  }

  for (let i = startPage; i <= endPage; i++) {
    const activeClass =
      i === state.currentPage
        ? 'bg-[#0A2A45] text-white border-[#0A2A45]'
        : 'bg-white border-gray-300 hover:bg-gray-100';
    html += `<button onclick="changePage(${i})" class="px-4 py-2 border rounded-lg transition-colors ${activeClass}">${i}</button>`;
  }

  if (endPage < state.totalPages) {
    if (endPage < state.totalPages - 1)
      html += `<span class="px-2 text-gray-400">...</span>`;
    html += `<button onclick="changePage(${state.totalPages})" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">${state.totalPages}</button>`;
  }

  if (state.currentPage < state.totalPages) {
    html += `<button onclick="changePage(${state.currentPage + 1})" 
      class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
      </svg>
    </button>`;
  }

  container.innerHTML = html;
};

const updateShowingCount = () => {
  const el = document.getElementById('showing-count');
  if (el) {
    const start = (state.currentPage - 1) * state.itemsPerPage + 1;
    const end = Math.min(
      state.currentPage * state.itemsPerPage,
      state.totalProducts
    );
    el.textContent = `Hiển thị ${start}-${end} trong tổng số ${state.totalProducts} sản phẩm`;
  }
};

const updateBreadcrumb = () => {
  const breadcrumb = document.getElementById('breadcrumb-name');
  if (!breadcrumb) return;

  if (state.filters.search) {
    breadcrumb.textContent = `Tìm kiếm: "${state.filters.search}"`;
  } else if (state.filters.categoryId) {
    const cat = state.categories.find((c) => c.id === state.filters.categoryId);
    breadcrumb.textContent = cat ? cat.name : 'Danh mục';
  } else if (state.filters.brandId) {
    const brand = state.brands.find((b) => b.id === state.filters.brandId);
    breadcrumb.textContent = brand ? brand.name : 'Thương hiệu';
  } else {
    breadcrumb.textContent = 'Tất cả sản phẩm';
  }
};

const showSkeleton = () => {
  const skeleton = document.getElementById('product-skeleton');
  const grid = document.getElementById('product-grid');
  if (skeleton) skeleton.style.display = 'grid';
  if (grid) grid.style.display = 'none';
};

const hideSkeleton = () => {
  const skeleton = document.getElementById('product-skeleton');
  const grid = document.getElementById('product-grid');
  if (skeleton) skeleton.style.display = 'none';
  if (grid) grid.style.display = 'grid';
};

const showError = (message) => {
  const grid = document.getElementById('product-grid');
  if (grid) {
    grid.innerHTML = `<div class="col-span-full py-20 text-center text-red-500">
      <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <p class="text-lg font-medium">${message}</p>
    </div>`;
  }
};

const setupEventListeners = () => {
  // Category & Brand filters with toggle
  document.addEventListener('change', (e) => {
    if (e.target.name === 'category') {
      const value = parseInt(e.target.value);

      // Toggle: if already selected, uncheck it
      if (state.filters.categoryId === value) {
        e.target.checked = false;
        state.filters.categoryId = null;
      } else {
        // Uncheck all others and set new filter
        document
          .querySelectorAll('input[name="category"]')
          .forEach((cb) => (cb.checked = false));
        e.target.checked = true;
        state.filters.categoryId = value;
      }

      state.currentPage = 1;
      loadProducts();
    }

    if (e.target.name === 'brand') {
      const value = parseInt(e.target.value);

      // Toggle: if already selected, uncheck it
      if (state.filters.brandId === value) {
        e.target.checked = false;
        state.filters.brandId = null;
      } else {
        // Uncheck all others and set new filter
        document
          .querySelectorAll('input[name="brand"]')
          .forEach((cb) => (cb.checked = false));
        e.target.checked = true;
        state.filters.brandId = value;
      }

      state.currentPage = 1;
      loadProducts();
    }
  });

  const btnApplyPrice = document.getElementById('btn-apply-price');
  if (btnApplyPrice) {
    btnApplyPrice.addEventListener('click', () => {
      const min = document.getElementById('price-min')?.value;
      const max = document.getElementById('price-max')?.value;

      if (min && max && Number(min) > Number(max)) {
        Swal.fire({
          icon: 'warning',
          title: 'Giá không hợp lệ',
          text: 'Giá tối thiểu phải nhỏ hơn giá tối đa',
        });
        return;
      }

      state.filters.minPrice = min ? Number(min) : null;
      state.filters.maxPrice = max ? Number(max) : null;
      state.currentPage = 1;
      loadProducts();
    });
  }

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      state.sort = e.target.value;
      state.currentPage = 1;
      loadProducts();
    });
  }

  const btnClearFilters = document.getElementById('btn-clear-filters');
  if (btnClearFilters) {
    btnClearFilters.addEventListener('click', () => {
      // Uncheck all checkboxes
      document
        .querySelectorAll('input[name="category"]')
        .forEach((cb) => (cb.checked = false));
      document
        .querySelectorAll('input[name="brand"]')
        .forEach((cb) => (cb.checked = false));

      // Clear inputs
      const minInput = document.getElementById('price-min');
      const maxInput = document.getElementById('price-max');
      if (minInput) minInput.value = '';
      if (maxInput) maxInput.value = '';

      const sortSelect = document.getElementById('sort-select');
      if (sortSelect) sortSelect.value = 'default';

      // Reset state
      state.filters = {
        categoryId: null,
        brandId: null,
        minPrice: null,
        maxPrice: null,
        search: null,
      };
      state.sort = 'default';
      state.currentPage = 1;

      // Clear URL params
      window.history.pushState({}, '', window.location.pathname);

      // Reload products
      loadProducts();
    });
  }
};

window.changePage = (page) => {
  state.currentPage = page;
  loadProducts();
  document
    .getElementById('product-grid')
    ?.scrollIntoView({ behavior: 'smooth' });
};

document.addEventListener('DOMContentLoaded', initProductsPage);

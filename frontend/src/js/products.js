import { ProductCard } from '../components/ProductCard.js';

// Mock data (Để test phân trang)
const allProducts = [
  {
    id: 1,
    name: 'Rolex Yacht-Master 40',
    brand: 'Rolex',
    category: 'Nam',
    price: 35250000,
    image: '/images/products/rolex-yacht.png',
    colors: ['#E5E7EB', '#F59E0B'],
  },
  {
    id: 2,
    name: 'Hublot Big Bang Unico',
    brand: 'Hublot',
    category: 'Nam',
    price: 45000000,
    image: '/images/products/hublot-bigbang.png',
    colors: ['#000000'],
  },
  {
    id: 3,
    name: 'Apple Watch Ultra 2',
    brand: 'Apple',
    category: 'Smartwatch',
    price: 21990000,
    image:
      'https://store.storeimages.cdn-apple.com/8756/as-images.apple.com/is/watch-ultra2-titanium-orange-ocean-band-select-202309?wid=800&hei=800&fmt=png-alpha',
    colors: ['#F97316'],
  },
  {
    id: 4,
    name: 'Tissot PRX Powermatic 80',
    brand: 'Tissot',
    category: 'Nam',
    price: 18000000,
    image:
      'https://www.tissotwatches.com/media/catalog/product/t/1/t137_407_11_041_00_1.png?im=Resize=(800,800)',
    colors: ['#1E3A8A'],
  },
  {
    id: 5,
    name: 'Cartier Tank Must',
    brand: 'Cartier',
    category: 'Nữ',
    price: 85000000,
    image:
      'https://www.cartier.com/dw/image/v2/BGTJ_PRD/on/demandware.static/-/Sites-cartier-master/default/dw123456/images/large/wsta0041_tank_must.png',
    colors: ['#000000'],
  },
  {
    id: 6,
    name: 'Omega Seamaster Diver',
    brand: 'Omega',
    category: 'Nam',
    price: 135000000,
    image:
      'https://www.omegawatches.com/media/catalog/product/cache/a5c37fddc1a529a1a44fea55d527b9a1/2/1/21030422003001-small.png',
    colors: ['#1D4ED8'],
  },
  {
    id: 7,
    name: 'Xiaomi Watch S3',
    brand: 'Xiaomi',
    category: 'Smartwatch',
    price: 3690000,
    image:
      'https://i01.appmifile.com/v1/MI_18455B3E4DA706226CF7535A58E875F0267/pms_1698307639.51658428.png',
    colors: ['#000000'],
  },
  {
    id: 8,
    name: 'Apple Watch SE 2',
    brand: 'Apple',
    category: 'Smartwatch',
    price: 6500000,
    image:
      'https://store.storeimages.cdn-apple.com/8756/as-images.apple.com/is/watch-se-aluminum-starlight-sport-band-starlight-select-202309?wid=800&hei=800&fmt=png-alpha',
    colors: ['#F3E8D6'],
  },
  {
    id: 9,
    name: 'Rolex Datejust 36',
    brand: 'Rolex',
    category: 'Nữ',
    price: 250000000,
    image:
      'https://content.rolex.com/dam/2022/up-close/datejust-36/datejust-36-m126234-0015.png?imwidth=800',
    colors: ['#D1D5DB'],
  },
  // ... Copy thêm nhiều sản phẩm nữa để test phân trang ...
  {
    id: 10,
    name: 'Tissot Gentleman',
    brand: 'Tissot',
    category: 'Nam',
    price: 21000000,
    image:
      'https://www.tissotwatches.com/media/catalog/product/t/1/t127_407_11_041_00.png',
    colors: ['#1E3A8A'],
  },
];

// Trạng thái hiện tại của trang
let state = {
  products: allProducts,
  filteredProducts: [],
  currentPage: 1,
  itemsPerPage: 6,
  filters: {
    category: [],
    brand: [],
    minPrice: null,
    maxPrice: null,
  },
  sort: 'default',
};

// HÀM CORE: LỌC & SẮP XẾP
function applyFiltersAndSort() {
  let result = [...state.products];

  // FILTER
  // Category
  if (state.filters.category.length > 0) {
    result = result.filter((p) => state.filters.category.includes(p.category));
  }
  // Brand
  if (state.filters.brand.length > 0) {
    result = result.filter((p) => state.filters.brand.includes(p.brand));
  }
  // Price
  if (state.filters.minPrice) {
    result = result.filter((p) => p.price >= state.filters.minPrice);
  }
  if (state.filters.maxPrice) {
    result = result.filter((p) => p.price <= state.filters.maxPrice);
  }

  // SORT
  if (state.sort === 'price-asc') {
    result.sort((a, b) => a.price - b.price);
  } else if (state.sort === 'price-desc') {
    result.sort((a, b) => b.price - a.price);
  } else if (state.sort === 'name-asc') {
    result.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Cập nhật State
  state.filteredProducts = result;
  state.currentPage = 1; // Reset về trang 1 khi lọc
  render();
}

// === RENDER UI ===
function render() {
  const grid = document.getElementById('product-grid');
  const pagination = document.getElementById('pagination');
  const showingCount = document.getElementById('showing-count');
  const emptyState = document.getElementById('empty-state');

  // Cập nhật số lượng
  showingCount.textContent = state.filteredProducts.length;

  // Check rỗng
  if (state.filteredProducts.length === 0) {
    grid.innerHTML = '';
    emptyState.classList.remove('hidden');
    emptyState.classList.add('flex');
    pagination.innerHTML = '';
    return;
  }

  emptyState.classList.add('hidden');
  emptyState.classList.remove('flex');

  // PAGINATION
  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const endIndex = startIndex + state.itemsPerPage;
  const pageData = state.filteredProducts.slice(startIndex, endIndex);

  // Render Grid
  grid.innerHTML = pageData.map((product) => ProductCard(product)).join('');

  // Render Pagination Buttons
  const totalPages = Math.ceil(
    state.filteredProducts.length / state.itemsPerPage
  );
  let paginationHTML = '';

  if (totalPages > 1) {
    // Nút Prev
    paginationHTML += `
            <button onclick="changePage(${state.currentPage - 1})" 
                    class="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50"
                    ${state.currentPage === 1 ? 'disabled' : ''}>
                &laquo;
            </button>
        `;

    // Các nút số trang
    for (let i = 1; i <= totalPages; i++) {
      const activeClass =
        i === state.currentPage
          ? 'bg-[#0A2A45] text-white border-[#0A2A45]'
          : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700';

      paginationHTML += `
                <button onclick="changePage(${i})" class="px-4 py-2 border rounded transition-colors ${activeClass}">
                    ${i}
                </button>
            `;
    }

    // Nút Next
    paginationHTML += `
            <button onclick="changePage(${state.currentPage + 1})" 
                    class="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50"
                    ${state.currentPage === totalPages ? 'disabled' : ''}>
                &raquo;
            </button>
        `;
  }
  pagination.innerHTML = paginationHTML;
}

// === EVENT LISTENERS ===

// Checkbox Categories & Brands
document
  .querySelectorAll('input[name="category"], input[name="brand"]')
  .forEach((input) => {
    input.addEventListener('change', () => {
      // Lấy tất cả checkbox đã tick
      state.filters.category = Array.from(
        document.querySelectorAll('input[name="category"]:checked')
      ).map((cb) => cb.value);
      state.filters.brand = Array.from(
        document.querySelectorAll('input[name="brand"]:checked')
      ).map((cb) => cb.value);
      applyFiltersAndSort();
    });
  });

// Price Filter
document.getElementById('btn-apply-price').addEventListener('click', () => {
  const min = document.getElementById('price-min').value;
  const max = document.getElementById('price-max').value;
  state.filters.minPrice = min ? parseInt(min) : null;
  state.filters.maxPrice = max ? parseInt(max) : null;
  applyFiltersAndSort();
});

// Sort Dropdown
document.getElementById('sort-select').addEventListener('change', (e) => {
  state.sort = e.target.value;
  applyFiltersAndSort();
});

// Pagination Helper (Gán vào window để HTML gọi được onclick)
window.changePage = (page) => {
  state.currentPage = page;
  render();
  // Cuộn lên đầu lưới sản phẩm
  document
    .getElementById('product-grid')
    .scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// Mobile Filter Toggle
const sidebar = document.getElementById('filter-sidebar');
const overlay = document.getElementById('filter-overlay');
const btnFilter = document.getElementById('mobile-filter-btn');

const toggleSidebar = () => {
  // Thêm class fixed để hiện lên trên mobile
  sidebar.classList.toggle('hidden');
  sidebar.classList.toggle('fixed');
  sidebar.classList.toggle('inset-y-0');
  sidebar.classList.toggle('left-0');
  sidebar.classList.toggle('z-50');
  sidebar.classList.toggle('bg-white');
  sidebar.classList.toggle('dark:bg-slate-900');
  sidebar.classList.toggle('p-4');
  sidebar.classList.toggle('overflow-y-auto');
  sidebar.classList.toggle('w-3/4'); // Chiếm 3/4 màn hình
  overlay.classList.toggle('hidden');
};

if (btnFilter) {
  btnFilter.addEventListener('click', toggleSidebar);
  overlay.addEventListener('click', toggleSidebar);
}

document.addEventListener('DOMContentLoaded', () => {
  applyFiltersAndSort(); // Chạy lần đầu để render
});

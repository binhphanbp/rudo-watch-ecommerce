import api, { getImageUrl } from '../../../shared/services/api.js';

let allPosts = [];
let filteredPosts = [];
let currentCategory = 'all';
let currentPage = 1;
const postsPerPage = 9;

// Category names mapping
const categoryNames = {
  1: 'Tin tức đồng hồ',
  2: 'Kiến thức đồng hồ',
  3: 'Hướng dẫn sử dụng',
  4: 'Đánh giá sản phẩm',
};

// Fetch all posts from API
const fetchPosts = async () => {
  try {
    const res = await api.get('/posts');
    // API response structure: { status: 'success', statusCode: 200, data: [...] }
    allPosts = res.data?.data || [];
    filteredPosts = [...allPosts];
    renderPosts();
  } catch (error) {
    console.error('Error fetching posts:', error);
    showEmptyState();
  }
};

// Render posts with pagination
const renderPosts = () => {
  const loadingEl = document.getElementById('loading-state');
  const containerEl = document.getElementById('news-container');
  const featuredEl = document.getElementById('featured-post');
  const gridEl = document.getElementById('news-grid');
  const emptyEl = document.getElementById('empty-state');
  const paginationEl = document.getElementById('pagination');

  loadingEl.classList.add('hidden');
  containerEl.classList.remove('hidden');

  if (filteredPosts.length === 0) {
    featuredEl.innerHTML = '';
    gridEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    paginationEl.classList.add('hidden');
    return;
  }

  emptyEl.classList.add('hidden');

  // Calculate pagination
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const postsToShow = filteredPosts.slice(startIndex, endIndex);

  // Featured post (first post on first page)
  if (currentPage === 1 && postsToShow.length > 0) {
    const featured = postsToShow[0];
    featuredEl.innerHTML = `
      <a href="/news-detail.html?id=${featured.id}" class="group block">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all">
          <div class="relative aspect-video lg:aspect-auto overflow-hidden">
            <img 
              src="${getImageUrl(featured.image)}" 
              alt="${featured.name}"
              class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div class="absolute top-4 left-4 bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-bold">
              Nổi bật
            </div>
          </div>
          <div class="p-8 lg:p-12 flex flex-col justify-center">
            <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
              <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full font-medium">
                ${categoryNames[featured.post_category_id] || 'Tin tức'}
              </span>
              <span>•</span>
              <span>${formatDate(featured.created_at)}</span>
            </div>
            <h2 class="text-3xl lg:text-4xl font-bold mb-4 text-slate-900 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
              ${featured.name}
            </h2>
            <p class="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-6 line-clamp-3">
              ${stripHtml(featured.content)}
            </p>
            <div class="flex items-center gap-2 text-blue-500 font-bold group-hover:gap-4 transition-all">
              Đọc thêm
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
              </svg>
            </div>
          </div>
        </div>
      </a>
    `;
  } else {
    featuredEl.innerHTML = '';
  }

  // Grid posts (skip first if on page 1)
  const gridPosts = currentPage === 1 ? postsToShow.slice(1) : postsToShow;
  gridEl.innerHTML = gridPosts
    .map(
      (post) => `
    <a href="/news-detail.html?id=${post.id}" class="group block">
      <article class="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2">
        <div class="relative aspect-video overflow-hidden">
          <img 
            src="${getImageUrl(post.image)}" 
            alt="${post.name}"
            class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </div>
        <div class="p-6">
          <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
            <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full font-medium text-xs">
              ${categoryNames[post.post_category_id] || 'Tin tức'}
            </span>
            <span>•</span>
            <span class="text-xs">${formatDate(post.created_at)}</span>
          </div>
          <h3 class="text-xl font-bold mb-3 text-slate-900 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
            ${post.name}
          </h3>
          <p class="text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3 mb-4">
            ${stripHtml(post.content)}
          </p>
          <div class="flex items-center gap-2 text-blue-500 font-medium text-sm group-hover:gap-3 transition-all">
            Xem chi tiết
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>
        </div>
      </article>
    </a>
  `
    )
    .join('');

  // Render pagination
  if (totalPages > 1) {
    paginationEl.classList.remove('hidden');
    paginationEl.innerHTML = `
      <button 
        onclick="changePage(${currentPage - 1})"
        ${currentPage === 1 ? 'disabled' : ''}
        class="px-4 py-2 rounded-lg font-medium transition-all ${
          currentPage === 1
            ? 'bg-gray-200 dark:bg-slate-700 text-gray-400 cursor-not-allowed'
            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-blue-500 hover:text-white shadow-md'
        }"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
        </svg>
      </button>
      
      ${Array.from({ length: totalPages }, (_, i) => i + 1)
        .map(
          (page) => `
        <button 
          onclick="changePage(${page})"
          class="px-4 py-2 rounded-lg font-medium transition-all ${
            page === currentPage
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-blue-100 dark:hover:bg-slate-700'
          }"
        >
          ${page}
        </button>
      `
        )
        .join('')}
      
      <button 
        onclick="changePage(${currentPage + 1})"
        ${currentPage === totalPages ? 'disabled' : ''}
        class="px-4 py-2 rounded-lg font-medium transition-all ${
          currentPage === totalPages
            ? 'bg-gray-200 dark:bg-slate-700 text-gray-400 cursor-not-allowed'
            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-blue-500 hover:text-white shadow-md'
        }"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
        </svg>
      </button>
    `;
  } else {
    paginationEl.classList.add('hidden');
  }

  // Scroll to top on page change (except initial load)
  if (currentPage > 1) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

// Show empty state
const showEmptyState = () => {
  document.getElementById('loading-state').classList.add('hidden');
  document.getElementById('news-container').classList.remove('hidden');
  document.getElementById('featured-post').innerHTML = '';
  document.getElementById('news-grid').innerHTML = '';
  document.getElementById('empty-state').classList.remove('hidden');
  document.getElementById('pagination').classList.add('hidden');
};

// Filter by category
const filterByCategory = (category) => {
  currentCategory = category;
  currentPage = 1;

  if (category === 'all') {
    filteredPosts = [...allPosts];
  } else {
    filteredPosts = allPosts.filter(
      (post) => post.post_category_id == category
    );
  }

  // Update tab styles and animate indicator
  let activeTab = null;
  document.querySelectorAll('.category-tab').forEach((tab) => {
    if (tab.dataset.category == category) {
      activeTab = tab;
      tab.classList.remove(
        'text-gray-600',
        'dark:text-gray-400',
        'hover:text-blue-600',
        'dark:hover:text-blue-400',
        'hover:bg-gray-50',
        'dark:hover:bg-slate-800/50'
      );
      tab.classList.add('text-blue-600', 'dark:text-blue-400');
    } else {
      tab.classList.remove('text-blue-600', 'dark:text-blue-400');
      tab.classList.add(
        'text-gray-600',
        'dark:text-gray-400',
        'hover:text-blue-600',
        'dark:hover:text-blue-400',
        'hover:bg-gray-50',
        'dark:hover:bg-slate-800/50'
      );
    }
  });

  // Animate the underline indicator
  if (activeTab) {
    const indicator = document.getElementById('tab-indicator');
    const tabRect = activeTab.getBoundingClientRect();
    const containerRect = activeTab.parentElement.getBoundingClientRect();

    indicator.style.width = `${tabRect.width}px`;
    indicator.style.left = `${tabRect.left - containerRect.left}px`;
  }

  renderPosts();
};

// Change page
window.changePage = (page) => {
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderPosts();
};

// Search posts
const searchPosts = (query) => {
  const searchTerm = query.toLowerCase().trim();

  if (!searchTerm) {
    filteredPosts =
      currentCategory === 'all'
        ? [...allPosts]
        : allPosts.filter((p) => p.post_category_id == currentCategory);
  } else {
    const baseFilter =
      currentCategory === 'all'
        ? allPosts
        : allPosts.filter((p) => p.post_category_id == currentCategory);

    filteredPosts = baseFilter.filter(
      (post) =>
        post.name.toLowerCase().includes(searchTerm) ||
        stripHtml(post.content).toLowerCase().includes(searchTerm)
    );
  }

  currentPage = 1;
  renderPosts();
};

// Utility: Format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Utility: Strip HTML tags
const stripHtml = (html) => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  fetchPosts();

  // Initialize indicator position on first tab
  setTimeout(() => {
    const firstTab = document.querySelector(
      '.category-tab[data-category="all"]'
    );
    if (firstTab) {
      const indicator = document.getElementById('tab-indicator');
      const tabRect = firstTab.getBoundingClientRect();
      const containerRect = firstTab.parentElement.getBoundingClientRect();

      indicator.style.width = `${tabRect.width}px`;
      indicator.style.left = `${tabRect.left - containerRect.left}px`;
    }
  }, 100);

  // Category tabs
  document.querySelectorAll('.category-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      filterByCategory(tab.dataset.category);
    });
  });

  // Search
  const searchInput = document.getElementById('search-input');
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchPosts(e.target.value);
    }, 500);
  });

  // Search button
  searchInput.nextElementSibling.addEventListener('click', () => {
    searchPosts(searchInput.value);
  });

  // Enter key for search
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchPosts(searchInput.value);
    }
  });
});

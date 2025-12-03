import api, { getImageUrl } from '../../../shared/services/api.js';
import { ProductCard } from '../components/ProductCard.js';
import { Banner } from '../components/Banner.js';
import { BrandMarquee } from '../components/BrandMarquee.js';
import { HotNews } from '../components/HotNews.js';
import Swiper from 'swiper';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// 1. RENDER BANNER & NEWS
const bannerSection = document.getElementById('banner-section');
if (bannerSection) {
  bannerSection.innerHTML = Banner() + BrandMarquee();
  new Swiper('.mySwiper', {
    modules: [Navigation, Pagination, Autoplay],
    loop: true,
    autoplay: { delay: 4000, disableOnInteraction: false },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
    pagination: { el: '.swiper-pagination', clickable: true },
  });
}

const newsContainer = document.getElementById('hot-news-section');
if (newsContainer && typeof HotNews === 'function') {
  newsContainer.innerHTML = HotNews();
} else if (newsContainer && window.renderHotNews) {
  window.renderHotNews();
}

// 2. LOGIC GỌI API SẢN PHẨM (DYNAMIC)
const initHomePage = async () => {
  try {
    console.log('Gọi Home API...');
    const res = await api.get('/products');
    // if(!res.ok) throw new Error('Lỗi khi gọi Home API');
    console.log('Home API Data:', res.data); // Debug

    let rawData = [];
    // Kiểm tra cấu trúc lồng nhau y hệt file products.js
    if (res.data && res.data.data && Array.isArray(res.data.data.data)) {
      rawData = res.data.data.data;
    } else if (res.data && Array.isArray(res.data.data)) {
      rawData = res.data.data;
    } else if (Array.isArray(res.data)) {
      rawData = res.data;
    }

    if (rawData.length === 0) {
      console.warn('API Trang chủ không có sản phẩm');
      return;
    }

    // Chuẩn hóa dữ liệu chung cho toàn trang chủ
    const products = rawData.map((p) => ({
      id: p.id,
      name: p.name,
      // Xử lý giá: ưu tiên giá sale, nếu ko có thì giá thường
      price: Number(p.price_sale || p.price || 0),
      originalPrice: p.price && p.price > p.price_sale ? Number(p.price) : null,
      // Xử lý ảnh: dùng helper getImageUrl để fix đường dẫn lỗi
      image: getImageUrl(p.image),
      brand_id: p.brand_id,
      brand_name: p.brand_name,
    }));

    // A. SẢN PHẨM MỚI (Lấy 8 cái đầu tiên)
    renderNewArrivals(products.slice(0, 8));

    // B. ROLEX (Lọc theo brand_id = 1 hoặc tên brand)
    // Bạn check trong database xem Rolex là ID mấy, ở đây tôi đoán là 1
    const rolex = products
      .filter((p) => p.brand_id == 1 || p.brand_name === 'Rolex')
      .slice(0, 4);
    renderGrid('rolex-list', rolex);

    // C. APPLE WATCH (Lọc theo brand_id = 2 hoặc tên brand)
    const apple = products
      .filter((p) => p.brand_id == 2 || p.brand_name === 'Apple')
      .slice(0, 4);
    renderGrid('apple-list', apple);
  } catch (error) {
    console.error('Lỗi Home API:', error);
  }
};

// --- HÀM RENDER SWIPER ---
const renderNewArrivals = (products) => {
  const container = document.getElementById('new-arrivals-container');
  const skeleton = document.getElementById('new-arrivals-skeleton');
  
  if (!container) return;

  if (products.length === 0) {
    container.innerHTML =
      '<p class="text-center text-gray-500 py-10">Đang cập nhật sản phẩm mới...</p>';
    if (skeleton) skeleton.style.display = 'none';
    container.classList.remove('hidden');
    return;
  }

  const slides = products
    .map(
      (p) => `
        <div class="swiper-slide h-auto p-2">
            ${ProductCard(p)}
        </div>
    `
    )
    .join('');

  container.innerHTML = `
        <div class="swiper newArrivalsSwiper !pb-12 !overflow-visible">
            <div class="swiper-wrapper">${slides}</div>
            <div class="swiper-pagination"></div>
        </div>
        <button class="swiper-button-prev-custom absolute top-1/2 -left-4 md:-left-0 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white dark:bg-slate-700 shadow-lg flex items-center justify-center text-slate-800 dark:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-blue-500 hover:text-white cursor-pointer border border-gray-100 dark:border-slate-600">
             <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <button class="swiper-button-next-custom absolute top-1/2 -right-4 md:-right-0 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white dark:bg-slate-700 shadow-lg flex items-center justify-center text-slate-800 dark:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-blue-500 hover:text-white cursor-pointer border border-gray-100 dark:border-slate-600">
             <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
        </button>
    `;

  new Swiper('.newArrivalsSwiper', {
    modules: [Navigation, Pagination, Autoplay],
    slidesPerView: 1,
    spaceBetween: 20,
    autoplay: { delay: 5000, pauseOnMouseEnter: true },
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
      dynamicBullets: true,
    },
    navigation: {
      nextEl: '.swiper-button-next-custom',
      prevEl: '.swiper-button-prev-custom',
    },
    breakpoints: {
      640: { slidesPerView: 2 },
      1024: { slidesPerView: 3 },
      1280: { slidesPerView: 4 },
    },
  });
  
  // Hide skeleton and show content
  if (skeleton) skeleton.style.display = 'none';
  container.classList.remove('hidden');
};

const renderGrid = (elementId, products) => {
  const container = document.getElementById(elementId);
  if (!container) return;
  
  // Find and hide corresponding skeleton
  const skeletonId = elementId.replace('-list', '-skeleton');
  const skeleton = document.getElementById(skeletonId);

  if (products.length === 0) {
    container.innerHTML =
      '<p class="col-span-full text-center text-gray-500 py-10">Chưa có sản phẩm.</p>';
    if (skeleton) skeleton.style.display = 'none';
    container.classList.remove('hidden');
    return;
  }

  container.innerHTML = products.map((p) => ProductCard(p)).join('');
  
  // Hide skeleton and show content
  if (skeleton) skeleton.style.display = 'none';
  container.classList.remove('hidden');
};

document.addEventListener('DOMContentLoaded', initHomePage);

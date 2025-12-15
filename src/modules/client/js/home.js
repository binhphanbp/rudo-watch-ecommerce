import api, { getImageUrl } from "../../../shared/services/api.js";
import { ProductCard } from "../components/ProductCard.js";
import { Banner } from "../components/Banner.js";
import { BrandMarquee } from "../components/BrandMarquee.js";
import { HotNews } from "../components/HotNews.js";
import Swiper from "swiper";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

// 1. RENDER BANNER & NEWS
const bannerSection = document.getElementById("banner-section");
if (bannerSection) {
  bannerSection.innerHTML = Banner() + BrandMarquee();
  new Swiper(".mySwiper", {
    modules: [Navigation, Pagination, Autoplay],
    loop: true,
    autoplay: { delay: 4000, disableOnInteraction: false },
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
    pagination: { el: ".swiper-pagination", clickable: true },
  });
}

// Load HotNews section
const loadHotNews = async () => {
  const newsContainer = document.getElementById("hot-news-section");
  if (newsContainer && typeof HotNews === "function") {
    try {
      newsContainer.innerHTML = await HotNews();
    } catch (error) {
      console.error("Error loading HotNews:", error);
      newsContainer.innerHTML = '<p class="text-center text-gray-500 py-10">Không thể tải tin tức</p>';
    }
  } else if (newsContainer && window.renderHotNews) {
    window.renderHotNews();
  }
};

// Load HotNews when DOM is ready
document.addEventListener("DOMContentLoaded", loadHotNews);

// 2. LOGIC GỌI API SẢN PHẨM (DYNAMIC)
const initHomePage = async () => {
  try {
    console.log("Gọi Home API...");
    const res = await api.get("/home");
    // API response structure: { status: 'success', statusCode: 200, data: { latest_products, featured_products, top_products, posts } }
    const homeData = res.data?.data || {};
    
    console.log("Home API Data:", homeData);
    
    // Helper function to map product data
    const mapProduct = (p, badgeType = null) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price_sale || p.price || 0),
      originalPrice: p.price && p.price > p.price_sale ? Number(p.price) : null,
      image: getImageUrl(p.image),
      brand_id: p.brand_id,
      brand_name: p.brand_name,
      variants: p.variants || [],
      badgeType: badgeType,
      sold_count: p.sold_count || p.total_sold || 0,
    });

    // Render Sản phẩm mới (New Arrivals) từ latest_products
    if (homeData.latest_products && Array.isArray(homeData.latest_products)) {
      const latestProducts = homeData.latest_products.map(mapProduct);
      renderNewArrivals(latestProducts.slice(0, 8));
    }

    // Render Sản phẩm bán chạy từ top_products
    if (homeData.top_products && Array.isArray(homeData.top_products)) {
      const topProducts = homeData.top_products.map((p) => mapProduct(p, 'bestseller'));
      renderGrid("rolex-list", topProducts.slice(0, 4));
    }
    
    // Render Sản phẩm nổi bật từ featured_products
    if (homeData.featured_products && Array.isArray(homeData.featured_products)) {
      const featuredProducts = homeData.featured_products.map((p) => mapProduct(p, 'featured'));
      renderGrid("apple-list", featuredProducts.slice(0, 4));
    }
  } catch (error) {
    console.error("Lỗi Home API:", error);
  }
};

// --- HÀM RENDER SWIPER ---
const renderNewArrivals = (products) => {
  const container = document.getElementById("new-arrivals-container");
  const skeleton = document.getElementById("new-arrivals-skeleton");

  if (!container) return;

  if (products.length === 0) {
    container.innerHTML =
      '<p class="text-center text-gray-500 py-10">Đang cập nhật sản phẩm mới...</p>';
    if (skeleton) skeleton.style.display = "none";
    container.classList.remove("hidden");
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
    .join("");

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

  new Swiper(".newArrivalsSwiper", {
    modules: [Navigation, Pagination, Autoplay],
    slidesPerView: 1,
    spaceBetween: 20,
    autoplay: { delay: 5000, pauseOnMouseEnter: true },
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
      dynamicBullets: true,
    },
    navigation: {
      nextEl: ".swiper-button-next-custom",
      prevEl: ".swiper-button-prev-custom",
    },
    breakpoints: {
      640: { slidesPerView: 2 },
      1024: { slidesPerView: 3 },
      1280: { slidesPerView: 4 },
    },
  });

  // Hide skeleton and show content
  if (skeleton) skeleton.style.display = "none";
  container.classList.remove("hidden");
};

const renderGrid = (elementId, products) => {
  const container = document.getElementById(elementId);
  if (!container) return;

  // Find and hide corresponding skeleton
  const skeletonId = elementId.replace("-list", "-skeleton");
  const skeleton = document.getElementById(skeletonId);

  if (products.length === 0) {
    container.innerHTML =
      '<p class="col-span-full text-center text-gray-500 py-10">Chưa có sản phẩm.</p>';
    if (skeleton) skeleton.style.display = "none";
    container.classList.remove("hidden");
    return;
  }

  container.innerHTML = products.map((p) => ProductCard(p)).join("");

  // Hide skeleton and show content
  if (skeleton) skeleton.style.display = "none";
  container.classList.remove("hidden");
};

document.addEventListener("DOMContentLoaded", initHomePage);

import { Banner } from '../components/Banner.js';
import { BrandMarquee } from '../components/BrandMarquee.js';
import { ProductCard } from '../components/ProductCard.js';
import Swiper from 'swiper';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const bannerSection = document.getElementById('banner-section');

if (bannerSection) {
  bannerSection.innerHTML = Banner() + BrandMarquee();

  new Swiper('.mySwiper', {
    modules: [Navigation, Pagination, Autoplay],
    loop: true,
    speed: 500,
    autoplay: {
      delay: 3000,
      disableOnInteraction: false,
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
      dynamicBullets: true,
    },
  });
}

// Mock data nha Khôi
const mockProducts = [
  {
    id: 1,
    brand: 'Rolex',
    name: 'Yacht-Master 40mm Rose Gold',
    price: 35250000,
    originalPrice: 49560000,
    image: '/images/products/yatch-master.png',
    colors: ['#E5E7EB', '#F59E0B'],
  },
  {
    id: 2,
    brand: 'Hublot',
    name: 'Big Bang Unico Titanium',
    price: 45000000,
    originalPrice: 52000000,
    image: '/images/products/yatch-master.png',
    colors: ['#000000', '#9CA3AF'],
  },
  {
    id: 3,
    brand: 'Omega',
    name: 'Speedmaster Moonwatch',
    price: 18500000,
    originalPrice: 22000000,
    image: '/images/products/yatch-master.png',
    colors: ['#D1D5DB', '#1F2937'],
  },
  {
    id: 4,
    brand: 'Patek Philippe',
    name: 'Nautilus 5711/1A Blue',
    price: 125000000,
    originalPrice: null,
    image: '/images/products/yatch-master.png',
    colors: ['#1E3A8A', '#E5E7EB'],
  },
  {
    id: 5,
    brand: 'Audemars Piguet',
    name: 'Royal Oak Selfwinding',
    price: 89000000,
    originalPrice: 95000000,
    image: '/images/products/yatch-master.png',
    colors: ['#1F2937'],
  },
  {
    id: 6,
    brand: 'Cartier',
    name: 'Santos de Cartier Large',
    price: 22500000,
    originalPrice: 25000000,
    image: '/images/products/yatch-master.png',
    colors: ['#D1D5DB', '#FCD34D'],
  },
  {
    id: 7,
    brand: 'Richard Mille',
    name: 'RM 11-03 McLaren',
    price: 550000000,
    originalPrice: 600000000,
    image: '/images/products/yatch-master.png',
    colors: ['#F97316', '#000000'],
  },
  {
    id: 8,
    brand: 'Breitling',
    name: 'Navitimer B01 Chronograph',
    price: 19800000,
    originalPrice: null,
    image: '/images/products/yatch-master.png',
    colors: ['#10B981', '#000000'],
  },
  {
    id: 9,
    brand: 'Rolex',
    name: 'Navitimer B01 Chronograph',
    price: 19800000,
    originalPrice: null,
    image: '/images/products/yatch-master.png',
    colors: ['#F97316', '#000000'],
  },
  {
    id: 10,
    brand: 'Rolex',
    name: 'Navitimer B01 Chronograph',
    price: 19800000,
    originalPrice: null,
    image: '/images/products/yatch-master.png',
    colors: ['#10B981', '#000000'],
  },
  {
    id: 11,
    brand: 'Rolex',
    name: 'Navitimer B01 Chronograph',
    price: 19800000,
    originalPrice: null,
    image: '/images/products/yatch-master.png',
    colors: ['#1F2937'],
  },
  {
    id: 12,
    brand: 'Apple',
    name: 'Apple Watch Ultra 2 Titanium',
    price: 21990000,
    originalPrice: 23500000,
    image: '/images/products/applewatch.png',
    colors: ['#F97316', '#E5E7EB'],
  },
  {
    id: 13,
    brand: 'Apple',
    name: 'Apple Watch Series 9 Midnight',
    price: 10490000,
    originalPrice: null,
    image: '/images/products/applewatch.png',
    colors: ['#1E293B'],
  },
  {
    id: 14,
    brand: 'Apple',
    name: 'Apple Watch SE 2023 Starlight',
    price: 6390000,
    originalPrice: 7000000,
    image: '/images/products/applewatch.png',
    colors: ['#F3E8D6'],
  },
  {
    id: 15,
    brand: 'Apple',
    name: 'Apple Watch Hermès Series 9',
    price: 34990000,
    originalPrice: null,
    image: '/images/products/applewatch.png',
    colors: ['#D97706', '#000000'],
  },
];

// Mock data tin tức
const newsData = {
  hero: {
    id: 1,
    title:
      'The latest Rolex watches 2025 introduced at the Watch & Wonder event',
    desc: 'Rolex is a brand that any watch enthusiast must know. Every year, all eyes in the watch world turn to the "holy land" of Watches & Wonders to wait for the latest Rolex models. This year 2025, Rolex brings a big "makeover" when not only introducing the familiar GMT, Daytona or Sky-Dweller but also refreshing the classic collection.',
    image: '/images/news/news-1.jpg',
    date: '31.03.2025',
    author: 'Bình Phan',
  },
  sideList: [
    {
      id: 2,
      title: "Explained: Rolex's proprietary metal alloys",
      desc: 'Over the past decade, metal alloy hairsprings have seemingly fallen out of favor as silicon has risen...',
      image: '/images/news/news-2.jpg',
      date: '30.07.2025',
      author: 'Trương Thanh Sáng',
    },
    {
      id: 3,
      title: 'The powerful Nivada Grenchen Depthmaster Bronze',
      desc: 'Recently released is a striking bronze version of the Depthmaster, adding a rugged appeal to the diver...',
      image: '/images/news/news-3.jpg',
      date: '14.07.2025',
      author: 'Lê Duy',
    },
    {
      id: 4,
      title: 'How to take care of your mechanical watch',
      desc: 'Owning a mechanical watch is a truly wonderful experience in a world of digital devices, but it needs care...',
      image: '/images/news/news-4.jpg',
      date: '25.06.2025',
      author: 'Bình Phan',
    },
  ],
};

// New Arrivals Section
const initNewArrivals = () => {
  const container = document.getElementById('new-arrivals-container');

  if (container) {
    // Thêm class 'h-auto' để các card cao bằng nhau
    const slides = mockProducts
      .map(
        (product) => `
            <div class="swiper-slide h-auto p-2">
                ${ProductCard(product)}
            </div>
        `
      )
      .join('');

    // !pb-12: Padding bottom 12 để chừa chỗ cho dấu chấm pagination
    container.innerHTML = `
            <div class="swiper newArrivalsSwiper !pb-12 !overflow-visible">
                <div class="swiper-wrapper">
                    ${slides}
                </div>
                
                <div class="swiper-pagination"></div>
            </div>

            <button class="swiper-button-prev-custom absolute top-1/2 -left-4 md:-left-12 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white dark:bg-slate-700 shadow-lg flex items-center justify-center text-slate-800 dark:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-blue-500 hover:text-white disabled:opacity-0 cursor-pointer border border-gray-100 dark:border-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            </button>
            
            <button class="swiper-button-next-custom absolute top-1/2 -right-4 md:-right-12 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white dark:bg-slate-700 shadow-lg flex items-center justify-center text-slate-800 dark:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-blue-500 hover:text-white disabled:opacity-0 cursor-pointer border border-gray-100 dark:border-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </button>
        `;

    new Swiper('.newArrivalsSwiper', {
      modules: [Navigation, Pagination, Autoplay],
      slidesPerView: 1,
      spaceBetween: 10,
      speed: 600,
      autoplay: {
        delay: 5000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true, // Hover thì dừng chạy
      },
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
        dynamicBullets: true,
      },

      navigation: {
        nextEl: '.swiper-button-next-custom',
        prevEl: '.swiper-button-prev-custom',
      },
      // Responsive Breakpoints
      breakpoints: {
        640: { slidesPerView: 2, spaceBetween: 20 },
        1024: { slidesPerView: 3, spaceBetween: 24 },
        1280: { slidesPerView: 4, spaceBetween: 24 },
      },
    });
  }
};

initNewArrivals();

// Rolex Section
const initRolexSection = () => {
  const container = document.getElementById('rolex-list');

  if (container) {
    const rolexProducts = mockProducts
      .filter((p) => p.brand === 'Rolex')
      .slice(0, 4);

    // Nếu lọc ra không có data (do mock data ít quá), thì lấy tạm 4 cái đầu tiên cho đỡ trống
    const displayProducts =
      rolexProducts.length > 0 ? rolexProducts : mockProducts.slice(0, 4);

    container.innerHTML = displayProducts
      .map((product) => ProductCard(product))
      .join('');
  }
};

// Apple Watch Section
const initAppleSection = () => {
  const container = document.getElementById('apple-list');

  if (container) {
    const appleProducts = mockProducts
      .filter((p) => p.brand === 'Apple')
      .slice(0, 4);

    // Nếu chưa có data Apple thì lấy tạm cái khác để test layout
    const displayProducts =
      appleProducts.length > 0 ? appleProducts : mockProducts.slice(4, 8);

    container.innerHTML = displayProducts
      .map((product) => ProductCard(product))
      .join('');
  }
};

// News Section
const renderHotNews = () => {
  const container = document.getElementById('hot-news-section');
  if (!container) return;

  const renderSideItem = (item) => `
        <article class="flex gap-5 group cursor-pointer h-full border-b border-gray-100 dark:border-slate-700 last:border-0 pb-4 last:pb-0">
            <div class="w-[45%] h-full shrink-0 overflow-hidden">
                <img src="${item.image}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
            </div>
            
            <div class="flex-1 flex flex-col justify-between py-1">
                <div>
                    <h3 class="text-xl font-bold text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 transition-colors mb-2">
                        ${item.title}
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                        ${item.desc}
                    </p>
                </div>
                
                <div class="flex items-center justify-between text-xs text-gray-400 mt-2">
                    <span class="flex items-center gap-1">📅 ${item.date}</span>
                    <span class="flex items-center gap-1">👤 ${item.author}</span>
                </div>
            </div>
        </article>
    `;

  container.innerHTML = `
        <section class="py-16 bg-white dark:bg-[#0f172a] transition-colors duration-300">
            <div class="container mx-auto px-4">
                <h2 class="text-4xl font-bold text-slate-900 dark:text-white mb-8">Hot News</h2>
                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch h-auto lg:h-[600px]">
                    
                    <article class="flex flex-col h-full group cursor-pointer">
                        <div class="w-full h-[60%] overflow-hidden mb-5">
                            <img src="${
                              newsData.hero.image
                            }" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">
                        </div>
                        
                        <div class="flex flex-col flex-1 justify-between">
                            <div>
                                <h3 class="text-3xl font-bold text-slate-900 dark:text-white mb-3 leading-tight group-hover:text-blue-600 transition-colors">
                                    ${newsData.hero.title}
                                </h3>
                                <p class="text-base text-gray-500 dark:text-gray-400 line-clamp-4 leading-relaxed">
                                    ${newsData.hero.desc}
                                </p>
                            </div>
                            
                            <div class="flex items-center justify-between border-t border-gray-200 dark:border-slate-700 pt-5 mt-4">
                                <button class="px-6 py-2 border border-slate-900 dark:border-white text-slate-900 dark:text-white font-bold text-sm uppercase hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-colors">
                                    See more
                                </button>
                                <div class="flex gap-6 text-sm text-gray-500">
                                  <span>📅 ${newsData.hero.date}</span>
                                    <span>👤 ${newsData.hero.author}</span>
                                </div>
                            </div>
                        </div>
                    </article>

                    <div class="grid grid-rows-3 gap-6 h-full">
                        ${newsData.sideList
                          .map((item) => renderSideItem(item))
                          .join('')}
                    </div>

                </div>
            </div>
        </section>
    `;
};

document.addEventListener('DOMContentLoaded', () => {
  initNewArrivals();
  initRolexSection();
  initAppleSection();
  renderHotNews();
});

import { formatCurrency } from '../utils/format.js';
import { ProductCard } from '../components/ProductCard.js';
import Swiper from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

import Swal, { Toast } from '../utils/swal.js';

// MOCK DATA CHI TIẾT SẢN PHẨM
const productData = {
  id: 1,
  name: 'Rolex Yacht-Master 42 Yellow Gold',
  brand: 'Rolex',
  price: 35250000,
  oldPrice: 42000000,
  images: [
    '/images/products/rolex-yacht.png', // Ảnh chính 1
    '/images/products/hublot-bigbang.png', // Ảnh test 2
    'https://content.rolex.com/dam/2022/up-close/yacht-master-42/yacht-master-42-m226658-0001.png?imwidth=800',
    '/images/products/rolex-yacht.png',
    '/images/products/rolex-yacht.png',
  ],
};

// MOCK DATA SẢN PHẨM TƯƠNG TỰ
const relatedProducts = [
  {
    id: 2,
    name: 'Rolex Submariner Date',
    brand: 'Rolex',
    price: 28000000,
    image: '/images/products/rolex-yacht.png',
    colors: ['#000'],
  },
  {
    id: 3,
    name: 'Omega Seamaster 300',
    brand: 'Omega',
    price: 18500000,
    image:
      'https://www.omegawatches.com/media/catalog/product/cache/a5c37fddc1a529a1a44fea55d527b9a1/2/1/21030422003001-small.png',
    colors: ['#1D4ED8'],
  },
  {
    id: 4,
    name: 'Hublot Classic Fusion',
    brand: 'Hublot',
    price: 21000000,
    image: '/images/products/hublot-bigbang.png',
    colors: ['#000'],
  },
  {
    id: 5,
    name: 'Tissot PRX',
    brand: 'Tissot',
    price: 15000000,
    image:
      'https://www.tissotwatches.com/media/catalog/product/t/1/t137_407_11_041_00_1.png?im=Resize=(800,800)',
    colors: ['#1E3A8A'],
  },
];

// 1. RENDER THÔNG TIN SẢN PHẨM
const renderProductInfo = () => {
  document.getElementById('product-name').textContent = productData.name;
  document.getElementById('breadcrumb-name').textContent = productData.name;
  document.getElementById('product-brand').textContent = productData.brand;
  document.getElementById('product-price').textContent = formatCurrency(
    productData.price
  );
  document.getElementById('product-old-price').textContent = formatCurrency(
    productData.oldPrice
  );

  // Render Main Image
  const mainImg = document.getElementById('main-image');
  mainImg.src = productData.images[0];

  // Khi load xong thì hiện ảnh lên (fade-in)
  mainImg.onload = () => {
    mainImg.style.opacity = 1;
  };

  // Render Thumbnails
  const thumbContainer = document.getElementById('thumbnail-container');
  thumbContainer.innerHTML = productData.images
    .map(
      (img, index) => `
        <div onclick="changeImage('${img}', this)" 
             class="thumbnail-item aspect-square bg-gray-50 dark:bg-slate-800 rounded-xl border-2 cursor-pointer overflow-hidden p-1 transition-all hover:border-blue-400 ${
               index === 0
                 ? 'border-blue-600 ring-2 ring-blue-600/20'
                 : 'border-transparent'
             }">
            <img src="${img}" class="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal">
        </div>
    `
    )
    .join('');
};

// 2. RENDER RELATED PRODUCTS
const renderRelated = () => {
  const container = document.getElementById('related-products-container');

  // Sử dụng ProductCard component
  const slides = relatedProducts
    .map(
      (p) => `
        <div class="swiper-slide h-auto p-2">
            ${ProductCard(p)}
        </div>
    `
    )
    .join('');

  container.innerHTML = `
        <div class="swiper relatedSwiper pb-12">
            <div class="swiper-wrapper">${slides}</div>
            <div class="swiper-pagination"></div>
        </div>
    `;

  new Swiper('.relatedSwiper', {
    modules: [Pagination],
    slidesPerView: 1,
    spaceBetween: 20,
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
      dynamicBullets: true,
    },
    breakpoints: {
      640: { slidesPerView: 2 },
      1024: { slidesPerView: 4 },
    },
  });
};

// --- GLOBAL FUNCTIONS ---

// Đổi ảnh chính
window.changeImage = (src, thumbEl) => {
  const mainImg = document.getElementById('main-image');

  // 1. Hiệu ứng mờ đi
  mainImg.style.opacity = 0;

  // 2. Đổi src và hiện lại
  setTimeout(() => {
    mainImg.src = src;
    mainImg.style.opacity = 1;
  }, 200);

  // 3. Highlight thumbnail được chọn
  document.querySelectorAll('.thumbnail-item').forEach((el) => {
    el.classList.remove('border-blue-600', 'ring-2', 'ring-blue-600/20');
    el.classList.add('border-transparent');
  });
  thumbEl.classList.remove('border-transparent');
  thumbEl.classList.add('border-blue-600', 'ring-2', 'ring-blue-600/20');
};

// Tăng giảm số lượng
window.updateQty = (change) => {
  const input = document.getElementById('qty-input');
  let newVal = parseInt(input.value) + change;
  if (newVal < 1) newVal = 1;
  input.value = newVal;
};

// Chuyển Tab
window.switchTab = (tabId) => {
  document
    .querySelectorAll('.tab-content')
    .forEach((el) => el.classList.add('hidden'));
  document.getElementById(`tab-${tabId}`).classList.remove('hidden');

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
    btn.classList.add('text-gray-500');
  });

  // Tìm nút active theo text (Cách đơn giản)
  const btns = document.querySelectorAll('.tab-btn');
  if (tabId === 'desc') {
    btns[0].classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
    btns[0].classList.remove('text-gray-500');
  }
  if (tabId === 'specs') {
    btns[1].classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
    btns[1].classList.remove('text-gray-500');
  }
  if (tabId === 'reviews') {
    btns[2].classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
    btns[2].classList.remove('text-gray-500');
  }
};

// Thêm vào giỏ hàng
window.addToCart = () => {
  const qty = parseInt(document.getElementById('qty-input').value);
  Swal.fire({
    icon: 'success',
    title: 'Đã thêm vào giỏ hàng',
    text: `Bạn đã thêm ${qty} sản phẩm ${productData.name}`,
    showConfirmButton: false,
    timer: 1500,
    background: document.documentElement.classList.contains('dark')
      ? '#1e293b'
      : '#fff',
    color: document.documentElement.classList.contains('dark')
      ? '#fff'
      : '#000',
  });
};

// INIT
document.addEventListener('DOMContentLoaded', () => {
  renderProductInfo();
  renderRelated();
});

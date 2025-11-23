import { Header } from '../components/Header';

const app = document.getElementById('app') || document.body;

document.body.insertAdjacentHTML('afterbegin', Header());

import { Banner } from '../components/Banner.js';
// 1. Import Swiper và các Module cần thiết
import Swiper from 'swiper';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';

// 2. Import CSS của Swiper (Bắt buộc)
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// ... Code Header cũ của bạn ở đây ...

// 3. Render HTML Banner ra màn hình
// Giả sử chèn ngay sau Header
document.querySelector('header').insertAdjacentHTML('afterend', Banner());

// 4. Khởi tạo Swiper (Sau khi HTML đã được chèn vào DOM)
const swiper = new Swiper('.mySwiper', {
  // Cấu hình Modules
  modules: [Navigation, Pagination, Autoplay],

  loop: true, // Vòng lặp vô tận
  speed: 800, // Tốc độ chuyển slide (ms)

  autoplay: {
    delay: 5000, // Tự động chạy sau 5s
    disableOnInteraction: false, // Người dùng vuốt xong vẫn tự chạy tiếp
  },

  // Cấu hình nút mũi tên
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },

  // Cấu hình dấu chấm
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
    dynamicBullets: true, // Hiệu ứng chấm to chấm nhỏ cho đẹp
  },
});

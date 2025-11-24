import { Header } from '../components/Header';
import { Footer } from '../components/Footer.js';

const app = document.getElementById('app') || document.body;

// Dark/Light Mode
const themeController = {
  init() {
    this.applyTheme();
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', () => {
        if (!localStorage.getItem('theme')) this.applyTheme();
      });
  },
  applyTheme() {
    const userChoice = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;

    if (userChoice === 'dark' || (!userChoice && systemPrefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },
  setTheme(mode) {
    console.log('Đã bấm nút chọn theme:', mode);
    if (mode === 'system') {
      localStorage.removeItem('theme');
    } else {
      localStorage.setItem('theme', mode);
    }
    this.applyTheme();
  },
};

window.themeController = themeController;

themeController.init();

// Scroll Progress Bar
function initScrollProgress() {
  const progressBar = document.getElementById('scroll-progress');
  if (!progressBar) return;

  window.addEventListener('scroll', () => {
    // Vị trí hiện tại (đã cuộn được bao nhiêu px)
    const scrollTop =
      document.documentElement.scrollTop || document.body.scrollTop;

    // Tổng chiều cao của trang web (trừ đi chiều cao màn hình hiển thị)
    const scrollHeight =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;

    // Tính % (Nếu scrollHeight = 0 nghĩa là trang ngắn quá, set bằng 0 luôn)
    const scrolled = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

    progressBar.style.width = `${scrolled}%`;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.body.insertAdjacentHTML('afterbegin', Header());

  document.body.insertAdjacentHTML('beforeend', Footer());

  initScrollProgress();
});

export function Banner() {
  // Danh sách ảnh banner (Nên để trong public folder vì ảnh banner thường nặng)
  const banners = [
    '/images/banners/banner-1.jpg',
    '/images/banners/banner-2.jpg',
    '/images/banners/banner-3.jpg',
  ];

  const slides = banners
    .map(
      (img) => `
        <div class="swiper-slide">
            <img src="${img}" alt="Banner" class="w-full h-auto object-cover block aspect-video md:aspect-21/9">
        </div>
    `
    )
    .join('');

  return `
    <div class="swiper mySwiper w-full group">
        <div class="swiper-wrapper">
            ${slides}
        </div>
        
        <div class="swiper-button-next !text-white/50 hover:!text-white transition-colors"></div>
        <div class="swiper-button-prev !text-white/50 hover:!text-white transition-colors"></div>
        
        <div class="swiper-pagination"></div>
    </div>
    `;
}

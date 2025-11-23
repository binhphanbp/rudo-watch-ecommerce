const brands = [
  { name: 'Rolex', img: '/images/brands/rolex.png' },
  { name: 'Patek Philippe', img: '/images/brands/cartier.svg' },
  { name: 'Cartier', img: '/images/brands/tissot.png' },
  { name: 'Omega', img: '/images/brands/omega.png' },
  { name: 'Hublot', img: '/images/brands/breitling.png' },
  { name: 'IWC', img: '/images/brands/apple-watch.png' },
  { name: 'Breitling', img: '/images/brands/breitling.png' },
  { name: 'Cartier', img: '/images/brands/xiaomi.png' },
  { name: 'Samsung', img: '/images/brands/samsung.png' },
];

export function BrandMarquee() {
  const renderLogoList = () =>
    brands
      .map(
        (brand) => `
        <div class="flex items-center justify-center w-[120px]">
          <img src="${brand.img}" alt="${brand.name}" 
            class="h-12 w-auto object-contain 
              grayscale hover:grayscale-0 
              dark:invert dark:hover:invert-0
              opacity-70 hover:opacity-100 
              transition-all duration-300 cursor-pointer">
        </div>
    `
      )
      .join('');

  return `
    <section class="w-full bg-white dark:bg-[#0f172a] py-10 border-b border-gray-100 dark:border-white/5 overflow-hidden transition-colors duration-300">
        <div class="relative w-full flex overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
            
            <div class="flex animate-infinite-scroll shrink-0 min-w-full items-center justify-around gap-10 pr-10">
                ${renderLogoList()}
            </div>

            <div class="flex animate-infinite-scroll shrink-0 min-w-full items-center justify-around gap-10 pr-10" aria-hidden="true">
                ${renderLogoList()}
            </div>

        </div>
    </section>
    `;
}

import api, { getImageUrl } from "../../../shared/services/api.js";

// State lưu brands
let brands = [];

// Fetch brands từ API
async function fetchBrands() {
  try {
    const response = await api.get("/brands");
    brands = (response.data.data || response.data || []).filter(
      (b) => b.status == 1
    );
    renderBrandMarquee();
  } catch (error) {
    console.error("Lỗi khi lấy brands:", error);
  }
}

// Render lại component sau khi có data
function renderBrandMarquee() {
  const container = document.getElementById("brand-marquee-container");
  if (container && brands.length > 0) {
    container.innerHTML = BrandMarqueeContent();
  }
}

// Render danh sách logo
function renderLogoList() {
  return brands
    .map(
      (brand) => `
        <div class="flex items-center justify-center w-[120px]">
          <img src="${
            brand.logo
              ? getImageUrl(brand.logo)
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  brand.name
                )}&background=random&size=100`
          }" 
            alt="${brand.name}" 
            class="h-12 w-auto object-contain 
              grayscale hover:grayscale-0 
              dark:invert dark:hover:invert-0
              opacity-70 hover:opacity-100 
              transition-all duration-300 cursor-pointer"
            onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(
              brand.name
            )}&background=eee&color=999&size=100'">
        </div>
    `
    )
    .join("");
}

// Nội dung marquee
function BrandMarqueeContent() {
  if (brands.length === 0) {
    return '<div class="text-center text-gray-400 py-4">Đang tải...</div>';
  }

  const logoList = renderLogoList();
  return `
    <div class="relative w-full flex overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
        
        <div class="flex animate-infinite-scroll shrink-0 min-w-full items-center justify-around gap-10 pr-10">
            ${logoList}
        </div>

        <div class="flex animate-infinite-scroll shrink-0 min-w-full items-center justify-around gap-10 pr-10" aria-hidden="true">
            ${logoList}
        </div>

    </div>
  `;
}

export function BrandMarquee() {
  // Fetch brands khi component được gọi
  fetchBrands();

  return `
    <section class="w-full bg-white dark:bg-[#0f172a] py-10 border-b border-gray-100 dark:border-white/5 overflow-hidden transition-colors duration-300">
        <div id="brand-marquee-container">
            ${BrandMarqueeContent()}
        </div>
    </section>
    `;
}

import { formatCurrency } from '../../../shared/utils/format.js';

export function ProductCard(product) {
  // 1. LOGIC TÍNH GIÁ HIỂN THỊ (QUAN TRỌNG)
  let displayPrice = 0;
  let originalPrice = 0; // Giá gốc (nếu có giảm giá)

  // Trường hợp 1: API trả về mảng variants (Sản phẩm có biến thể)
  if (
    product.variants &&
    Array.isArray(product.variants) &&
    product.variants.length > 0
  ) {
    // Lấy tất cả giá từ các biến thể
    const prices = product.variants.map((v) => Number(v.price));
    // Tìm giá nhỏ nhất để hiển thị (VD: "Từ 5.000.000đ")
    displayPrice = Math.min(...prices);

    // Nếu có logic giá gốc ở biến thể, bạn có thể xử lý thêm ở đây
    // Ví dụ: originalPrice = Math.min(...product.variants.map(v => Number(v.original_price || 0)));
  }
  // Trường hợp 2: API trả về giá trực tiếp ở root (Sản phẩm đơn giản hoặc Backend đã xử lý sẵn)
  else {
    // Ưu tiên sử dụng price_sale nếu có (giá bán thực tế), nếu không thì dùng price
    // Lưu ý: Cần kiểm tra kỹ field name từ API của bạn (price, price_sale, original_price...)
    displayPrice = Number(product.price_sale || product.price || 0);

    // Nếu có giá sale, thì giá gốc là price. Nếu không sale, giá gốc là 0 (hoặc null)
    if (
      product.price_sale &&
      Number(product.price) > Number(product.price_sale)
    ) {
      originalPrice = Number(product.price);
    }
  }

  // 2. TÍNH PHẦN TRĂM GIẢM GIÁ
  let discountTag = '';
  if (originalPrice > displayPrice) {
    const percent = Math.round(
      ((originalPrice - displayPrice) / originalPrice) * 100
    );
    if (percent > 0) {
      discountTag = `
            <span class="bg-[#EAD8B1] text-[#5A4010] text-xs font-bold px-2 py-1 rounded">
                -${percent}%
            </span>`;
    }
  }

  // 3. RENDER MÀU SẮC (Lấy từ variants)
  // Thu thập tất cả màu từ các variants (mỗi variant có field colors là JSON array)
  let allColors = [];
  if (
    product.variants &&
    Array.isArray(product.variants) &&
    product.variants.length > 0
  ) {
    // Debug: log để kiểm tra
    console.log('Product variants:', product.name, product.variants);

    product.variants.forEach((variant) => {
      if (variant.colors) {
        // colors có thể là string JSON hoặc array
        let variantColors = variant.colors;
        console.log('Variant colors raw:', variantColors, typeof variantColors);

        if (typeof variantColors === 'string') {
          try {
            variantColors = JSON.parse(variantColors);
          } catch (e) {
            // Nếu không parse được, có thể là string đơn như "Đen, Trắng"
            variantColors = variantColors
              .split(',')
              .map((c) => c.trim())
              .filter((c) => c);
          }
        }
        if (Array.isArray(variantColors)) {
          allColors = [...allColors, ...variantColors];
        }
      }
    });
    // Loại bỏ màu trùng lặp
    allColors = [...new Set(allColors)];
    console.log('All colors extracted:', allColors);
  }
  // Fallback: nếu không có variants, lấy từ product.colors
  else if (product.colors && Array.isArray(product.colors)) {
    allColors = product.colors;
  }

  // Map màu tiếng Việt sang mã màu CSS
  const colorMap = {
    // Màu cơ bản
    đen: '#000000',
    trắng: '#FFFFFF',
    đỏ: '#EF4444',
    xanh: '#3B82F6',
    'xanh dương': '#3B82F6',
    'xanh lá': '#22C55E',
    'xanh lá cây': '#22C55E',
    vàng: '#EAB308',
    cam: '#F97316',
    tím: '#A855F7',
    hồng: '#EC4899',
    nâu: '#92400E',
    xám: '#6B7280',
    bạc: '#C0C0C0',
    'vàng hồng': '#B76E79',
    'rose gold': '#B76E79',
    // Màu đồng hồ phổ biến
    'vàng gold': '#FFD700',
    gold: '#FFD700',
    silver: '#C0C0C0',
    black: '#000000',
    white: '#FFFFFF',
    blue: '#3B82F6',
    green: '#22C55E',
    red: '#EF4444',
    navy: '#1E3A5F',
    'xanh navy': '#1E3A5F',
    champagne: '#F7E7CE',
    olive: '#808000',
  };

  const getColorCode = (colorName) => {
    const normalizedName = colorName.toLowerCase().trim();
    // Kiểm tra nếu đã là mã màu hex
    if (normalizedName.startsWith('#')) return colorName;
    // Tìm trong map
    return colorMap[normalizedName] || '#9CA3AF'; // Màu xám mặc định
  };

  const colorDots =
    allColors.length > 0
      ? allColors
          .slice(0, 4)
          .map(
            (color) => `
			<span class="w-4 h-4 rounded-full border border-gray-200 dark:border-gray-600 cursor-pointer hover:scale-110 transition-transform shadow-sm" 
				  style="background-color: ${getColorCode(color)};" title="${color}"></span>
		`
          )
          .join('') +
        (allColors.length > 4
          ? `<span class="text-xs text-gray-400">+${
              allColors.length - 4
            }</span>`
          : '')
      : '';

  // 4. XỬ LÝ ẢNH (Fallback nếu ảnh lỗi hoặc null)
  // Đảm bảo đường dẫn ảnh luôn hợp lệ (đã được xử lý bởi getImageUrl ở service/api.js trước khi truyền vào đây là tốt nhất)
  // Tuy nhiên, check thêm ở đây cho chắc chắn.
  const imageUrl =
    product.image || 'https://placehold.co/600x600?text=No+Image';

  // 5. RENDER HTML
  return `
    <div class="group relative bg-white dark:bg-slate-800 rounded-2xl p-4 transition-all duration-300 border border-gray-300 dark:border-white/20 hover:border-[#0A2A45]/50 dark:hover:border-blue-400/50 flex flex-col h-full">
        
        <div class="absolute top-4 left-4 z-10">
            ${discountTag}
        </div>
        
        <button 
            onclick="window.toggleFavorite && window.toggleFavorite(${
              product.id
            }, this)"
            data-product-id="${product.id}"
            class="favorite-btn absolute top-4 right-4 z-10 text-gray-400 hover:text-red-500 transition-colors"
            title="Yêu thích"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
        </button>

        <div class="relative w-full aspect-square mb-4 overflow-hidden rounded-xl bg-gray-50 dark:bg-slate-700/50">
            <a href="/product-detail.html?id=${
              product.id
            }" class="block w-full h-full">
                <img src="${imageUrl}" alt="${product.name}" loading="lazy"
                  class="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal transform hover:scale-110 transition-transform duration-500 ease-in-out">
            </a>
        </div>

        <div class="flex-1 flex flex-col">
            <div class="flex justify-between items-start mb-1">
                <span class="text-xs text-gray-400 font-[400] tracking-wider truncate max-w-[70%]">
                    ${product.brand_name || product.brand || 'RUDO'}
                </span>
                <div class="flex gap-1">
                    ${colorDots}
                </div>
            </div>

            <a href="/product-detail.html?id=${
              product.id
            }" class="text-lg font-bold text-slate-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2" title="${
    product.name
  }">
                ${product.name}
            </a>

            <div class="mt-auto flex items-end justify-between gap-2 mb-2">
                ${
                  originalPrice > 0
                    ? `
                    <span class="text-sm text-gray-400 line-through decoration-gray-400">
                        ${formatCurrency(originalPrice)}
                    </span>
                `
                    : '<span></span>'
                } <span class="text-lg font-bold text-[#0A2A45] dark:text-blue-300">
                                ${
                                  displayPrice > 0
                                    ? formatCurrency(displayPrice)
                                    : 'Liên hệ'
                                }
                </span>
            </div>
            
            <a href="/product-detail.html?id=${
              product.id
            }" class="w-full bg-[#0A2A45] hover:bg-[#153e60] dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium py-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 text-sm uppercase tracking-wide">
                Thêm vào giỏ hàng
            </a>
        </div>
    </div>
    `;
}

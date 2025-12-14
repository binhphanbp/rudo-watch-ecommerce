import api, { getImageUrl } from '../../../shared/services/api.js';
import CartService from '../../../shared/services/cart.js';
import ReviewService from '../../../shared/services/review.js';
import favoritesService from '../../../shared/services/favorites.js';
import { formatCurrency } from '../../../shared/utils/format.js';
import Swal from '../../../shared/utils/swal.js';
import Swiper from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

const MAX_QTY_PER_ITEM = 10; // Giới hạn mua lẻ cho 1 sản phẩm

const params = new URLSearchParams(window.location.search);
const id = params.get('id');

// STATE: Lưu trữ dữ liệu hiện tại
let state = {
  product: null,
  variants: [],
  selectedVariant: null,
  selectedColor: null,
  selectedSize: null,
  availableColors: [],
  availableSizes: [],
};

// --- 1. KHỞI TẠO & GỌI API ---
const initDetail = async () => {
  if (!id) {
    window.location.href = '/products.html';
    return;
  }

  try {
    const res = await api.get(`/products/${id}`);
    const apiData = res.data.data || res.data; // Lấy data từ response

    console.log('📦 Chi tiết sản phẩm:', apiData);
    console.log(
      '📷 Thumbnail từ API:',
      apiData.thumbnail,
      typeof apiData.thumbnail
    );
    console.log('📷 Images từ API:', apiData.images, typeof apiData.images);

    // Xử lý dữ liệu an toàn (Safe Parsing)
    const safeVariants = Array.isArray(apiData.variants)
      ? apiData.variants
      : [];

    // Parse Thumbnail/Images (Backend có thể trả về nhiều dạng khác nhau)
    let safeImages = [getImageUrl(apiData.image)]; // Mặc định có ảnh đại diện

    // Kiểm tra field "images" trước (có thể backend dùng field này thay vì thumbnail)
    let rawImages =
      apiData.thumbnail || apiData.images || apiData.gallery || [];

    if (rawImages) {
      try {
        // Parse nếu là chuỗi JSON
        let parsedImages =
          typeof rawImages === 'string' ? JSON.parse(rawImages) : rawImages;

        console.log('📷 Parsed images:', parsedImages);

        if (Array.isArray(parsedImages) && parsedImages.length > 0) {
          // Gộp ảnh đại diện + ảnh thumbnail và xử lý đường dẫn
          safeImages = [
            getImageUrl(apiData.image),
            ...parsedImages.map((img) => getImageUrl(img)),
          ];
        }
      } catch (e) {
        console.warn('Lỗi parse thumbnail/images:', e);
        // Nếu không parse được, thử xử lý như string đơn (path ảnh)
        if (typeof rawImages === 'string' && rawImages.trim()) {
          safeImages = [getImageUrl(apiData.image), getImageUrl(rawImages)];
        }
      }
    }

    console.log('📷 Final safeImages:', safeImages);

    // Parse Specifications (Thông số kỹ thuật)
    let safeSpecs = {};
    if (apiData.specifications) {
      try {
        safeSpecs =
          typeof apiData.specifications === 'string'
            ? JSON.parse(apiData.specifications)
            : apiData.specifications;
      } catch (e) {
        console.warn('Lỗi parse specs', e);
      }
    }

    // Lưu vào State
    state.product = {
      id: apiData.id,
      name: apiData.name,
      brand: apiData.brand_name || 'Rudo Watch',
      image: getImageUrl(apiData.image),
      images: safeImages,
      description: apiData.description || 'Đang cập nhật mô tả...',
      specs: safeSpecs,
      defaultPrice: Number(apiData.price || 0),
    };

    state.variants = safeVariants;

    // Tách màu sắc và size từ variants
    if (state.variants.length > 0) {
      // Lấy danh sách màu sắc unique
      const colorsSet = new Set();
      const sizesSet = new Set();

      state.variants.forEach((v) => {
        if (v.colors) {
          let colors = v.colors;
          // Parse nếu là string JSON
          if (typeof colors === 'string') {
            try {
              colors = JSON.parse(colors);
            } catch (e) {
              colors = colors.split(',').map((c) => c.trim());
            }
          }
          if (Array.isArray(colors)) {
            colors.forEach((c) => colorsSet.add(c));
          }
        }
        if (v.size) {
          sizesSet.add(v.size);
        }
      });

      state.availableColors = Array.from(colorsSet);
      state.availableSizes = Array.from(sizesSet);

      // Chọn màu và size mặc định
      if (state.availableColors.length > 0) {
        state.selectedColor = state.availableColors[0];
      }
      if (state.availableSizes.length > 0) {
        state.selectedSize = state.availableSizes[0];
      }

      // Tìm variant tương ứng
      updateSelectedVariant();
    } else {
      // Nếu không có variants, vẫn cần gọi để set selectedVariant = null
      updateSelectedVariant();
    }

    // Render ra màn hình
    renderInfo();
    renderGallery();
    renderVariants();
    // Cập nhật ảnh từ variant sau khi render gallery
    updateImageFromVariant();
    renderSpecs(); // Hàm mới để render bảng thông số
    renderRelated(apiData.brand_id);

    // Load reviews
    loadReviewsStats(id);
    loadReviews(id, 1);

    // Check review permission
    checkReviewPermission(id);

    // Update favorite button state
    updateFavoriteButtonState();
  } catch (error) {
    console.error('Lỗi tải trang chi tiết:', error);
    document.querySelector(
      'section'
    ).innerHTML = `<div class="text-center py-20 text-red-500"><h2 class="text-2xl font-bold">Không tìm thấy sản phẩm</h2><p>Vui lòng quay lại trang chủ.</p></div>`;
  }
};

// --- 2. CÁC HÀM RENDER GIAO DIỆN ---

const renderInfo = () => {
  document.getElementById('product-name').textContent = state.product.name;
  const breadcrumb = document.getElementById('breadcrumb-name');
  if (breadcrumb) breadcrumb.textContent = state.product.name;

  document.getElementById('product-brand').textContent = state.product.brand;

  // Render Mô tả HTML
  const descEl = document.getElementById('tab-desc');
  if (descEl) descEl.innerHTML = state.product.description;

  updatePriceDisplay();
};

const renderGallery = () => {
  const images = state.product.images;

  // Ưu tiên ảnh variant nếu có
  let primaryImage = images[0] || state.product.image;
  if (state.selectedVariant && state.selectedVariant.image) {
    primaryImage = getImageUrl(state.selectedVariant.image);
  }

  // 1. Ảnh chính
  const mainImg = document.getElementById('main-image');
  if (mainImg) {
    mainImg.src = primaryImage;
    mainImg.onload = () => {
      mainImg.style.opacity = 1;
    };
  }

  // 2. Thumbnails
  const container = document.getElementById('thumbnail-container');
  if (!container) return;

  // Chỉ render nếu có nhiều hơn 1 ảnh, hoặc render chính nó nếu chỉ có 1
  const displayImages = images.length > 0 ? images : [state.product.image];

  // Nếu variant có ảnh, đưa ảnh variant lên đầu
  if (state.selectedVariant && state.selectedVariant.image) {
    const variantImageUrl = getImageUrl(state.selectedVariant.image);
    // Kiểm tra xem ảnh variant đã có trong danh sách chưa
    if (!displayImages.includes(variantImageUrl)) {
      displayImages.unshift(variantImageUrl);
    } else {
      // Nếu đã có, di chuyển lên đầu
      const index = displayImages.indexOf(variantImageUrl);
      displayImages.splice(index, 1);
      displayImages.unshift(variantImageUrl);
    }
  }

  container.innerHTML = displayImages
    .map(
      (src, index) => `
        <div onclick="changeImage('${src}', this)" 
             class="thumbnail-item aspect-square bg-gray-50 dark:bg-slate-800 rounded-xl border-2 cursor-pointer overflow-hidden p-1 transition-all hover:border-blue-400 ${
               index === 0
                 ? 'border-blue-600 ring-2 ring-blue-600/20'
                 : 'border-transparent'
             }">
            <img src="${src}" class="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal">
        </div>
    `
    )
    .join('');
};

// Hàm helper: Tìm variant dựa trên màu và size đã chọn
const updateSelectedVariant = () => {
  if (!state.selectedColor && !state.selectedSize) {
    state.selectedVariant = state.variants[0] || null;
    updateImageFromVariant();
    return;
  }

  // Tìm variant khớp với màu và size đã chọn
  const matchedVariant = state.variants.find((v) => {
    let variantColors = v.colors;

    // Parse colors nếu là string
    if (typeof variantColors === 'string') {
      try {
        variantColors = JSON.parse(variantColors);
      } catch (e) {
        variantColors = variantColors.split(',').map((c) => c.trim());
      }
    }

    const hasColor =
      !state.selectedColor ||
      (Array.isArray(variantColors) &&
        variantColors.includes(state.selectedColor));
    const hasSize = !state.selectedSize || v.size === state.selectedSize;

    return hasColor && hasSize;
  });

  state.selectedVariant = matchedVariant || state.variants[0];
  updatePriceDisplay();
  updateImageFromVariant();
};

// Map màu tiếng Việt sang mã CSS
const getColorCode = (colorName) => {
  const colorMap = {
    đen: '#000000',
    black: '#000000',
    trắng: '#FFFFFF',
    white: '#FFFFFF',
    đỏ: '#EF4444',
    red: '#EF4444',
    xanh: '#3B82F6',
    blue: '#3B82F6',
    'xanh dương': '#3B82F6',
    'xanh navy': '#1E3A5F',
    navy: '#1E3A5F',
    'xanh lá': '#22C55E',
    green: '#22C55E',
    vàng: '#EAB308',
    yellow: '#EAB308',
    gold: '#FFD700',
    'vàng gold': '#FFD700',
    cam: '#F97316',
    orange: '#F97316',
    tím: '#A855F7',
    purple: '#A855F7',
    hồng: '#EC4899',
    pink: '#EC4899',
    nâu: '#92400E',
    brown: '#92400E',
    xám: '#6B7280',
    gray: '#6B7280',
    bạc: '#C0C0C0',
    silver: '#C0C0C0',
    'rose gold': '#B76E79',
    'vàng hồng': '#B76E79',
  };

  const normalized = colorName.toLowerCase().trim();
  if (normalized.startsWith('#')) return colorName;
  return colorMap[normalized] || '#9CA3AF';
};

const renderVariants = () => {
  const container = document.getElementById('variant-options');
  if (!container) return;

  if (state.variants.length === 0) {
    container.innerHTML = '';
    return;
  }

  let html = '';

  // Render màu sắc (nếu có)
  if (state.availableColors.length > 0) {
    const colorButtons = state.availableColors
      .map((color) => {
        const isSelected = state.selectedColor === color;
        const colorCode = getColorCode(color);
        const activeClass = isSelected
          ? 'ring-2 ring-blue-600 ring-offset-2 scale-110'
          : 'hover:scale-105';

        return `
        <button 
          onclick="selectColor('${color}')" 
          class="relative w-10 h-10 rounded-full border-2 border-gray-300 dark:border-gray-600 transition-all ${activeClass}"
          style="background-color: ${colorCode}"
          title="${color}">
          ${
            isSelected
              ? '<div class="absolute inset-0 flex items-center justify-center"><svg class="w-5 h-5 text-white drop-shadow" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg></div>'
              : ''
          }
        </button>
      `;
      })
      .join('');

    html += `
      <div class="mb-4">
        <h4 class="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Màu sắc</h4>
        <div class="flex gap-3 flex-wrap">${colorButtons}</div>
      </div>
    `;
  }

  // Render kích thước (nếu có)
  if (state.availableSizes.length > 0) {
    const sizeButtons = state.availableSizes
      .map((size) => {
        const isSelected = state.selectedSize === size;
        const activeClass = isSelected
          ? 'border-[#0A2A45] bg-[#0A2A45] text-white dark:border-blue-500 dark:bg-blue-600'
          : 'border-gray-300 text-gray-700 hover:border-[#0A2A45] dark:border-slate-600 dark:text-gray-300 bg-white dark:bg-slate-800';

        return `
        <button 
          onclick="selectSize('${size}')" 
          class="px-4 py-2 border rounded-lg text-sm font-bold transition-all min-w-[80px] ${activeClass}">
          ${size}
        </button>
      `;
      })
      .join('');

    html += `
      <div>
        <h4 class="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Kích thước</h4>
        <div class="flex gap-3 flex-wrap">${sizeButtons}</div>
      </div>
    `;
  }

  container.innerHTML = html;
};

// Hàm render Thông số kỹ thuật (Specs) vào bảng
const renderSpecs = () => {
  const tbody = document.querySelector('#tab-specs tbody');
  if (!tbody) return;

  // Nếu không có specs thì báo trống
  if (Object.keys(state.product.specs).length === 0) {
    tbody.innerHTML =
      '<tr><td class="p-4 text-gray-500">Chưa có thông số kỹ thuật.</td></tr>';
    return;
  }

  // Duyệt qua object specs và tạo dòng tr
  // Specs ví dụ: { "Chống nước": "100m", "Máy": "Automatic" }
  let html = '';
  let isEven = false; // Để làm màu so le

  for (const [key, value] of Object.entries(state.product.specs)) {
    const bgClass = isEven
      ? 'bg-gray-50 dark:bg-slate-900/50'
      : 'bg-white dark:bg-slate-800';
    html += `
            <tr class="${bgClass}">
                <td class="p-4 font-bold w-1/3 text-slate-900 dark:text-white">${key}</td>
                <td class="p-4 text-gray-600 dark:text-gray-300">${value}</td>
            </tr>
        `;
    isEven = !isEven;
  }

  // Thêm các thông tin cơ bản mặc định (Thương hiệu, Xuất xứ...) nếu chưa có trong specs JSON
  // (Tùy chọn, ở đây mình chỉ render đúng những gì DB trả về)

  tbody.innerHTML = html;
};

const updatePriceDisplay = () => {
  const priceEl = document.getElementById('product-price');
  const oldPriceEl = document.getElementById('product-old-price');

  // Giá ưu tiên: Variant > Product Default > 0
  const currentPrice = state.selectedVariant
    ? Number(state.selectedVariant.price)
    : Number(state.product.defaultPrice);

  priceEl.textContent = formatCurrency(currentPrice);

  // Logic hiển thị giá cũ (Giả lập nếu DB không có field old_price)
  // Nếu bạn có field old_price trong DB thì thay thế logic này
  if (currentPrice > 0) {
    oldPriceEl.textContent = formatCurrency(currentPrice * 1.2); // Giả vờ giảm 20%
  } else {
    oldPriceEl.textContent = '';
  }
};

// Hàm cập nhật ảnh từ variant được chọn
const updateImageFromVariant = () => {
  if (!state.selectedVariant || !state.selectedVariant.image) {
    // Nếu variant không có ảnh, giữ nguyên ảnh sản phẩm
    return;
  }

  const variantImageUrl = getImageUrl(state.selectedVariant.image);
  const mainImg = document.getElementById('main-image');

  if (mainImg && variantImageUrl) {
    // Cập nhật ảnh chính với hiệu ứng fade
    mainImg.style.opacity = 0;
    setTimeout(() => {
      mainImg.src = variantImageUrl;
      mainImg.onload = () => {
        mainImg.style.opacity = 1;
      };
    }, 200);

    // Cập nhật thumbnail đầu tiên
    const firstThumbnail = document.querySelector('.thumbnail-item');
    if (firstThumbnail) {
      const thumbnailImg = firstThumbnail.querySelector('img');
      if (thumbnailImg) {
        thumbnailImg.src = variantImageUrl;
      }
      // Đánh dấu thumbnail đầu tiên là active
      document.querySelectorAll('.thumbnail-item').forEach((el) => {
        el.classList.remove('border-blue-600', 'ring-2', 'ring-blue-600/20');
        el.classList.add('border-transparent');
      });
      firstThumbnail.classList.remove('border-transparent');
      firstThumbnail.classList.add(
        'border-blue-600',
        'ring-2',
        'ring-blue-600/20'
      );
    }
  }
};

// --- 3. LOGIC SẢN PHẨM LIÊN QUAN ---
const renderRelated = async (brandId) => {
  const container = document.getElementById('related-products-container');
  if (!container) return;

  try {
    // Gọi API lấy danh sách (có thể tối ưu bằng endpoint /products/related/{id} nếu BE hỗ trợ)
    const res = await api.get('/products');
    let all = res.data.data || res.data;
    if (!Array.isArray(all)) {
      // Trường hợp response là object rỗng, undefined, hoặc data nằm trong một layer khác
      console.warn(
        'Dữ liệu sản phẩm không phải là mảng, chuyển đổi về mảng rỗng.'
      );
      all = []; // Gán lại all là một mảng rỗng để filter không bị lỗi
    }
    console.log('related products data (array status): ' + Array.isArray(all));
    // Lọc cùng Brand, khác ID hiện tại
    console.log('related: ' + all);
    const related = all
      .filter((p) => p.brand_id == brandId && p.id != state.product.id)
      .slice(0, 8);

    if (related.length === 0) {
      container.innerHTML =
        '<p class="text-gray-500">Không có sản phẩm tương tự.</p>';
      return;
    }

    // Render Swiper HTML
    const slides = related
      .map((p) => {
        // Lấy giá variant đầu tiên để hiển thị
        const displayPrice =
          p.variants && p.variants.length > 0 ? p.variants[0].price : p.price;
        return `
                <div class="swiper-slide h-auto p-2">
                    <div class="group relative bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-white/5 h-full flex flex-col transition-all hover:shadow-lg">
                        <div class="relative w-full aspect-square mb-4 overflow-hidden rounded-xl bg-gray-50 dark:bg-slate-700/50">
                            <a href="/product-detail.html?id=${p.id}">
                                <img src="${getImageUrl(
                                  p.image
                                )}" class="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal transform hover:scale-110 transition-transform">
                            </a>
                        </div>
                        <div class="flex-1 flex flex-col">
                            <a href="/product-detail.html?id=${
                              p.id
                            }" class="text-base font-bold text-slate-900 dark:text-white line-clamp-2 mb-2 hover:text-blue-600 transition-colors">
                                ${p.name}
                            </a>
                            <div class="mt-auto font-bold text-[#0A2A45] dark:text-blue-400 text-lg">
                                ${formatCurrency(displayPrice)}
                            </div>
                        </div>
                    </div>
                </div>
            `;
      })
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
      pagination: { clickable: true },
      breakpoints: { 640: { slidesPerView: 2 }, 1024: { slidesPerView: 4 } },
    });
  } catch (err) {
    console.error(err);
  }
};

// --- 4. ACTIONS (Window Global) ---

window.selectColor = (color) => {
  state.selectedColor = color;
  updateSelectedVariant();
  renderVariants();
  // updateImageFromVariant được gọi trong updateSelectedVariant
};

window.selectSize = (size) => {
  state.selectedSize = size;
  updateSelectedVariant();
  renderVariants();
};

window.addToCart = () => {
  // Validate
  if (state.variants.length > 0 && !state.selectedVariant) {
    let message = 'Vui lòng chọn ';
    if (state.availableColors.length > 0 && state.availableSizes.length > 0) {
      message += 'màu sắc và kích thước!';
    } else if (state.availableColors.length > 0) {
      message += 'màu sắc!';
    } else if (state.availableSizes.length > 0) {
      message += 'kích thước!';
    }
    return Swal.fire({ icon: 'warning', title: message });
  }

  const qty = parseInt(document.getElementById('qty-input').value) || 1;
  const stockLimit = state.selectedVariant
    ? state.selectedVariant.quantity
    : 999;

  // Tạo ID unique cho sản phẩm
  const itemId = state.selectedVariant
    ? `${state.product.id}_${state.selectedVariant.id}`
    : `${state.product.id}`;

  // Kiểm tra số lượng hiện có trong giỏ hàng
  const currentCart = CartService.getCart();
  const existingItem = currentCart.find((item) => item.id === itemId);
  const currentQtyInCart = existingItem ? existingItem.quantity : 0;
  const totalQty = currentQtyInCart + qty;

  // Kiểm tra vượt quá tồn kho
  if (totalQty > stockLimit) {
    return Swal.fire({
      icon: 'warning',
      title: 'Vượt quá số lượng trong kho!',
      html: `Bạn đã có <b>${currentQtyInCart}</b> sản phẩm trong giỏ.<br>Kho chỉ còn <b>${stockLimit}</b> sản phẩm.<br>Không thể thêm <b>${qty}</b> sản phẩm nữa.`,
      confirmButtonText: 'Đã hiểu',
    });
  }

  // Kiểm tra vượt quá giới hạn mua lẻ (MAX 10)
  if (totalQty > MAX_QTY_PER_ITEM) {
    return Swal.fire({
      icon: 'info',
      title: 'Giới hạn mua lẻ',
      html: `Bạn đã có <b>${currentQtyInCart}</b> sản phẩm trong giỏ.<br>Giới hạn mua lẻ là <b>${MAX_QTY_PER_ITEM}</b> sản phẩm.<br><br><small class="text-gray-500">💡 Để đặt số lượng lớn, vui lòng liên hệ hotline để có giá ưu đãi!</small>`,
      confirmButtonText: 'Đã hiểu',
    });
  }

  // Dữ liệu chuẩn để lưu vào LocalStorage
  const cartItem = {
    id: itemId,
    product_id: state.product.id,
    variant_id: state.selectedVariant ? state.selectedVariant.id : null,
    name: state.product.name,
    color: state.selectedColor || null,
    size: state.selectedSize || null,
    variant_name: (() => {
      const parts = [];
      if (state.selectedColor) parts.push(state.selectedColor);
      if (state.selectedSize) parts.push(state.selectedSize);
      return parts.length > 0 ? `(${parts.join(', ')})` : '';
    })(),
    price: state.selectedVariant
      ? Number(state.selectedVariant.price)
      : Number(state.product.defaultPrice),
    image: state.product.images[0],
    quantity: qty,
    stock: stockLimit,
  };

  console.log('🛒 Thêm vào giỏ:', cartItem);

  CartService.add(cartItem, qty);
};

// Hàm Mua ngay: Chuyển thẳng đến checkout với chỉ sản phẩm này
window.buyNow = () => {
  // Kiểm tra variant (màu sắc, kích thước) trước khi thêm
  if (state.availableColors.length > 0 && !state.selectedColor) {
    return Swal.fire({
      icon: 'warning',
      title: 'Vui lòng chọn màu sắc',
      confirmButtonText: 'Đã hiểu',
    });
  }

  if (state.availableSizes.length > 0 && !state.selectedSize) {
    return Swal.fire({
      icon: 'warning',
      title: 'Vui lòng chọn kích thước',
      confirmButtonText: 'Đã hiểu',
    });
  }

  // Lấy số lượng
  const input = document.getElementById('qty-input');
  const qty = parseInt(input.value) || 1;

  // Kiểm tra tồn kho
  const stockLimit = state.selectedVariant
    ? state.selectedVariant.quantity
    : 999;

  if (qty > stockLimit) {
    return Swal.fire({
      icon: 'error',
      title: 'Không đủ hàng',
      text: `Kho chỉ còn ${stockLimit} sản phẩm`,
      confirmButtonText: 'Đã hiểu',
    });
  }

  // Tạo ID duy nhất cho item trong giỏ
  const itemId = `${state.product.id}_${
    state.selectedVariant ? state.selectedVariant.id : 'default'
  }`;

  // Kiểm tra giới hạn mua lẻ
  if (qty > MAX_QTY_PER_ITEM) {
    return Swal.fire({
      icon: 'info',
      title: 'Giới hạn mua lẻ',
      html: `Giới hạn mua lẻ là <b>${MAX_QTY_PER_ITEM}</b> sản phẩm.<br><br><small class="text-gray-500">💡 Để đặt số lượng lớn, vui lòng liên hệ hotline!</small>`,
      confirmButtonText: 'Đã hiểu',
    });
  }

  // Tạo cart item cho "mua ngay"
  const buyNowItem = {
    id: itemId,
    product_id: state.product.id,
    variant_id: state.selectedVariant ? state.selectedVariant.id : null,
    name: state.product.name,
    color: state.selectedColor || null,
    size: state.selectedSize || null,
    variant_name: (() => {
      const parts = [];
      if (state.selectedColor) parts.push(state.selectedColor);
      if (state.selectedSize) parts.push(state.selectedSize);
      return parts.length > 0 ? `(${parts.join(', ')})` : '';
    })(),
    price: state.selectedVariant
      ? Number(state.selectedVariant.price)
      : Number(state.product.defaultPrice),
    image: state.product.images[0],
    quantity: qty,
    stock: stockLimit,
  };

  // Lưu vào sessionStorage với flag "buy_now"
  sessionStorage.setItem('buy_now_item', JSON.stringify(buyNowItem));
  sessionStorage.setItem('buy_now_mode', 'true');

  console.log('🛒 Buy now item saved:', buyNowItem);

  // Hiển thị thông báo và chuyển đến checkout
  Swal.fire({
    icon: 'success',
    title: 'Mua ngay!',
    text: 'Đang chuyển đến trang thanh toán...',
    timer: 800,
    showConfirmButton: false,
    timerProgressBar: true,
  }).then(() => {
    window.location.href = '/checkout.html';
  });
};

// Logic đổi ảnh gallery
window.changeImage = (src, thumbEl) => {
  const mainImg = document.getElementById('main-image');
  mainImg.style.opacity = 0;
  setTimeout(() => {
    mainImg.src = src;
    mainImg.style.opacity = 1;
  }, 200);

  document.querySelectorAll('.thumbnail-item').forEach((el) => {
    el.classList.remove('border-blue-600', 'ring-2', 'ring-blue-600/20');
    el.classList.add('border-transparent');
  });
  thumbEl.classList.remove('border-transparent');
  thumbEl.classList.add('border-blue-600', 'ring-2', 'ring-blue-600/20');
};

// Logic tăng giảm số lượng
window.updateQty = (change) => {
  const input = document.getElementById('qty-input');
  let val = parseInt(input.value) + change;
  if (val < 1) val = 1;

  // Lấy số lượng tồn kho
  const stockLimit = state.selectedVariant
    ? state.selectedVariant.quantity
    : 999;

  // Kiểm tra giới hạn tồn kho
  if (val > stockLimit) {
    Swal.fire({
      toast: true,
      icon: 'warning',
      title: `Kho chỉ còn ${stockLimit} sản phẩm`,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
    val = stockLimit;
  }

  // Kiểm tra giới hạn mua lẻ (MAX 10)
  if (val > MAX_QTY_PER_ITEM) {
    Swal.fire({
      toast: true,
      icon: 'info',
      title: 'Giới hạn mua lẻ là 10',
      text: 'Để đặt số lượng lớn, vui lòng liên hệ hotline để có giá ưu đãi',
      position: 'top-end',
      showConfirmButton: false,
      timer: 5000,
      timerProgressBar: true,
    });
    val = MAX_QTY_PER_ITEM;
  }

  input.value = val;
};

window.switchTab = (tabId) => {
  document
    .querySelectorAll('.tab-content')
    .forEach((el) => el.classList.add('hidden'));
  document.getElementById(`tab-${tabId}`).classList.remove('hidden');

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
    btn.classList.add('text-gray-500');
  });

  const btnMap = { desc: 0, specs: 1, reviews: 2 };
  const btns = document.querySelectorAll('.tab-btn');
  if (btns[btnMap[tabId]]) {
    btns[btnMap[tabId]].classList.add(
      'text-blue-600',
      'border-b-2',
      'border-blue-600'
    );
    btns[btnMap[tabId]].classList.remove('text-gray-500');
  }
};

//todo: === REVIEWS FUNCTIONALITY ===

// Hàm: Lấy ID người dùng hiện tại từ localStorage (Giả định)
const getCurrentUserId = () => {
  // Giả định bạn lưu User ID trong localStorage sau khi đăng nhập
  const user = JSON.parse(localStorage.getItem('user'));
  console.log(user);
  console.log(user.id);
  return user.id;
  // Nếu bạn chỉ lưu token và cần giải mã token để lấy ID, bạn cần điều chỉnh hàm này.
  // Nếu bạn không có User ID, việc kiểm tra này sẽ KHÔNG THỰC HIỆN được.
};

// Hàm: Tải Reviews và kiểm tra xem User hiện tại đã đánh giá chưa
const checkExistingReviewAndLoad = async (productId, page = 1) => {
  console.log('getCurrentUserId rt:' + getCurrentUserId());
  const currentUserId = getCurrentUserId();
  console.log(currentUserId);
  const reviewFormContainer = document.getElementById('review-form-container');
  const reviewPermissionNotice = document.getElementById(
    'review-permission-notice'
  );

  // Luôn load reviews trước
  const reviews = await loadReviews(productId, page);
  // Nếu chưa đăng nhập hoặc không có orderIdFromUrl, ta sẽ kiểm tra lại ở checkReviewPermission sau
  if (!currentUserId) return;

  // Kiểm tra đã đánh giá chưa
  let userHasReviewed = false;
  console.log('đang trong hàm check xem user đã reviews chưa: ' + reviews);
  if (reviews && reviews.length > 0) {
    userHasReviewed = reviews.some(
      (review) => String(review.user_id) === String(currentUserId)
    );
  }
  console.log(userHasReviewed);

  if (userHasReviewed) {
    console.log(
      '🚫 User has already reviewed this product based on reviews list.'
    );
    reviewFormContainer.classList.add('hidden');
    if (reviewPermissionNotice) {
      reviewPermissionNotice.classList.remove('hidden');
      reviewPermissionNotice.innerHTML = `
                  <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-center">
                      <p class="text-blue-800 dark:text-blue-200">
                          <i class="fas fa-check-circle mr-2"></i>
                          Bạn đã đánh giá sản phẩm này rồi. (Mỗi sản phẩm chỉ được đánh giá 1 lần.)
                      </p>
                  </div>
              `;
    }
    return true; // Đã đánh giá
  }

  // Nếu chưa đánh giá, tiếp tục logic check mua hàng
  return false;
};

const getQueryParam = (key) => {
  return new URLSearchParams(window.location.search).get(key);
};
// Lấy Order ID từ URL (ví dụ: ...?id=61&order_id=36)
const orderIdFromUrl = getQueryParam('order_id');
console.log(orderIdFromUrl);
// Giả định biến 'id' (Product ID) đã được lấy từ URL query params khác hoặc global scope.

let currentReviewPage = 1;
let selectedRating = 0;
let currentReviews = [];
let currentStats = {
  total_reviews: 0,
  average_rating: 0,
  rating_distribution: {},
};

// Hàm: Gọi endpoint kiểm tra trạng thái thanh toán
const checkPaymentStatus = async (orderId) => {
  if (!orderId) {
    // Ném lỗi nếu thiếu ID, hàm gọi sẽ bắt và xử lý
    throw new Error('Thiếu Order ID để kiểm tra trạng thái thanh toán.');
  }
  // GỌI API của bạn: /api/v1/payments/status/{id}
  const res = await api.get(`/payments/status/${orderId}`);
  return res.data;
};

// Hàm: Kiểm tra điều kiện có được phép hiển thị form đánh giá không (chỉ dựa vào trạng thái thanh toán)
const checkUserCanReview = async (orderId) => {
  try {
    // 1. Kiểm tra trạng thái thanh toán (Sử dụng endpoint /payments/status/{id})
    const paymentStatusResponse = await checkPaymentStatus(orderId);

    // Trích xuất phần data lồng bên trong
    const paymentStatusData = paymentStatusResponse.data?.data;

    // --- ĐIỂM SỬA LỖI: THÊM TRẠNG THÁI 'delivered' ---
    const isOrderEligible =
      paymentStatusData.order_status === 'confirmed' ||
      paymentStatusData.order_status === 'delivered';
    // --------------------------------------------------

    // Kiểm tra điều kiện thành công:
    // 1. API phải thành công
    // 2. Dữ liệu phải tồn tại
    // 3. Thanh toán phải là 'paid'
    // 4. Trạng thái đơn hàng phải là 'confirmed' HOẶC 'delivered'
    if (
      paymentStatusResponse.status === 'success' &&
      paymentStatusData &&
      paymentStatusData.payment_status === 'paid' &&
      isOrderEligible
    ) {
      let successMessage = 'Đơn hàng đã được thanh toán và xác nhận.';
      if (paymentStatusData.order_status === 'delivered') {
        successMessage = 'Đơn hàng đã giao thành công. Bạn có thể đánh giá.';
      }

      return { can_review: true, message: successMessage };
    } else {
      // Trường hợp: processing, error, pending, hoặc order_status chưa hợp lệ
      let message =
        'Đơn hàng chưa hoàn tất hoặc đang chờ xác nhận. Vui lòng thử lại sau.';
      if (paymentStatusData) {
        message = `Đơn hàng đang ở trạng thái Thanh toán: ${paymentStatusData.payment_status}, Đơn hàng: ${paymentStatusData.order_status}. Bạn chỉ có thể đánh giá khi đơn hàng được xác nhận hoặc đã giao hàng.`;
      }
      return {
        can_review: false,
        message: message,
      };
    }
  } catch (error) {
    console.error('Lỗi khi kiểm tra trạng thái thanh toán:', error);
    return {
      can_review: false,
      message: 'Không tìm thấy đơn hàng hoặc lỗi hệ thống.',
    };
  }
};

// Load reviews stats
const loadReviewsStats = async (productId) => {
  try {
    const res = await api.get(`/reviews/stats/${productId}`);
    const stats = res.data.data || res.data;

    // Store stats for later manipulation
    currentStats = stats;

    console.log('✅ Reviews stats loaded:', stats);

    // Update average rating
    document.getElementById('avg-rating').textContent =
      stats.average_rating?.toFixed(1) || '0.0';
    document.getElementById('total-reviews').textContent = `${
      stats.total_reviews || 0
    } đánh giá`;

    // Render stars
    const avgStars = document.getElementById('avg-stars');
    avgStars.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
      const star = i <= Math.round(stats.average_rating || 0) ? '★' : '☆';
      avgStars.innerHTML += star;
    }

    // Render rating breakdown
    const breakdown = document.getElementById('rating-breakdown');
    breakdown.innerHTML = '';

    if (stats.rating_distribution) {
      for (let i = 5; i >= 1; i--) {
        const count = stats.rating_distribution[`${i}_star`] || 0;
        const percentage =
          stats.total_reviews > 0
            ? ((count / stats.total_reviews) * 100).toFixed(0)
            : 0;

        breakdown.innerHTML += `
                    <div class="flex items-center gap-3">
                        <span class="text-sm w-12">${i} sao</span>
                        <div class="flex-1 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div class="h-full bg-yellow-400" style="width: ${percentage}%"></div>
                        </div>
                        <span class="text-sm text-gray-500 w-12 text-right">${count}</span>
                    </div>
                `;
      }
    }
  } catch (error) {
    console.warn('Reviews stats not available:', error.response?.status);
    // Hiển thị giá trị mặc định nếu chưa có reviews (404 hoặc 400)
    if (error.response?.status === 404 || error.response?.status === 400) {
      const avgRatingEl = document.getElementById('avg-rating');
      const totalReviewsEl = document.getElementById('total-reviews');
      const avgStarsEl = document.getElementById('avg-stars');

      if (avgRatingEl) avgRatingEl.textContent = '0.0';
      if (totalReviewsEl) totalReviewsEl.textContent = '0 đánh giá';
      if (avgStarsEl) avgStarsEl.innerHTML = '☆☆☆☆☆';

      const breakdown = document.getElementById('rating-breakdown');
      if (breakdown) {
        breakdown.innerHTML = `
                    <div class="text-center py-4 text-gray-400 text-sm">
                        Chưa có đánh giá nào
                    </div>
                `;
      }
    }
  }
};

// Load reviews list
const loadReviews = async (productId, page = 1) => {
  const container = document.getElementById('reviews-list');
  const paginationContainer = document.getElementById('reviews-pagination');

  if (!container) return [];

  try {
    const res = await api.get(
      `/reviews/product/${productId}?page=${page}&limit=5`
    );

    // --- ĐIỂM SỬA LỖI QUAN TRỌNG: TRUY CẬP ĐÚNG CẤU TRÚC JSON LỒNG ---
    // res.data -> { status: 'success', data: { data: [reviews], pagination: {...} } }
    // Cần lấy: res.data.data.data (mảng reviews)
    const reviewsData = res.data?.data;
    const reviews = reviewsData?.data || [];
    const pagination = reviewsData?.pagination;

    console.log('Reviews Array (After fix, length should be > 0):', reviews);

    // Store reviews for later manipulation
    currentReviews = reviews;

    // ... (Phần xử lý Reviews || Reviews.length === 0 giữ nguyên) ...
    if (!reviews || reviews.length === 0) {
      container.innerHTML = `
                <div class="text-center py-10">
                    <p class="text-gray-500 dark:text-gray-400">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
                </div>
            `;
      if (paginationContainer) paginationContainer.innerHTML = '';
      return [];
    }

    // --- BẮT ĐẦU RENDER (Phần này giữ nguyên logic, chỉ sử dụng biến reviews đã fix) ---
    container.innerHTML = reviews
      .map((review) => {
        const formattedDate = review.created_at
          ? new Date(review.created_at).toLocaleDateString('vi-VN')
          : 'Vừa xong';
        const userInitial = (review.user_name || 'User')
          .substring(0, 2)
          .toUpperCase();

        return `
                        <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
                            <div class="flex justify-between items-start mb-4">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">
                                        ${userInitial}
                                    </div>
                                    <div>
                                        <h4 class="font-bold text-sm text-slate-900 dark:text-white">
                                            ${review.user_name || 'Người dùng'}
                                        </h4>
                                        <div class="flex text-yellow-400 text-xs">
                                            ${'★'.repeat(
                                              review.rating
                                            )}${'☆'.repeat(5 - review.rating)}
                                        </div>
                                    </div>
                                </div>
                                <span class="text-xs text-gray-400">${formattedDate}</span>
                            </div>
                            <p class="text-sm text-gray-600 dark:text-gray-300">${
                              review.content || review.comment || ''
                            }</p>
                            ${
                              review.reply
                                ? `
                                <div class="mt-4 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border-l-4 border-blue-500">
                                    <p class="text-xs font-bold text-blue-600 dark:text-blue-400">Phản hồi từ Quản trị viên:</p>
                                    <p class="text-sm text-gray-700 dark:text-gray-200">${review.reply}</p>
                                </div>
                            `
                                : ''
                            }
                        </div>
                    `;
      })
      .join('');

    // Render pagination
    if (pagination && pagination.total_pages > 1) {
      renderReviewsPagination(pagination);
    } else {
      if (paginationContainer) paginationContainer.innerHTML = '';
    }
    return reviews;
  } catch (error) {
    console.warn(
      'Reviews list not available or API error:',
      error.response?.status
    );
    // ... (Logic xử lý lỗi API - giữ nguyên) ...
    if (paginationContainer) paginationContainer.innerHTML = '';
    return [];
  }
};
// Render pagination
const renderReviewsPagination = (pagination) => {
  const container = document.getElementById('reviews-pagination');
  container.innerHTML = '';

  for (let i = 1; i <= pagination.total_pages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = `px-4 py-2 rounded-lg border transition-colors ${
      i === pagination.current_page
        ? 'bg-blue-600 text-white border-blue-600'
        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-blue-600'
    }`;
    btn.onclick = () => {
      currentReviewPage = i;
      loadReviews(id, i);
    };
    container.appendChild(btn);
  }
};

// Helper: Thêm review mới vào đầu danh sách
const addReviewToList = (newReview) => {
  const container = document.getElementById('reviews-list');
  if (!container) return;

  // Tạo HTML cho review mới
  const reviewHTML = `
        <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm animate-fadeIn">
            <div class="flex justify-between items-start mb-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center font-bold text-green-600 dark:text-green-400">
                        ${(newReview.user_name || 'User')
                          .substring(0, 2)
                          .toUpperCase()}
                    </div>
                    <div>
                        <h4 class="font-bold text-sm text-slate-900 dark:text-white">
                            ${newReview.user_name || 'Người dùng'}
                            <span class="ml-2 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">Mới</span>
                        </h4>
                        <div class="flex text-yellow-400 text-xs">
                            ${'★'.repeat(newReview.rating)}${'☆'.repeat(
    5 - newReview.rating
  )}
                        </div>
                    </div>
                </div>
                <span class="text-xs text-gray-400">Vừa xong</span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-300">${
              newReview.content
            }</p>
        </div>
    `;

  // Nếu đang hiển thị "Chưa có đánh giá", thay thế bằng review mới
  if (container.innerHTML.includes('Chưa có đánh giá')) {
    container.innerHTML = reviewHTML;
  } else {
    // Thêm vào đầu danh sách
    container.insertAdjacentHTML('afterbegin', reviewHTML);
  }

  // Add to currentReviews array
  currentReviews.unshift(newReview);
};

// Helper: Cập nhật stats sau khi thêm review
const updateReviewStats = (newRating) => {
  const avgRatingEl = document.getElementById('avg-rating');
  const totalReviewsEl = document.getElementById('total-reviews');
  const avgStarsEl = document.getElementById('avg-stars');

  if (!avgRatingEl || !totalReviewsEl) return;

  // Tính toán stats mới
  const oldTotal = currentStats.total_reviews || 0;
  const oldAvg = currentStats.average_rating || 0;
  const newTotal = oldTotal + 1;
  const newAvg = (oldAvg * oldTotal + newRating) / newTotal;

  // Cập nhật UI
  avgRatingEl.textContent = newAvg.toFixed(1);
  totalReviewsEl.textContent = `${newTotal} đánh giá`;

  // Cập nhật stars
  if (avgStarsEl) {
    avgStarsEl.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
      const star = i <= Math.round(newAvg) ? '★' : '☆';
      avgStarsEl.innerHTML += star;
    }
  }

  // Cập nhật breakdown
  const breakdown = document.getElementById('rating-breakdown');
  if (breakdown && currentStats.rating_distribution) {
    const dist = { ...currentStats.rating_distribution };
    const key = `${newRating}_star`;
    dist[key] = (dist[key] || 0) + 1;

    breakdown.innerHTML = '';
    for (let i = 5; i >= 1; i--) {
      const count = dist[`${i}_star`] || 0;
      const percentage =
        newTotal > 0 ? ((count / newTotal) * 100).toFixed(0) : 0;

      breakdown.innerHTML += `
                <div class="flex items-center gap-3">
                    <span class="text-sm w-12">${i} sao</span>
                    <div class="flex-1 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div class="h-full bg-yellow-400 transition-all duration-500" style="width: ${percentage}%"></div>
                    </div>
                    <span class="text-sm text-gray-500 w-12 text-right">${count}</span>
                </div>
            `;
    }

    // Update stored stats
    currentStats.total_reviews = newTotal;
    currentStats.average_rating = newAvg;
    currentStats.rating_distribution = dist;
  }
};

// Handle rating stars selection
document.addEventListener('DOMContentLoaded', () => {
  const starBtns = document.querySelectorAll('.star-btn');
  const ratingValue = document.getElementById('rating-value');

  starBtns.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      selectedRating = index + 1;
      ratingValue.value = selectedRating;

      // Update star colors
      starBtns.forEach((star, i) => {
        if (i < selectedRating) {
          star.classList.remove('text-gray-300');
          star.classList.add('text-yellow-400');
        } else {
          star.classList.add('text-gray-300');
          star.classList.remove('text-yellow-400');
        }
      });
    });
  });

  // Handle review form submit
  const reviewForm = document.getElementById('review-form');
  if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const token = localStorage.getItem('token');
      if (!token) {
        // ... (Logic thông báo đăng nhập - giữ nguyên) ...
        return;
      }

      const rating = document.getElementById('rating-value').value;
      const comment = document.getElementById('review-comment').value.trim();

      if (!rating || !comment) {
        // ... (Logic thông báo thiếu thông tin - giữ nguyên) ...
        return;
      }

      // --- BẮT ĐẦU PHẦN GỬI ĐÁNH GIÁ ĐÃ CẬP NHẬT ---
      // Kiểm tra lại quyền trước khi gửi (để đảm bảo không có thay đổi trạng thái sau khi tải trang)
      if (!orderIdFromUrl) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi xác thực',
          text: 'Không tìm thấy ID đơn hàng. Vui lòng thử lại từ lịch sử đơn hàng.',
        });
        return;
      }

      try {
        Swal.fire({
          title: 'Đang gửi đánh giá...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        // GỌI API GỬI ĐÁNH GIÁ VÀ TRUYỀN THÊM order_id
        const newReview = await ReviewService.submitReview({
          product_id: Number(id),
          rating: Number(rating),
          content: comment,
          order_id: Number(orderIdFromUrl), // <<< TRUYỀN ORDER ID
        });

        Swal.fire({
          icon: 'success',
          title: 'Gửi đánh giá thành công!',
          text: 'Cảm ơn bạn đã đánh giá sản phẩm.',
          timer: 1500,
          showConfirmButton: false,
        });

        // Reset form, ẩn form, hiển thị thông báo đã đánh giá
        reviewForm.reset();
        selectedRating = 0;
        starBtns.forEach((star) => {
          star.classList.add('text-gray-300');
          star.classList.remove('text-yellow-400');
        });

        const reviewFormContainer = document.getElementById(
          'review-form-container'
        );
        const reviewPermissionNotice = document.getElementById(
          'review-permission-notice'
        );

        if (reviewFormContainer) {
          reviewFormContainer.classList.add('hidden');
        }

        if (reviewPermissionNotice) {
          reviewPermissionNotice.classList.remove('hidden');
          reviewPermissionNotice.innerHTML = `
                        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-center">
                            <p class="text-blue-800 dark:text-blue-200">
                                <i class="fas fa-check-circle mr-2"></i>
                                Bạn đã đánh giá sản phẩm này rồi
                            </p>
                        </div>
                    `;
        }

        // Thêm review mới và cập nhật stats
        addReviewToList({
          id: newReview?.id || Date.now(),
          user_name: localStorage.getItem('username') || 'Bạn',
          rating: Number(rating),
          content: comment,
          created_at: new Date().toISOString(),
        });

        updateReviewStats(Number(rating));
      } catch (error) {
        console.error('Error submitting review:', error);
        Swal.fire({
          icon: 'error',
          title: 'Gửi đánh giá thất bại',
          text:
            error.response?.data?.message ||
            'Đã có lỗi xảy ra. Vui lòng thử lại sau. (Lưu ý: Bạn chỉ được đánh giá 1 lần cho mỗi đơn hàng.)',
        });
      }
    });
  }
  // --- KẾT THÚC PHẦN GỬI ĐÁNH GIÁ ĐÃ CẬP NHẬT ---

  // Load reviews when tab is clicked
  const reviewsTab = document.querySelector('[data-tab="tab-reviews"]');
  if (reviewsTab) {
    reviewsTab.addEventListener('click', () => {
      if (id) {
        loadReviewsStats(id);
        loadReviews(id, 1);
        // CHỈ CẦN GỌI VỚI PRODUCT ID
        checkReviewPermission(id);
      }
    });
  }

  // Auto-open reviews tab if hash is #reviews (từ profile "Đánh giá" button)
  if (window.location.hash === '#reviews') {
    setTimeout(() => {
      const reviewsTab = document.querySelector('[data-tab="tab-reviews"]');
      if (reviewsTab) {
        reviewsTab.click();
        // Scroll logic (Giữ nguyên)
        setTimeout(() => {
          const reviewForm = document.getElementById('review-form-container');
          if (reviewForm && !reviewForm.classList.contains('hidden')) {
            reviewForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const firstStar = document.querySelector('.rating-star');
            if (firstStar) {
              firstStar.focus();
            }
          } else {
            const reviewsSection = document.getElementById('tab-reviews');
            if (reviewsSection) {
              reviewsSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              });
            }
          }
        }, 800);
      }
    }, 500);
  }

  // Initialize product detail
  initDetail();
});

// Kiểm tra xem user có quyền đánh giá sản phẩm này không (dựa trên orderIdFromUrl)
const checkReviewPermission = async (productId) => {
  console.log(
    'Checking review permission for product:',
    productId,
    'and order:',
    orderIdFromUrl
  );

  const reviewFormContainer = document.getElementById('review-form-container');
  const reviewPermissionNotice = document.getElementById(
    'review-permission-notice'
  );
  console.log('Lấy đc review form container');
  if (!reviewFormContainer) return;
  const token = localStorage.getItem('token');

  // 1. CHƯA ĐĂNG NHẬP
  if (!token) {
    reviewFormContainer.classList.add('hidden');
    if (reviewPermissionNotice) {
      reviewPermissionNotice.classList.remove('hidden');
      reviewPermissionNotice.innerHTML = `
                <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 text-center">
                    <p class="text-yellow-800 dark:text-yellow-200">
                        <i class="fas fa-info-circle mr-2"></i>
                        Bạn cần đăng nhập để đánh giá sản phẩm
                    </p>
                    <a href="/login.html" class="inline-block mt-3 px-4 py-2 bg-[#0A2A45] text-white rounded-lg hover:bg-[#153e60] transition-colors">
                        Đăng nhập ngay
                    </a>
                </div>
            `;
    }
    return;
  }
  const alreadyReviewed = await checkExistingReviewAndLoad(productId);
  if (alreadyReviewed) {
    return;
  }
  console.log('Chưa từng comment');
  console.log(alreadyReviewed);
  // 2. ĐÃ ĐĂNG NHẬP - KIỂM TRA ĐIỀU KIỆN ĐƠN HÀNG/THANH TOÁN
  if (!orderIdFromUrl) {
    // Nếu user truy cập thẳng mà không có order_id trong URL
    reviewFormContainer.classList.add('hidden');
    if (reviewPermissionNotice) {
      reviewPermissionNotice.classList.remove('hidden');
      reviewPermissionNotice.innerHTML = `
                <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
                    <p class="text-red-800 dark:text-red-200">
                        <i class="fas fa-times-circle mr-2"></i>
                        hãy mua hàng đễ có thể đánh giá.
                    </p>
                </div>
            `;
    }
    return;
  }

  try {
    // Gọi hàm kiểm tra quyền mới (chỉ dựa vào trạng thái thanh toán)
    const permissionCheck = await checkUserCanReview(orderIdFromUrl);

    if (permissionCheck.can_review) {
      // Đã thanh toán thành công -> HIỂN THỊ FORM
      console.log('✅ Payment successful - Showing review form.');
      reviewFormContainer.classList.remove('hidden');
      if (reviewPermissionNotice) {
        reviewPermissionNotice.classList.add('hidden');
      }
      // Thêm logic kiểm tra xem user đã review chưa (Tùy chọn FE/BẮT BUỘC BE)
      // Nếu muốn kiểm tra đã review chưa ở FE:
      // const existingReview = await ReviewService.getMyReview(productId, orderIdFromUrl);
      // if (existingReview) { /* Logic ẩn form và thông báo đã review */ }
    } else {
      // Chưa thanh toán thành công -> ẨN FORM VÀ HIỂN THỊ THÔNG BÁO LÝ DO
      console.log('🚫 Payment not successful or Order ID missing.');
      reviewFormContainer.classList.add('hidden');
      if (reviewPermissionNotice) {
        reviewPermissionNotice.classList.remove('hidden');
        reviewPermissionNotice.innerHTML = `
                    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
                        <p class="text-red-800 dark:text-red-200">
                            <i class="fas fa-times-circle mr-2"></i>
                            ${permissionCheck.message}
                        </p>
                    </div>
                `;
      }
    }
  } catch (error) {
    console.error('❌ General error during permission check:', error);
    // Fallback: Ẩn form nếu có lỗi mạng nghiêm trọng
    reviewFormContainer.classList.add('hidden');
  }
};

// === FAVORITES FUNCTIONALITY ===
window.toggleFavoriteDetail = async () => {
  try {
    const isFavorited = await favoritesService.toggleFavorite(id);
    await updateFavoriteButtonState();
  } catch (err) {
    console.error('Error toggling favorite:', err);
  }
};

const updateFavoriteButtonState = async () => {
  const btn = document.getElementById('favorite-btn-detail');
  if (!btn) return;

  try {
    const isFavorited = await favoritesService.isFavorite(id);
    if (isFavorited) {
      btn.classList.remove('text-gray-400');
      btn.classList.add('text-red-500', 'fill-current');
      btn.title = 'Xóa khỏi yêu thích';
    } else {
      btn.classList.add('text-gray-400');
      btn.classList.remove('text-red-500', 'fill-current');
      btn.title = 'Thêm vào yêu thích';
    }
  } catch (err) {
    console.error('Error checking favorite state:', err);
  }
};

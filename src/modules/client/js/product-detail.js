import api, { getImageUrl } from '../../../shared/services/api.js';
import CartService from '../../../shared/services/cart.js';
import ReviewService from '../../../shared/services/review.js';
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
    }

    // Render ra màn hình
    renderInfo();
    renderGallery();
    renderVariants();
    renderSpecs(); // Hàm mới để render bảng thông số
    renderRelated(apiData.brand_id);
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

  // 1. Ảnh chính
  const mainImg = document.getElementById('main-image');
  if (mainImg) {
    mainImg.src = images[0]; // Ảnh đầu tiên
    mainImg.onload = () => {
      mainImg.style.opacity = 1;
    };
  }

  // 2. Thumbnails
  const container = document.getElementById('thumbnail-container');
  if (!container) return;

  // Chỉ render nếu có nhiều hơn 1 ảnh, hoặc render chính nó nếu chỉ có 1
  const displayImages = images.length > 0 ? images : [state.product.image];

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

// --- 3. LOGIC SẢN PHẨM LIÊN QUAN ---
const renderRelated = async (brandId) => {
  const container = document.getElementById('related-products-container');
  if (!container) return;

  try {
    // Gọi API lấy danh sách (có thể tối ưu bằng endpoint /products/related/{id} nếu BE hỗ trợ)
    const res = await api.get('/products');
    const all = res.data.data || res.data;

    // Lọc cùng Brand, khác ID hiện tại
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

// === REVIEWS FUNCTIONALITY ===
let currentReviewPage = 1;
let selectedRating = 0;

// Load reviews stats
const loadReviewsStats = async (productId) => {
  try {
    const res = await api.get(`/reviews/stats/${productId}`);
    const stats = res.data.data || res.data;

    console.log('Reviews stats:', stats);

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
    console.error('Error loading reviews stats:', error);
  }
};

// Load reviews list
const loadReviews = async (productId, page = 1) => {
  try {
    const res = await api.get(
      `/reviews/product/${productId}?page=${page}&limit=5`
    );
    const data = res.data.data || res.data;
    const reviews = data.reviews || data;

    console.log('Reviews list:', reviews);

    const container = document.getElementById('reviews-list');

    if (!reviews || reviews.length === 0) {
      container.innerHTML = `
        <div class="text-center py-10">
          <p class="text-gray-500 dark:text-gray-400">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = reviews
      .map(
        (review) => `
      <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
        <div class="flex justify-between items-start mb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">
              ${(review.user_name || 'User').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h4 class="font-bold text-sm text-slate-900 dark:text-white">
                ${review.user_name || 'Người dùng'}
              </h4>
              <div class="flex text-yellow-400 text-xs">
                ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
              </div>
            </div>
          </div>
          <span class="text-xs text-gray-400">${new Date(
            review.created_at
          ).toLocaleDateString('vi-VN')}</span>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-300">${
          review.comment
        }</p>
      </div>
    `
      )
      .join('');

    // Render pagination if needed
    if (data.pagination && data.pagination.total_pages > 1) {
      renderReviewsPagination(data.pagination);
    }
  } catch (error) {
    console.error('Error loading reviews:', error);
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
        Swal.fire({
          icon: 'warning',
          title: 'Yêu cầu đăng nhập',
          text: 'Bạn cần đăng nhập để đánh giá sản phẩm.',
          confirmButtonText: 'Đăng nhập',
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.href = '/login.html';
          }
        });
        return;
      }

      const rating = document.getElementById('rating-value').value;
      const comment = document.getElementById('review-comment').value.trim();

      if (!rating || !comment) {
        Swal.fire({
          icon: 'error',
          title: 'Thiếu thông tin',
          text: 'Vui lòng chọn số sao và nhập nhận xét.',
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

        // Sử dụng ReviewService.submitReview thay vì gọi API trực tiếp
        await ReviewService.submitReview({
          product_id: Number(id),
          rating: Number(rating),
          comment: comment,
        });

        Swal.fire({
          icon: 'success',
          title: 'Gửi đánh giá thành công!',
          text: 'Cảm ơn bạn đã đánh giá sản phẩm.',
          timer: 2000,
        });

        // Reset form
        reviewForm.reset();
        selectedRating = 0;
        starBtns.forEach((star) => {
          star.classList.add('text-gray-300');
          star.classList.remove('text-yellow-400');
        });

        // Reload reviews và check lại quyền review
        loadReviewsStats(id);
        loadReviews(id, 1);
        await checkReviewPermission(id);
      } catch (error) {
        console.error('Error submitting review:', error);
        Swal.fire({
          icon: 'error',
          title: 'Gửi đánh giá thất bại',
          text:
            error.response?.data?.message ||
            error.message ||
            'Đã có lỗi xảy ra. Vui lòng thử lại sau.',
        });
      }
    });
  }

  // Load reviews when tab is clicked
  const reviewsTab = document.querySelector('[data-tab="tab-reviews"]');
  if (reviewsTab) {
    reviewsTab.addEventListener('click', () => {
      if (id) {
        loadReviewsStats(id);
        loadReviews(id, 1);
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
        // Scroll to reviews section
        const reviewsSection = document.getElementById('tab-reviews');
        if (reviewsSection) {
          reviewsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 500);
  }

  // Initialize product detail
  initDetail();
});

// Kiểm tra quyền đánh giá và hiển thị form có điều kiện
const checkReviewPermission = async (productId) => {
  const reviewFormContainer = document.getElementById('review-form-container');
  const reviewPermissionNotice = document.getElementById(
    'review-permission-notice'
  );

  if (!reviewFormContainer) return;

  try {
    const permission = await ReviewService.canReview(productId);

    console.log('🔒 Review permission:', permission);

    if (permission.canReview) {
      // Hiển thị form đánh giá
      reviewFormContainer.classList.remove('hidden');
      if (reviewPermissionNotice) {
        reviewPermissionNotice.classList.add('hidden');
      }
    } else {
      // Ẩn form, hiển thị thông báo
      reviewFormContainer.classList.add('hidden');
      if (reviewPermissionNotice) {
        reviewPermissionNotice.classList.remove('hidden');
        reviewPermissionNotice.innerHTML = `
          <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 text-center">
            <p class="text-yellow-800 dark:text-yellow-200">
              <i class="fas fa-info-circle mr-2"></i>
              ${permission.reason}
            </p>
          </div>
        `;
      }
    }
  } catch (error) {
    console.error('Error checking review permission:', error);
    // Mặc định ẩn form nếu có lỗi
    reviewFormContainer.classList.add('hidden');
  }
};

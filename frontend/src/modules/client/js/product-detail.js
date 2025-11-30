import api, { getImageUrl } from '../../../shared/services/api.js';
import CartService from '../../../shared/services/cart.js';
import { formatCurrency } from '../../../shared/utils/format.js';
import Swal from '../../../shared/utils/swal.js';
import Swiper from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

const params = new URLSearchParams(window.location.search);
const id = params.get('id');

// STATE: Lưu trữ dữ liệu hiện tại
let state = {
  product: null,
  variants: [],
  selectedVariant: null,
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

    // Xử lý dữ liệu an toàn (Safe Parsing)
    const safeVariants = Array.isArray(apiData.variants)
      ? apiData.variants
      : [];

    // Parse Thumbnail (Backend có thể trả về chuỗi JSON hoặc Mảng)
    let safeImages = [getImageUrl(apiData.image)]; // Mặc định có ảnh đại diện
    if (apiData.thumbnail) {
      try {
        const parsedThumb =
          typeof apiData.thumbnail === 'string'
            ? JSON.parse(apiData.thumbnail)
            : apiData.thumbnail;
        if (Array.isArray(parsedThumb)) {
          // Gộp ảnh đại diện + ảnh thumbnail và xử lý đường dẫn
          safeImages = [
            getImageUrl(apiData.image),
            ...parsedThumb.map((img) => getImageUrl(img)),
          ];
        }
      } catch (e) {
        console.warn('Lỗi parse thumbnail', e);
      }
    }

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

    // Chọn variant mặc định (Cái đầu tiên)
    if (state.variants.length > 0) {
      state.selectedVariant = state.variants[0];
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

const renderVariants = () => {
  const container = document.getElementById('variant-options');
  if (!container) return;

  if (state.variants.length === 0) {
    container.innerHTML = ''; // Không có biến thể thì ẩn đi
    return;
  }

  const html = state.variants
    .map((v, index) => {
      const isSelected =
        state.selectedVariant && state.selectedVariant.id === v.id;
      // Style nút: Active (Xanh) vs Inactive (Xám)
      const activeClass = isSelected
        ? 'border-[#0A2A45] bg-[#0A2A45] text-white dark:border-blue-500 dark:bg-blue-600'
        : 'border-gray-300 text-gray-700 hover:border-[#0A2A45] dark:border-slate-600 dark:text-gray-300 bg-white dark:bg-slate-800';

      return `
            <button onclick="selectVariant(${index})" 
                class="px-4 py-2 border rounded-lg text-sm font-bold transition-all min-w-[80px] ${activeClass}">
                ${v.size}
            </button>
        `;
    })
    .join('');

  container.innerHTML = `
        <h4 class="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Kích thước</h4>
        <div class="flex gap-3 flex-wrap">${html}</div>
    `;
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

window.selectVariant = (index) => {
  state.selectedVariant = state.variants[index];
  renderVariants(); // Re-render để highlight nút active
  updatePriceDisplay(); // Update giá
};

window.addToCart = () => {
  // Validate
  if (state.variants.length > 0 && !state.selectedVariant) {
    return Swal.fire({ icon: 'warning', title: 'Vui lòng chọn kích thước!' });
  }

  const qty = parseInt(document.getElementById('qty-input').value) || 1;

  // Dữ liệu chuẩn để lưu vào LocalStorage
  const cartItem = {
    // ID Unique trong giỏ: ProductID + VariantID (nếu có)
    id: state.selectedVariant
      ? `${state.product.id}_${state.selectedVariant.id}`
      : `${state.product.id}`,
    product_id: state.product.id,
    name: state.product.name,
    // Nếu có size thì thêm vào tên hiển thị
    variant_name: state.selectedVariant
      ? `(${state.selectedVariant.size})`
      : '',
    price: state.selectedVariant
      ? Number(state.selectedVariant.price)
      : Number(state.product.defaultPrice),
    image: state.product.images[0], // Lấy ảnh chính
    size: state.selectedVariant ? state.selectedVariant.size : null,
    quantity: qty,
  };

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

  // Active style cho thumb
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
  // Có thể check max quantity nếu variant có trường quantity
  if (state.selectedVariant && val > state.selectedVariant.quantity) {
    Swal.fire({
      toast: true,
      icon: 'info',
      title: `Kho chỉ còn ${state.selectedVariant.quantity} sản phẩm`,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
    });
    val = state.selectedVariant.quantity;
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
  // Logic active đơn giản dựa trên text button
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

document.addEventListener('DOMContentLoaded', initDetail);

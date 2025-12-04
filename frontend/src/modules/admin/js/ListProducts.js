import { productRow } from '../components/RowProduct.js';
import { productSkeletonRows } from '../components/ProductSkeleton.js';
import api, { getImageUrl } from '../../../shared/services/api.js';

console.log("load list products admin")

const productTableBody = document.getElementById('product-list-body');
if (!productTableBody) { console.log("khong thay product table") }
console.log(productTableBody);

// Flag để tránh nhiều request đồng thời
let isLoading = false;

// Filter và Sort state
let filterState = {
	status: 'all', // 'all', '1' (còn hàng), '0' (hết hàng)
	sort: '', // 'price_asc', 'price_desc', 'stock_asc', 'stock_desc', 'newest', 'oldest'
	category_id: '',
	brand_id: '',
	price_min: '',
	price_max: '',
	search: ''
};

let categories = [];
let brands = [];

// Hàm khởi tạo lại tooltip sau khi render HTML động
const initTooltips = (container) => {
	if (!container) return;

	// Kiểm tra Bootstrap đã load chưa
	if (typeof bootstrap === 'undefined' || !bootstrap.Tooltip) {
		console.warn('Bootstrap chưa được load, không thể khởi tạo tooltip');
		return;
	}

	// Xóa các tooltip cũ nếu có
	const existingTooltips = container.querySelectorAll('[data-bs-toggle="tooltip"]');
	existingTooltips.forEach(el => {
		const tooltipInstance = bootstrap.Tooltip.getInstance(el);
		if (tooltipInstance) {
			tooltipInstance.dispose();
		}
	});

	// Khởi tạo tooltip mới (chỉ cho các element có data-bs-toggle="tooltip" và không phải dropdown)
	const tooltipTriggerList = container.querySelectorAll('[data-bs-toggle="tooltip"]');
	tooltipTriggerList.forEach((tooltipTriggerEl) => {
		// Chỉ khởi tạo tooltip nếu không phải dropdown toggle
		const toggleAttr = tooltipTriggerEl.getAttribute('data-bs-toggle');
		if (toggleAttr === 'tooltip') {
			new bootstrap.Tooltip(tooltipTriggerEl);
		}
	});
}

// Load categories và brands cho filter
const loadFilterOptions = async () => {
	try {
		// Load categories
		try {
			const catRes = await api.get('/categories');
			let catData = [];
			if (catRes.data && catRes.data.data && Array.isArray(catRes.data.data.data)) {
				catData = catRes.data.data.data;
			} else if (catRes.data && Array.isArray(catRes.data.data)) {
				catData = catRes.data.data;
			} else if (Array.isArray(catRes.data)) {
				catData = catRes.data;
			}
			categories = catData;

			const categorySelect = document.getElementById('filter-category');
			if (categorySelect) {
				categories.forEach(cat => {
					const option = document.createElement('option');
					option.value = cat.id;
					option.textContent = cat.name || cat.title;
					categorySelect.appendChild(option);
				});
			}
		} catch (catError) {
			console.warn('Lỗi load categories:', catError);
			// Không block việc load products nếu categories lỗi
		}

		// Load brands
		try {
			const brandRes = await api.get('/brands');
			let brandData = [];
			if (brandRes.data && brandRes.data.data && Array.isArray(brandRes.data.data.data)) {
				brandData = brandRes.data.data.data;
			} else if (brandRes.data && Array.isArray(brandRes.data.data)) {
				brandData = brandRes.data.data;
			} else if (Array.isArray(brandRes.data)) {
				brandData = brandRes.data;
			}
			brands = brandData;

			const brandSelect = document.getElementById('filter-brand');
			if (brandSelect) {
				brands.forEach(brand => {
					const option = document.createElement('option');
					option.value = brand.id;
					option.textContent = brand.name || brand.title;
					brandSelect.appendChild(option);
				});
			}
		} catch (brandError) {
			console.warn('Lỗi load brands:', brandError);
			// Không block việc load products nếu brands lỗi
		}
	} catch (error) {
		console.error('Lỗi load filter options:', error);
		// Không throw error để không block việc load products
	}
};

// Build query params từ filter state
const buildQueryParams = () => {
	const params = new URLSearchParams();

	if (filterState.status !== 'all') {
		params.append('status', filterState.status);
	}

	if (filterState.sort) {
		params.append('sort', filterState.sort);
	}

	if (filterState.category_id) {
		params.append('category_id', filterState.category_id);
	}

	if (filterState.brand_id) {
		params.append('brand_id', filterState.brand_id);
	}

	if (filterState.price_min) {
		params.append('price_min', filterState.price_min);
	}

	if (filterState.price_max) {
		params.append('price_max', filterState.price_max);
	}

	if (filterState.search) {
		params.append('search', filterState.search);
	}

	return params.toString();
};

// Sort products client-side (nếu API không hỗ trợ sort)
const sortProducts = (products, sortType) => {
	const sorted = [...products];

	switch (sortType) {
		case 'price_asc':
			return sorted.sort((a, b) => {
				const priceA = Number(a.price_sale || a.price || 0);
				const priceB = Number(b.price_sale || b.price || 0);
				return priceA - priceB;
			});
		case 'price_desc':
			return sorted.sort((a, b) => {
				const priceA = Number(a.price_sale || a.price || 0);
				const priceB = Number(b.price_sale || b.price || 0);
				return priceB - priceA;
			});
		case 'newest':
			return sorted.sort((a, b) => {
				const dateA = new Date(a.created_at || 0);
				const dateB = new Date(b.created_at || 0);
				return dateB - dateA;
			});
		case 'oldest':
			return sorted.sort((a, b) => {
				const dateA = new Date(a.created_at || 0);
				const dateB = new Date(b.created_at || 0);
				return dateA - dateB;
			});
		default:
			return sorted;
	}
};

// Filter products client-side
const filterProducts = (products) => {
	let filtered = [...products];

	// Filter by status
	if (filterState.status !== 'all') {
		filtered = filtered.filter(p => p.status == filterState.status);
	}

	// Filter by category
	if (filterState.category_id) {
		filtered = filtered.filter(p => p.category_id == filterState.category_id);
	}

	// Filter by brand
	if (filterState.brand_id) {
		filtered = filtered.filter(p => p.brand_id == filterState.brand_id);
	}

	// Filter by price range
	if (filterState.price_min) {
		filtered = filtered.filter(p => {
			const price = Number(p.price_sale || p.price || 0);
			return price >= Number(filterState.price_min);
		});
	}

	if (filterState.price_max) {
		filtered = filtered.filter(p => {
			const price = Number(p.price_sale || p.price || 0);
			return price <= Number(filterState.price_max);
		});
	}

	// Filter by search
	if (filterState.search) {
		const searchLower = filterState.search.toLowerCase();
		filtered = filtered.filter(p => {
			const name = (p.name || '').toLowerCase();
			const modelCode = (p.model_code || '').toLowerCase();
			return name.includes(searchLower) || modelCode.includes(searchLower);
		});
	}

	return filtered;
};

const loadProductList = async (showSkeleton = true) => {
	// Kiểm tra nếu đang load thì không load lại
	if (isLoading) {
		console.log('Đang tải dữ liệu, vui lòng đợi...');
		return;
	}

	isLoading = true;
	console.log("load product list function")

	//showshow skeleton lỏading
	if (productTableBody && showSkeleton) {
		productTableBody.innerHTML = productSkeletonRows(5);
	}

	try {
		// Build query string - chỉ gửi các params cần thiết, không gửi empty values
		const queryString = buildQueryParams();
		const url = queryString ? `/products?${queryString}` : '/products';

		console.log('Loading products from:', url);
		const res = await api.get(url);
		console.log('API Response:', res.data); // Debug xem data trả về gì

		let rawData = [];

		if (res.data && res.data.data && Array.isArray(res.data.data.data)) {
			rawData = res.data.data.data;
		} else if (res.data && Array.isArray(res.data.data)) {
			rawData = res.data.data;
		} else if (Array.isArray(res.data)) {
			rawData = res.data;
		}

		// Apply client-side filters (nếu API chưa hỗ trợ đầy đủ)
		let filteredData = filterProducts(rawData);

		// Apply sort
		if (filterState.sort) {
			filteredData = sortProducts(filteredData, filterState.sort);
		}

		if (filteredData.length === 0) {
			if (productTableBody) {
				productTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Không tìm thấy sản phẩm nào phù hợp với bộ lọc</td></tr>';
			}
			return;
		}

		//render rows
		let html = '';
		filteredData.forEach(product => {
			html += productRow(product);
		});

		if (productTableBody) {
			productTableBody.innerHTML = html;
			setTimeout(() => {
				initTooltips(productTableBody);
			}, 0);
		} else {
			console.error('Không tìm thấy element product-list-body');
		}

	} catch (error) {
		console.error('Lỗi API Products:', error);
		console.error('Error details:', error.response?.data || error.message);
		if (productTableBody) {
			const errorMsg = error.response?.data?.message || error.message || 'Lỗi khi tải danh sách sản phẩm';
			productTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">${errorMsg}</td></tr>`;
		}
	} finally {
		isLoading = false;
		const reloadIcon = document.getElementById('reload-icon');
		const reloadBtn = document.getElementById('reload-product-btn');

		if (reloadIcon) {
			reloadIcon.classList.remove('rotating');
		}

		if (reloadBtn) {
			reloadBtn.style.pointerEvents = 'auto';
			reloadBtn.style.opacity = '1';
		}
	}
}

// Hàm xử lý reload
const handleReload = async () => {
	const reloadIcon = document.getElementById('reload-icon');
	const reloadBtn = document.getElementById('reload-product-btn');

	if (!reloadIcon || !reloadBtn) return;

	if (isLoading) {
		return;
	}

	reloadBtn.style.pointerEvents = 'none';
	reloadBtn.style.opacity = '0.6';
	reloadIcon.classList.add('rotating');
	await loadProductList(true);
}
const initReloadButton = () => {
	const reloadBtn = document.getElementById('reload-product-btn');
	if (reloadBtn) {
		reloadBtn.addEventListener('click', handleReload);
		if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
			new bootstrap.Tooltip(reloadBtn);
		}
	}
}

// Setup Status Filter Dropdown
const initStatusFilters = () => {
	const statusOptions = document.querySelectorAll('.status-option');
	const statusBtn = document.getElementById('status-dropdown');

	statusOptions.forEach(option => {
		option.addEventListener('click', (e) => {
			e.preventDefault();

			// Remove active class from all options
			statusOptions.forEach(opt => opt.classList.remove('active'));

			// Add active class to clicked option
			e.currentTarget.classList.add('active');

			// Update filter state
			const status = e.currentTarget.dataset.status;
			filterState.status = status;

			// Update button text
			if (statusBtn) {
				const statusText = e.currentTarget.textContent.trim();
				statusBtn.innerHTML = `<i class="ti ti-filter"></i> ${statusText}`;
			}

			// Close dropdown
			const dropdown = bootstrap.Dropdown.getInstance(statusBtn);
			if (dropdown) {
				dropdown.hide();
			}

			// Reload products
			loadProductList(true);
		});
	});
};

// Setup Sort Dropdown
const initSortDropdown = () => {
	const sortOptions = document.querySelectorAll('.sort-option');
	sortOptions.forEach(option => {
		option.addEventListener('click', (e) => {
			const sortType = e.currentTarget.dataset.sort;
			filterState.sort = sortType;

			// Update button text
			const sortBtn = document.getElementById('sort-dropdown');
			if (sortBtn) {
				sortBtn.innerHTML = `<i class="ti ti-arrow-up-down"></i> ${e.currentTarget.textContent}`;
			}

			// Reload products
			loadProductList(true);
		});
	});
};

// Setup Filter Dropdown
const initFilterDropdown = () => {
	const applyBtn = document.getElementById('apply-filters');
	const clearBtn = document.getElementById('clear-filters');

	if (applyBtn) {
		applyBtn.addEventListener('click', () => {
			filterState.category_id = document.getElementById('filter-category').value;
			filterState.brand_id = document.getElementById('filter-brand').value;
			filterState.price_min = document.getElementById('filter-price-min').value;
			filterState.price_max = document.getElementById('filter-price-max').value;

			// Close dropdown
			const dropdown = bootstrap.Dropdown.getInstance(document.getElementById('filter-dropdown'));
			if (dropdown) {
				dropdown.hide();
			}

			// Reload products
			loadProductList(true);
		});
	}

	if (clearBtn) {
		clearBtn.addEventListener('click', () => {
			document.getElementById('filter-category').value = '';
			document.getElementById('filter-brand').value = '';
			document.getElementById('filter-price-min').value = '';
			document.getElementById('filter-price-max').value = '';

			filterState.category_id = '';
			filterState.brand_id = '';
			filterState.price_min = '';
			filterState.price_max = '';

			// Close dropdown
			const dropdown = bootstrap.Dropdown.getInstance(document.getElementById('filter-dropdown'));
			if (dropdown) {
				dropdown.hide();
			}

			// Reload products
			loadProductList(true);
		});
	}
};

// Setup Search
const initSearch = () => {
	const searchInput = document.getElementById('text-srh');
	if (searchInput) {
		let searchTimeout;
		searchInput.addEventListener('input', (e) => {
			clearTimeout(searchTimeout);
			searchTimeout = setTimeout(() => {
				filterState.search = e.target.value;
				loadProductList(true);
			}, 500); // Debounce 500ms
		});
	}
};

// Hàm xóa sản phẩm
window.deleteProduct = async (productId) => {
	if (!productId) return;

	if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
		return;
	}

	try {
		await api.delete(`/products/${productId}`);
		alert('Xóa sản phẩm thành công!');
		// Reload danh sách
		loadProductList(true);
	} catch (error) {
		console.error('Lỗi xóa sản phẩm:', error);
		const errorMsg = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi xóa sản phẩm';
		alert(errorMsg);
	}
};

window.addEventListener('DOMContentLoaded', async () => {
	await loadFilterOptions();
	loadProductList();
	initReloadButton();
	initStatusFilters();
	initSortDropdown();
	initFilterDropdown();
	initSearch();
});
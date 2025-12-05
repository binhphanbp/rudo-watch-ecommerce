import { productRow } from '../components/RowProduct.js';
import { productSkeletonRows } from '../components/ProductSkeleton.js';
import api from '../../../shared/services/api.js';
import { showSuccess, showError, showErrorDialog, showConfirm } from '../../../shared/utils/swal.js';
import Swal from '../../../shared/utils/swal.js';

const productTableBody = document.getElementById('product-list-body');

// Flag để tránh nhiều request đồng thời
let isLoading = false;

// Filter state - chỉ dùng API params, không sort client-side
let filterState = {
	status: '', // Gửi '1' hoặc '0' hoặc '' (all)
	category_id: '',
	brand_id: '',
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

// Load categories và brands cho filter - Tối ưu: load song song
const loadFilterOptions = async () => {
	try {
		// Load categories và brands song song để tối ưu thời gian
		const [catRes, brandRes] = await Promise.allSettled([
			api.get('/categories'),
			api.get('/brands')
		]);

		// Xử lý categories
		if (catRes.status === 'fulfilled') {
			const res = catRes.value;
			let catData = [];
			if (res.data?.data?.data && Array.isArray(res.data.data.data)) {
				catData = res.data.data.data;
			} else if (res.data?.data && Array.isArray(res.data.data)) {
				catData = res.data.data;
			} else if (Array.isArray(res.data)) {
				catData = res.data;
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
		} else {
			console.warn('Lỗi load categories:', catRes.reason);
		}

		// Xử lý brands
		if (brandRes.status === 'fulfilled') {
			const res = brandRes.value;
			let brandData = [];
			if (res.data?.data?.data && Array.isArray(res.data.data.data)) {
				brandData = res.data.data.data;
			} else if (res.data?.data && Array.isArray(res.data.data)) {
				brandData = res.data.data;
			} else if (Array.isArray(res.data)) {
				brandData = res.data;
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
		} else {
			console.warn('Lỗi load brands:', brandRes.reason);
		}
	} catch (error) {
		console.error('Lỗi load filter options:', error);
	}
};

// Build query params từ filter state - chỉ gửi params mà API hỗ trợ
const buildQueryParams = () => {
	const params = new URLSearchParams();

	if (filterState.status && filterState.status !== 'all') {
		params.append('status', filterState.status);
	}

	if (filterState.category_id) {
		params.append('category_id', filterState.category_id);
	}

	if (filterState.brand_id) {
		params.append('brand_id', filterState.brand_id);
	}

	if (filterState.search) {
		params.append('search', filterState.search);
	}

	return params.toString();
};

// Không cần client-side filter và sort nữa vì API đã xử lý

const loadProductList = async (showSkeleton = true) => {
	// Kiểm tra nếu đang load thì không load lại
	if (isLoading) {
		return;
	}

	isLoading = true;

	// Hiển thị skeleton loading ngay lập tức
	if (productTableBody && showSkeleton) {
		productTableBody.innerHTML = productSkeletonRows(5);
	}

	try {
		// Build query string
		const queryString = buildQueryParams();
		const url = queryString ? `/products?${queryString}` : '/products';

		const res = await api.get(url);

		// Parse response theo cấu trúc mới: { status, statusCode, data: { data: [...], pagination } }
		let rawData = [];
		if (res.data?.data?.data && Array.isArray(res.data.data.data)) {
			rawData = res.data.data.data;
		} else if (res.data?.data && Array.isArray(res.data.data)) {
			rawData = res.data.data;
		} else if (Array.isArray(res.data)) {
			rawData = res.data;
		}

		if (rawData.length === 0) {
			if (productTableBody) {
				productTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Không tìm thấy sản phẩm nào</td></tr>';
			}
			return;
		}

		// Render rows
		let html = '';
		rawData.forEach(product => {
			html += productRow(product);
		});

		if (productTableBody) {
			productTableBody.innerHTML = html;
			// Init tooltips sau khi render
			requestAnimationFrame(() => {
				initTooltips(productTableBody);
			});
		}

	} catch (error) {
		console.error('Lỗi API Products:', error);
		const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Lỗi khi tải danh sách sản phẩm';

		if (productTableBody) {
			productTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4">${errorMsg}</td></tr>`;
		}

		showError(errorMsg, 'Lỗi tải danh sách');
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
	const statusBtn = document.getElementById('filter-status-dropdown') || document.getElementById('status-dropdown');

	statusOptions.forEach(option => {
		option.addEventListener('click', (e) => {
			e.preventDefault();

			// Remove active class from all options
			statusOptions.forEach(opt => opt.classList.remove('active'));

			// Add active class to clicked option
			e.currentTarget.classList.add('active');

			// Update filter state - chỉ gửi '1' hoặc '0' hoặc '' (all)
			const status = e.currentTarget.dataset.status;
			filterState.status = status === 'all' ? '' : status;

			// Update button text
			if (statusBtn) {
				const statusText = e.currentTarget.textContent.trim();
				statusBtn.innerHTML = `<i class="ti ti-filter"></i> ${statusText}`;
			}

			// Close dropdown
			if (statusBtn) {
				const dropdown = bootstrap.Dropdown.getInstance(statusBtn);
				if (dropdown) {
					dropdown.hide();
				}
			}

			// Reload products
			loadProductList(true);
		});
	});
};


// Setup Filter Dropdown - Chỉ dùng category và brand (API hỗ trợ)
const initFilterDropdown = () => {
	const applyBtn = document.getElementById('apply-filters');
	const clearBtn = document.getElementById('clear-filters');

	if (applyBtn) {
		applyBtn.addEventListener('click', () => {
			filterState.category_id = document.getElementById('filter-category')?.value || '';
			filterState.brand_id = document.getElementById('filter-brand')?.value || '';

			// Close dropdown
			const filterDropdown = document.getElementById('filter-dropdown-button');
			if (filterDropdown) {
				const dropdown = bootstrap.Dropdown.getInstance(filterDropdown);
				if (dropdown) {
					dropdown.hide();
				}
			}

			// Reload products
			loadProductList(true);
		});
	}

	if (clearBtn) {
		clearBtn.addEventListener('click', () => {
			const categorySelect = document.getElementById('filter-category');
			const brandSelect = document.getElementById('filter-brand');

			if (categorySelect) categorySelect.value = '';
			if (brandSelect) brandSelect.value = '';

			filterState.category_id = '';
			filterState.brand_id = '';

			// Close dropdown
			const filterDropdown = document.getElementById('filter-dropdown-button');
			if (filterDropdown) {
				const dropdown = bootstrap.Dropdown.getInstance(filterDropdown);
				if (dropdown) {
					dropdown.hide();
				}
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


//showloading function 
export const showLoading = (title = 'Đang xử lý...') => {
	return Swal.fire({
		title,
		allowOutsideClick: false,
		allowEscapeKey: false,
		showConfirmButton: false,
		didOpen: () => {
			Swal.showLoading();
		}
	});
};



// Hàm xóa sản phẩm
window.deleteProduct = async (productId) => {
	if (!productId) return;

	const result = await showConfirm(
		'Bạn có chắc chắn muốn xóa sản phẩm này?',
		'Xác nhận xóa',
		'Xóa',
		'Hủy'
	);

	if (!result.isConfirmed) {
		return;
	}

	const loadingSwal = showLoading('Đang xóa sản phẩm...');

	try {
		await api.delete(`/products/${productId}`);
		Swal.close();

		showSuccess('Xóa sản phẩm thành công!');
		// Reload danh sách
		await loadProductList(false);
	} catch (error) {
		console.error('Lỗi xóa sản phẩm:', error);
		Swal.close();

		const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Có lỗi xảy ra khi xóa sản phẩm';
		showErrorDialog(errorMsg, 'Lỗi xóa sản phẩm');
	}
};

window.addEventListener('DOMContentLoaded', async () => {
	// Load filter options và product list song song để tối ưu thời gian
	loadFilterOptions(); // Không await để không block

	// Load product list ngay (không đợi filter options)
	loadProductList();

	// Init các event listeners
	initReloadButton();
	initStatusFilters();
	initFilterDropdown();
	initSearch();
});
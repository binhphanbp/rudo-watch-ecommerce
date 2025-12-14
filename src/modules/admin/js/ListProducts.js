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

// Pagination state
let pagination = {
	currentPage: 1,
	perPage: 5,
	total: 0,
	totalPages: 0
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

	// Chỉ gửi status nếu có giá trị và không phải 'all'
	if (filterState.status && filterState.status !== 'all' && String(filterState.status).trim() !== '') {
		params.append('status', String(filterState.status).trim());
	}

	// Chỉ gửi category_id nếu có giá trị hợp lệ (số)
	if (filterState.category_id && String(filterState.category_id).trim() !== '') {
		const categoryId = parseInt(filterState.category_id);
		if (!isNaN(categoryId) && categoryId > 0) {
			params.append('category_id', categoryId);
		}
	}

	// Chỉ gửi brand_id nếu có giá trị hợp lệ (số)
	if (filterState.brand_id && String(filterState.brand_id).trim() !== '') {
		const brandId = parseInt(filterState.brand_id);
		if (!isNaN(brandId) && brandId > 0) {
			params.append('brand_id', brandId);
		}
	}

	// Chỉ gửi search nếu có giá trị
	if (filterState.search && String(filterState.search).trim() !== '') {
		params.append('search', String(filterState.search).trim());
	}

	// Thêm pagination params - Backend dùng 'limit' chứ không phải 'per_page'
	params.append('page', pagination.currentPage);
	params.append('limit', pagination.perPage);

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
			// Parse pagination nếu có
			if (res.data?.data?.pagination) {
				pagination.total = res.data.data.pagination.total || 0;
				pagination.totalPages = res.data.data.pagination.total_pages || res.data.data.pagination.totalPages || 0;
				pagination.currentPage = res.data.data.pagination.current_page || res.data.data.pagination.currentPage || 1;
				pagination.perPage = res.data.data.pagination.per_page || res.data.data.pagination.perPage || 5;
			}
		} else if (res.data?.data && Array.isArray(res.data.data)) {
			rawData = res.data.data;
			pagination.total = rawData.length;
		} else if (Array.isArray(res.data)) {
			rawData = res.data;
			pagination.total = rawData.length;
		}

		// Update pagination UI
		if (typeof updatePaginationUI === 'function') {
			updatePaginationUI();
		}

		if (rawData.length === 0) {
			if (productTableBody) {
				productTableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4">Không tìm thấy sản phẩm nào</td></tr>';
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
			pagination.currentPage = 1; // Reset về trang đầu khi filter

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
			pagination.currentPage = 1; // Reset về trang đầu khi filter

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
			pagination.currentPage = 1; // Reset về trang đầu khi clear filter

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
				pagination.currentPage = 1; // Reset về trang đầu khi search
				loadProductList(true);
			}, 500); // Debounce 500ms
		});
	}
};

// Update pagination UI
const updatePaginationUI = () => {
	// Update text "1–5 of 12"
	const paginationText = document.querySelector('.table-responsive p.mb-0.fs-2');
	if (paginationText) {
		const start = pagination.total === 0 ? 0 : ((pagination.currentPage - 1) * pagination.perPage) + 1;
		const end = Math.min(pagination.currentPage * pagination.perPage, pagination.total);
		paginationText.textContent = `${start}–${end} of ${pagination.total}`;
	}

	// Update per page select
	const perPageSelect = document.querySelector('.table-responsive select.form-select');
	if (perPageSelect) {
		perPageSelect.value = pagination.perPage === 5 ? '0' : pagination.perPage === 10 ? '1' : '2';
	}

	// Update pagination buttons
	const prevBtn = document.querySelector('.pagination .page-item:first-child .page-link');
	const nextBtn = document.querySelector('.pagination .page-item:last-child .page-link');

	if (prevBtn) {
		if (pagination.currentPage <= 1) {
			prevBtn.classList.add('disabled');
			prevBtn.style.pointerEvents = 'none';
			prevBtn.style.opacity = '0.5';
		} else {
			prevBtn.classList.remove('disabled');
			prevBtn.style.pointerEvents = 'auto';
			prevBtn.style.opacity = '1';
		}
	}

	if (nextBtn) {
		if (pagination.currentPage >= pagination.totalPages) {
			nextBtn.classList.add('disabled');
			nextBtn.style.pointerEvents = 'none';
			nextBtn.style.opacity = '0.5';
		} else {
			nextBtn.classList.remove('disabled');
			nextBtn.style.pointerEvents = 'auto';
			nextBtn.style.opacity = '1';
		}
	}
};

// Setup pagination
const initPagination = () => {
	// Per page select
	const perPageSelect = document.querySelector('.table-responsive select.form-select');
	if (perPageSelect) {
		perPageSelect.addEventListener('change', (e) => {
			const value = e.target.value;
			pagination.perPage = value === '0' ? 5 : value === '1' ? 10 : 25;
			pagination.currentPage = 1; // Reset về trang đầu khi đổi per page
			loadProductList(true);
		});
	}

	// Previous button
	const prevBtn = document.querySelector('.pagination .page-item:first-child .page-link');
	if (prevBtn) {
		prevBtn.addEventListener('click', (e) => {
			e.preventDefault();
			if (pagination.currentPage > 1) {
				pagination.currentPage--;
				loadProductList(true);
			}
		});
	}

	// Next button
	const nextBtn = document.querySelector('.pagination .page-item:last-child .page-link');
	if (nextBtn) {
		nextBtn.addEventListener('click', (e) => {
			e.preventDefault();
			if (pagination.currentPage < pagination.totalPages) {
				pagination.currentPage++;
				loadProductList(true);
			}
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
	initPagination();
});
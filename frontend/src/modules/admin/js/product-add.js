import api, { API_BASE_URL } from '../../../shared/services/api.js';
import Swal, { Toast } from '../../../shared/utils/swal.js';

// Biến lưu trữ
let mainImageFile = null;
let thumbnailFiles = [];

// Load options cho dropdown
const loadOptions = async (endpoint, selectId, placeholder) => {
	try {
		const res = await api.get(endpoint);
		const data = res.data?.data?.data || res.data?.data || res.data || [];
		const select = document.getElementById(selectId);
		if (select) {
			select.innerHTML = `<option value="">-- ${placeholder} --</option>`;
			data.forEach(item => {
				const option = document.createElement('option');
				option.value = item.id;
				option.textContent = item.name || item.title;
				select.appendChild(option);
			});
		}
	} catch (error) {
		console.error(`Lỗi load ${endpoint}:`, error);
	}
};

// Update status indicator
const updateStatusIndicator = (status) => {
	const indicator = document.getElementById('status-indicator');
	if (indicator) {
		indicator.className = status === 1
			? 'p-2 h-100 bg-success rounded-circle'
			: 'p-2 h-100 bg-danger rounded-circle';
	}
};

// Setup Dropzone
const setupDropzone = (elementId, maxFiles, onSuccess) => {
	const element = document.getElementById(elementId);
	if (!element) {
		console.warn(`Element ${elementId} not found`);
		return;
	}

	// Check if Dropzone is available
	if (typeof Dropzone === 'undefined') {
		console.error('Dropzone is not loaded. Please include dropzone.min.js');
		Toast.fire({ icon: 'error', title: 'Dropzone chưa được load' });
		return;
	}

	try {
		// Disable auto discover globally
		Dropzone.autoDiscover = false;

		// Check if element already has Dropzone instance
		if (element.dropzone) {
			console.log(`Disposing existing Dropzone instance for ${elementId}`);
			element.dropzone.destroy();
		}

		// Ensure dropzone class exists for styling (autoDiscover is false so it won't auto-init)
		if (!element.classList.contains('dropzone')) {
			element.classList.add('dropzone');
		}

		// Get token for authorization
		const token = localStorage.getItem('token');

		// Create new Dropzone instance
		const dropzone = new Dropzone(element, {
			url: `${API_BASE_URL}upload`,
			maxFiles,
			acceptedFiles: 'image/*',
			addRemoveLinks: true,
			dictDefaultMessage: maxFiles === 1 ? 'Kéo thả ảnh chính vào đây' : 'Kéo thả nhiều ảnh vào đây',
			dictRemoveFile: 'Xóa',
			headers: token ? {
				'Authorization': `Bearer ${token}`
			} : {},
			init: function () {
				this.on('success', (file, response) => {
					try {
						const path = response?.data?.path || response?.path || response?.url || file.name;
						onSuccess(path, file);
					} catch (err) {
						console.error('Error processing upload response:', err);
						Toast.fire({ icon: 'error', title: 'Lỗi xử lý upload' });
					}
				});
				this.on('error', (file, error) => {
					console.error('Dropzone upload error:', error);
					const errorMsg = error?.message || error || 'Lỗi upload ảnh';
					Toast.fire({ icon: 'error', title: errorMsg });
				});
			}
		});

		console.log(`Dropzone initialized for ${elementId}`);
	} catch (error) {
		console.error('Error initializing Dropzone:', error);
		Toast.fire({ icon: 'error', title: 'Lỗi khởi tạo Dropzone' });
	}
};

// Collect form data
const collectFormData = () => {
	const editor = document.querySelector('#editor .ql-editor');
	let description = editor?.innerHTML || '';
	if (description.trim() === '<p><br></p>' || description.trim() === '<p></p>') {
		description = '';
	}

	return {
		name: document.getElementById('product-name')?.value || '',
		model_code: document.getElementById('product-model-code')?.value || '',
		category_id: parseInt(document.getElementById('product-category')?.value) || null,
		brand_id: parseInt(document.getElementById('product-brand')?.value) || null,
		description,
		image: mainImageFile,
		thumbnail: thumbnailFiles,
		specifications: {
			brand: document.getElementById('spec-brand')?.value || '',
			model: document.getElementById('spec-model')?.value || '',
			color: document.getElementById('spec-color')?.value || '',
			material: document.getElementById('spec-material')?.value || '',
			size: document.getElementById('spec-size')?.value || '',
			weight: document.getElementById('spec-weight')?.value || '',
			warranty: document.getElementById('spec-warranty')?.value || ''
		},
		status: parseInt(document.getElementById('product-status')?.value) || 1
	};
};

// Validate form
const validateForm = (data) => {
	const errors = [];
	if (!data.name?.trim()) errors.push('Tên sản phẩm là bắt buộc');
	if (!data.model_code?.trim()) errors.push('Mã sản phẩm là bắt buộc');
	if (!data.category_id) errors.push('Vui lòng chọn danh mục');
	if (!data.brand_id) errors.push('Vui lòng chọn thương hiệu');
	return errors;
};

// Handle form submit
const handleFormSubmit = async (e) => {
	if (e) {
		e.preventDefault();
		e.stopPropagation();
	}

	const formData = collectFormData();
	const errors = validateForm(formData);
	if (errors.length > 0) {
		Toast.fire({ icon: 'error', title: errors.join(', ') });
		return false;
	}

	// Show loading
	const loadingSwal = Swal.fire({
		title: 'Đang tạo sản phẩm...',
		allowOutsideClick: false,
		allowEscapeKey: false,
		showConfirmButton: false,
		didOpen: () => {
			Swal.showLoading();
		}
	});

	try {
		await api.post('/products', formData);

		// Close loading
		await Swal.close();

		// Show success
		await Swal.fire({
			icon: 'success',
			title: 'Thành công!',
			text: 'Tạo sản phẩm thành công',
			timer: 2000,
			showConfirmButton: false
		});

		// Redirect after success message
		window.location.href = '/src/pages/admin/product-list.html';
	} catch (error) {
		// Close loading first
		Swal.close();

		// Show error
		const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Có lỗi xảy ra khi tạo sản phẩm';
		await Swal.fire({
			icon: 'error',
			title: 'Lỗi',
			text: errorMsg,
			confirmButtonText: 'Đóng'
		});
	}

	return false;
};

// Initialize
const init = async () => {
	// Disable Dropzone auto-discover as early as possible
	if (typeof Dropzone !== 'undefined') {
		Dropzone.autoDiscover = false;
	}

	await Promise.all([
		loadOptions('/categories', 'product-category', 'Chọn danh mục'),
		loadOptions('/brands', 'product-brand', 'Chọn thương hiệu')
	]);

	// Wait for Dropzone to be available
	if (typeof Dropzone === 'undefined') {
		// Wait a bit for script to load
		await new Promise(resolve => setTimeout(resolve, 500));
		// Set again after waiting
		if (typeof Dropzone !== 'undefined') {
			Dropzone.autoDiscover = false;
		}
	}

	setupDropzone('main-image-dropzone', 1, (path) => { mainImageFile = path; });
	setupDropzone('thumbnail-dropzone', 10, (path) => { thumbnailFiles.push(path); });

	const form = document.getElementById('product-form');
	const submitBtn = document.getElementById('submit-product-btn') || document.querySelector('button[type="submit"]');

	if (form) {
		form.onsubmit = (e) => {
			e.preventDefault();
			e.stopPropagation();
			handleFormSubmit(e);
			return false;
		};

		form.addEventListener('submit', (e) => {
			e.preventDefault();
			e.stopPropagation();
			handleFormSubmit(e);
			return false;
		}, { capture: true });
	}

	if (submitBtn) {
		submitBtn.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			handleFormSubmit(e);
			return false;
		}, { capture: true });
	}

	const statusSelect = document.getElementById('product-status');
	if (statusSelect) {
		statusSelect.value = '1';
		updateStatusIndicator(1);
		statusSelect.addEventListener('change', (e) => updateStatusIndicator(parseInt(e.target.value)));
	}
};

window.addEventListener('DOMContentLoaded', init);

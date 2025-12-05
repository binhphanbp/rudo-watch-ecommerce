import api, { API_BASE_URL } from '../../../shared/services/api.js';
import Swal, { Toast, showLoading, showSuccess, showError, showErrorDialog } from '../../../shared/utils/swal.js';

// Biến lưu trữ
let mainImageFile = null;
let thumbnailFiles = [];
let variantCounter = 0;
let brands = [];
let categories = [];

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

		// Lưu brands và categories để dùng cho generate SKU
		if (endpoint === '/brands') {
			brands = data;
		} else if (endpoint === '/categories') {
			categories = data;
		}

		return data;
	} catch (error) {
		console.error(`Lỗi load ${endpoint}:`, error);
		showError(`Không thể tải ${placeholder.toLowerCase()}`);
		return [];
	}
};

// Load product data
const loadProductData = async (productId) => {
	const loadingSwal = showLoading('Đang tải thông tin sản phẩm...');

	try {
		const res = await api.get(`/products/${productId}`);
		Swal.close();

		const product = res.data?.data || res.data;
		if (!product) {
			showErrorDialog('Không tìm thấy thông tin sản phẩm');
			window.location.href = '/src/pages/admin/product-list.html';
			return;
		}

		document.getElementById('product-name').value = product.name || '';
		document.getElementById('product-model-code').value = product.model_code || '';
		document.getElementById('product-category').value = product.category_id || '';
		document.getElementById('product-brand').value = product.brand_id || '';
		document.getElementById('product-status').value = product.status ?? 1;

		const editor = document.querySelector('#editor .ql-editor');
		if (editor && product.description) editor.innerHTML = product.description;
		console.log(product)
		console.log(product.specifications)
		if (product.specifications) {
			const specs = product.specifications;
			console.log(specs)
			document.getElementById('spec-brand').value = specs.brand || '';
			document.getElementById('spec-model').value = specs.model || '';
			document.getElementById('spec-color').value = specs.color || '';
			document.getElementById('spec-material').value = specs.material || '';
			document.getElementById('spec-size').value = specs.size || '';
			document.getElementById('spec-weight').value = specs.weight || '';
			document.getElementById('spec-warranty').value = specs.warranty || '';
		}

		// Update image variables
		mainImageFile = product.image || null;
		thumbnailFiles = product.thumbnail && Array.isArray(product.thumbnail) ? [...product.thumbnail] : [];

		// Note: Dropzone sẽ tự động cập nhật khi user upload ảnh mới
		// Không cần reload Dropzone vì nó đã được setup trong init()

		// Clear and reload variants
		const container = document.getElementById('variants-container');
		if (container) {
			// Remove all existing variants
			const existingVariants = container.querySelectorAll('.variant-item');
			existingVariants.forEach(v => v.remove());

			// Reset counter
			variantCounter = 0;

			// Show no variants message if empty
			const noMessage = document.getElementById('no-variants-message');
			if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
				if (noMessage) noMessage.style.display = 'none';
				loadVariants(product.variants);
			} else {
				if (noMessage) noMessage.style.display = 'block';
			}
		}

		updateStatusIndicator(product.status);
	} catch (error) {
		console.error('Lỗi load product:', error);
		Swal.close();
		const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Không thể tải dữ liệu sản phẩm';
		showErrorDialog(errorMsg, 'Lỗi tải dữ liệu');
		setTimeout(() => {
			window.location.href = '/src/pages/admin/product-list.html';
		}, 2000);
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
const setupDropzone = (elementId, maxFiles, onSuccess, existingFiles = []) => {
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
				// Load existing files
				if (existingFiles && existingFiles.length > 0) {
					existingFiles.forEach(filePath => {
						try {
							const mockFile = { name: filePath.split('/').pop(), size: 0 };
							this.emit('addedfile', mockFile);
							this.emit('complete', mockFile);
							this.files.push(mockFile);
						} catch (err) {
							console.error('Error loading existing file:', err);
						}
					});
				}

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
				this.on('removedfile', (file) => {
					if (maxFiles === 1) {
						mainImageFile = null;
					} else {
						const index = thumbnailFiles.findIndex(f => f === file.name);
						if (index > -1) thumbnailFiles.splice(index, 1);
					}
				});
			}
		});

		console.log(`Dropzone initialized for ${elementId}`);
	} catch (error) {
		console.error('Error initializing Dropzone:', error);
		Toast.fire({ icon: 'error', title: 'Lỗi khởi tạo Dropzone' });
	}
};

// Generate SKU tự động
const generateSKU = (brandId, modelCode, size) => {
	// Lấy brand prefix (3 ký tự đầu của brand name)
	let brandPrefix = '';
	if (brandId && brands.length > 0) {
		const brand = brands.find(b => b.id == brandId);
		if (brand) {
			const brandName = (brand.name || brand.title || '').toUpperCase();
			brandPrefix = brandName.substring(0, 3);
		}
	}
	if (!brandPrefix) brandPrefix = 'UNK';

	// Rút gọn model_code (lấy phần sau dấu gạch cuối cùng hoặc toàn bộ nếu không có)
	let modelShort = '';
	if (modelCode) {
		const parts = modelCode.split('-');
		if (parts.length > 1) {
			modelShort = parts.slice(-1)[0]; // Lấy phần cuối
		} else {
			modelShort = modelCode.replace(/[^A-Z0-9]/gi, '').substring(0, 6).toUpperCase();
		}
	}
	if (!modelShort) modelShort = 'MODEL';

	// Lấy số từ size (VD: 42mm -> 42)
	let sizeNum = '';
	if (size) {
		const match = size.match(/\d+/);
		if (match) {
			sizeNum = match[0];
		}
	}
	if (!sizeNum) sizeNum = '00';

	return `${brandPrefix}-${modelShort}-${sizeNum}`;
};

// Collect variants data
const collectVariants = (productId, brandId, modelCode) => {
	const variantItems = document.querySelectorAll('.variant-item');
	const variants = [];

	variantItems.forEach((item, index) => {
		const price = item.querySelector('.variant-price')?.value;
		const size = item.querySelector('.variant-size')?.value;
		const skuInput = item.querySelector('.variant-sku');
		const quantity = item.querySelector('.variant-quantity')?.value;
		const colors = item.querySelector('.variant-colors')?.value;
		const image = item.querySelector('.variant-image')?.value;
		const variantId = item.getAttribute('data-variant-id');

		if (price && quantity) {
			// Tự động generate SKU nếu chưa có hoặc input trống
			let sku = skuInput?.value?.trim();
			if (!sku && brandId && modelCode && size) {
				sku = generateSKU(brandId, modelCode, size);
				// Cập nhật lại input SKU
				if (skuInput) {
					skuInput.value = sku;
				}
			}

			const variant = {
				product_id: parseInt(productId),
				price: parseFloat(price) || 0,
				size: size || null,
				sku: sku || `SKU-${Date.now()}-${index}`,
				quantity: parseInt(quantity) || 0,
				colors: colors || null,
				image: image || null
			};

			// Nếu có ID (edit mode), thêm ID vào
			if (variantId) {
				variant.id = parseInt(variantId);
			}

			variants.push(variant);
		}
	});

	return variants;
};

// Collect form data (không bao gồm variants)
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

// Validate variants
const validateVariants = (variants) => {
	const errors = [];
	if (!variants || variants.length === 0) {
		errors.push('Vui lòng thêm ít nhất một variant');
	} else {
		variants.forEach((v, index) => {
			if (!v.price || v.price <= 0) {
				errors.push(`Variant ${index + 1}: Giá phải lớn hơn 0`);
			}
			if (!v.quantity && v.quantity !== 0) {
				errors.push(`Variant ${index + 1}: Số lượng là bắt buộc`);
			}
		});
	}
	return errors;
};

// Save variants to API
const saveVariants = async (productId, variants) => {
	const results = [];

	for (const variant of variants) {
		try {
			if (variant.id) {
				// Update existing variant
				const { id, ...updateData } = variant;
				const res = await api.put(`/product-variants/${id}`, updateData);
				results.push({ success: true, variant: res.data });
			} else {
				// Create new variant
				const res = await api.post('/product-variants', variant);
				results.push({ success: true, variant: res.data });
			}
		} catch (error) {
			console.error('Lỗi lưu variant:', error);
			results.push({
				success: false,
				error: error.response?.data?.error || error.message
			});
		}
	}

	return results;
};

// Handle form submit
const handleFormSubmit = async (e) => {
	if (e) {
		e.preventDefault();
		e.stopPropagation();
	}

	const urlParams = new URLSearchParams(window.location.search);
	const productId = urlParams.get('id');
	if (!productId) {
		Toast.fire({ icon: 'error', title: 'Không tìm thấy ID sản phẩm' });
		return false;
	}

	const formData = collectFormData();
	const errors = validateForm(formData);
	if (errors.length > 0) {
		showError(errors.join(', '));
		return false;
	}

	// Validate variants
	const brandId = formData.brand_id;
	const modelCode = formData.model_code;
	const variants = collectVariants(productId, brandId, modelCode);
	const variantErrors = validateVariants(variants);
	if (variantErrors.length > 0) {
		showError(variantErrors.join(', '));
		return false;
	}

	// Show loading
	const loadingSwal = showLoading('Đang cập nhật sản phẩm...');

	try {
		// 1. Update product (không bao gồm variants)
		await api.put(`/products/${productId}`, formData);

		// 2. Save variants riêng biệt
		const variantResults = await saveVariants(productId, variants);

		// Kiểm tra kết quả variants
		const failedVariants = variantResults.filter(r => !r.success);
		if (failedVariants.length > 0) {
			const errorMessages = failedVariants.map(r => r.error).join(', ');
			Swal.close();
			showErrorDialog(`Cập nhật sản phẩm thành công nhưng có lỗi khi lưu variants: ${errorMessages}`, 'Cảnh báo');
		} else {
			Swal.close();
			showSuccess('Cập nhật sản phẩm và variants thành công!');
		}

		// Reload product data instead of redirecting
		await loadProductData(productId);
	} catch (error) {
		Swal.close();
		const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Có lỗi xảy ra khi cập nhật sản phẩm';
		showErrorDialog(errorMsg, 'Lỗi cập nhật sản phẩm');
	}

	return false;
};

// Initialize
const init = async () => {
	// Disable Dropzone auto-discover as early as possible
	if (typeof Dropzone !== 'undefined') {
		Dropzone.autoDiscover = false;
	}

	const urlParams = new URLSearchParams(window.location.search);
	const productId = urlParams.get('id');
	if (!productId) {
		Toast.fire({ icon: 'error', title: 'Không tìm thấy ID sản phẩm' });
		window.location.href = '/src/pages/admin/product-list.html';
		return;
	}

	await Promise.all([
		loadOptions('/categories', 'product-category', 'Chọn danh mục'),
		loadOptions('/brands', 'product-brand', 'Chọn thương hiệu'),
		loadProductData(productId)
	]);

	// Wait for Dropzone to be available if needed
	if (typeof Dropzone === 'undefined') {
		await new Promise(resolve => setTimeout(resolve, 500));
		if (typeof Dropzone !== 'undefined') {
			Dropzone.autoDiscover = false;
		}
	}

	setupDropzone('main-image-dropzone', 1, (path) => { mainImageFile = path; }, mainImageFile ? [mainImageFile] : []);
	setupDropzone('thumbnail-dropzone', 10, (path) => { thumbnailFiles.push(path); }, thumbnailFiles);

	const form = document.getElementById('product-form');
	const submitBtn = document.getElementById('submit-product-btn') || document.querySelector('button[type="submit"]');

	if (form) {
		// Prevent default form submission
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
			e.stopImmediatePropagation();
			handleFormSubmit(e);
			return false;
		}, { capture: true });
	}

	const statusSelect = document.getElementById('product-status');
	if (statusSelect) {
		statusSelect.addEventListener('change', (e) => updateStatusIndicator(parseInt(e.target.value)));
	}

	// Init variants management
	initVariants();
};

// Variants management
const addVariant = (variantData = null) => {
	const template = document.getElementById('variant-template');
	const container = document.getElementById('variants-container');
	const noMessage = document.getElementById('no-variants-message');

	if (!template || !container) return;

	variantCounter++;
	const clone = template.content.cloneNode(true);
	const variantItem = clone.querySelector('.variant-item');

	variantItem.setAttribute('data-variant-index', variantCounter);
	if (variantData?.id) {
		variantItem.setAttribute('data-variant-id', variantData.id);
	}

	variantItem.querySelector('.variant-number').textContent = variantCounter;

	// Fill data if provided (edit mode)
	if (variantData) {
		if (variantData.price) variantItem.querySelector('.variant-price').value = variantData.price;
		if (variantData.size) variantItem.querySelector('.variant-size').value = variantData.size;
		if (variantData.sku) variantItem.querySelector('.variant-sku').value = variantData.sku;
		if (variantData.quantity) variantItem.querySelector('.variant-quantity').value = variantData.quantity;
		if (variantData.colors) variantItem.querySelector('.variant-colors').value = variantData.colors;
		if (variantData.image) variantItem.querySelector('.variant-image').value = variantData.image;
	} else {
		// Auto-generate SKU for new variant
		const brandId = document.getElementById('product-brand')?.value;
		const modelCode = document.getElementById('product-model-code')?.value;
		const sizeInput = variantItem.querySelector('.variant-size');
		const skuInput = variantItem.querySelector('.variant-sku');

		// Generate SKU when size is entered
		const updateSKU = () => {
			const size = sizeInput?.value;
			if (brandId && modelCode && size && skuInput) {
				const sku = generateSKU(brandId, modelCode, size);
				skuInput.value = sku;
			}
		};

		if (sizeInput) {
			sizeInput.addEventListener('input', updateSKU);
			sizeInput.addEventListener('change', updateSKU);
		}
	}

	// Auto-update SKU when brand, model_code, or size changes
	const skuInput = variantItem.querySelector('.variant-sku');
	const sizeInput = variantItem.querySelector('.variant-size');

	const updateSKUFromForm = () => {
		const brandId = document.getElementById('product-brand')?.value;
		const modelCode = document.getElementById('product-model-code')?.value;
		const size = sizeInput?.value;

		// Only auto-update if SKU is empty or was auto-generated
		if (skuInput && brandId && modelCode && size) {
			const currentSKU = skuInput.value;
			const expectedSKU = generateSKU(brandId, modelCode, size);

			// Update if SKU is empty or matches the pattern (was auto-generated)
			if (!currentSKU || currentSKU === expectedSKU || currentSKU.match(/^[A-Z]{3}-[A-Z0-9]+-\d+$/)) {
				skuInput.value = expectedSKU;
			}
		}
	};

	// Listen to brand and model_code changes
	const brandSelect = document.getElementById('product-brand');
	const modelCodeInput = document.getElementById('product-model-code');

	if (brandSelect) {
		brandSelect.addEventListener('change', updateSKUFromForm);
	}
	if (modelCodeInput) {
		modelCodeInput.addEventListener('input', updateSKUFromForm);
		modelCodeInput.addEventListener('change', updateSKUFromForm);
	}
	if (sizeInput) {
		sizeInput.addEventListener('input', updateSKUFromForm);
		sizeInput.addEventListener('change', updateSKUFromForm);
	}

	// Remove button handler
	const removeBtn = variantItem.querySelector('.remove-variant-btn');
	removeBtn.addEventListener('click', () => removeVariant(variantItem));

	if (noMessage) {
		noMessage.style.display = 'none';
	}

	container.appendChild(clone);
	updateVariantNumbers();
};

const loadVariants = (variants) => {
	if (!variants || !Array.isArray(variants) || variants.length === 0) return;

	variants.forEach(variant => {
		addVariant(variant);
	});
};

const removeVariant = (variantItem) => {
	variantItem.remove();
	updateVariantNumbers();

	const container = document.getElementById('variants-container');
	const variantItems = container.querySelectorAll('.variant-item');
	const noMessage = document.getElementById('no-variants-message');

	if (variantItems.length === 0 && noMessage) {
		noMessage.style.display = 'block';
	}
};

const updateVariantNumbers = () => {
	const variantItems = document.querySelectorAll('.variant-item');
	variantItems.forEach((item, index) => {
		item.querySelector('.variant-number').textContent = index + 1;
	});
};

const initVariants = () => {
	const addBtn = document.getElementById('add-variant-btn');
	if (addBtn) {
		addBtn.addEventListener('click', () => addVariant());
	}
};

window.addEventListener('DOMContentLoaded', init);

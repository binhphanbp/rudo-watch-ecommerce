import api, { API_BASE_URL, getImageUrl } from '../../../shared/services/api.js';
import Swal, { Toast, showLoading, showSuccess, showError, showErrorDialog } from '../../../shared/utils/swal.js';

// Biến lưu trữ
let mainImageFile = null; // File object hoặc URL string
let thumbnailFiles = []; // Array of File objects hoặc URL strings
let variantCounter = 0;
let brands = [];
let categories = [];
let mainDropzone = null;
let thumbDropzone = null;

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
			document.getElementById('spec-material').value = specs.material || '';
			document.getElementById('spec-size').value = specs.size || '';
			document.getElementById('spec-weight').value = specs.weight || '';
			document.getElementById('spec-warranty').value = specs.warranty || '';
		}

		// Update image variables
		mainImageFile = product.image || null;
		
		// Parse thumbnail - có thể là string JSON hoặc array
		let parsedThumbnail = [];
		if (product.thumbnail) {
			try {
				if (typeof product.thumbnail === 'string') {
					parsedThumbnail = JSON.parse(product.thumbnail);
				} else if (Array.isArray(product.thumbnail)) {
					parsedThumbnail = product.thumbnail;
				}
			} catch (e) {
				console.warn('Lỗi parse thumbnail:', e);
				parsedThumbnail = [];
			}
		}
		thumbnailFiles = parsedThumbnail;

		// Re-init dropzone với ảnh mới load được (nếu dropzone đã được khởi tạo)
		// Nếu dropzone chưa được khởi tạo, ảnh sẽ được load trong setupDropzone với existingFiles
		if (mainDropzone && mainImageFile && typeof mainImageFile === 'string') {
			// Kiểm tra xem ảnh đã có trong dropzone chưa
			const existingFile = mainDropzone.files.find(f => f.serverPath === mainImageFile);
			if (!existingFile) {
				const imageUrl = getImageUrl(mainImageFile);
				const fileName = mainImageFile.split('/').pop() || mainImageFile.split('\\').pop() || 'image.jpg';
				const mockFile = {
					name: fileName,
					size: 0,
					status: Dropzone.ADDED,
					accepted: true,
					serverPath: mainImageFile
				};
				mainDropzone.emit('addedfile', mockFile);
				mainDropzone.emit('thumbnail', mockFile, imageUrl);
				mainDropzone.emit('complete', mockFile);
				mainDropzone.files.push(mockFile);
			}
		}

		if (thumbDropzone && thumbnailFiles.length > 0) {
			thumbnailFiles.forEach((thumbnailPath) => {
				if (thumbnailPath && typeof thumbnailPath === 'string') {
					// Kiểm tra xem ảnh đã có trong dropzone chưa
					const existingFile = thumbDropzone.files.find(f => f.serverPath === thumbnailPath);
					if (!existingFile) {
						const imageUrl = getImageUrl(thumbnailPath);
						const fileName = thumbnailPath.split('/').pop() || thumbnailPath.split('\\').pop() || 'thumbnail.jpg';
						const mockFile = {
							name: fileName,
							size: 0,
							status: Dropzone.ADDED,
							accepted: true,
							serverPath: thumbnailPath
						};
						thumbDropzone.emit('addedfile', mockFile);
						thumbDropzone.emit('thumbnail', mockFile, imageUrl);
						thumbDropzone.emit('complete', mockFile);
						thumbDropzone.files.push(mockFile);
					}
				}
			});
		}

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

		// Create Dropzone instance - CHỈ PREVIEW, KHÔNG UPLOAD TỰ ĐỘNG (giống product-add.js)
		const dropzone = new Dropzone(element, {
			url: '#', // Không upload tự động
			maxFiles,
			acceptedFiles: 'image/*',
			addRemoveLinks: true,
			autoProcessQueue: false, // QUAN TRỌNG: Không upload tự động
			dictDefaultMessage: maxFiles === 1 ? 'Kéo thả ảnh chính vào đây' : 'Kéo thả nhiều ảnh vào đây',
			dictRemoveFile: 'Xóa',
			init: function () {
				// Load existing files (ảnh hiện có từ server)
				if (existingFiles && existingFiles.length > 0) {
					existingFiles.forEach(filePath => {
						try {
							const imageUrl = getImageUrl(filePath);
							const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'image.jpg';
							
							// Tạo mock file object
							const mockFile = {
								name: fileName,
								size: 0,
								status: Dropzone.ADDED,
								accepted: true
							};
							
							// Thêm file vào dropzone
							this.emit('addedfile', mockFile);
							this.emit('thumbnail', mockFile, imageUrl);
							this.emit('complete', mockFile);
							this.files.push(mockFile);
							
							// Lưu đường dẫn gốc
							mockFile.serverPath = filePath;
						} catch (err) {
							console.error('Error loading existing file:', err);
						}
					});
				}

				// Khi user thêm file mới (chỉ preview, chưa upload)
				this.on('addedfile', (file) => {
					console.log('File added:', file.name);
					// Chỉ lưu File object nếu là file mới (không phải mock file từ server)
					if (!file.serverPath && file instanceof File) {
						// Lưu File object (sẽ upload khi submit form)
						if (maxFiles === 1) {
							mainImageFile = file;
						} else {
							// Kiểm tra xem file đã có trong array chưa
							const exists = thumbnailFiles.some(f => {
								if (f instanceof File) return f.name === file.name;
								return false;
							});
							if (!exists) {
								thumbnailFiles.push(file);
							}
						}
					}
				});

				// Khi user xóa file
				this.on('removedfile', (file) => {
					console.log('File removed:', file.name);
					if (maxFiles === 1) {
						mainImageFile = null;
					} else {
						// Xóa khỏi array
						if (file.serverPath) {
							// Nếu là ảnh từ server, xóa theo serverPath
							thumbnailFiles = thumbnailFiles.filter(f => {
								if (typeof f === 'string') return f !== file.serverPath;
								return f.name !== file.name;
							});
						} else {
							// Nếu là file mới, xóa theo name
							thumbnailFiles = thumbnailFiles.filter(f => {
								if (f instanceof File) return f.name !== file.name;
								return true;
							});
						}
					}
				});

				this.on('error', (file, error) => {
					console.error('Dropzone error:', error);
					Toast.fire({ icon: 'error', title: 'Lỗi: ' + (error?.message || error) });
				});
			}
		});

		console.log(`Dropzone initialized for ${elementId}`);
	} catch (error) {
		console.error('Error initializing Dropzone:', error);
		Toast.fire({ icon: 'error', title: 'Lỗi khởi tạo Dropzone' });
	}
};

// Generate SKU tự động (không dùng size nữa)
const generateSKU = (brandId, modelCode, variantIndex = 0) => {
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

	// Dùng variant index thay vì size
	const variantNum = String(variantIndex + 1).padStart(2, '0');

	return `${brandPrefix}-${modelShort}-${variantNum}`;
};

// Collect variants data
const collectVariants = (productId, brandId, modelCode) => {
	const variantItems = document.querySelectorAll('.variant-item');
	const variants = [];

	variantItems.forEach((item, index) => {
		const price = item.querySelector('.variant-price')?.value;
		const skuInput = item.querySelector('.variant-sku');
		const quantity = item.querySelector('.variant-quantity')?.value;
		const colorsInput = item.querySelector('.variant-colors')?.value;
		const imageHidden = item.querySelector('.variant-image-url') || item.querySelector('.variant-image');
		const image = imageHidden?.value || null;
		const variantId = item.getAttribute('data-variant-id');

		if (price && (quantity !== null && quantity !== undefined && quantity !== '') && colorsInput) {
			// Tự động generate SKU nếu chưa có hoặc input trống
			let sku = skuInput?.value?.trim();
			if (!sku && brandId && modelCode) {
				sku = generateSKU(brandId, modelCode, index);
				// Cập nhật lại input SKU
				if (skuInput) {
					skuInput.value = sku;
				}
			}

			// Parse colors - có thể là JSON string hoặc array string
			let colors = colorsInput;
			try {
				// Thử parse nếu là JSON string
				if (typeof colorsInput === 'string' && colorsInput.trim().startsWith('[')) {
					colors = JSON.parse(colorsInput);
				} else if (typeof colorsInput === 'string' && colorsInput.includes(',')) {
					// Nếu là string dạng "color1, color2", chuyển thành array
					colors = colorsInput.split(',').map(c => c.trim()).filter(c => c);
				}
				// Nếu colors là array, chuyển thành JSON string
				if (Array.isArray(colors)) {
					colors = JSON.stringify(colors);
				}
			} catch (e) {
				console.warn('Lỗi parse colors:', e);
				// Giữ nguyên nếu không parse được
			}

			const variant = {
				product_id: parseInt(productId),
				price: parseFloat(price) || 0,
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

// Collect form data với FormData (hỗ trợ upload file) - giống product-add.js
const collectFormData = () => {
	const editor = document.querySelector('#editor .ql-editor');
	let description = editor?.innerHTML || '';
	if (description.trim() === '<p><br></p>' || description.trim() === '<p></p>') {
		description = '';
	}

	const formData = new FormData();
	formData.append('name', document.getElementById('product-name')?.value || '');
	formData.append('model_code', document.getElementById('product-model-code')?.value || '');
	formData.append('category_id', document.getElementById('product-category')?.value || '');
	formData.append('brand_id', document.getElementById('product-brand')?.value || '');
	formData.append('description', description);
	formData.append('status', document.getElementById('product-status')?.value || '1');

	// Specifications
	const specifications = {};
	const specSize = document.getElementById('spec-size')?.value?.trim();
	const specMaterial = document.getElementById('spec-material')?.value?.trim();
	const specWarranty = document.getElementById('spec-warranty')?.value?.trim();
	const specWeight = document.getElementById('spec-weight')?.value?.trim();
	const specBrand = document.getElementById('spec-brand')?.value?.trim();
	const specModel = document.getElementById('spec-model')?.value?.trim();

	if (specSize) specifications.size = specSize;
	if (specMaterial) specifications.material = specMaterial;
	if (specWarranty) specifications.warranty = specWarranty;
	if (specWeight) specifications.weight = specWeight;
	if (specBrand) specifications.brand = specBrand;
	if (specModel) specifications.model = specModel;

	formData.append('specifications', JSON.stringify(specifications));

	// Xử lý ảnh: Lấy từ dropzone files hoặc từ biến
	// Ưu tiên File object từ dropzone (ảnh mới), sau đó mới đến string (ảnh cũ)
	const mainDropzoneEl = document.getElementById('main-image-dropzone');
	if (mainDropzoneEl && mainDropzoneEl.dropzone && mainDropzoneEl.dropzone.files.length > 0) {
		const mainFile = mainDropzoneEl.dropzone.files[0];
		if (mainFile instanceof File) {
			formData.append('image', mainFile);
		} else if (mainFile.serverPath) {
			formData.append('image', mainFile.serverPath);
		}
	} else if (mainImageFile instanceof File) {
		formData.append('image', mainImageFile);
	} else if (mainImageFile && typeof mainImageFile === 'string') {
		formData.append('image', mainImageFile);
	}

	// Thumbnail: chỉ lấy file đầu tiên (giống product-add.js)
	// Backend chỉ nhận 1 thumbnail file, không phải array
	const thumbDropzoneEl = document.getElementById('thumbnail-dropzone');
	if (thumbDropzoneEl && thumbDropzoneEl.dropzone && thumbDropzoneEl.dropzone.files.length > 0) {
		// Tìm file đầu tiên (ưu tiên File object mới)
		const thumbFiles = thumbDropzoneEl.dropzone.files;
		let thumbFile = null;
		
		// Ưu tiên File object (ảnh mới)
		for (const file of thumbFiles) {
			if (file instanceof File) {
				thumbFile = file;
				break;
			}
		}
		
		// Nếu không có File object, lấy serverPath đầu tiên (ảnh cũ)
		if (!thumbFile) {
			for (const file of thumbFiles) {
				if (file.serverPath) {
					thumbFile = file.serverPath;
					break;
				}
			}
		}
		
		if (thumbFile) {
			if (thumbFile instanceof File) {
				formData.append('thumbnail', thumbFile);
			} else if (typeof thumbFile === 'string') {
				formData.append('thumbnail', thumbFile);
			}
		}
	} else if (thumbnailFiles.length > 0) {
		// Fallback: lấy từ biến
		const firstThumb = thumbnailFiles[0];
		if (firstThumb instanceof File) {
			formData.append('thumbnail', firstThumb);
		} else if (firstThumb && typeof firstThumb === 'string') {
			formData.append('thumbnail', firstThumb);
		}
	}

	return formData;
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
			if (!v.colors || !v.colors.trim()) {
				errors.push(`Variant ${index + 1}: Màu sắc là bắt buộc`);
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
			// Log dữ liệu gửi lên để debug
			console.log('Saving variant:', variant);
			
			if (variant.id) {
				// Update existing variant
				const { id, ...updateData } = variant;
				console.log('Updating variant:', id, updateData);
				const res = await api.put(`/product-variants/${id}`, updateData);
				const responseData = res.data?.data || res.data;
				results.push({ success: true, variant: responseData });
			} else {
				// Create new variant
				console.log('Creating variant:', variant);
				const res = await api.post('/product-variants', variant);
				const responseData = res.data?.data || res.data;
				results.push({ success: true, variant: responseData });
			}
		} catch (error) {
			console.error('Lỗi lưu variant:', error);
			console.error('Error response:', error.response?.data);
			results.push({
				success: false,
				error: error.response?.data?.error || error.response?.data?.message || error.message
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
		// 1. Update product với FormData (hỗ trợ upload file)
		await api.put(`/products/${productId}`, formData, {
			headers: {
				'Content-Type': 'multipart/form-data'
			}
		});

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

	// Setup Dropzone - lưu File objects (giống product-add.js)
	// Truyền existingFiles từ mainImageFile và thumbnailFiles đã load
	// Nếu chưa có (lần đầu init), sẽ là empty array, ảnh sẽ được thêm sau khi loadProductData()
	mainDropzone = setupDropzone('main-image-dropzone', 1, (file) => {
		// Callback này chỉ được gọi khi user thêm file mới (không phải mock file)
		if (file instanceof File && !file.serverPath) {
			mainImageFile = file; // Lưu File object
		}
	}, mainImageFile && typeof mainImageFile === 'string' ? [mainImageFile] : []);
	
	thumbDropzone = setupDropzone('thumbnail-dropzone', 10, (file) => {
		// Callback này chỉ được gọi khi user thêm file mới (không phải mock file)
		if (file instanceof File && !file.serverPath) {
			thumbnailFiles.push(file); // Thêm File object vào array
		}
	}, Array.isArray(thumbnailFiles) && thumbnailFiles.length > 0 && typeof thumbnailFiles[0] === 'string' ? thumbnailFiles : []);

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
		if (variantData.sku) variantItem.querySelector('.variant-sku').value = variantData.sku;
		if (variantData.quantity) variantItem.querySelector('.variant-quantity').value = variantData.quantity;
		// Parse colors từ JSON array hoặc string
		if (variantData.colors) {
			let colorsValue = '';
			if (Array.isArray(variantData.colors)) {
				colorsValue = variantData.colors.join(', ');
			} else if (typeof variantData.colors === 'string') {
				try {
					const parsed = JSON.parse(variantData.colors);
					if (Array.isArray(parsed)) {
						colorsValue = parsed.join(', ');
					} else {
						colorsValue = variantData.colors;
					}
				} catch {
					colorsValue = variantData.colors;
				}
			}
			variantItem.querySelector('.variant-colors').value = colorsValue;
		}
		// Setup variant image (edit mode - hiển thị ảnh cũ nếu có)
		if (variantData.image) {
			const imageHidden = variantItem.querySelector('.variant-image');
			const imagePreview = variantItem.querySelector('.variant-image-preview');
			const imagePreviewImg = imagePreview?.querySelector('img');
			if (imageHidden) imageHidden.value = variantData.image;
			if (imagePreviewImg && variantData.image) {
				imagePreviewImg.src = variantData.image;
				imagePreview.style.display = 'block';
			}
		}
	} else {
		// Auto-generate SKU for new variant
		const brandId = document.getElementById('product-brand')?.value;
		const modelCode = document.getElementById('product-model-code')?.value;
		const skuInput = variantItem.querySelector('.variant-sku');
		const variantIndex = document.querySelectorAll('.variant-item').length;

		// Generate SKU automatically
		if (brandId && modelCode && skuInput) {
			const sku = generateSKU(brandId, modelCode, variantIndex);
			skuInput.value = sku;
		}
	}

	// Auto-update SKU when brand or model_code changes
	const skuInput = variantItem.querySelector('.variant-sku');

	const updateSKUFromForm = () => {
		const brandId = document.getElementById('product-brand')?.value;
		const modelCode = document.getElementById('product-model-code')?.value;
		const variantIndex = Array.from(document.querySelectorAll('.variant-item')).indexOf(variantItem);

		// Only auto-update if SKU is empty or was auto-generated
		if (skuInput && brandId && modelCode) {
			const currentSKU = skuInput.value;
			const expectedSKU = generateSKU(brandId, modelCode, variantIndex);

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

	// Setup variant image upload
	const imageInput = variantItem.querySelector('.variant-image-input');
	const imagePreview = variantItem.querySelector('.variant-image-preview');
	const imagePreviewImg = imagePreview?.querySelector('img');
	const imageHidden = variantItem.querySelector('.variant-image');
	const imageRemoveBtn = variantItem.querySelector('.variant-image-remove');

	if (imageInput) {
		imageInput.addEventListener('change', async (e) => {
			const file = e.target.files[0];
			if (file) {
				// Validate file type
				if (!file.type.startsWith('image/')) {
					Toast.fire({ icon: 'error', title: 'Chỉ chấp nhận file ảnh' });
					e.target.value = '';
					return;
				}

				// Validate file size (max 5MB)
				if (file.size > 5 * 1024 * 1024) {
					Toast.fire({ icon: 'error', title: 'Kích thước file không được vượt quá 5MB' });
					e.target.value = '';
					return;
				}

				// Show preview
				const reader = new FileReader();
				reader.onload = (event) => {
					if (imagePreviewImg) {
						imagePreviewImg.src = event.target.result;
						imagePreview.style.display = 'block';
					}
				};
				reader.readAsDataURL(file);

				// Upload file
				try {
					const formData = new FormData();
					formData.append('image', file);
					formData.append('folder', 'products/variants');
					const token = localStorage.getItem('token');
					const res = await api.post('/upload/image', formData, {
						headers: {
							'Content-Type': 'multipart/form-data',
							...(token ? { Authorization: `Bearer ${token}` } : {})
						}
					});

					// Parse response - có thể có nhiều lớp data
					const responseData = res.data?.data || res.data;
					const imageUrl = responseData?.data?.url || responseData?.data?.secure_url || responseData?.url || responseData?.secure_url || responseData?.path;
					if (imageUrl && imageHidden) {
						imageHidden.value = imageUrl;
					} else {
						console.error("Không nhận được URL ảnh từ server:", res.data);
						Toast.fire({ icon: 'error', title: 'Không nhận được URL ảnh từ server' });
					}
				} catch (error) {
					console.error('Lỗi upload ảnh variant:', error);
					Toast.fire({ icon: 'error', title: 'Lỗi upload ảnh' });
					e.target.value = '';
					imagePreview.style.display = 'none';
				}
			}
		});
	}

	if (imageRemoveBtn) {
		imageRemoveBtn.addEventListener('click', () => {
			if (imageInput) imageInput.value = '';
			if (imageHidden) imageHidden.value = '';
			if (imagePreview) imagePreview.style.display = 'none';
		});
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

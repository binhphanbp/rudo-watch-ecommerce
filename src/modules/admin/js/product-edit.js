import api, { getImageUrl } from "../../../shared/services/api.js";
import Swal from "../../../shared/utils/swal.js";

// Toast notification
const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

// State
let product = null;
let brands = [];
let categories = [];
let variantCounter = 0;
let mainImageFile = null; // File object hoặc string (URL cũ) - chỉ 1 ảnh
let thumbnailFiles = []; // Array of File objects hoặc strings (URL cũ) - nhiều ảnh
let originalMainImage = null; // Ảnh gốc từ server (để restore khi xóa ảnh mới)
let mainDropzone = null;
let thumbDropzone = null;

// DOM Elements
const productForm = document.getElementById("product-form");
const productNameInput = document.getElementById("product-name");
const productModelCodeInput = document.getElementById("product-model-code");
const productCategorySelect = document.getElementById("product-category");
const productBrandSelect = document.getElementById("product-brand");
const productStatusSelect = document.getElementById("product-status");
const submitBtn = document.getElementById("submit-product-btn");
const variantsContainer = document.getElementById("variants-container");
const noVariantsMessage = document.getElementById("no-variants-message");
const addVariantBtn = document.getElementById("add-variant-btn");
const variantTemplate = document.getElementById("variant-template");

// ==================== API CALLS ====================

/**
 * Lấy thông tin sản phẩm theo ID
 */
async function fetchProduct(productId) {
  try {
    const response = await api.get(`/products/${productId}`);
    product = response.data?.data || response.data || null;
    
    if (!product) {
      Toast.fire({
        icon: "error",
        title: "Không tìm thấy sản phẩm",
      });
      setTimeout(() => {
        window.location.href = "/src/pages/admin/product-list.html";
      }, 2000);
      return;
    }

    populateForm(product);
	} catch (error) {
    Toast.fire({
      icon: "error",
      title: "Không thể tải thông tin sản phẩm",
    });
    setTimeout(() => {
      window.location.href = "/src/pages/admin/product-list.html";
    }, 2000);
  }
}

/**
 * Cập nhật sản phẩm
 */
async function updateProduct(productId, formData) {
  try {
    // PHP không đọc được $_FILES từ PUT, nên dùng POST với _method=PUT
    formData.append("_method", "PUT");
    
    const response = await api.post(`/products/${productId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    Toast.fire({
      icon: "success",
      title: response.data.message || "Cập nhật sản phẩm thành công",
    });

    // KHÔNG reload ở đây - sẽ reload sau khi update variants xong
    // await fetchProduct(productId);
	} catch (error) {
    const errorMsg =
      error.response?.data?.error ||
      error.response?.data?.message ||
      "Không thể cập nhật sản phẩm";
    Toast.fire({
      icon: "error",
      title: errorMsg,
    });
    throw error;
  }
}

/**
 * Lấy danh sách brands và categories
 */
async function fetchBrandsAndCategories() {
  try {
    const [brandsRes, categoriesRes] = await Promise.all([
      api.get("/brands"),
      api.get("/categories"),
    ]);

    brands = brandsRes.data?.data || brandsRes.data || [];
    categories = categoriesRes.data?.data || categoriesRes.data || [];

    // Populate selects
    populateSelect(brands, productBrandSelect, "Chọn thương hiệu");
    populateSelect(categories, productCategorySelect, "Chọn danh mục");
  } catch (error) {
    Toast.fire({
      icon: "error",
      title: "Không thể tải danh sách thương hiệu/danh mục",
    });
  }
}

/**
 * Lưu variants (tạo mới hoặc cập nhật)
 */
async function saveVariants(productId, variants) {
  const results = [];

  for (const variant of variants) {
    try {
      if (variant.id) {
        // Update existing variant
        const { id, ...updateData } = variant;
        // Đảm bảo có product_id trong update data
        if (!updateData.product_id) {
          updateData.product_id = parseInt(productId);
        }
        
        // Chuẩn hóa dữ liệu - chỉ gửi các field có giá trị (giống backend expect)
        const cleanData = {};
        
        // Product ID - bắt buộc (backend kiểm tra isset)
        if (updateData.product_id !== undefined && updateData.product_id !== null) {
          cleanData.product_id = parseInt(updateData.product_id);
        }
        
        // Price - bắt buộc (backend kiểm tra isset và is_numeric)
        if (updateData.price !== undefined && updateData.price !== null) {
          cleanData.price = parseFloat(updateData.price);
        }
        
        // SKU - chỉ gửi nếu có giá trị
        if (updateData.sku !== undefined && updateData.sku !== null && updateData.sku !== "") {
          cleanData.sku = String(updateData.sku).trim();
        }
        
        // Quantity - chỉ gửi nếu có giá trị
        if (updateData.quantity !== undefined && updateData.quantity !== null && updateData.quantity !== "") {
          cleanData.quantity = parseInt(updateData.quantity) || 0;
        }
        
        // Colors - chỉ gửi nếu có giá trị (backend sẽ normalize)
        if (updateData.colors !== undefined && updateData.colors !== null && updateData.colors !== "") {
          cleanData.colors = String(updateData.colors).trim();
        }
        
        // Image - chỉ gửi nếu có URL hợp lệ
        // Backend: ưu tiên imagePath từ upload, sau đó mới đến data->image
        if (updateData.image !== undefined && updateData.image !== null && updateData.image !== "" && updateData.image !== "null") {
          cleanData.image = String(updateData.image).trim();
        }
        // Nếu không có image, không gửi field này (backend sẽ giữ nguyên ảnh cũ)
        
        // Đảm bảo gửi với Content-Type: application/json (api.js đã set default, nhưng đảm bảo)
        const response = await api.put(`/product-variants/${id}`, cleanData, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const updatedVariant = response.data?.data || response.data || variant;
        
        results.push({ 
          success: true, 
          variant: updatedVariant
        });
      } else {
        // Create new variant
        const newVariant = {
          ...variant,
          product_id: parseInt(productId),
        };
        const response = await api.post("/product-variants", newVariant);
        results.push({ 
          success: true, 
          variant: response.data?.data || response.data 
        });
      }
    } catch (error) {
      // Lấy thông báo lỗi chi tiết
      let errorMsg = "Lỗi không xác định";
      if (error.response?.data) {
        if (typeof error.response.data === "object") {
          errorMsg = error.response.data.error || 
                    error.response.data.message || 
                    error.response.data.errors ||
                    JSON.stringify(error.response.data);
        } else {
          errorMsg = error.response.data;
        }
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      results.push({
        success: false,
        error: typeof errorMsg === "object" ? JSON.stringify(errorMsg) : String(errorMsg),
        variant: variant,
      });
    }
  }

  return results;
}

// ==================== FORM POPULATION ====================

/**
 * Điền dữ liệu vào form
 */
function populateForm(productData) {
  // Basic info
  if (productNameInput) productNameInput.value = productData.name || "";
  if (productModelCodeInput) productModelCodeInput.value = productData.model_code || "";
  if (productCategorySelect) productCategorySelect.value = productData.category_id || "";
  if (productBrandSelect) productBrandSelect.value = productData.brand_id || "";
  if (productStatusSelect) productStatusSelect.value = productData.status ?? 1;

  // Description (Quill editor)
  const editor = document.querySelector("#editor .ql-editor");
  if (editor && productData.description) {
    editor.innerHTML = productData.description;
  }

  // Specifications
  if (productData.specifications) {
    const specs = typeof productData.specifications === "string" 
      ? JSON.parse(productData.specifications) 
      : productData.specifications;
    
    const specSize = document.getElementById("spec-size");
    const specBrand = document.getElementById("spec-brand");
    const specModel = document.getElementById("spec-model");
    const specMaterial = document.getElementById("spec-material");
    const specWeight = document.getElementById("spec-weight");
    const specWarranty = document.getElementById("spec-warranty");

    if (specSize) specSize.value = specs.size || "";
    if (specBrand) specBrand.value = specs.brand || "";
    if (specModel) specModel.value = specs.model || "";
    if (specMaterial) specMaterial.value = specs.material || "";
    if (specWeight) specWeight.value = specs.weight || "";
    if (specWarranty) specWarranty.value = specs.warranty || "";
  }

  // Images - lưu cả original để restore khi cần
  mainImageFile = productData.image || null;
  originalMainImage = productData.image || null; // Lưu ảnh gốc
  
  // Parse thumbnail - có thể là string, JSON string, hoặc array
  thumbnailFiles = [];
  if (productData.thumbnail) {
    try {
      if (typeof productData.thumbnail === "string") {
        // Thử parse JSON nếu có
        if (productData.thumbnail.trim().startsWith("[")) {
          thumbnailFiles = JSON.parse(productData.thumbnail);
			} else {
          // Nếu là string đơn giản, coi như 1 ảnh
          thumbnailFiles = [productData.thumbnail];
        }
      } else if (Array.isArray(productData.thumbnail)) {
        thumbnailFiles = productData.thumbnail;
      }
    } catch (e) {
      thumbnailFiles = [];
    }
  }

  // Load images vào dropzone - đảm bảo Dropzone đã sẵn sàng
  // Sẽ được gọi sau trong init() để đảm bảo timing đúng

  // Variants
  if (productData.variants && Array.isArray(productData.variants) && productData.variants.length > 0) {
    loadVariants(productData.variants);
			} else {
    if (noVariantsMessage) noVariantsMessage.style.display = "block";
  }

  // Status indicator
  updateStatusIndicator(productData.status);
}

/**
 * Populate select dropdown
 */
function populateSelect(data, selectElement, placeholder) {
  if (!selectElement) return;
  
  selectElement.innerHTML = `<option value="">-- ${placeholder} --</option>`;
  data.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.name || item.title;
    selectElement.appendChild(option);
  });
}

// ==================== DROPZONE SETUP ====================

/**
 * Setup Dropzone cho ảnh
 */
function setupDropzone(elementId, maxFiles, existingFiles) {
	const element = document.getElementById(elementId);
  if (!element || typeof Dropzone === "undefined") {
    return null;
  }

		Dropzone.autoDiscover = false;

  // Destroy existing instance
		if (element.dropzone) {
			element.dropzone.destroy();
		}

  if (!element.classList.contains("dropzone")) {
    element.classList.add("dropzone");
		}

		const dropzone = new Dropzone(element, {
    url: "#",
			maxFiles,
    acceptedFiles: "image/*",
			addRemoveLinks: true,
    autoProcessQueue: false, // Không upload tự động
    preventMultiple: true, // Chỉ cho phép 1 file
    thumbnailWidth: 120, // Set width cho thumbnail
    thumbnailHeight: 120, // Set height cho thumbnail
    thumbnailMethod: "contain", // Cách hiển thị thumbnail
    dictDefaultMessage: maxFiles === 1 ? "Kéo thả ảnh chính vào đây" : "Kéo thả ảnh thumbnail vào đây",
    dictRemoveFile: "Xóa",
			init: function () {
      const dzInstance = this;

      // Load existing files nếu có
      const filesToLoad = Array.isArray(existingFiles) ? existingFiles : (existingFiles ? [existingFiles] : []);
      
      filesToLoad.forEach((existingFile) => {
        if (existingFile && typeof existingFile === "string") {
          try {
            // Sử dụng getImageUrl để lấy URL đầy đủ
            const imageUrl = getImageUrl ? getImageUrl(existingFile) : existingFile;
            const fileName = existingFile.split("/").pop() || existingFile.split("\\").pop() || "image.jpg";
            
            // Tạo mock file object với URL đầy đủ
							const mockFile = {
								name: fileName,
								size: 0,
              type: "image/png", // Set type để Dropzone nhận diện là ảnh
								status: Dropzone.ADDED,
              accepted: true,
              serverPath: existingFile, // Lưu path gốc
							};
            
            // Push file vào array trước khi emit
            dzInstance.files.push(mockFile);
							
							// Thêm file vào dropzone
            dzInstance.emit("addedfile", mockFile);
            
            // Tạo thumbnail từ URL - dùng setTimeout để đảm bảo DOM đã được tạo
            setTimeout(() => {
              // Tạo image element để load thumbnail
              const img = new Image();
              img.crossOrigin = "anonymous";
              
              img.onload = function() {
                try {
                  // Tạo canvas để tạo thumbnail
                  const canvas = document.createElement("canvas");
                  const ctx = canvas.getContext("2d");
                  
                  // Resize để tạo thumbnail
                  const maxWidth = 120;
                  const maxHeight = 120;
                  let width = img.width;
                  let height = img.height;
                  
                  if (width > height) {
                    if (width > maxWidth) {
                      height = (height * maxWidth) / width;
                      width = maxWidth;
                    }
                  } else {
                    if (height > maxHeight) {
                      width = (width * maxHeight) / height;
                      height = maxHeight;
                    }
                  }
                  
                  canvas.width = width;
                  canvas.height = height;
                  ctx.drawImage(img, 0, 0, width, height);
                  
                  // Tạo dataURL từ canvas
                  const dataURL = canvas.toDataURL("image/png");
                  
                  // Set thumbnail cho Dropzone
                  dzInstance.emit("thumbnail", mockFile, dataURL);
                  dzInstance.emit("complete", mockFile);
                  
                  // Cũng set trực tiếp vào preview element nếu có
                  const previewElement = mockFile.previewElement;
                  if (previewElement) {
                    const imgElement = previewElement.querySelector("img[data-dz-thumbnail]");
                    if (imgElement) {
                      imgElement.src = dataURL;
                      imgElement.alt = fileName;
                    }
                  }
                } catch (error) {
                  // Fallback: dùng URL trực tiếp
                  dzInstance.emit("thumbnail", mockFile, imageUrl);
                  dzInstance.emit("complete", mockFile);
                }
              };
              
              img.onerror = function() {
                // Nếu load lỗi (CORS), vẫn set URL trực tiếp
                dzInstance.emit("thumbnail", mockFile, imageUrl);
                dzInstance.emit("complete", mockFile);
                
                // Set trực tiếp vào preview element
                const previewElement = mockFile.previewElement;
                if (previewElement) {
                  const imgElement = previewElement.querySelector("img[data-dz-thumbnail]");
                  if (imgElement) {
                    imgElement.src = imageUrl;
                    imgElement.alt = fileName;
                  }
                }
              };
              
              img.src = imageUrl;
            }, 200); // Delay để đảm bảo DOM đã được render
          } catch (error) {
            // Ignore errors
          }
        }
      });

      // Ngăn chặn upload thực sự (vì chỉ cần preview)
      dzInstance.on("sending", (file, xhr, formData) => {
        // Cancel upload vì chúng ta chỉ muốn preview
        xhr.abort();
        // Không cần xử lý thêm vì đã có autoProcessQueue: false
      });

      // Xử lý khi vượt quá maxFiles - chỉ áp dụng cho ảnh chính (maxFiles === 1)
      dzInstance.on("maxfilesexceeded", (file) => {
        if (maxFiles === 1) {
          // Chỉ với ảnh chính: xóa file đầu tiên (file cũ nhất)
          if (dzInstance.files.length > 0) {
            dzInstance.removeFile(dzInstance.files[0]);
          }
          // Sau đó thêm file mới
          dzInstance.addFile(file);
        }
        // Với thumbnail (maxFiles > 1): không cần xử lý, chỉ cần hiển thị lỗi hoặc bỏ qua
      });

      // Handle file added
      dzInstance.on("addedfile", (file) => {
        // Chỉ xử lý File object mới (không phải mock file từ server)
					if (!file.serverPath && file instanceof File) {
						if (maxFiles === 1) {
            // Ảnh chính: xóa các file cũ khác (trừ file hiện tại) nếu có
            dzInstance.files.forEach((f) => {
              if (f !== file) {
                dzInstance.removeFile(f);
              }
            });
            mainImageFile = file; // Lưu file mới
          } else {
            // Thumbnail: thêm vào array (không xóa file cũ)
								thumbnailFiles.push(file);
						}
					}
				});

      // Handle file removed
      dzInstance.on("removedfile", (file) => {
					if (maxFiles === 1) {
          // Xử lý ảnh chính
          if (file.serverPath) {
            // Xóa ảnh cũ từ server - không restore
						mainImageFile = null;
            originalMainImage = null; // Đã xóa vĩnh viễn
					} else {
            // Xóa file mới - restore lại ảnh gốc từ server nếu có
            mainImageFile = null;
            if (originalMainImage) {
              setTimeout(() => {
                restoreOriginalImage(dzInstance, originalMainImage, "main");
              }, 100);
            }
          }
        } else {
          // Xử lý thumbnail: chỉ xóa khỏi array, không restore
						if (file.serverPath) {
            // Xóa ảnh cũ từ server khỏi array
							thumbnailFiles = thumbnailFiles.filter(f => {
              if (typeof f === "string") {
                return f !== file.serverPath;
              }
								return true;
							});
          } else {
            // Xóa file mới khỏi array
            thumbnailFiles = thumbnailFiles.filter(f => f !== file);
						}
					}
				});

      // Xử lý lỗi - bỏ qua lỗi "Upload canceled" và "maxFiles" vì đó là hành vi mong muốn
      dzInstance.on("error", (file, error) => {
        // Bỏ qua các lỗi không cần thiết
        if (
          error === "Upload canceled" ||
          error === "You can't upload files of this type." ||
          error === "You can not upload any more files." ||
          (typeof error === "string" && (
            error.includes("canceled") ||
            error.includes("not upload any more files") ||
            error.includes("maxFiles")
          ))
        ) {
          // Không hiển thị lỗi cho những trường hợp này
          return;
        }

        // Chỉ hiển thị lỗi thực sự
        Toast.fire({
          icon: "error",
          title: "Lỗi: " + (error?.message || error),
        });
      });
    },
  });

  return dropzone;
}

/**
 * Restore ảnh gốc vào dropzone (chỉ cho ảnh chính)
 */
function restoreOriginalImage(dzInstance, imagePath, type) {
  if (!imagePath || !dzInstance || type !== "main") return;

  const imageUrl = getImageUrl(imagePath);
  const fileName = imagePath.split("/").pop() || imagePath.split("\\").pop() || "image.jpg";
  const mockFile = {
    name: fileName,
    size: 0,
    status: Dropzone.ADDED,
    accepted: true,
    serverPath: imagePath,
  };

  dzInstance.emit("addedfile", mockFile);
  dzInstance.emit("thumbnail", mockFile, imageUrl);
  dzInstance.emit("complete", mockFile);
  dzInstance.files.push(mockFile);

  // Cập nhật lại state
  mainImageFile = imagePath;
}

/**
 * Load ảnh vào dropzone
 */
function loadImagesToDropzone() {
  if (typeof Dropzone === "undefined") {
    setTimeout(loadImagesToDropzone, 100);
    return;
  }

  // Setup main image dropzone (chỉ 1 ảnh)
  let mainImagesToLoad = [];
  if (mainImageFile) {
    if (typeof mainImageFile === "string") {
      mainImagesToLoad = [mainImageFile];
    } else if (mainImageFile instanceof File) {
      // File object mới, không cần load vào dropzone (đã có trong dropzone)
      mainImagesToLoad = [];
    }
  }
  
  mainDropzone = setupDropzone("main-image-dropzone", 1, mainImagesToLoad);

  // Setup thumbnail dropzone (nhiều ảnh - max 10)
  let thumbImagesToLoad = [];
  if (thumbnailFiles && thumbnailFiles.length > 0) {
    thumbImagesToLoad = thumbnailFiles.filter(f => typeof f === "string");
  }
  
  thumbDropzone = setupDropzone("thumbnail-dropzone", 10, thumbImagesToLoad);
}

// ==================== VARIANTS MANAGEMENT ====================

/**
 * Load variants vào form
 */
function loadVariants(variants) {
  if (!variantsContainer || !variantTemplate) return;

  // Clear existing
  const existingVariants = variantsContainer.querySelectorAll(".variant-item");
  existingVariants.forEach((v) => v.remove());

  variantCounter = 0;

  if (variants.length === 0) {
    if (noVariantsMessage) noVariantsMessage.style.display = "block";
    return;
  }

  if (noVariantsMessage) noVariantsMessage.style.display = "none";

  variants.forEach((variant) => {
    addVariant(variant);
  });
}

/**
 * Thêm variant vào form
 */
function addVariant(variantData = null) {
  if (!variantTemplate || !variantsContainer) return;

  variantCounter++;
  const clone = variantTemplate.content.cloneNode(true);
  const variantItem = clone.querySelector(".variant-item");

  variantItem.setAttribute("data-variant-index", variantCounter);
  if (variantData?.id) {
    variantItem.setAttribute("data-variant-id", variantData.id);
  }

  const variantNumber = variantItem.querySelector(".variant-number");
  if (variantNumber) {
    variantNumber.textContent = variantCounter;
  }

  // Fill data nếu có (edit mode)
  if (variantData) {
    const priceInput = variantItem.querySelector(".variant-price");
    const skuInput = variantItem.querySelector(".variant-sku");
    const quantityInput = variantItem.querySelector(".variant-quantity");
    const colorsInput = variantItem.querySelector(".variant-colors");
    const imageHidden = variantItem.querySelector(".variant-image");
    const imagePreview = variantItem.querySelector(".variant-image-preview");
    const imagePreviewImg = imagePreview?.querySelector("img");

    if (priceInput) priceInput.value = variantData.price || "";
    if (skuInput) skuInput.value = variantData.sku || "";
    if (quantityInput) quantityInput.value = variantData.quantity || "";

    // Parse colors
    if (colorsInput && variantData.colors) {
      let colorsValue = "";
      if (Array.isArray(variantData.colors)) {
        colorsValue = variantData.colors.join(", ");
      } else if (typeof variantData.colors === "string") {
        try {
          const parsed = JSON.parse(variantData.colors);
          if (Array.isArray(parsed)) {
            colorsValue = parsed.join(", ");
          } else {
            colorsValue = variantData.colors;
          }
        } catch {
          colorsValue = variantData.colors;
        }
      }
      colorsInput.value = colorsValue;
    }

    // Image - hiển thị ảnh từ server
    if (variantData.image) {
      // Xử lý image - có thể là URL đầy đủ hoặc path
      let imagePath = variantData.image;
      const imageUrl = getImageUrl ? getImageUrl(imagePath) : imagePath;
      
      if (imageHidden) {
        // Lưu path gốc (URL hoặc path từ server)
        imageHidden.value = imagePath;
      }
      
      if (imagePreviewImg) {
        imagePreviewImg.src = imageUrl;
        imagePreviewImg.alt = variantData.sku || "Variant image";
        if (imagePreview) {
          imagePreview.style.display = "block";
        }
      }
    } else {
      // Không có ảnh - đảm bảo preview bị ẩn
      if (imagePreview) {
        imagePreview.style.display = "none";
      }
      if (imageHidden) {
        imageHidden.value = "";
      }
    }
  } else {
    // Auto-generate SKU for new variant
    autoGenerateSKU(variantItem);
  }

  // Setup variant image upload
  setupVariantImageUpload(variantItem);

  // Remove button
  const removeBtn = variantItem.querySelector(".remove-variant-btn");
  if (removeBtn) {
    removeBtn.addEventListener("click", () => removeVariant(variantItem));
  }

  variantsContainer.appendChild(clone);
  updateVariantNumbers();

  if (noVariantsMessage) noVariantsMessage.style.display = "none";
}

/**
 * Xóa variant
 */
function removeVariant(variantItem) {
  variantItem.remove();
  updateVariantNumbers();

  const variantItems = variantsContainer.querySelectorAll(".variant-item");
  if (variantItems.length === 0 && noVariantsMessage) {
    noVariantsMessage.style.display = "block";
  }
}

/**
 * Cập nhật số thứ tự variants
 */
function updateVariantNumbers() {
  const variantItems = variantsContainer.querySelectorAll(".variant-item");
  variantItems.forEach((item, index) => {
    const variantNumber = item.querySelector(".variant-number");
    if (variantNumber) {
      variantNumber.textContent = index + 1;
    }
    item.setAttribute("data-variant-index", index + 1);
  });
}

/**
 * Tự động generate SKU
 */
function autoGenerateSKU(variantItem) {
  const brandId = productBrandSelect?.value;
  const modelCode = productModelCodeInput?.value;
  const skuInput = variantItem.querySelector(".variant-sku");

  if (!skuInput || !brandId || !modelCode) return;

  // Get brand prefix
  const brand = brands.find((b) => b.id == brandId);
  const brandPrefix = brand ? (brand.name || "").substring(0, 3).toUpperCase() : "UNK";

  // Get model short
  const parts = modelCode.split("-");
  const modelShort = parts.length > 1 ? parts.slice(-1)[0] : modelCode.substring(0, 6).toUpperCase();

  // Variant number
  const variantIndex = variantsContainer.querySelectorAll(".variant-item").length;
  const variantNum = String(variantIndex + 1).padStart(2, "0");

  const sku = `${brandPrefix}-${modelShort}-${variantNum}`;
  skuInput.value = sku;
}

/**
 * Setup variant image upload
 */
function setupVariantImageUpload(variantItem) {
  const imageInput = variantItem.querySelector(".variant-image-input");
  const imagePreview = variantItem.querySelector(".variant-image-preview");
  const imagePreviewImg = imagePreview?.querySelector("img");
  const imageHidden = variantItem.querySelector(".variant-image");
  const imageRemoveBtn = variantItem.querySelector(".variant-image-remove");

  if (!imageInput || !imageHidden) return;

  imageInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith("image/")) {
      Toast.fire({
        icon: "error",
        title: "Chỉ chấp nhận file ảnh",
      });
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      Toast.fire({
        icon: "error",
        title: "Kích thước file không được vượt quá 5MB",
      });
      e.target.value = "";
      return;
    }

    // Preview
    if (imagePreviewImg) {
      const reader = new FileReader();
      reader.onload = (event) => {
        imagePreviewImg.src = event.target.result;
        if (imagePreview) imagePreview.style.display = "block";
      };
      reader.readAsDataURL(file);
    }

    // Upload
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("folder", "products/variants");

      const response = await api.post("/upload/image", formData, {
			headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const responseData = response.data?.data || response.data;
      const imageUrl =
        responseData?.data?.url ||
        responseData?.data?.secure_url ||
        responseData?.url ||
        responseData?.secure_url ||
        responseData?.path;

      if (imageUrl && imageHidden) {
        imageHidden.value = imageUrl;
		} else {
        throw new Error("Không nhận được URL ảnh từ server");
		}
	} catch (error) {
      Toast.fire({
        icon: "error",
        title: "Lỗi upload ảnh",
      });
      e.target.value = "";
      if (imagePreview) imagePreview.style.display = "none";
    }
  });

  if (imageRemoveBtn) {
    imageRemoveBtn.addEventListener("click", () => {
      if (imageInput) imageInput.value = "";
      if (imageHidden) imageHidden.value = "";
      if (imagePreview) imagePreview.style.display = "none";
    });
  }
}

// ==================== FORM VALIDATION & SUBMISSION ====================

/**
 * Thu thập dữ liệu form
 */
function collectFormData() {
	const formData = new FormData();

  // Basic info
  formData.append("name", productNameInput?.value || "");
  formData.append("model_code", productModelCodeInput?.value || "");
  formData.append("category_id", productCategorySelect?.value || "");
  formData.append("brand_id", productBrandSelect?.value || "");
  formData.append("status", productStatusSelect?.value || "1");

  // Description
  const editor = document.querySelector("#editor .ql-editor");
  let description = editor?.innerHTML || "";
  if (description.trim() === "<p><br></p>" || description.trim() === "<p></p>") {
    description = "";
  }
  formData.append("description", description);

	// Specifications
	const specifications = {};
  const specSize = document.getElementById("spec-size")?.value?.trim();
  const specBrand = document.getElementById("spec-brand")?.value?.trim();
  const specModel = document.getElementById("spec-model")?.value?.trim();
  const specMaterial = document.getElementById("spec-material")?.value?.trim();
  const specWeight = document.getElementById("spec-weight")?.value?.trim();
  const specWarranty = document.getElementById("spec-warranty")?.value?.trim();

	if (specSize) specifications.size = specSize;
	if (specBrand) specifications.brand = specBrand;
	if (specModel) specifications.model = specModel;
  if (specMaterial) specifications.material = specMaterial;
  if (specWeight) specifications.weight = specWeight;
  if (specWarranty) specifications.warranty = specWarranty;

  formData.append("specifications", JSON.stringify(specifications));

  // Images - ưu tiên File object mới, sau đó mới đến string (ảnh cũ)
  if (mainDropzone && mainDropzone.files.length > 0) {
    const mainFile = mainDropzone.files[0];
		if (mainFile instanceof File) {
      formData.append("image", mainFile);
		} else if (mainFile.serverPath) {
      formData.append("image", mainFile.serverPath);
		}
	} else if (mainImageFile instanceof File) {
    formData.append("image", mainImageFile);
  } else if (mainImageFile && typeof mainImageFile === "string") {
    formData.append("image", mainImageFile);
  }

  // Thumbnail: chỉ lấy file đầu tiên (giống product-add.js) vì backend có thể chỉ nhận 1 file
  if (thumbDropzone && thumbDropzone.files.length > 0) {
		// Tìm file đầu tiên (ưu tiên File object mới)
		let thumbFile = null;
    for (const file of thumbDropzone.files) {
			if (file instanceof File) {
				thumbFile = file;
				break;
			}
		}
    // Nếu không có File object, lấy serverPath đầu tiên
		if (!thumbFile) {
      for (const file of thumbDropzone.files) {
				if (file.serverPath) {
					thumbFile = file.serverPath;
					break;
				}
			}
		}
		
		if (thumbFile) {
			if (thumbFile instanceof File) {
        formData.append("thumbnail", thumbFile);
      } else if (typeof thumbFile === "string") {
        formData.append("thumbnail", thumbFile);
			}
		}
	} else if (thumbnailFiles.length > 0) {
    // Fallback: lấy từ array
		const firstThumb = thumbnailFiles[0];
		if (firstThumb instanceof File) {
      formData.append("thumbnail", firstThumb);
    } else if (typeof firstThumb === "string") {
      formData.append("thumbnail", firstThumb);
		}
	}

	return formData;
}

/**
 * Thu thập variants data
 */
function collectVariants() {
  const variantItems = variantsContainer.querySelectorAll(".variant-item");
  const variants = [];

  variantItems.forEach((item, index) => {
    const price = item.querySelector(".variant-price")?.value;
    const skuInput = item.querySelector(".variant-sku");
    const quantity = item.querySelector(".variant-quantity")?.value;
    const colorsInput = item.querySelector(".variant-colors")?.value?.trim();
    const imageHidden = item.querySelector(".variant-image");
    const image = imageHidden?.value?.trim() || null;
    const variantId = item.getAttribute("data-variant-id");

    if (price && quantity !== null && quantity !== "" && colorsInput) {
      // Auto-generate SKU nếu chưa có
      let sku = skuInput?.value?.trim();
      if (!sku) {
        const brandId = productBrandSelect?.value;
        const modelCode = productModelCodeInput?.value;
        if (brandId && modelCode && brands.length > 0) {
          const brand = brands.find((b) => b.id == brandId);
          const brandPrefix = brand ? (brand.name || "").substring(0, 3).toUpperCase() : "UNK";
          const parts = modelCode.split("-");
          const modelShort = parts.length > 1 ? parts.slice(-1)[0] : modelCode.substring(0, 6).toUpperCase();
          const variantNum = String(index + 1).padStart(2, "0");
          sku = `${brandPrefix}-${modelShort}-${variantNum}`;
			} else {
          sku = `SKU-${Date.now()}-${index}`;
        }
      }

      // Parse colors - giống product-add.js (gửi string trực tiếp)
      let colorsValue = colorsInput;
      // Backend sẽ tự normalize, không cần JSON.stringify

      const variant = {
        price: parseFloat(price) || 0,
        sku: sku,
        quantity: parseInt(quantity) || 0,
        colors: colorsValue || null,
      };

      // Chỉ thêm image nếu có giá trị (không phải empty string)
      if (image && image.trim() !== "") {
        variant.image = image.trim();
      } else {
        variant.image = null; // Đảm bảo là null, không phải empty string
      }

      if (variantId) {
        variant.id = parseInt(variantId);
      }

      variants.push(variant);
    }
  });

  return variants;
}

/**
 * Validate form
 */
function validateForm() {
  const errors = [];

  if (!productNameInput?.value?.trim()) {
    errors.push("Tên sản phẩm là bắt buộc");
  }

  if (!productModelCodeInput?.value?.trim()) {
    errors.push("Mã sản phẩm là bắt buộc");
  }

  if (!productCategorySelect?.value) {
    errors.push("Vui lòng chọn danh mục");
  }

  if (!productBrandSelect?.value) {
    errors.push("Vui lòng chọn thương hiệu");
  }

  const variants = collectVariants();
  if (variants.length === 0) {
    errors.push("Vui lòng thêm ít nhất một variant");
  } else {
    variants.forEach((v, index) => {
      if (!v.price || v.price <= 0) {
        errors.push(`Variant ${index + 1}: Giá phải lớn hơn 0`);
      }
      if (v.quantity === null || v.quantity === undefined || v.quantity === "") {
        errors.push(`Variant ${index + 1}: Số lượng là bắt buộc`);
      }
      if (!v.colors || !v.colors.trim()) {
        errors.push(`Variant ${index + 1}: Màu sắc là bắt buộc`);
      }
    });
  }

  return errors;
}

/**
 * Handle form submit
 */
async function handleFormSubmit(e) {
			e.preventDefault();

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");

  if (!productId) {
    Toast.fire({
      icon: "error",
      title: "Không tìm thấy ID sản phẩm",
    });
					return;
				}

  // Validate
  const errors = validateForm();
  if (errors.length > 0) {
    Toast.fire({
      icon: "warning",
      title: errors.join(", "),
    });
					return;
				}

  // Show loading
  Swal.fire({
    title: "Đang cập nhật...",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  try {
    // 1. Update product (KHÔNG reload ở đây)
    const formData = collectFormData();
    await updateProduct(productId, formData);

    // 2. Save variants
    const variants = collectVariants();
    if (variants.length > 0) {
      const variantResults = await saveVariants(productId, variants);
      const failedVariants = variantResults.filter((r) => !r.success);
      
      if (failedVariants.length > 0) {
        const errorMessages = failedVariants.map((r) => r.error).join(", ");
        Swal.fire({
          icon: "warning",
          title: "Cập nhật thành công",
          text: `Nhưng có lỗi khi lưu variants: ${errorMessages}`,
        });
        // Reload data để hiển thị những gì đã cập nhật thành công
        await fetchProduct(productId);
      } else {
        Swal.close();
        Toast.fire({
          icon: "success",
          title: "Cập nhật sản phẩm và variants thành công!",
        });
        
        // Cập nhật UI với variant data từ response (có thể có ảnh mới)
        const updatedVariants = variantResults
          .filter((r) => r.success && r.variant)
          .map((r) => r.variant);
        
        if (updatedVariants.length > 0) {
          // Cập nhật ảnh variant trong UI với data từ response
          updatedVariants.forEach((updatedVariant) => {
            const variantItem = variantsContainer.querySelector(
              `[data-variant-id="${updatedVariant.id}"]`
            );
            if (variantItem) {
              const imageHidden = variantItem.querySelector(".variant-image");
              const imagePreviewImg = variantItem.querySelector(".variant-image-preview img");
              const imagePreview = variantItem.querySelector(".variant-image-preview");
              
              if (updatedVariant.image) {
                const imageUrl = getImageUrl ? getImageUrl(updatedVariant.image) : updatedVariant.image;
                if (imageHidden) {
                  imageHidden.value = updatedVariant.image;
                }
                if (imagePreviewImg) {
                  imagePreviewImg.src = imageUrl;
                  if (imagePreview) {
                    imagePreview.style.display = "block";
                  }
                }
              } else {
                // Nếu không có ảnh, clear preview
                if (imageHidden) {
                  imageHidden.value = "";
                }
                if (imagePreview) {
                  imagePreview.style.display = "none";
                }
              }
            }
          });
        }
        
        // Sau đó reload để đảm bảo sync với server
        await fetchProduct(productId);
      }
    } else {
      Swal.close();
      // Reload lại product data
      await fetchProduct(productId);
				}
				} catch (error) {
    Swal.close();
    // Error đã được xử lý trong updateProduct
  }
}

/**
 * Update status indicator
 */
function updateStatusIndicator(status) {
  const indicator = document.getElementById("status-indicator");
  if (indicator) {
    indicator.className =
      status === 1
        ? "p-2 h-100 bg-success rounded-circle"
        : "p-2 h-100 bg-danger rounded-circle";
  }
}

// ==================== INIT ====================

/**
 * Initialize
 */
async function init() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");

  if (!productId) {
    Toast.fire({
      icon: "error",
      title: "Không tìm thấy ID sản phẩm",
    });
    setTimeout(() => {
      window.location.href = "/src/pages/admin/product-list.html";
    }, 2000);
					return;
				}

  // Wait for Dropzone to be available
  let retryCount = 0;
  while (typeof Dropzone === "undefined" && retryCount < 10) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    retryCount++;
  }

  if (typeof Dropzone === "undefined") {
    Toast.fire({
      icon: "error",
      title: "Dropzone chưa được load, vui lòng tải lại trang",
    });
					return;
				}

  // Fetch data - brands và categories phải load TRƯỚC product để populateForm có thể set giá trị
  await fetchBrandsAndCategories();
  await fetchProduct(productId);

  // Setup dropzones sau khi product data đã được load
  // Đảm bảo mainImageFile và thumbnailFiles đã được set trong populateForm
  loadImagesToDropzone();

  // Form submit
  if (productForm) {
    productForm.addEventListener("submit", handleFormSubmit);
  }

  if (submitBtn) {
    submitBtn.addEventListener("click", handleFormSubmit);
  }

  // Status change
  if (productStatusSelect) {
    productStatusSelect.addEventListener("change", (e) => {
      updateStatusIndicator(parseInt(e.target.value));
    });
  }

  // Add variant button
  if (addVariantBtn) {
    addVariantBtn.addEventListener("click", () => addVariant());
  }

  // Auto-update SKU when brand/model changes
  if (productBrandSelect) {
    productBrandSelect.addEventListener("change", () => {
      const variantItems = variantsContainer.querySelectorAll(".variant-item");
      variantItems.forEach((item) => {
        const skuInput = item.querySelector(".variant-sku");
        if (skuInput && !skuInput.value) {
          autoGenerateSKU(item);
        }
      });
    });
  }

  if (productModelCodeInput) {
    productModelCodeInput.addEventListener("input", () => {
      const variantItems = variantsContainer.querySelectorAll(".variant-item");
      variantItems.forEach((item) => {
        const skuInput = item.querySelector(".variant-sku");
        if (skuInput && !skuInput.value) {
          autoGenerateSKU(item);
        }
      });
    });
  }
}

// Start when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}


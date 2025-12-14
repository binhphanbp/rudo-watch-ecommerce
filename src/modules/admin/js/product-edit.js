import api, { getImageUrl } from "../../../shared/services/api.js";
import Swal, {
  Toast,
  showLoading,
} from "../../../shared/utils/swal.js";
import {
  retryWithBackoff,
  searchProductInfo,
  searchAlternativeSources,
  fileToBase64,
  generateSpecsAndVariantsWithImage,
  countVariants,
  generateSpecsAndVariantsWithAI as generateSpecsAndVariantsWithAIShared,
} from "./product-ai-helpers.js";

let product = null;
let brands = [];
let categories = [];
let variantCounter = 0;
let mainImageFile = null;
let thumbnailFiles = [];
let originalMainImage = null;
let mainDropzone = null;
let thumbDropzone = null;
let pendingVariantImageUploads = new Map();
let pendingMainImageUpload = null;
let pendingThumbnailUploads = new Map();
const productForm = document.getElementById("product-form");
const productNameInput = document.getElementById("product-name");
const productModelCodeInput = document.getElementById("product-model-code");
const productCategorySelect = document.getElementById("product-category");
const productBrandSelect = document.getElementById("product-brand");
const productStatusSelect = document.getElementById("product-status");
const productIsFeaturedCheckbox = document.getElementById("product-is-featured");
const submitBtn = document.getElementById("submit-product-btn");
const variantsContainer = document.getElementById("variants-container");
const noVariantsMessage = document.getElementById("no-variants-message");
const addVariantBtn = document.getElementById("add-variant-btn");
const variantTemplate = document.getElementById("variant-template");

const generateModelCode = (productName, brandId) => {
  const prefix = "RDW";
  
  let namePart = "";
  if (productName) {
    namePart = productName
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .toUpperCase()
      .trim();
    
    if (namePart.length > 30) {
      namePart = namePart.substring(0, 30);
      if (namePart.endsWith("-")) {
        namePart = namePart.slice(0, -1);
      }
    }
    
    if (namePart.length === 0) {
      namePart = "SAN-PHAM";
    }
  } else {
    namePart = "SAN-PHAM";
  }
  
  const timestamp = Date.now().toString().slice(-4);
  return `${prefix}-${namePart}-${timestamp}`;
};

const generateSKU = (brandId, modelCode, variantIndex = 0) => {
  let brandPrefix = "";
  if (brandId && brands.length > 0) {
    const brand = brands.find((b) => b.id == brandId);
    if (brand) {
      const brandName = (brand.name || brand.title || "").toUpperCase();
      brandPrefix = brandName.substring(0, 3);
    }
  }
  if (!brandPrefix) brandPrefix = "UNK";

  let modelShort = "";
  if (modelCode) {
    const parts = modelCode.split("-");
    if (parts.length > 1) {
      modelShort = parts.slice(-1)[0];
    } else {
      modelShort = modelCode
        .replace(/[^A-Z0-9]/gi, "")
        .substring(0, 6)
        .toUpperCase();
    }
  }
  if (!modelShort) modelShort = "MODEL";

  const index = String(variantIndex + 1).padStart(2, "0");
  return `${brandPrefix}-${modelShort}-${index}`;
};


const collectFullProductData = () => {
  const formName = productNameInput?.value.trim() || "";
  const formModelCode = productModelCodeInput?.value.trim() || "";
  const brandId = productBrandSelect?.value || "";
  const categoryId = productCategorySelect?.value || "";
  const editor = document.querySelector("#editor .ql-editor");
  const description = editor?.innerHTML || "";
  
  let brandName = "";
  let categoryName = "";
  if (brandId && brands.length > 0) {
    const brand = brands.find(b => b.id == brandId);
    brandName = brand?.name || brand?.title || "";
  }
  if (categoryId && categories.length > 0) {
    const category = categories.find(c => c.id == categoryId);
    categoryName = category?.name || category?.title || "";
  }

  return {
    name: formName,
    model_code: formModelCode,
    brand_name: brandName,
    category_name: categoryName,
    description: description
  };
};

const collectImages = async () => {
  const images = [];
  
  if (mainImageFile instanceof File) {
    try {
      const imageData = await fileToBase64(mainImageFile);
      images.push(imageData);
    } catch (error) {
      // Bỏ qua lỗi convert
    }
  }
  
  if (thumbnailFiles.length > 0 && thumbnailFiles[0] instanceof File) {
    try {
      const imageData = await fileToBase64(thumbnailFiles[0]);
      images.push(imageData);
    } catch (error) {
      // Bỏ qua lỗi convert
    }
  }
  
  return images;
};

window.generateSpecsAndVariantsWithAI = async () => {
  await generateSpecsAndVariantsWithAIShared({
    collectFullProductData,
    collectImages,
    brands,
    categories,
  });
};

const setupAutoGenerateModelCode = () => {
  if (!productNameInput || !productModelCodeInput) return;

  const updateModelCode = () => {
    if (productModelCodeInput.value.trim() === "") {
      const productName = productNameInput.value.trim();
      const brandId = productBrandSelect?.value || "";
      
      if (productName) {
        const generatedCode = generateModelCode(productName, brandId);
        productModelCodeInput.value = generatedCode;
      }
    }
  };

  let nameTimeout;
  if (productNameInput) {
    productNameInput.addEventListener("input", () => {
      clearTimeout(nameTimeout);
      nameTimeout = setTimeout(updateModelCode, 500);
    });
  }

  if (productBrandSelect) {
    productBrandSelect.addEventListener("change", () => {
      if (productModelCodeInput.value.trim() === "" && productNameInput.value.trim()) {
        updateModelCode();
      }
    });
  }
};

// ==================== API CALLS ====================

/**
 * Lấy thông tin sản phẩm theo ID
 */
async function fetchProduct(productId) {
  try {
    const response = await api.get(`/products/${productId}`);
    
    product = response.data?.data?.data || 
              response.data?.data || 
              response.data?.product ||
              response.data || 
              null;
    
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

    if (!productNameInput || !productModelCodeInput) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    populateForm(product);
	} catch (error) {
    Toast.fire({
      icon: "error",
      title: "Không thể tải thông tin sản phẩm: " + (error.response?.data?.error || error.message),
    });
    setTimeout(() => {
      window.location.href = "/src/pages/admin/product-list.html";
    }, 2000);
  }
}

async function updateProduct(productId, formData) {
  try {
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

async function fetchBrandsAndCategories() {
  try {
    const [brandsRes, categoriesRes] = await Promise.all([
      api.get("/brands"),
      api.get("/categories"),
    ]);

    brands = brandsRes.data?.data || brandsRes.data || [];
    categories = categoriesRes.data?.data || categoriesRes.data || [];

    populateSelect(brands, productBrandSelect, "Chọn thương hiệu");
    populateSelect(categories, productCategorySelect, "Chọn danh mục");
  } catch (error) {
    Toast.fire({
      icon: "error",
      title: "Không thể tải danh sách thương hiệu/danh mục",
    });
  }
}

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
        
        if (updateData.price !== undefined && updateData.price !== null) {
          cleanData.price = parseFloat(updateData.price);
        }
        
        if (updateData.sku !== undefined && updateData.sku !== null && updateData.sku !== "") {
          cleanData.sku = String(updateData.sku).trim();
        }
        
        if (updateData.quantity !== undefined && updateData.quantity !== null && updateData.quantity !== "") {
          cleanData.quantity = parseInt(updateData.quantity) || 0;
        }
        
        if (updateData.colors !== undefined && updateData.colors !== null && updateData.colors !== "") {
          cleanData.colors = String(updateData.colors).trim();
        }
        
        if (updateData.image !== undefined && updateData.image !== null && updateData.image !== "" && updateData.image !== "null") {
          const imageUrl = String(updateData.image).trim();
          cleanData.image = imageUrl;
        }
        
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

function populateForm(productData) {
  if (productNameInput) {
    productNameInput.value = productData.name || "";
  }
  if (productModelCodeInput) {
    productModelCodeInput.value = productData.model_code || "";
  }
  if (productCategorySelect) {
    productCategorySelect.value = productData.category_id || "";
  }
  if (productBrandSelect) {
    productBrandSelect.value = productData.brand_id || "";
  }
  if (productStatusSelect) {
    productStatusSelect.value = productData.status ?? 1;
  }

  // Set is_featured checkbox - tìm lại từ DOM nếu cần
  const isFeaturedCheckbox = productIsFeaturedCheckbox || document.getElementById("product-is-featured");
  if (isFeaturedCheckbox) {
    const isFeatured = productData.is_featured === 1 || productData.is_featured === '1' || productData.is_featured === true;
    isFeaturedCheckbox.checked = isFeatured;
  }

  const editor = document.querySelector("#editor .ql-editor");
  if (editor && productData.description) {
    editor.innerHTML = productData.description;
  }

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

  mainImageFile = productData.image || null;
  originalMainImage = productData.image || null;
  
  thumbnailFiles = [];
  if (productData.thumbnail) {
    try {
      if (typeof productData.thumbnail === "string") {
        if (productData.thumbnail.trim().startsWith("[")) {
          thumbnailFiles = JSON.parse(productData.thumbnail);
			} else {
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

function setupDropzone(elementId, maxFiles, existingFiles) {
	const element = document.getElementById(elementId);
  if (!element || typeof Dropzone === "undefined") {
    return null;
  }

		Dropzone.autoDiscover = false;

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
    autoProcessQueue: false,
    preventMultiple: true,
    thumbnailWidth: 120,
    thumbnailHeight: 120,
    thumbnailMethod: "contain",
    dictDefaultMessage: maxFiles === 1 ? "Kéo thả ảnh chính vào đây" : "Kéo thả ảnh thumbnail vào đây",
    dictRemoveFile: "Xóa",
			init: function () {
      const dzInstance = this;

      const filesToLoad = Array.isArray(existingFiles) ? existingFiles : (existingFiles ? [existingFiles] : []);
      
      filesToLoad.forEach((existingFile) => {
        if (existingFile && typeof existingFile === "string") {
          try {
            const imageUrl = getImageUrl ? getImageUrl(existingFile) : existingFile;
            const fileName = existingFile.split("/").pop() || existingFile.split("\\").pop() || "image.jpg";
            
							const mockFile = {
								name: fileName,
								size: 0,
                type: "image/png",
								status: Dropzone.ADDED,
                accepted: true,
                serverPath: existingFile,
							};
            
            dzInstance.files.push(mockFile);
							
							dzInstance.emit("addedfile", mockFile);
            
            setTimeout(() => {
              const img = new Image();
              img.crossOrigin = "anonymous";
              
              img.onload = function() {
                try {
                  const canvas = document.createElement("canvas");
                  const ctx = canvas.getContext("2d");
                  
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
                  
                  const dataURL = canvas.toDataURL("image/png");
                  
                  dzInstance.emit("thumbnail", mockFile, dataURL);
                  dzInstance.emit("complete", mockFile);
                  
                  const previewElement = mockFile.previewElement;
                  if (previewElement) {
                    const imgElement = previewElement.querySelector("img[data-dz-thumbnail]");
                    if (imgElement) {
                      imgElement.src = dataURL;
                      imgElement.alt = fileName;
                    }
                  }
                } catch (error) {
                  dzInstance.emit("thumbnail", mockFile, imageUrl);
                  dzInstance.emit("complete", mockFile);
                }
              };
              
              img.onerror = function() {
                dzInstance.emit("thumbnail", mockFile, imageUrl);
                dzInstance.emit("complete", mockFile);
                
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
            }, 200);
          } catch (error) {
            // Bỏ qua lỗi
          }
        }
      });

      dzInstance.on("sending", (file, xhr, formData) => {
        xhr.abort();
      });

      dzInstance.on("maxfilesexceeded", (file) => {
        if (maxFiles === 1) {
          if (dzInstance.files.length > 0) {
            dzInstance.removeFile(dzInstance.files[0]);
          }
          dzInstance.addFile(file);
        }
      });

      dzInstance.on("addedfile", (file) => {
					if (!file.serverPath && file instanceof File) {
						if (maxFiles === 1) {
            dzInstance.files.forEach((f) => {
              if (f !== file) {
                dzInstance.removeFile(f);
              }
            });
            
							mainImageFile = file;
            uploadMainImage(file);
						} else {
								thumbnailFiles.push(file);
            uploadThumbnail(file);
						}
					}
				});

      dzInstance.on("removedfile", (file) => {
					if (maxFiles === 1) {
          if (file.serverPath) {
						mainImageFile = null;
            originalMainImage = null;
            pendingMainImageUpload = null;
					} else {
            mainImageFile = null;
            pendingMainImageUpload = null;
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
            // Xóa file mới khỏi array và clear upload promise
            thumbnailFiles = thumbnailFiles.filter(f => f !== file);
            pendingThumbnailUploads.delete(file);
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
          return;
        }

        Toast.fire({
          icon: "error",
          title: "Lỗi: " + (error?.message || error),
        });
      });
    },
  });

  return dropzone;
}

async function uploadMainImage(file) {
  if (!file || !(file instanceof File)) return;
  
  const uploadPromise = (async () => {
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("folder", "products");

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

      if (imageUrl) {
        mainImageFile = imageUrl;
        
        if (mainDropzone && mainDropzone.files.length > 0) {
          const mainFile = mainDropzone.files[0];
          if (mainFile === file) {
            mainFile.serverPath = imageUrl;
          }
        }
        
        return imageUrl;
      }
    } catch (error) {
      Toast.fire({
        icon: "error",
        title: "Lỗi upload ảnh chính: " + (error.response?.data?.error || error.message || "Lỗi không xác định"),
      });
      throw error;
    } finally {
      pendingMainImageUpload = null;
    }
  })();
  
  pendingMainImageUpload = uploadPromise;
  uploadPromise.catch(() => {
    // Bỏ qua lỗi upload
  });
}

async function uploadThumbnail(file) {
  if (!file || !(file instanceof File)) return;
  
  const uploadPromise = (async () => {
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("folder", "products/thumbnails");

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

      if (imageUrl) {
        const index = thumbnailFiles.findIndex(f => f === file);
        if (index !== -1) {
          thumbnailFiles[index] = imageUrl;
        }
        
        if (thumbDropzone && thumbDropzone.files.length > 0) {
          const thumbFile = thumbDropzone.files.find(f => f === file);
          if (thumbFile) {
            thumbFile.serverPath = imageUrl;
          }
        }
        
        return imageUrl;
      }
	} catch (error) {
      Toast.fire({
        icon: "error",
        title: "Lỗi upload ảnh thumbnail: " + (error.response?.data?.error || error.message || "Lỗi không xác định"),
      });
      throw error;
    } finally {
      pendingThumbnailUploads.delete(file);
    }
  })();
  
  pendingThumbnailUploads.set(file, uploadPromise);
  uploadPromise.catch(() => {
    // Bỏ qua lỗi upload
  });
}

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

  mainImageFile = imagePath;
}

function loadImagesToDropzone() {
  if (typeof Dropzone === "undefined") {
    setTimeout(loadImagesToDropzone, 100);
		return;
	}

  let mainImagesToLoad = [];
  if (mainImageFile) {
    if (typeof mainImageFile === "string") {
      mainImagesToLoad = [mainImageFile];
    } else if (mainImageFile instanceof File) {
      mainImagesToLoad = [];
    }
  }
  
  mainDropzone = setupDropzone("main-image-dropzone", 1, mainImagesToLoad);

  let thumbImagesToLoad = [];
  if (thumbnailFiles && thumbnailFiles.length > 0) {
    thumbImagesToLoad = thumbnailFiles.filter(f => typeof f === "string");
  }
  
  thumbDropzone = setupDropzone("thumbnail-dropzone", 10, thumbImagesToLoad);
}

function loadVariants(variants) {
  if (!variantsContainer || !variantTemplate) return;

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

    // Parse colors - xử lý select multiple
    if (colorsInput && variantData.colors) {
      let colorsArray = [];
			if (Array.isArray(variantData.colors)) {
        colorsArray = variantData.colors;
      } else if (typeof variantData.colors === "string") {
				try {
					const parsed = JSON.parse(variantData.colors);
					if (Array.isArray(parsed)) {
            colorsArray = parsed;
					} else {
            // Nếu là string thường (phân cách bằng dấu phẩy), split ra
            colorsArray = variantData.colors.split(',').map(c => c.trim()).filter(c => c);
					}
				} catch {
          colorsArray = variantData.colors.split(',').map(c => c.trim()).filter(c => c);
        }
      }
      
      if (colorsInput instanceof HTMLSelectElement) {
        Array.from(colorsInput.options).forEach(option => {
          option.selected = false;
        });
        
        colorsArray.forEach(color => {
          const option = Array.from(colorsInput.options).find(opt => opt.value === color);
          if (option) {
            option.selected = true;
          }
        });
      } else {
        colorsInput.value = colorsArray.join(", ");
      }
    }

		if (variantData.image) {
      let imagePath = variantData.image;
      const imageUrl = getImageUrl ? getImageUrl(imagePath) : imagePath;
      
      if (imageHidden) {
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
      if (imagePreview) {
        imagePreview.style.display = "none";
      }
      if (imageHidden) {
        imageHidden.value = "";
			}
		}
	} else {
    autoGenerateSKU(variantItem);
  }

  setupVariantImageUpload(variantItem);

  const removeBtn = variantItem.querySelector(".remove-variant-btn");
  if (removeBtn) {
    removeBtn.addEventListener("click", () => removeVariant(variantItem));
  }

  variantsContainer.appendChild(clone);
  updateVariantNumbers();

  if (noVariantsMessage) noVariantsMessage.style.display = "none";
}

function removeVariant(variantItem) {
  variantItem.remove();
  updateVariantNumbers();

  const variantItems = variantsContainer.querySelectorAll(".variant-item");
  if (variantItems.length === 0 && noVariantsMessage) {
    noVariantsMessage.style.display = "block";
  }
}

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

  const variantIndex = variantsContainer.querySelectorAll(".variant-item").length;
  const variantNum = String(variantIndex + 1).padStart(2, "0");

  const sku = `${brandPrefix}-${modelShort}-${variantNum}`;
  skuInput.value = sku;
}

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

    if (imagePreviewImg) {
				const reader = new FileReader();
				reader.onload = (event) => {
						imagePreviewImg.src = event.target.result;
        if (imagePreview) imagePreview.style.display = "block";
				};
				reader.readAsDataURL(file);
    }

    const uploadPromise = (async () => {
      const uploadSwal = Swal.fire({
        title: "Đang upload ảnh...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

				try {
					const formData = new FormData();
        formData.append("image", file);
        formData.append("folder", "products/variants");

        const response = await api.post("/upload/image", formData, {
			headers: {
            "Content-Type": "multipart/form-data",
          },
        });

			Swal.close();

        const responseData = response.data?.data || response.data;
        const imageUrl =
          responseData?.data?.url ||
          responseData?.data?.secure_url ||
          responseData?.url ||
          responseData?.secure_url ||
          responseData?.path;

					if (imageUrl && imageHidden) {
						imageHidden.value = imageUrl;
          
          if (imagePreviewImg) {
            const fullImageUrl = getImageUrl ? getImageUrl(imageUrl) : imageUrl;
            imagePreviewImg.src = fullImageUrl;
            if (imagePreview) imagePreview.style.display = "block";
          }
          
          Toast.fire({
            icon: "success",
            title: "Upload ảnh thành công",
          });
          
          return imageUrl;
					} else {
          throw new Error("Không nhận được URL ảnh từ server");
					}
	} catch (error) {
		Swal.close();
        Toast.fire({
          icon: "error",
          title: "Lỗi upload ảnh: " + (error.response?.data?.error || error.message || "Lỗi không xác định"),
        });
        e.target.value = "";
        if (imagePreview) imagePreview.style.display = "none";
        if (imageHidden) imageHidden.value = "";
        throw error;
      } finally {
        pendingVariantImageUploads.delete(variantItem);
      }
    })();
    
    pendingVariantImageUploads.set(variantItem, uploadPromise);
    
    uploadPromise.catch(() => {
      // Bỏ qua lỗi upload
    });
  });

	if (imageRemoveBtn) {
    imageRemoveBtn.addEventListener("click", () => {
      if (imageInput) imageInput.value = "";
      if (imageHidden) imageHidden.value = "";
      if (imagePreview) imagePreview.style.display = "none";
    });
  }
}

function collectFormData() {
	const formData = new FormData();

  formData.append("name", productNameInput?.value || "");
  formData.append("model_code", productModelCodeInput?.value || "");
  formData.append("category_id", productCategorySelect?.value || "");
  formData.append("brand_id", productBrandSelect?.value || "");
  formData.append("status", productStatusSelect?.value || "1");
  
  // Xử lý is_featured - luôn gửi giá trị rõ ràng
  // Nếu không tìm thấy checkbox, lấy từ DOM trực tiếp
  const isFeaturedCheckbox = productIsFeaturedCheckbox || document.getElementById("product-is-featured");
  const isFeaturedValue = isFeaturedCheckbox?.checked === true ? "1" : "0";
  formData.append("is_featured", isFeaturedValue);

  const editor = document.querySelector("#editor .ql-editor");
  let description = editor?.innerHTML || "";
  if (description.trim() === "<p><br></p>" || description.trim() === "<p></p>") {
    description = "";
  }
  formData.append("description", description);

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

  if (mainImageFile) {
    if (typeof mainImageFile === "string") {
      formData.append("image", mainImageFile);
    } else if (mainImageFile instanceof File) {
      formData.append("image", mainImageFile);
    }
  } else if (mainDropzone && mainDropzone.files.length > 0) {
    const mainFile = mainDropzone.files[0];
		if (mainFile.serverPath) {
      formData.append("image", mainFile.serverPath);
		} else if (mainFile instanceof File) {
      formData.append("image", mainFile);
		}
	}
  // Backend hỗ trợ lưu nhiều thumbnail dưới dạng JSON array
  const thumbnails = [];
  
  // Thu thập từ dropzone (bao gồm cả ảnh cũ từ server và ảnh mới đã upload)
  if (thumbDropzone && thumbDropzone.files.length > 0) {
    thumbDropzone.files.forEach(file => {
      if (file.serverPath && typeof file.serverPath === "string") {
        // Ảnh từ server (cũ hoặc mới đã upload) - thêm vào array
        if (!thumbnails.includes(file.serverPath)) {
          thumbnails.push(file.serverPath);
        }
      }
    });
  }
  
  // Thu thập từ thumbnailFiles array (fallback)
  thumbnailFiles.forEach(file => {
    if (typeof file === "string") {
      // URL đã upload - thêm vào array nếu chưa có
      if (!thumbnails.includes(file)) {
        thumbnails.push(file);
      }
    }
  });
  
  if (thumbnails.length > 0) {
    formData.append("thumbnail", JSON.stringify(thumbnails));
  }
  
  const unuploadedFiles = [];
  if (thumbDropzone && thumbDropzone.files.length > 0) {
    thumbDropzone.files.forEach(file => {
		if (file instanceof File && !file.serverPath) {
        unuploadedFiles.push(file);
      }
    });
  }
  if (unuploadedFiles.length > 0) {
    formData.append("thumbnail", unuploadedFiles[0]);
	}

	return formData;
}

function collectVariants() {
  const variantItems = variantsContainer.querySelectorAll(".variant-item");
  const variants = [];

  variantItems.forEach((item, index) => {
    const price = item.querySelector(".variant-price")?.value;
    const skuInput = item.querySelector(".variant-sku");
    const quantity = item.querySelector(".variant-quantity")?.value;
    const colorsSelect = item.querySelector(".variant-colors");
    
    let colorsValue = null;
    if (colorsSelect) {
      if (colorsSelect instanceof HTMLSelectElement && colorsSelect.multiple) {
        const selectedOptions = Array.from(colorsSelect.selectedOptions);
        if (selectedOptions.length > 0) {
          colorsValue = selectedOptions.map(opt => opt.value).join(", ");
        }
	} else {
        colorsValue = colorsSelect.value?.trim() || null;
      }
    }
    
    const imageHidden = item.querySelector(".variant-image");
    let image = null;
    if (imageHidden) {
      const rawValue = imageHidden.value;
      if (rawValue && typeof rawValue === 'string') {
        image = rawValue.trim();
        if (image === "" || image === "null") {
          image = null;
        }
      }
    }
    
    const variantId = item.getAttribute("data-variant-id");

    if (price && quantity !== null && quantity !== "" && colorsValue) {
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

      const variant = {
        price: parseFloat(price) || 0,
        sku: sku,
        quantity: parseInt(quantity) || 0,
        colors: colorsValue || null,
      };

      // Chỉ thêm image nếu có giá trị (không phải empty string)
      // QUAN TRỌNG: Luôn gửi image URL nếu có, kể cả khi giống ảnh cũ (để đảm bảo backend cập nhật)
      // Đảm bảo lấy giá trị mới nhất từ hidden input (READ AGAIN từ DOM)
      if (imageHidden) {
        const freshImageValue = imageHidden.value?.trim() || null;
        if (freshImageValue && freshImageValue !== "" && freshImageValue !== "null") {
          variant.image = freshImageValue;
        }
      } else if (image && image !== "" && image !== "null") {
        // Fallback: dùng giá trị đã lấy trước đó
        variant.image = image.trim();
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
      if (!v.colors || (typeof v.colors === 'string' && !v.colors.trim())) {
        errors.push(`Variant ${index + 1}: Màu sắc là bắt buộc`);
      }
    });
  }

  return errors;
}

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

  const errors = validateForm();
  if (errors.length > 0) {
    Toast.fire({
      icon: "warning",
      title: errors.join(", "),
    });
					return;
				}

  Swal.fire({
    title: "Đang cập nhật...",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  try {
    const pendingUploads = [];
    
    if (pendingMainImageUpload) {
      pendingUploads.push(pendingMainImageUpload);
    }
    
    if (pendingThumbnailUploads.size > 0) {
      pendingUploads.push(...Array.from(pendingThumbnailUploads.values()));
    }
    
    if (pendingVariantImageUploads.size > 0) {
      pendingUploads.push(...Array.from(pendingVariantImageUploads.values()));
    }
    
    if (pendingUploads.length > 0) {
      showLoading(`Đang đợi upload ${pendingUploads.length} ảnh hoàn tất...`);
      
      try {
        await Promise.all(pendingUploads);
      } catch (error) {
        // Bỏ qua lỗi upload
      }
      
      Swal.close();
    }
    
    // Đợi thêm một chút để đảm bảo DOM đã được cập nhật
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const variants = collectVariants();
    if (variants.length > 0) {
      const variantResults = await saveVariants(productId, variants);
      const failedVariants = variantResults.filter((r) => !r.success);
      
      if (failedVariants.length > 0) {
        const errorMessages = failedVariants.map((r) => r.error).join(", ");
        Swal.fire({
          icon: "error",
          title: "Lỗi khi lưu variants",
          text: errorMessages,
        });
        return;
      }

      const updatedVariants = variantResults
        .filter((r) => r.success && r.variant)
        .map((r) => r.variant);
      
      if (updatedVariants.length > 0) {
        updatedVariants.forEach((updatedVariant) => {
          const variantItem = variantsContainer.querySelector(
            `[data-variant-id="${updatedVariant.id}"]`
          );
          
          if (variantItem) {
            const imageHidden = variantItem.querySelector(".variant-image");
            const imagePreviewImg = variantItem.querySelector(".variant-image-preview img");
            const imagePreview = variantItem.querySelector(".variant-image-preview");
            const imageInput = variantItem.querySelector(".variant-image-input");
            
            if (updatedVariant.image && updatedVariant.image.trim() !== "") {
              const imagePath = updatedVariant.image;
              const imageUrl = getImageUrl ? getImageUrl(imagePath) : imagePath;
              
              if (imageHidden) {
                imageHidden.value = imagePath;
              }
              
					if (imagePreviewImg) {
                imagePreviewImg.src = imageUrl;
                imagePreviewImg.alt = updatedVariant.sku || "Variant image";
              }
              
              if (imagePreview) {
                imagePreview.style.display = "block";
              }
              
              if (imageInput) {
                imageInput.value = "";
              }
					} else {
              if (imageHidden) {
                imageHidden.value = "";
              }
              if (imagePreview) {
                imagePreview.style.display = "none";
              }
              if (imageInput) {
                imageInput.value = "";
              }
				}
			}
		});
      }
    }

    const formData = collectFormData();
    await updateProduct(productId, formData);

    Swal.close();
    Toast.fire({
      icon: "success",
      title: "Cập nhật sản phẩm và variants thành công!",
    });
				} catch (error) {
    Swal.close();
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

  await fetchBrandsAndCategories();
  await fetchProduct(productId);

  loadImagesToDropzone();

  if (productForm) {
    productForm.addEventListener("submit", handleFormSubmit);
  }

  if (submitBtn) {
    submitBtn.addEventListener("click", handleFormSubmit);
  }

  if (productStatusSelect) {
    productStatusSelect.addEventListener("change", (e) => {
      updateStatusIndicator(parseInt(e.target.value));
    });
  }

  if (addVariantBtn) {
    addVariantBtn.addEventListener("click", () => addVariant());
  }

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

  setupAutoGenerateModelCode();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}


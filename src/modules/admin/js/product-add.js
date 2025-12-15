import api, { API_BASE_URL } from "../../../shared/services/api.js";
import aiApi, { GEMINI_MODEL, GEMINI_BASE_URL, GEMINI_API_KEY } from "../../../shared/services/ai.js";
import { PROMPT_DISCRIPTION_PRODUCT_WATCH, PROMPT_SPEC_WATCH, PROMPT_VARIANTS_WATCH } from "../../../shared/services/prompt.js";
import { cleanAiOutput } from "../../../shared/utils/cleanResult.js";
import axios from "axios";
import Swal, {
  Toast,
  showLoading,
  showSuccess,
  showError,
  showErrorDialog,
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

let mainImageFile = null;
let thumbnailFiles = [];
let variantCounter = 0;
let brands = [];
let categories = [];
let mainDropzone = null;
let thumbDropzone = null;

const loadOptions = async (endpoint, selectId, placeholder) => {
  try {
    const res = await api.get(endpoint);
    const data = res.data?.data?.data || res.data?.data || res.data || [];
    const select = document.getElementById(selectId);
    if (select) {
      select.innerHTML = `<option value="">-- ${placeholder} --</option>`;
      data.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = item.name || item.title;
        select.appendChild(option);
      });
    }

    if (endpoint === "/brands") {
      brands = data;
    } else if (endpoint === "/categories") {
      categories = data;
    }

    return data;
  } catch (error) {
    showError("Không thể tải " + placeholder.toLowerCase());
    return [];
  }
};

const updateStatusIndicator = (status) => {
  const indicator = document.getElementById("status-indicator");
  if (indicator) {
    indicator.className =
      status === 1
        ? "p-2 h-100 bg-success rounded-circle"
        : "p-2 h-100 bg-warning rounded-circle";
  }
};

// Khởi tạo Dropzone chỉ để preview, không upload tự động
const setupDropzone = (elementId, maxFiles, onFileAdded) => {
  const element = document.getElementById(elementId);
  if (!element) return null;

  if (typeof Dropzone === "undefined") {
    Toast.fire({ icon: "error", title: "Dropzone chưa được load" });
    return null;
  }

  try {
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
      dictDefaultMessage:
        maxFiles === 1
          ? "Kéo thả ảnh chính vào đây"
          : "Kéo thả nhiều ảnh vào đây",
      dictRemoveFile: "Xóa",
      init: function () {
        this.on("addedfile", (file) => {
          onFileAdded(file);
        });
        this.on("removedfile", (file) => {
          if (maxFiles === 1) {
            mainImageFile = null;
          } else {
            thumbnailFiles = thumbnailFiles.filter((f) => f.name !== file.name);
          }
        });
      },
    });

    return dropzone;
  } catch (error) {
    Toast.fire({ icon: "error", title: "Lỗi khởi tạo Dropzone" });
    return null;
  }
};

// Tự động tạo mã sản phẩm theo format: RDW-TÊN-SẢN-PHẨM-TIMESTAMP
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

// Tự động tạo SKU theo format: BRAND-MODEL-INDEX
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

  const variantNum = String(variantIndex + 1).padStart(2, "0");
  return `${brandPrefix}-${modelShort}-${variantNum}`;
};

const loadingEffectOneAction = (isLoading) => {
  const loadingEffect = document.querySelector(".loading_effect");
  
  if (loadingEffect) {
    if (isLoading) {
      loadingEffect.classList.add("show");
    } else {
      loadingEffect.classList.remove("show");
    }
  }
}
const loadingEffectNextAction = (isLoading) => {
  const loadingEffect = document.querySelector(".loading_effect-2");
  
  if (loadingEffect) {
    if (isLoading) {
      loadingEffect.classList.add("show");
    } else {
      loadingEffect.classList.remove("show");
    }
  }

}
const loadingEffectVarAction = (isLoading) => {
  const loadingEffect = document.querySelector(".loading_effect-3");
  
  if (loadingEffect) {
    if (isLoading) {
      loadingEffect.classList.add("show");
    } else {
      loadingEffect.classList.remove("show");
    }
  }

}
const generateDiscriptionWithAI = async (productName, modelCode) => {
  const res = await aiApi.post("/generate", {
    prompt: PROMPT_DISCRIPTION_PRODUCT_WATCH(productName, modelCode),
  });
  return res.data;
}

const generateSpecWithAI = async (productName, modelCode) => {
  const res = await aiApi.post("/generate", {
    prompt: PROMPT_SPEC_WATCH(productName, modelCode),
  });
  return res.data;
}

const collectHeaderFormDate = () => {
  const formName = document.getElementById("product-name")?.value.trim() || "";
  const formModelCode = document.getElementById("product-model-code")?.value.trim() || "";

  return {
    name: formName,
    model_code: formModelCode
  };
};

window.fillDiscriptionFromAI = async () => {
  const {name, model_code} = collectHeaderFormDate();
  if(!name || !model_code) return;
  try {
    loadingEffectOneAction(true);
    const aiRes = await generateDiscriptionWithAI(name, model_code);
    const editor = document.querySelector("#editor .ql-editor");

    if (editor && aiRes) {
      loadingEffectOneAction(false);
      editor.innerHTML = aiRes; 
    }
  } catch (error) {
    loadingEffectOneAction(false);
  }
}

window.fillSpecFromAI = async () => {
  const {name, model_code} = collectHeaderFormDate();
  if(!name || !model_code) return;
  try {
    loadingEffectNextAction(true);
    const aiRes = await generateSpecWithAI(name, model_code);
    if (aiRes) {
      const spec = cleanAiOutput(aiRes);
      document.getElementById("spec-size").value = spec.size || "";
      document.getElementById("spec-brand").value = spec.brand || "";
      document.getElementById("spec-model").value = spec.model || "";
      document.getElementById("spec-weight").value = spec.weight || "";
      document.getElementById("spec-material").value = spec.material || "";
      document.getElementById("spec-warranty").value = spec.warranty || "";
      loadingEffectNextAction(false);
    }

  }  catch (error) {
    loadingEffectNextAction(false);
  }
}

const generateVariantsWithAI = async (productName, modelCode, numVariants) => {
  const res = await aiApi.post("/generate", {
    prompt: PROMPT_VARIANTS_WATCH(productName, modelCode, numVariants),
  });
  return res.data;
}

window.fillVariantsFromAI = async () => { 
  const {name, model_code} = collectHeaderFormDate();
  if(!name || !model_code) return;
  const numVariants = countVariants();
  try {
    loadingEffectVarAction(true);
    const aiRes = await generateVariantsWithAI(name, model_code, numVariants);
    if (aiRes) {
      const variants = cleanAiOutput(aiRes);
      if (Array.isArray(variants)) {
        const variantItems = document.querySelectorAll(".variant-item");
        variants.forEach((variant, index) => {
          const item = variantItems[index];
          if (item) {
            item.querySelector(".variant-price").value = variant.price || "";
            item.querySelector(".variant-quantity").value = variant.quantity || "";
            
            const colorsSelect = item.querySelector(".variant-colors");
            if (colorsSelect) {
              let colorValue = "";
              if (Array.isArray(variant.colors)) {
                colorValue = variant.colors[0] || variant.colors.join(", ");
              } else if (typeof variant.colors === "string") {
                try {
                  const parsed = JSON.parse(variant.colors);
                  if (Array.isArray(parsed)) {
                    colorValue = parsed[0] || parsed.join(", ");
                  } else {
                    colorValue = variant.colors.split(',')[0] || variant.colors;
                  }
                } catch {
                  colorValue = variant.colors.split(',')[0] || variant.colors;
                }
              }
              
              if (colorsSelect instanceof HTMLSelectElement) {
                colorsSelect.value = colorValue.trim();
              } else {
                colorsSelect.value = colorValue;
              }
            }
            item.querySelector(".variant-image").value = variant.image || "";
          }
        });
      }
      loadingEffectVarAction(false);
    }
  } catch (error) {
    loadingEffectVarAction(false);
    showError("Lỗi khi tạo variants bằng AI: " + (error.message || "Lỗi không xác định"));
  }
}

const collectFullProductData = () => {
  const formName = document.getElementById("product-name")?.value.trim() || "";
  const formModelCode = document.getElementById("product-model-code")?.value.trim() || "";
  const brandId = document.getElementById("product-brand")?.value || "";
  const categoryId = document.getElementById("product-category")?.value || "";
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



// Thu thập dữ liệu variants từ form
const collectVariants = (productId, brandId, modelCode) => {
  const container = document.getElementById("variants-container");
  const variantItems = container 
    ? container.querySelectorAll(".variant-item")
    : document.querySelectorAll(".variant-item");
  
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
    
    const image = item.querySelector(".variant-image")?.value?.trim();

    // Kiểm tra price hợp lệ (DECIMAL(12,2): 0 đến 999,999,999,999.99)
    const priceNum = parseFloat(price);
    const isValidPrice = price && !isNaN(priceNum) && priceNum >= 0 && priceNum <= 999999999999.99;

    if (isValidPrice && quantity && colorsValue) {
      let sku = skuInput?.value?.trim();
      if (!sku && brandId && modelCode) {
        sku = generateSKU(brandId, modelCode, index);
        if (skuInput) {
          skuInput.value = sku;
        }
      }

      // Làm tròn đến 2 chữ số thập phân (DECIMAL(12,2))
      const roundedPrice = Math.round(priceNum * 100) / 100;

      variants.push({
        product_id: parseInt(productId) || 0,
        price: roundedPrice, // Làm tròn đến 2 chữ số thập phân
        sku: sku || `SKU-${Date.now()}-${index}`,
        quantity: parseInt(quantity) || 0,
        colors: colorsValue || null,
        image: image || null,
      });
    }
  });

  return variants;
};

// Thu thập dữ liệu form (không bao gồm variants) - trả về FormData để upload file
const collectFormData = () => {
  const editor = document.querySelector("#editor .ql-editor");
  let description = editor?.innerHTML || "";
  if (
    description.trim() === "<p><br></p>" ||
    description.trim() === "<p></p>"
  ) {
    description = "";
  }
  const formData = new FormData();

  formData.append("name", document.getElementById("product-name")?.value || "");
  formData.append(
    "model_code",
    document.getElementById("product-model-code")?.value || ""
  );
  formData.append(
    "category_id",
    document.getElementById("product-category")?.value || ""
  );
  formData.append(
    "brand_id",
    document.getElementById("product-brand")?.value || ""
  );
  formData.append("description", description);
  formData.append(
    "status",
    document.getElementById("product-status")?.value || "1"
  );
  const specifications = {};

  const specSize = document.getElementById("spec-size")?.value?.trim();
  const specMaterial = document.getElementById("spec-material")?.value?.trim();
  const specWarranty = document.getElementById("spec-warranty")?.value?.trim();
  const specWeight = document.getElementById("spec-weight")?.value?.trim();
  const specBrand = document.getElementById("spec-brand")?.value?.trim();
  const specModel = document.getElementById("spec-model")?.value?.trim();

  if (specSize) specifications.size = specSize || "";
  if (specMaterial) specifications.material = specMaterial || "";
  if (specWarranty) specifications.warranty = specWarranty || "";
  if (specWeight) specifications.weight = specWeight || "";
  if (specBrand) specifications.brand = specBrand || "";
  if (specModel) specifications.model = specModel || "";

  formData.append("specifications", JSON.stringify(specifications));
  if (mainImageFile instanceof File) {
    formData.append("image", mainImageFile);
  }

  const thumbnails = [];
  
  if (thumbDropzone && thumbDropzone.files.length > 0) {
    thumbDropzone.files.forEach(file => {
      if (file.serverPath && typeof file.serverPath === "string") {
        if (!thumbnails.includes(file.serverPath)) {
          thumbnails.push(file.serverPath);
        }
      } else if (file instanceof File) {
        if (!thumbnails.includes(file)) {
          thumbnails.push(file);
        }
      }
    });
  }
  
  thumbnailFiles.forEach(file => {
    if (typeof file === "string") {
      if (!thumbnails.includes(file)) {
        thumbnails.push(file);
      }
    } else if (file instanceof File) {
      if (!thumbnails.includes(file)) {
        thumbnails.push(file);
      }
    }
  });
  
  if (thumbnails.length > 0) {
    const urlThumbnails = thumbnails.filter(t => typeof t === "string");
    const fileThumbnails = thumbnails.filter(t => t instanceof File);
    
    if (urlThumbnails.length > 0) {
      formData.append("thumbnail", JSON.stringify(urlThumbnails));
    } else if (fileThumbnails.length > 0) {
      fileThumbnails.forEach((file, index) => {
        if (index === 0) {
          formData.append("thumbnail", file);
        }
      });
    }
  }

  return formData;
};

// Thu thập dữ liệu thô để validate
const collectRawData = () => {
  return {
    name: document.getElementById("product-name")?.value || "",
    model_code: document.getElementById("product-model-code")?.value || "",
    category_id:
      parseInt(document.getElementById("product-category")?.value) || null,
    brand_id: parseInt(document.getElementById("product-brand")?.value) || null,
  };
};

const validateForm = (data) => {
  const errors = [];
  if (!data.name?.trim()) errors.push("Tên sản phẩm là bắt buộc");
  if (!data.model_code?.trim()) errors.push("Mã sản phẩm là bắt buộc");
  if (!data.category_id) errors.push("Vui lòng chọn danh mục");
  if (!data.brand_id) errors.push("Vui lòng chọn thương hiệu");
  return errors;
};

const validateVariants = (variants) => {
  const errors = [];
  if (!variants || variants.length === 0) {
    errors.push("Vui lòng thêm ít nhất một variant");
  } else {
    variants.forEach((v, index) => {
      if (!v.price || v.price <= 0) {
        errors.push(`Variant ${index + 1}: Giá phải lớn hơn 0`);
      } else if (v.price > 999999999999.99) {
        errors.push(`Variant ${index + 1}: Giá không được vượt quá 999,999,999,999.99 (DECIMAL(12,2))`);
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

// Lưu variants lên server
const saveVariants = async (productId, variants) => {
  const results = [];

  for (const variant of variants) {
    try {
      const variantData = {
        product_id: parseInt(variant.product_id),
        price: parseFloat(variant.price),
        sku: variant.sku || null,
        quantity: parseInt(variant.quantity) || 0,
        colors: variant.colors || null,
        image: variant.image || null,
      };

      if (!variantData.product_id || variantData.product_id <= 0) {
        throw new Error("Product ID không hợp lệ");
      }
      
      if (!variantData.price || variantData.price <= 0) {
        throw new Error("Giá phải lớn hơn 0");
      }

      const res = await api.post("/product-variants", variantData);
      
      results.push({ 
        success: true, 
        variant: res.data?.data || res.data,
        sku: variantData.sku
      });
    } catch (error) {
      let errorMessage = "Lỗi không xác định";
      
      if (error.response) {
        const responseData = error.response.data;
        errorMessage = responseData?.error || 
                      responseData?.message || 
                      responseData?.errors || 
                      `HTTP ${error.response.status}: ${error.response.statusText}`;
        
        if (typeof errorMessage === 'object') {
          errorMessage = JSON.stringify(errorMessage);
        }
      } else if (error.request) {
        errorMessage = "Không nhận được phản hồi từ server";
      } else {
        errorMessage = error.message || "Lỗi không xác định";
      }
      
      results.push({
        success: false,
        error: errorMessage,
        variant: variant,
        sku: variant.sku || "N/A"
      });
    }
  }

  return results;
};

// Xử lý submit form
const handleFormSubmit = async (e) => {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  const rawData = collectRawData();
  const errors = validateForm(rawData);
  if (errors.length > 0) {
    showError(errors.join(", "));
    return false;
  }

  const brandId = rawData.brand_id;
  const modelCode = rawData.model_code;
  const variants = collectVariants(0, brandId, modelCode);
  const variantErrors = validateVariants(variants);
  if (variantErrors.length > 0) {
    showError(variantErrors.join(", "));
    return false;
  }

  const loadingSwal = showLoading("Đang tạo sản phẩm...");

  try {
    const fileThumbnails = thumbnailFiles.filter(f => f instanceof File);
    if (fileThumbnails.length > 0) {
      showLoading("Đang upload ảnh thumbnail...");
      const uploadPromises = fileThumbnails.map(async (file) => {
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
            const index = thumbnailFiles.indexOf(file);
            if (index !== -1) {
              thumbnailFiles[index] = imageUrl;
            }
            return imageUrl;
          }
        } catch (error) {
          throw error;
        }
      });
      
      await Promise.all(uploadPromises);
    }

    const formData = collectFormData();

    const productRes = await api.post("/products", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const responseData = productRes.data;
    const productId =
      responseData?.data?.id ||
      responseData?.id ||
      responseData?.product?.id ||
      responseData?.data?.data?.id;

    if (!productId) {
      throw new Error("Không nhận được ID sản phẩm sau khi tạo");
    }

    const variantsWithProductId = variants.map((v) => ({
      product_id: parseInt(productId),
      price: parseFloat(v.price) || 0,
      sku: v.sku || null,
      quantity: parseInt(v.quantity) || 0,
      colors: v.colors || null,
      image: v.image || null,
    }));

    const variantResults = await saveVariants(productId, variantsWithProductId);

    const failedVariants = variantResults.filter((r) => !r.success);
    if (failedVariants.length > 0) {
      const errorMessages = failedVariants.map((r) => {
        const sku = r.sku || r.variant?.sku || 'N/A';
        return `SKU ${sku}: ${r.error}`;
      }).join("\n\n");
      
      Swal.close();
      showErrorDialog(
        `Tạo sản phẩm thành công nhưng có lỗi khi lưu variants:\n\n${errorMessages}\n\nVui lòng kiểm tra lại dữ liệu và thử lại.`,
        "Cảnh báo"
      );
    } else {
      Swal.close();
      showSuccess("Tạo sản phẩm và variants thành công!").then(() => {
        window.location.href = "/src/pages/admin/product-list.html";
      });
    }
  } catch (error) {
    Swal.close();
    const errorMsg =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.response?.data?.errors ||
      error.message ||
      "Có lỗi xảy ra khi tạo sản phẩm";

    const displayError =
      typeof errorMsg === "object" ? JSON.stringify(errorMsg) : errorMsg;
    showErrorDialog(displayError, "Lỗi tạo sản phẩm");
  }

  return false;
};

const init = async () => {
  if (typeof Dropzone !== "undefined") {
    Dropzone.autoDiscover = false;
  }

  await Promise.all([
    loadOptions("/categories", "product-category", "Chọn danh mục"),
    loadOptions("/brands", "product-brand", "Chọn thương hiệu"),
  ]);

  if (typeof Dropzone === "undefined") {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (typeof Dropzone !== "undefined") {
      Dropzone.autoDiscover = false;
    }
  }

  mainDropzone = setupDropzone("main-image-dropzone", 1, (file) => {
    mainImageFile = file;
  });

  thumbDropzone = setupDropzone("thumbnail-dropzone", 10, (file) => {
    thumbnailFiles.push(file);
  });

  const form = document.getElementById("product-form");
  const submitBtn =
    document.getElementById("submit-product-btn") ||
    document.querySelector('button[type="submit"]');

  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleFormSubmit(e);
      return false;
    };

    form.addEventListener(
      "submit",
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleFormSubmit(e);
        return false;
      },
      { capture: true }
    );
  }

  if (submitBtn) {
    submitBtn.addEventListener(
      "click",
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleFormSubmit(e);
        return false;
      },
      { capture: true }
    );
  }

  const statusSelect = document.getElementById("product-status");
  if (statusSelect) {
    statusSelect.value = "1";
    updateStatusIndicator(1);
    statusSelect.addEventListener("change", (e) =>
      updateStatusIndicator(parseInt(e.target.value))
    );
  }

  initVariants();
  setupAutoGenerateModelCode();
};

const addVariant = () => {
  const template = document.getElementById("variant-template");
  const container = document.getElementById("variants-container");
  const noMessage = document.getElementById("no-variants-message");

  if (!template || !container) return;

  variantCounter++;
  const clone = template.content.cloneNode(true);
  const variantItem = clone.querySelector(".variant-item");

  variantItem.setAttribute("data-variant-index", variantCounter);
  variantItem.querySelector(".variant-number").textContent = variantCounter;

  const brandId = document.getElementById("product-brand")?.value;
  const modelCode = document.getElementById("product-model-code")?.value;
  const skuInput = variantItem.querySelector(".variant-sku");
  const variantIndex = document.querySelectorAll(".variant-item").length;

  if (brandId && modelCode && skuInput) {
    const sku = generateSKU(brandId, modelCode, variantIndex);
    skuInput.value = sku;
  }

  const updateSKUFromForm = () => {
    const brandId = document.getElementById("product-brand")?.value;
    const modelCode = document.getElementById("product-model-code")?.value;
    const variantIndex = Array.from(document.querySelectorAll(".variant-item")).indexOf(variantItem);

    if (skuInput && brandId && modelCode) {
      const currentSKU = skuInput.value;
      const expectedSKU = generateSKU(brandId, modelCode, variantIndex);

      if (
        !currentSKU ||
        currentSKU === expectedSKU ||
        currentSKU.match(/^[A-Z]{3}-[A-Z0-9]+-\d+$/)
      ) {
        skuInput.value = expectedSKU;
      }
    }
  };

  const brandSelect = document.getElementById("product-brand");
  const modelCodeInput = document.getElementById("product-model-code");

  if (brandSelect) {
    brandSelect.addEventListener("change", updateSKUFromForm);
  }
  if (modelCodeInput) {
    modelCodeInput.addEventListener("input", updateSKUFromForm);
    modelCodeInput.addEventListener("change", updateSKUFromForm);
  }

  const imageInput = variantItem.querySelector(".variant-image-input");
  const imagePreview = variantItem.querySelector(".variant-image-preview");
  const imagePreviewImg = imagePreview?.querySelector("img");
  const imageHidden = variantItem.querySelector(".variant-image");
  const imageRemoveBtn = variantItem.querySelector(".variant-image-remove");

  if (imageInput) {
    imageInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (file) {
        if (!file.type.startsWith("image/")) {
          Toast.fire({ icon: "error", title: "Chỉ chấp nhận file ảnh" });
          e.target.value = "";
          return;
        }

        if (file.size > 5 * 1024 * 1024) {
          Toast.fire({ icon: "error", title: "Kích thước file không được vượt quá 5MB" });
          e.target.value = "";
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          if (imagePreviewImg) {
            imagePreviewImg.src = event.target.result;
            imagePreview.style.display = "block";
          }
        };
        reader.readAsDataURL(file);

        try {
          const formData = new FormData();
          formData.append("image", file);
          formData.append("folder", "products/variants");
          const token = localStorage.getItem("token");
          const res = await api.post("/upload/image", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });

          const responseData = res.data?.data || res.data;
          const imageUrl = responseData?.data?.url || responseData?.data?.secure_url || responseData?.url || responseData?.secure_url || responseData?.path;
          if (imageUrl && imageHidden) {
            imageHidden.value = imageUrl;
          } else {
            Toast.fire({ icon: "error", title: "Không nhận được URL ảnh từ server" });
          }
        } catch (error) {
          Toast.fire({ icon: "error", title: "Lỗi upload ảnh" });
          e.target.value = "";
          imagePreview.style.display = "none";
        }
      }
    });
  }

  if (imageRemoveBtn) {
    imageRemoveBtn.addEventListener("click", () => {
      if (imageInput) imageInput.value = "";
      if (imageHidden) imageHidden.value = "";
      if (imagePreview) imagePreview.style.display = "none";
    });
  }

  const removeBtn = variantItem.querySelector(".remove-variant-btn");
  removeBtn.addEventListener("click", () => removeVariant(variantItem));

  if (noMessage) {
    noMessage.style.display = "none";
  }

  container.appendChild(clone);
  updateVariantNumbers();
};

const removeVariant = (variantItem) => {
  variantItem.remove();
  updateVariantNumbers();

  const container = document.getElementById("variants-container");
  const variantItems = container.querySelectorAll(".variant-item");
  const noMessage = document.getElementById("no-variants-message");

  if (variantItems.length === 0 && noMessage) {
    noMessage.style.display = "block";
  }
};

const updateVariantNumbers = () => {
  const variantItems = document.querySelectorAll(".variant-item");
  variantItems.forEach((item, index) => {
    item.querySelector(".variant-number").textContent = index + 1;
  });
};

const initVariants = () => {
  const addBtn = document.getElementById("add-variant-btn");
  if (addBtn) {
    addBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      addVariant();
    });
  }
};

// Tự động tạo mã sản phẩm khi nhập tên hoặc chọn brand
const setupAutoGenerateModelCode = () => {
  const productNameInput = document.getElementById("product-name");
  const modelCodeInput = document.getElementById("product-model-code");
  const brandSelect = document.getElementById("product-brand");

  if (!productNameInput || !modelCodeInput) return;

  const updateModelCode = () => {
    if (modelCodeInput.value.trim() === "") {
      const productName = productNameInput.value.trim();
      const brandId = brandSelect?.value || "";
      
      if (productName) {
        const generatedCode = generateModelCode(productName, brandId);
        modelCodeInput.value = generatedCode;
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

  if (brandSelect) {
    brandSelect.addEventListener("change", () => {
      if (modelCodeInput.value.trim() === "" && productNameInput.value.trim()) {
        updateModelCode();
      }
    });
  }
};

window.addEventListener("DOMContentLoaded", init);

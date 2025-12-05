import api, { API_BASE_URL } from "../../../shared/services/api.js";
import Swal, {
  Toast,
  showLoading,
  showSuccess,
  showError,
  showErrorDialog,
} from "../../../shared/utils/swal.js";

// Biến lưu trữ
let mainImageFile = null; // File object (không phải path)
let thumbnailFiles = []; // Array of File objects
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
      data.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = item.name || item.title;
        select.appendChild(option);
      });
    }

    // Lưu brands và categories để dùng cho generate SKU
    if (endpoint === "/brands") {
      brands = data;
    } else if (endpoint === "/categories") {
      categories = data;
    }

    return data;
  } catch (error) {
    console.error(`Lỗi load ${endpoint}:`, error);
    showError(`Không thể tải ${placeholder.toLowerCase()}`);
    return [];
  }
};

// Update status indicator
const updateStatusIndicator = (status) => {
  const indicator = document.getElementById("status-indicator");
  if (indicator) {
    indicator.className =
      status === 1
        ? "p-2 h-100 bg-success rounded-circle"
        : "p-2 h-100 bg-warning rounded-circle"; // Màu cam (warning) khi hết hàng
  }
};

// Setup Dropzone - Chỉ preview, không upload ngay
const setupDropzone = (elementId, maxFiles, onFileAdded) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`Element ${elementId} not found`);
    return null;
  }

  // Check if Dropzone is available
  if (typeof Dropzone === "undefined") {
    console.error("Dropzone is not loaded. Please include dropzone.min.js");
    Toast.fire({ icon: "error", title: "Dropzone chưa được load" });
    return null;
  }

  try {
    // Disable auto discover globally
    Dropzone.autoDiscover = false;

    // Check if element already has Dropzone instance
    if (element.dropzone) {
      console.log(`Disposing existing Dropzone instance for ${elementId}`);
      element.dropzone.destroy();
    }

    // Ensure dropzone class exists for styling
    if (!element.classList.contains("dropzone")) {
      element.classList.add("dropzone");
    }

    // Create Dropzone instance - CHỈ PREVIEW, KHÔNG UPLOAD
    const dropzone = new Dropzone(element, {
      url: "#", // Không upload tự động
      maxFiles,
      acceptedFiles: "image/*",
      addRemoveLinks: true,
      autoProcessQueue: false, // QUAN TRỌNG: Không upload tự động
      dictDefaultMessage:
        maxFiles === 1
          ? "Kéo thả ảnh chính vào đây"
          : "Kéo thả nhiều ảnh vào đây",
      dictRemoveFile: "Xóa",
      init: function () {
        this.on("addedfile", (file) => {
          console.log("File added:", file.name);
          onFileAdded(file);
        });
        this.on("removedfile", (file) => {
          console.log("File removed:", file.name);
          // Callback để remove file khỏi array
          if (maxFiles === 1) {
            mainImageFile = null;
          } else {
            thumbnailFiles = thumbnailFiles.filter((f) => f.name !== file.name);
          }
        });
        this.on("error", (file, error) => {
          console.error("Dropzone error:", error);
        });
      },
    });

    console.log(`Dropzone initialized for ${elementId} (preview only)`);
    return dropzone;
  } catch (error) {
    console.error("Error initializing Dropzone:", error);
    Toast.fire({ icon: "error", title: "Lỗi khởi tạo Dropzone" });
    return null;
  }
};

// Generate SKU tự động
const generateSKU = (brandId, modelCode, size) => {
  // Lấy brand prefix (3 ký tự đầu của brand name)
  let brandPrefix = "";
  if (brandId && brands.length > 0) {
    const brand = brands.find((b) => b.id == brandId);
    if (brand) {
      const brandName = (brand.name || brand.title || "").toUpperCase();
      brandPrefix = brandName.substring(0, 3);
    }
  }
  if (!brandPrefix) brandPrefix = "UNK";

  // Rút gọn model_code (lấy phần sau dấu gạch cuối cùng hoặc toàn bộ nếu không có)
  let modelShort = "";
  if (modelCode) {
    const parts = modelCode.split("-");
    if (parts.length > 1) {
      modelShort = parts.slice(-1)[0]; // Lấy phần cuối
    } else {
      modelShort = modelCode
        .replace(/[^A-Z0-9]/gi, "")
        .substring(0, 6)
        .toUpperCase();
    }
  }
  if (!modelShort) modelShort = "MODEL";

  // Lấy số từ size (VD: 42mm -> 42)
  let sizeNum = "";
  if (size) {
    const match = size.match(/\d+/);
    if (match) {
      sizeNum = match[0];
    }
  }
  if (!sizeNum) sizeNum = "00";

  return `${brandPrefix}-${modelShort}-${sizeNum}`;
};

// Collect variants data
const collectVariants = (productId, brandId, modelCode) => {
  const variantItems = document.querySelectorAll(".variant-item");
  const variants = [];

  variantItems.forEach((item, index) => {
    const price = item.querySelector(".variant-price")?.value;
    const size = item.querySelector(".variant-size")?.value?.trim();
    const skuInput = item.querySelector(".variant-sku");
    const quantity = item.querySelector(".variant-quantity")?.value;
    const colorsInput = item.querySelector(".variant-colors")?.value?.trim();
    const image = item.querySelector(".variant-image")?.value?.trim();

    if (price) {
      // Tự động generate SKU nếu chưa có hoặc input trống
      let sku = skuInput?.value?.trim();
      if (!sku && brandId && modelCode && size) {
        sku = generateSKU(brandId, modelCode, size);
        // Cập nhật lại input SKU
        if (skuInput) {
          skuInput.value = sku;
        }
      }

      variants.push({
        product_id: parseInt(productId),
        price: parseFloat(price) || 0,
        size: size || null,
        sku: sku || `SKU-${Date.now()}-${index}`,
        quantity: parseInt(quantity) || 0,
        colors: colorsInput || null, // Gửi string trực tiếp, backend sẽ normalize
        image: image || null,
      });
    }
  });

  return variants;
};

// Collect form data (không bao gồm variants) - Trả về FormData để hỗ trợ upload file
const collectFormData = () => {
  const editor = document.querySelector("#editor .ql-editor");
  let description = editor?.innerHTML || "";
  if (
    description.trim() === "<p><br></p>" ||
    description.trim() === "<p></p>"
  ) {
    description = "";
  }

  // Tạo FormData để gửi file
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

  // Specifications as JSON array of strings (như format trong DB)
  const specifications = {};

  const specSize = document.getElementById("spec-size")?.value?.trim();
  const specMaterial = document.getElementById("spec-material")?.value?.trim();
  const specColor = document.getElementById("spec-color")?.value?.trim();
  const specWarranty = document.getElementById("spec-warranty")?.value?.trim();
  const specWeight = document.getElementById("spec-weight")?.value?.trim();
  const specBrand = document.getElementById("spec-brand")?.value?.trim();
  const specModel = document.getElementById("spec-model")?.value?.trim();

  if (specSize) specifications.size = specSize || "";
  if (specMaterial) specifications.material = specMaterial || "";
  if (specColor) specifications.color = specColor || "";
  if (specWarranty) specifications.warranty = specWarranty || "";
  if (specWeight) specifications.weight = specWeight || "";
  if (specBrand) specifications.brand = specBrand || "";
  if (specModel) specifications.model = specModel || "";

  formData.append("specifications", JSON.stringify(specifications));
  console.log("Specifications JSON:", JSON.stringify(specifications));

  // Thêm file ảnh chính nếu có
  if (mainImageFile instanceof File) {
    formData.append("image", mainImageFile);
  }

  // Thêm thumbnail - backend chỉ hỗ trợ 1 file thumbnail
  // Lấy file đầu tiên nếu có
  if (thumbnailFiles.length > 0 && thumbnailFiles[0] instanceof File) {
    formData.append("thumbnail", thumbnailFiles[0]);
  }

  return formData;
};

// Collect raw data để validate (không phải FormData)
const collectRawData = () => {
  return {
    name: document.getElementById("product-name")?.value || "",
    model_code: document.getElementById("product-model-code")?.value || "",
    category_id:
      parseInt(document.getElementById("product-category")?.value) || null,
    brand_id: parseInt(document.getElementById("product-brand")?.value) || null,
  };
};

// Validate form
const validateForm = (data) => {
  const errors = [];
  if (!data.name?.trim()) errors.push("Tên sản phẩm là bắt buộc");
  if (!data.model_code?.trim()) errors.push("Mã sản phẩm là bắt buộc");
  if (!data.category_id) errors.push("Vui lòng chọn danh mục");
  if (!data.brand_id) errors.push("Vui lòng chọn thương hiệu");
  return errors;
};

// Validate variants
const validateVariants = (variants) => {
  const errors = [];
  if (!variants || variants.length === 0) {
    errors.push("Vui lòng thêm ít nhất một variant");
  } else {
    variants.forEach((v, index) => {
      if (!v.price || v.price <= 0) {
        errors.push(`Variant ${index + 1}: Giá phải lớn hơn 0`);
      }
      // quantity có default 0 trong DB nên không bắt buộc
    });
  }
  return errors;
};

// Save variants to API
const saveVariants = async (productId, variants) => {
  const results = [];

  console.log("Saving variants for productId:", productId);
  console.log("Variants to save:", variants);

  for (const variant of variants) {
    try {
      console.log("Sending variant:", variant);
      const res = await api.post("/product-variants", variant);
      console.log("Variant saved successfully:", res.data);
      results.push({ success: true, variant: res.data });
    } catch (error) {
      console.error("Lỗi lưu variant:", error);
      console.error("Error response:", error.response?.data);
      results.push({
        success: false,
        error: error.response?.data?.error || error.message,
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

  // Validate với raw data
  const rawData = collectRawData();
  const errors = validateForm(rawData);
  if (errors.length > 0) {
    showError(errors.join(", "));
    return false;
  }

  // Validate variants
  const brandId = rawData.brand_id;
  const modelCode = rawData.model_code;
  // Tạm thời dùng 0 vì chưa có productId, sẽ cập nhật sau khi tạo product
  const variants = collectVariants(0, brandId, modelCode);
  const variantErrors = validateVariants(variants);
  if (variantErrors.length > 0) {
    showError(variantErrors.join(", "));
    return false;
  }

  // Show loading
  const loadingSwal = showLoading("Đang tạo sản phẩm...");

  try {
    // 1. Create product với FormData (hỗ trợ upload file)
    const formData = collectFormData();

    // Gửi request với multipart/form-data
    const productRes = await api.post("/products", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // Debug: Log response để xem cấu trúc
    console.log("Product API Response:", productRes);
    console.log("Response data:", productRes.data);

    // Lấy product ID từ response - thử nhiều cách
    const responseData = productRes.data;
    const productId =
      responseData?.data?.id || // { data: { id: ... } }
      responseData?.id || // { id: ... }
      responseData?.product?.id || // { product: { id: ... } }
      responseData?.data?.data?.id; // Nested deeper

    console.log("Extracted productId:", productId);

    if (!productId) {
      console.error(
        "Full response for debugging:",
        JSON.stringify(productRes.data, null, 2)
      );
      throw new Error(
        "Không nhận được ID sản phẩm sau khi tạo. Response: " +
          JSON.stringify(responseData)
      );
    }

    // 2. Update variants với product_id thực tế
    const variantsWithProductId = variants.map((v) => ({
      ...v,
      product_id: parseInt(productId),
    }));

    // 3. Save variants riêng biệt
    const variantResults = await saveVariants(productId, variantsWithProductId);

    // Kiểm tra kết quả variants
    const failedVariants = variantResults.filter((r) => !r.success);
    if (failedVariants.length > 0) {
      const errorMessages = failedVariants.map((r) => r.error).join(", ");
      Swal.close();
      showErrorDialog(
        `Tạo sản phẩm thành công nhưng có lỗi khi lưu variants: ${errorMessages}`,
        "Cảnh báo"
      );
    } else {
      Swal.close();
      showSuccess("Tạo sản phẩm và variants thành công!");
    }

    // Redirect after success message
    setTimeout(() => {
      window.location.href = "/src/pages/admin/product-list.html";
    }, 1500);
  } catch (error) {
    Swal.close();
    const errorMsg =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.response?.data?.errors ||
      error.message ||
      "Có lỗi xảy ra khi tạo sản phẩm";

    // Hiển thị lỗi chi tiết hơn
    const displayError =
      typeof errorMsg === "object" ? JSON.stringify(errorMsg) : errorMsg;
    showErrorDialog(displayError, "Lỗi tạo sản phẩm");
  }

  return false;
};

// Initialize
const init = async () => {
  // Disable Dropzone auto-discover as early as possible
  if (typeof Dropzone !== "undefined") {
    Dropzone.autoDiscover = false;
  }

  await Promise.all([
    loadOptions("/categories", "product-category", "Chọn danh mục"),
    loadOptions("/brands", "product-brand", "Chọn thương hiệu"),
  ]);

  // Wait for Dropzone to be available
  if (typeof Dropzone === "undefined") {
    // Wait a bit for script to load
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Set again after waiting
    if (typeof Dropzone !== "undefined") {
      Dropzone.autoDiscover = false;
    }
  }

  // Setup dropzone cho ảnh chính - lưu File object
  mainDropzone = setupDropzone("main-image-dropzone", 1, (file) => {
    mainImageFile = file; // Lưu File object
  });

  // Setup dropzone cho thumbnails - lưu array File objects
  thumbDropzone = setupDropzone("thumbnail-dropzone", 10, (file) => {
    thumbnailFiles.push(file); // Thêm File object vào array
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

  // Init variants management
  initVariants();
};

// Variants management
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

  // Auto-generate SKU for new variant
  const brandId = document.getElementById("product-brand")?.value;
  const modelCode = document.getElementById("product-model-code")?.value;
  const sizeInput = variantItem.querySelector(".variant-size");
  const skuInput = variantItem.querySelector(".variant-sku");

  // Generate SKU when size is entered
  const updateSKU = () => {
    const size = sizeInput?.value;
    if (brandId && modelCode && size && skuInput) {
      const sku = generateSKU(brandId, modelCode, size);
      skuInput.value = sku;
    }
  };

  if (sizeInput) {
    sizeInput.addEventListener("input", updateSKU);
    sizeInput.addEventListener("change", updateSKU);
  }

  // Auto-update SKU when brand, model_code, or size changes
  const updateSKUFromForm = () => {
    const brandId = document.getElementById("product-brand")?.value;
    const modelCode = document.getElementById("product-model-code")?.value;
    const size = sizeInput?.value;

    // Only auto-update if SKU is empty or was auto-generated
    if (skuInput && brandId && modelCode && size) {
      const currentSKU = skuInput.value;
      const expectedSKU = generateSKU(brandId, modelCode, size);

      // Update if SKU is empty or matches the pattern (was auto-generated)
      if (
        !currentSKU ||
        currentSKU === expectedSKU ||
        currentSKU.match(/^[A-Z]{3}-[A-Z0-9]+-\d+$/)
      ) {
        skuInput.value = expectedSKU;
      }
    }
  };

  // Listen to brand and model_code changes
  const brandSelect = document.getElementById("product-brand");
  const modelCodeInput = document.getElementById("product-model-code");

  if (brandSelect) {
    brandSelect.addEventListener("change", updateSKUFromForm);
  }
  if (modelCodeInput) {
    modelCodeInput.addEventListener("input", updateSKUFromForm);
    modelCodeInput.addEventListener("change", updateSKUFromForm);
  }
  if (sizeInput) {
    sizeInput.addEventListener("input", updateSKUFromForm);
    sizeInput.addEventListener("change", updateSKUFromForm);
  }

  // Remove button handler
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
  } else {
    console.warn("Không tìm thấy button add-variant-btn");
  }

  // Debug: Kiểm tra template và container
  const template = document.getElementById("variant-template");
  const container = document.getElementById("variants-container");
  if (!template) {
    console.error("Không tìm thấy variant-template");
  }
  if (!container) {
    console.error("Không tìm thấy variants-container");
  }
};

window.addEventListener("DOMContentLoaded", init);

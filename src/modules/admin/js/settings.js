import api from "../../../shared/services/api.js";
import Swal from "../../../shared/utils/swal.js";

// Toast notification
const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

// DOM Elements
const settingsForm = document.getElementById("settingsForm");
const saveBtn = document.getElementById("saveBtn");
const resetBtn = document.getElementById("resetBtn");
const siteLogoInput = document.getElementById("siteLogo");
const logoPreviewContainer = document.getElementById("logoPreviewContainer");
const logoPreview = document.getElementById("logoPreview");
const removeLogoBtn = document.getElementById("removeLogo");
const primaryColorInput = document.getElementById("primaryColor");
const primaryColorPreview = document.getElementById("primaryColorPreview");
const secondaryColorInput = document.getElementById("secondaryColor");
const secondaryColorPreview = document.getElementById("secondaryColorPreview");

// State
let settings = {};
let logoFile = null;

// ==================== INITIALIZATION ====================

document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  setupEventListeners();
});

// ==================== EVENT LISTENERS ====================

function setupEventListeners() {
  // Form submit
  settingsForm.addEventListener("submit", handleSubmit);

  // Reset button
  resetBtn.addEventListener("click", () => {
    Swal.fire({
      title: "Đặt lại cài đặt?",
      text: "Bạn có chắc muốn đặt lại tất cả cài đặt về mặc định?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Đặt lại",
      cancelButtonText: "Hủy",
    }).then((result) => {
      if (result.isConfirmed) {
        resetToDefaults();
      }
    });
  });

  // Logo upload
  siteLogoInput.addEventListener("change", handleLogoUpload);

  // Remove logo
  removeLogoBtn.addEventListener("click", () => {
    logoFile = null;
    siteLogoInput.value = "";
    logoPreviewContainer.classList.add("d-none");
  });

  // Color pickers
  primaryColorInput.addEventListener("input", (e) => {
    primaryColorPreview.style.backgroundColor = e.target.value;
  });

  secondaryColorInput.addEventListener("input", (e) => {
    secondaryColorPreview.style.backgroundColor = e.target.value;
  });
}

// ==================== LOAD SETTINGS ====================

/**
 * Load settings from localStorage (hoặc từ API nếu có)
 */
function loadSettings() {
  try {
    const savedSettings = localStorage.getItem("websiteSettings");
    if (savedSettings) {
      settings = JSON.parse(savedSettings);
      populateForm(settings);
    } else {
      // Load default settings
      loadDefaultSettings();
    }
  } catch (error) {
    console.error("Lỗi khi load settings:", error);
    Toast.fire({
      icon: "error",
      title: "Không thể tải cài đặt",
    });
    loadDefaultSettings();
  }
}

/**
 * Load default settings
 */
function loadDefaultSettings() {
  settings = {
    site: {
      name: "Rudo Watch",
      description: "Cửa hàng đồng hồ chính hãng uy tín",
      logo: "",
      favicon: "",
    },
    contact: {
      email: "",
      phone: "",
      address: "",
      map: "",
    },
    social: {
      facebook: "",
      instagram: "",
      twitter: "",
      youtube: "",
      tiktok: "",
      zalo: "",
    },
    seo: {
      title: "",
      description: "",
      keywords: "",
    },
    general: {
      currency: "VND",
      timezone: "Asia/Ho_Chi_Minh",
      language: "vi",
      maintenanceMode: false,
      allowRegistration: true,
      allowReviews: true,
    },
    colors: {
      primary: "#0A2A45",
      secondary: "#1e40af",
    },
  };
  populateForm(settings);
}

/**
 * Populate form with settings data
 */
function populateForm(data) {
  // Site info
  document.getElementById("siteName").value = data.site?.name || "";
  document.getElementById("siteDescription").value =
    data.site?.description || "";
  if (data.site?.logo) {
    logoPreview.src = data.site.logo;
    logoPreviewContainer.classList.remove("d-none");
  }

  // Contact
  document.getElementById("contactEmail").value = data.contact?.email || "";
  document.getElementById("contactPhone").value = data.contact?.phone || "";
  document.getElementById("contactAddress").value = data.contact?.address || "";
  document.getElementById("contactMap").value = data.contact?.map || "";

  // Social
  document.getElementById("socialFacebook").value =
    data.social?.facebook || "";
  document.getElementById("socialInstagram").value =
    data.social?.instagram || "";
  document.getElementById("socialTwitter").value = data.social?.twitter || "";
  document.getElementById("socialYoutube").value = data.social?.youtube || "";
  document.getElementById("socialTiktok").value = data.social?.tiktok || "";
  document.getElementById("socialZalo").value = data.social?.zalo || "";

  // SEO
  document.getElementById("seoTitle").value = data.seo?.title || "";
  document.getElementById("seoDescription").value = data.seo?.description || "";
  document.getElementById("seoKeywords").value = data.seo?.keywords || "";

  // General
  document.getElementById("currency").value = data.general?.currency || "VND";
  document.getElementById("timezone").value =
    data.general?.timezone || "Asia/Ho_Chi_Minh";
  document.getElementById("language").value = data.general?.language || "vi";
  document.getElementById("maintenanceMode").checked =
    data.general?.maintenanceMode || false;
  document.getElementById("allowRegistration").checked =
    data.general?.allowRegistration !== false;
  document.getElementById("allowReviews").checked =
    data.general?.allowReviews !== false;

  // Colors
  const primaryColor = data.colors?.primary || "#0A2A45";
  const secondaryColor = data.colors?.secondary || "#1e40af";
  primaryColorInput.value = primaryColor;
  primaryColorPreview.style.backgroundColor = primaryColor;
  secondaryColorInput.value = secondaryColor;
  secondaryColorPreview.style.backgroundColor = secondaryColor;
}

// ==================== HANDLERS ====================

/**
 * Handle form submission
 */
async function handleSubmit(e) {
  e.preventDefault();

  const submitBtnText = saveBtn.innerHTML;
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i class="ti ti-loader me-2"></i>Đang lưu...';

  try {
    // Collect form data
    const formData = collectFormData();

    // Upload logo if changed
    if (logoFile) {
      try {
        const logoUrl = await uploadLogo(logoFile);
        formData.site.logo = logoUrl;
      } catch (error) {
        console.error("Lỗi upload logo:", error);
        Toast.fire({
          icon: "warning",
          title: "Lưu cài đặt thành công nhưng logo chưa được upload",
        });
      }
    }

    // Save to localStorage (hoặc gọi API)
    saveSettings(formData);

    Toast.fire({
      icon: "success",
      title: "Lưu cài đặt thành công!",
    });

    // Reload settings
    settings = formData;
  } catch (error) {
    console.error("Lỗi khi lưu cài đặt:", error);
    Toast.fire({
      icon: "error",
      title: "Không thể lưu cài đặt",
    });
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = submitBtnText;
  }
}

/**
 * Collect form data
 */
function collectFormData() {
  return {
    site: {
      name: document.getElementById("siteName").value,
      description: document.getElementById("siteDescription").value,
      logo: settings.site?.logo || "",
      favicon: settings.site?.favicon || "",
    },
    contact: {
      email: document.getElementById("contactEmail").value,
      phone: document.getElementById("contactPhone").value,
      address: document.getElementById("contactAddress").value,
      map: document.getElementById("contactMap").value,
    },
    social: {
      facebook: document.getElementById("socialFacebook").value,
      instagram: document.getElementById("socialInstagram").value,
      twitter: document.getElementById("socialTwitter").value,
      youtube: document.getElementById("socialYoutube").value,
      tiktok: document.getElementById("socialTiktok").value,
      zalo: document.getElementById("socialZalo").value,
    },
    seo: {
      title: document.getElementById("seoTitle").value,
      description: document.getElementById("seoDescription").value,
      keywords: document.getElementById("seoKeywords").value,
    },
    general: {
      currency: document.getElementById("currency").value,
      timezone: document.getElementById("timezone").value,
      language: document.getElementById("language").value,
      maintenanceMode: document.getElementById("maintenanceMode").checked,
      allowRegistration: document.getElementById("allowRegistration").checked,
      allowReviews: document.getElementById("allowReviews").checked,
    },
    colors: {
      primary: primaryColorInput.value,
      secondary: secondaryColorInput.value,
    },
  };
}

/**
 * Handle logo upload
 */
function handleLogoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith("image/")) {
    Toast.fire({
      icon: "error",
      title: "Vui lòng chọn file ảnh",
    });
    e.target.value = "";
    return;
  }

  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    Toast.fire({
      icon: "error",
      title: "Kích thước file không được vượt quá 2MB",
    });
    e.target.value = "";
    return;
  }

  logoFile = file;

  // Preview
  const reader = new FileReader();
  reader.onload = (event) => {
    logoPreview.src = event.target.result;
    logoPreviewContainer.classList.remove("d-none");
  };
  reader.readAsDataURL(file);
}

/**
 * Upload logo to server
 */
async function uploadLogo(file) {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("folder", "settings");

  const response = await api.post("/upload/image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data.data?.url || response.data.data?.secure_url || "";
}

/**
 * Save settings to localStorage (hoặc API)
 */
function saveSettings(data) {
  localStorage.setItem("websiteSettings", JSON.stringify(data));
  
  // TODO: Nếu có API endpoint để lưu settings, gọi ở đây
  // await api.post('/settings', data);
}

/**
 * Reset to default settings
 */
function resetToDefaults() {
  loadDefaultSettings();
  Toast.fire({
    icon: "success",
    title: "Đã đặt lại cài đặt về mặc định",
  });
}


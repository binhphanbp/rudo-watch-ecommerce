import { GEMINI_API_KEY, GEMINI_MODEL, GEMINI_BASE_URL } from "../../../shared/services/ai.js";
import { PROMPT_SPECS_AND_VARIANTS_WITH_IMAGE } from "../../../shared/services/prompt.js";
import { cleanAiOutput } from "../../../shared/utils/cleanResult.js";
import axios from "axios";
import Swal, {
  showLoading,
  showSuccess,
  showError,
  showErrorDialog,
} from "../../../shared/utils/swal.js";

/**
 * Hàm retry với exponential backoff
 */
export const retryWithBackoff = async (fn, maxRetries = 3, initialDelay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      // Nếu là lỗi 429 (rate limit), đợi lâu hơn
      if (error.response?.status === 429) {
        const delay = initialDelay * Math.pow(2, i); // Exponential backoff
        const retryAfter = error.response.headers['retry-after'] 
          ? parseInt(error.response.headers['retry-after']) * 1000 
          : delay;
        
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryAfter));
          continue;
        }
      }
      
      // Nếu không phải lỗi 429 hoặc đã retry hết, throw error
      throw error;
    }
  }
};

/**
 * Hàm tìm kiếm thông tin về sản phẩm (tra cứu từ website chính thức trước)
 */
export const searchProductInfo = async (productName, modelCode, brandName) => {
  try {
    const officialWebsitePrompt = `
Bạn là chuyên gia tra cứu thông tin đồng hồ. 

QUAN TRỌNG: Hãy ưu tiên tìm kiếm từ WEBSITE CHÍNH THỨC của thương hiệu trước tiên.

Thông tin sản phẩm:
- Tên sản phẩm: "${productName}"
- Model/Mã sản phẩm: "${modelCode}"
- Thương hiệu: "${brandName || 'Chưa xác định'}"

QUY TRÌNH TRA CỨU:
1. ĐẦU TIÊN: Truy cập/tra cứu từ website chính thức của thương hiệu "${brandName}" để tìm thông tin về model "${modelCode}" hoặc sản phẩm "${productName}"
   - Tìm trên website chính thức (official website) của thương hiệu
   - Xem trang sản phẩm, catalog chính thức
   - Lấy thông số kỹ thuật chính xác từ nguồn chính thức

2. NẾU KHÔNG TÌM THẤY trên website chính thức:
   - Tìm từ các trang bán hàng chính thức (authorized dealers)
   - Tìm từ các review/đánh giá từ nguồn đáng tin cậy
   - Tìm thông tin từ catalog, brochure chính thức

3. NẾU VẪN KHÔNG CÓ:
   - Tìm sản phẩm tương tự cùng thương hiệu
   - Sử dụng kiến thức về dòng sản phẩm này

Hãy cung cấp thông tin với nguồn rõ ràng:
- Nếu lấy từ website chính thức: ghi rõ "Nguồn: Website chính thức [tên thương hiệu]"
- Nếu lấy từ nguồn khác: ghi rõ nguồn

Thông tin cần tra cứu:
1. Thông số kỹ thuật chính thức: kích thước mặt đồng hồ (mm), trọng lượng (g), chất liệu vỏ và dây đeo, bảo hành
2. Các biến thể màu sắc có sẵn (từ catalog chính thức)
3. Giá bán chính thức hoặc giá tham khảo (VNĐ)
4. Đặc điểm nổi bật, tính năng đặc biệt

Trả về thông tin dưới dạng text rõ ràng, bao gồm:
- Nguồn thông tin (website chính thức hay nguồn khác)
- Thông số kỹ thuật chi tiết
- Các màu sắc có sẵn
- Khoảng giá
`;

    const searchPayload = {
      contents: [
        {
          role: "user",
          parts: [{ text: officialWebsitePrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
      },
    };

    const searchRes = await retryWithBackoff(async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/${GEMINI_MODEL}:generateContent`,
        searchPayload,
        {
          headers: { "Content-Type": "application/json" },
          params: { 
            key: GEMINI_API_KEY,
          },
        }
      );
    }, 3, 2000);

    const searchResult = searchRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    if (searchResult && searchResult.trim().length > 50) {
      return searchResult;
    }
    
    return await searchAlternativeSources(productName, modelCode, brandName);
    
  } catch (error) {
    try {
      return await searchAlternativeSources(productName, modelCode, brandName);
    } catch (altError) {
      return null;
    }
  }
};

/**
 * Hàm tìm kiếm từ nguồn khác (backup)
 */
export const searchAlternativeSources = async (productName, modelCode, brandName) => {
  try {
    const alternativePrompt = `
Hãy tìm kiếm thông tin về sản phẩm đồng hồ sau từ các nguồn đáng tin cậy (không phải website chính thức):

- Tên sản phẩm: "${productName}"
- Model/Mã: "${modelCode}"
- Thương hiệu: "${brandName}"

Tìm từ:
- Các trang web bán hàng uy tín
- Review/đánh giá từ chuyên gia
- Catalog, tài liệu kỹ thuật
- So sánh với sản phẩm tương tự

Cung cấp:
1. Thông số kỹ thuật ước tính/dự đoán
2. Các màu sắc phổ biến
3. Khoảng giá tham khảo
4. Ghi chú về nguồn thông tin
`;

    const searchPayload = {
      contents: [
        {
          role: "user",
          parts: [{ text: alternativePrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
      },
    };

    const searchRes = await retryWithBackoff(async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/${GEMINI_MODEL}:generateContent`,
        searchPayload,
        {
          headers: { "Content-Type": "application/json" },
          params: { key: GEMINI_API_KEY },
        }
      );
    }, 3, 2000);

    return searchRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch (error) {
    return null;
  }
};

/**
 * Hàm convert File thành base64
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result.split(',')[1];
      resolve({
        mimeType: file.type,
        data: base64String
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Hàm generate specs và variants với hình ảnh
 */
export const generateSpecsAndVariantsWithImage = async (productData, images, numVariants, productInfo = null) => {
  try {
    let enhancedDescription = productData.description || "";
    if (productInfo) {
      enhancedDescription += `\n\n[THÔNG TIN TRA CỨU ĐÃ TÌM THẤY]\n${productInfo}\n\nHãy sử dụng thông tin tra cứu này để đảm bảo tính chính xác của thông số kỹ thuật và biến thể.`;
    }

    const prompt = PROMPT_SPECS_AND_VARIANTS_WITH_IMAGE(
      productData.name,
      productData.model_code,
      productData.brand_name || "",
      productData.category_name || "",
      enhancedDescription,
      numVariants
    );

    const parts = [{ text: prompt }];
    
    if (images && images.length > 0) {
      for (const imageData of images) {
        if (imageData.mimeType && imageData.data) {
          parts.push({
            inlineData: {
              mimeType: imageData.mimeType,
              data: imageData.data
            }
          });
        }
      }
    }

    const payload = {
      contents: [
        {
          role: "user",
          parts: parts
        }
      ]
    };

    const res = await retryWithBackoff(async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return await axios.post(
        `${GEMINI_BASE_URL}${GEMINI_MODEL}:generateContent`,
        payload,
        {
          headers: { "Content-Type": "application/json" },
          params: { key: GEMINI_API_KEY }
        }
      );
    }, 3, 2000);

    const output = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return output;
  } catch (error) {
    throw error;
  }
};

/**
 * Hàm count variants
 */
export const countVariants = () => {
  const container = document.getElementById("variants-container");
  if (container) {
    return container.querySelectorAll(".variant-item").length;
  }
  return document.querySelectorAll(".variant-item").length;
};

/**
 * Hàm chính: Generate specs và variants với AI
 * @param {Object} options - Configuration options
 * @param {Function} options.collectFullProductData - Function to collect product data
 * @param {Function} options.collectImages - Function to collect images
 * @param {Array} options.brands - Brands array
 * @param {Array} options.categories - Categories array
 */
export const generateSpecsAndVariantsWithAI = async ({ collectFullProductData, collectImages, brands = [], categories = [] }) => {
  try {
    const productData = collectFullProductData();
    if (!productData.name || !productData.model_code) {
      showError("Vui lòng nhập tên sản phẩm và mã sản phẩm trước");
      return;
    }

    const numVariants = countVariants();
    if (numVariants === 0) {
      showError("Vui lòng thêm ít nhất 1 variant trước khi generate. Nhấn nút 'Thêm variant' ở trên.");
      return;
    }

    const images = await collectImages();
    if (images.length === 0) {
      const confirm = await Swal.fire({
        title: 'Không có hình ảnh',
        text: 'Bạn chưa upload hình ảnh. Bạn có muốn tiếp tục generate không? (Kết quả có thể kém chính xác hơn)',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Tiếp tục',
        cancelButtonText: 'Hủy'
      });
      
      if (!confirm.isConfirmed) {
        return;
      }
    }

    let loadingSwal = null;
    let productInfo = null;
    
    if (productData.brand_name || productData.model_code) {
      try {
        const brandText = productData.brand_name ? ` của thương hiệu "${productData.brand_name}"` : "";
        loadingSwal = showLoading(`Đang tra cứu thông tin từ website chính thức${brandText}...`);
        
        productInfo = await searchProductInfo(
          productData.name,
          productData.model_code,
          productData.brand_name || ""
        );
        
        if (!productInfo || productInfo.trim().length < 100) {
          loadingSwal = showLoading("Không tìm thấy trên website chính thức. Đang tìm kiếm từ nguồn khác...");
        } else {
          loadingSwal = showLoading("Đã tìm thấy thông tin từ website chính thức. Đang xử lý...");
        }
      } catch (error) {
        loadingSwal = showLoading("Đang xử lý thông tin sản phẩm...");
      }
    } else {
      loadingSwal = showLoading("Đang phân tích hình ảnh và tạo thông số, biến thể...");
    }

    try {
      if (productInfo) {
        loadingSwal = showLoading("Đang chờ để tránh giới hạn API...");
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      loadingSwal = showLoading("Đang phân tích hình ảnh và tạo thông số, biến thể bằng AI...");
      const aiResponse = await generateSpecsAndVariantsWithImage(productData, images, numVariants, productInfo);
      
      Swal.close();
      
      if (!aiResponse) {
        showError("Không nhận được phản hồi từ AI");
        return;
      }

      const result = cleanAiOutput(aiResponse);
      
      // Fill specs
      if (result.specifications) {
        const spec = result.specifications;
        if (spec.size) document.getElementById("spec-size").value = spec.size || "";
        if (spec.brand) document.getElementById("spec-brand").value = spec.brand || "";
        if (spec.model) document.getElementById("spec-model").value = spec.model || "";
        if (spec.weight) document.getElementById("spec-weight").value = spec.weight || "";
        if (spec.material) document.getElementById("spec-material").value = spec.material || "";
        if (spec.warranty) document.getElementById("spec-warranty").value = spec.warranty || "";
      }

      // Fill variants
      if (result.variants && Array.isArray(result.variants)) {
        const variantItems = document.querySelectorAll(".variant-item");
        result.variants.forEach((variant, index) => {
          const item = variantItems[index];
          if (item) {
            if (variant.price) item.querySelector(".variant-price").value = variant.price || "";
            if (variant.quantity !== undefined) item.querySelector(".variant-quantity").value = variant.quantity || "";
            
            const colorsSelect = item.querySelector(".variant-colors");
            if (colorsSelect && variant.colors) {
              let colorValue = "";
              if (Array.isArray(variant.colors)) {
                colorValue = variant.colors[0] || "";
              } else if (typeof variant.colors === "string") {
                colorValue = variant.colors.split(',')[0].trim() || variant.colors.trim();
              }
              
              if (colorsSelect instanceof HTMLSelectElement) {
                colorsSelect.value = colorValue;
              }
            }
          }
        });
      }

      showSuccess("Đã tạo thông số và biến thể thành công!");
    } catch (error) {
      Swal.close();
      
      if (error.response?.status === 429) {
        showErrorDialog(
          "Đã vượt quá giới hạn số lần gọi API. Vui lòng đợi một vài phút rồi thử lại.\n\nLưu ý: Gemini API có giới hạn số lần gọi trong một khoảng thời gian.",
          "Giới hạn API"
        );
      } else {
        showError("Lỗi khi generate: " + (error.response?.data?.error?.message || error.message || "Lỗi không xác định"));
      }
    }
  } catch (error) {
    if (error.response?.status === 429) {
      showErrorDialog(
        "Đã vượt quá giới hạn số lần gọi API. Vui lòng đợi một vài phút rồi thử lại.",
        "Giới hạn API"
      );
    } else {
      showError("Lỗi: " + (error.response?.data?.error?.message || error.message || "Lỗi không xác định"));
    }
  }
};


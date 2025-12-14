import api, { getImageUrl } from "../../../shared/services/api.js";
import Swal, {showLoading} from "../../../shared/utils/swal.js";
import { quill } from "./quill.js";

// Toast notification
const Toast = Swal.mixin({
	toast: true,
	position: "top-end",
	showConfirmButton: false,
	timer: 3000,
	timerProgressBar: true,
});


function generateSlug(str) {
	return str
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-+|-+$/g, "");
}

const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get("id"); // lấy id


// =============================
// 1. Load danh mục bài viết
// =============================
const loadCategories = async () => {
	try {
		const res = await api.get("/post-categories");

		const select = document.getElementById("post-category");
		select.innerHTML = `<option value="">-- Chọn danh mục --</option>`;

		res.data.data.forEach(cat => {
			select.innerHTML += `
                <option value="${cat.id}">${cat.name}</option>
            `;
		});

	} catch (err) {
		console.log(err);
	}
};

loadCategories();

async function loadPostById() {
	if (!postId) return; // Nếu không có id thì là trang tạo mới

	try {
		const loadingSwal = showLoading("Đang tải dữ liệu bài viết...");
		const res = await api.get(`/posts/${postId}`);
		const post = res.data.data;

		// Đổ dữ liệu vào các input
		document.getElementById("post-title").value = post.name;
		document.getElementById("post-category").value = post.post_category_id;

		// Slug xử lý tự động nên không cần set vào input
		quill.root.innerHTML = post.content || "";

		// Gắn preview ảnh
		if (post.image) {
			document.getElementById("thumbnail-preview").src = getImageUrl(post.image);
			document.getElementById("thumbnail-preview").style.display = "block";
		}
		loadingSwal.close();

	} catch (error) {
		console.error(error);
		Toast.fire({
			icon: "error",
			title: "Không tải được dữ liệu bài viết",
		});
		loadingSwal.close();
	}
}
loadPostById();




// =============================
// 2. Lấy dữ liệu form
// =============================
const collectPostFormData = () => {
	const title = document.getElementById('post-title').value.trim();
	const category_id = document.getElementById('post-category').value;
	const slug = generateSlug(title);


	const user = localStorage.getItem("user")
		? JSON.parse(localStorage.getItem("user"))
		: null;

	const user_id = user ? user.id : null;

	const content = quill.root.innerHTML;
	const thumbnailInput = document.getElementById('post-thumbnail');
	const thumbnailFile = thumbnailInput.files[0] || null;

	if (!title || !category_id) {
		alert("Vui lòng điền đầy đủ tiêu đề và chọn danh mục");
		return null;
	}
	console.log(thumbnailFile);
	return {
		title,
		category_id,
		user_id,
		// slug,
		content,
		thumbnailFile
	};
};


// =============================
// 2.5. Upload ảnh base64 trong content lên server
// =============================
const uploadBase64Images = async (htmlContent) => {
	// Tìm tất cả ảnh base64 trong HTML
	const imgRegex = /<img[^>]+src="(data:image\/[^;]+;base64,[^"]+)"[^>]*>/g;
	const matches = [...htmlContent.matchAll(imgRegex)];
	
	if (matches.length === 0) {
		return htmlContent; // Không có ảnh base64, trả về content gốc
	}
	
	let processedContent = htmlContent;
	
	// Tạo map để thay thế base64 bằng URL
	const replacementMap = new Map();
	
	// Upload tất cả ảnh song song
	const uploadPromises = matches.map(async (match, index) => {
		const base64Data = match[1];
		
		try {
			// Parse base64 string
			const base64String = base64Data.split(',')[1];
			if (!base64String) {
				console.warn(`Không thể parse base64 string cho ảnh ${index + 1}`);
				return { base64Data, url: null };
			}
			
			const mimeType = base64Data.match(/data:image\/([^;]+);/)?.[1] || 'png';
			
			// Chuyển base64 thành Blob
			const byteCharacters = atob(base64String);
			const byteNumbers = new Array(byteCharacters.length);
			for (let i = 0; i < byteCharacters.length; i++) {
				byteNumbers[i] = byteCharacters.charCodeAt(i);
			}
			const byteArray = new Uint8Array(byteNumbers);
			const blob = new Blob([byteArray], { type: `image/${mimeType}` });
			
			// Tạo FormData để upload
			const uploadFormData = new FormData();
			uploadFormData.append('image', blob, `content-image-${Date.now()}-${index}.${mimeType}`);
			uploadFormData.append('folder', 'posts/content');
			
			// Upload lên server
			const uploadResponse = await api.post('/upload/image', uploadFormData, {
				headers: {
					'Content-Type': 'multipart/form-data',
				},
				timeout: 60000, // 60s timeout cho mỗi ảnh
			});
			
			if (uploadResponse.data?.data?.url) {
				return { base64Data, url: uploadResponse.data.data.url };
			} else {
				console.warn(`Upload ảnh ${index + 1} thành công nhưng không có URL`);
				return { base64Data, url: null };
			}
		} catch (error) {
			console.error(`Lỗi khi upload ảnh ${index + 1}:`, error);
			return { base64Data, url: null };
		}
	});
	
	// Chờ tất cả upload hoàn thành
	const results = await Promise.all(uploadPromises);
	
	// Tạo map replacement
	results.forEach(({ base64Data, url }) => {
		if (url) {
			replacementMap.set(base64Data, url);
		}
	});
	
	// Thay thế tất cả base64 bằng URL
	replacementMap.forEach((url, base64Data) => {
		processedContent = processedContent.replace(new RegExp(base64Data.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), url);
	});
	
	const successCount = replacementMap.size;
	console.log(`Đã upload ${successCount}/${matches.length} ảnh thành công`);
	
	return processedContent;
};

// =============================
// 3. Submit bài viết
// =============================
const submitPost = async (id) => {
    const form = collectPostFormData();
    if (!form) return;

    try {
		const loadingSwal = showLoading("Đang cập nhật bài viết...");
        document.getElementById("submit-post-btn").disabled = true;

		// Upload ảnh base64 trong content lên server
		let processedContent = form.content;
		if (form.content.includes('data:image')) {
			processedContent = await uploadBase64Images(form.content);
		}

        const formData = new FormData();
        formData.append("name", form.title);
        formData.append("post_category_id", form.category_id);
        formData.append("user_id", form.user_id);
        formData.append("content", processedContent);

        // Chỉ gửi image nếu có chọn file
        if (form.thumbnailFile) {
            formData.append("image", form.thumbnailFile);
        }

        // IMPORTANT: override method cho PHP thuần
        formData.append("_method", "PUT");

        // Log để debug
        console.log('Content length:', processedContent.length);
        console.log('Has images:', processedContent.includes('<img'));
        
        const response = await api.post(`/posts/${id}`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
            timeout: 120000, // Tăng timeout lên 2 phút cho content lớn
        });
		loadingSwal.close();
        Toast.fire({
            icon: "success",
            title: response.data.message || "Cập nhật bài viết thành công",
        });

        document.getElementById("post-form").reset();
        quill.setContents([{ insert: "\n" }]);

    } catch (error) {
        loadingSwal.close();
		console.log(error.response?.data || error);
        console.error("Cập nhật bài viết thất bại:", error);
        
        // Hiển thị lỗi chi tiết
        let errorMessage = "Cập nhật bài viết thất bại";
        if (error.response?.data) {
            if (error.response.data.error) {
                errorMessage = error.response.data.error;
            } else if (error.response.data.message) {
                errorMessage = error.response.data.message;
            } else if (error.response.data.errors) {
                const errors = Object.values(error.response.data.errors).flat();
                errorMessage = errors.join(', ');
            }
        }
        
        Toast.fire({
            icon: "error",
            title: errorMessage,
        });
		
    } finally {
        document.getElementById("submit-post-btn").disabled = false;
		setTimeout(() => {
			window.location.href = '/src/pages/admin/posts.html';
		}, 500);
    }
};



// =============================
// 4. Preview ảnh thumbnail
// =============================
const setupImagePreview = (inputId, previewId) => {
	const input = document.getElementById(inputId);
	const preview = document.getElementById(previewId);

	input.addEventListener("change", function () {
		const file = this.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = function (e) {
				preview.src = e.target.result;
				preview.style.display = "block";
			};
			reader.readAsDataURL(file);
		} else {
			preview.src = "";
			preview.style.display = "none";
		}
	});
};

setupImagePreview("post-thumbnail", "thumbnail-preview");

document.getElementById("submit-post-btn").addEventListener("click", () => submitPost(postId));

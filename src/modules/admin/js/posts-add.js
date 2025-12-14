import api, { getImageUrl } from "../../../shared/services/api.js";
import Swal from "../../../shared/utils/swal.js";
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
		slug,
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
const submitPost = async () => {
	const form = collectPostFormData();
	if (!form) return;

	const submitBtn = document.getElementById('submit-post-btn');
	
	try {
		submitBtn.disabled = true;
		submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang xử lý...';
		
		// Upload ảnh base64 trong content lên server
		let processedContent = form.content;
		if (form.content && form.content.includes('data:image')) {
			submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang upload ảnh...';
			try {
				processedContent = await uploadBase64Images(form.content);
			} catch (uploadError) {
				console.error('Lỗi khi upload ảnh:', uploadError);
				Toast.fire({
					icon: "warning",
					title: "Có lỗi khi upload một số ảnh, sẽ thử lưu với ảnh gốc",
				});
			}
		}

		submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang lưu...';

		// Tạo FormData gửi thẳng vào /posts
		const formData = new FormData();
		formData.append("name", form.title);
		formData.append("post_category_id", form.category_id);
		formData.append("slug", form.slug);
		formData.append("user_id", form.user_id);
		formData.append("content", processedContent);

		if (form.thumbnailFile) {
			formData.append("image", form.thumbnailFile);
		}
		
		// Log để debug
		console.log('Content length:', processedContent.length);
		console.log('Has images:', processedContent.includes('<img'));
		
		const response = await api.post("/posts", formData, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
			timeout: 120000, // Tăng timeout lên 2 phút cho content lớn
		});

		Toast.fire({
			icon: "success",
			title: response.data.message || "Tạo bài viết thành công",
		});

		document.getElementById("post-form").reset();
		quill.setContents([{ insert: "\n" }]);
		
		// Redirect về trang danh sách sau 1 giây
		setTimeout(() => {
			window.location.href = '/src/pages/admin/posts.html';
		}, 1000);

	} catch (error) {
		console.error("Tạo bài viết thất bại:", error);
		
		// Hiển thị lỗi chi tiết
		let errorMessage = "Tạo bài viết thất bại";
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
		submitBtn.disabled = false;
		submitBtn.innerHTML = 'Lưu bài viết';
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

document.getElementById("submit-post-btn").addEventListener("click", submitPost);

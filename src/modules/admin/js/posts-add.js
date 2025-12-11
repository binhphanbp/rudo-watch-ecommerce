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
// 3. Submit bài viết (KHÔNG còn upload riêng)
// =============================
const submitPost = async () => {
	const form = collectPostFormData();
	if (!form) return;

	try {
		document.getElementById('submit-post-btn').disabled = true;

		// Tạo FormData gửi thẳng vào /posts
		const formData = new FormData();
		formData.append("name", form.title);
		formData.append("post_category_id", form.category_id);
		formData.append("slug", form.slug);
		formData.append("user_id", form.user_id);
		formData.append("content", form.content);

		if (form.thumbnailFile) {
			formData.append("image", form.thumbnailFile);
		}
		console.log(...formData);
		const response = await api.post("/posts", formData, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
		});

		Toast.fire({
			icon: "success",
			title: response.data.message || "Tạo bài viết thành công",
		});

		document.getElementById("post-form").reset();
		quill.setContents([{ insert: "\n" }]);

	} catch (error) {
		console.error("Tạo bài viết thất bại:", error);
		Toast.fire({
			icon: "error",
			title: "Tạo bài viết thất bại",
		});

	} finally {
		document.getElementById("submit-post-btn").disabled = false;
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

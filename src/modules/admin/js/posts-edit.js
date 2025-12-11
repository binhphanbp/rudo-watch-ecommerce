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
// 3. Submit bài viết (KHÔNG còn upload riêng)
// =============================
const submitPost = async (id) => {
    const form = collectPostFormData();
    if (!form) return;

    try {
		const loadingSwal = showLoading("Đang cập nhật bài viết...");
        document.getElementById("submit-post-btn").disabled = true;

        const formData = new FormData();
        formData.append("name", form.title);
        formData.append("post_category_id", form.category_id);
        formData.append("user_id", form.user_id);
        formData.append("content", form.content);

        // Chỉ gửi image nếu có chọn file
        if (form.thumbnailFile) {
            formData.append("image", form.thumbnailFile);
        }

        // IMPORTANT: override method cho PHP thuần
        formData.append("_method", "PUT");

        console.log(...formData);

        const response = await api.post(`/posts/${id}`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
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
        Toast.fire({
            icon: "error",
            title: "Cập nhật bài viết thất bại",
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

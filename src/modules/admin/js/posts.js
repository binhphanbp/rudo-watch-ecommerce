import api from "../../../shared/services/api.js";
import Swal from "../../../shared/utils/swal.js";

// Toast
const Toast = Swal.mixin({
	toast: true,
	position: "top-end",
	showConfirmButton: false,
	timer: 3000,
	timerProgressBar: true,
});


// DOM
const postsTableBody = document.getElementById("postsTableBody");
const postsTableBodyLoading = document.getElementById("postsTableBodyLoading");
// State
let posts = [];



const loadingIndicator = (isLoading) => {
	if (postsTableBodyLoading) {
		postsTableBodyLoading.style.display = isLoading ? "table-row" : "none";
		postsTableBodyLoading.style.visibility = isLoading ? "visible" : "collapse";
		postsTableBody.style.opacity = isLoading ? "0.5" : "1";
	}	
}

/* ============================
LẤY TÊN USER THEO ID
=============================== */
const getUserNameById = async (user_id) => {
	if (!user_id) return "Không có user";

	try {
		const res = await api.get(`/users/${user_id}`);
		return res.data.data?.fullname || "Không rõ";
	} catch (error) {
		console.error("Lỗi khi lấy tên user:", error);
		return "Không rõ";
	}
};

/* ============================
GẮN TÊN USER VÀO LIST POSTS
=============================== */
async function attachUserNamesToPosts(posts) {
	// Tạo danh sách promise lấy user name song song
	const promises = posts.map((post) =>
		getUserNameById(post.user_id).then((name) => {
			post.user_name = name;
		})
	);

	// Chờ tất cả hoàn thành
	await Promise.all(promises);
}

/* ============================
RENDER TABLE
=============================== */
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

function renderPostsTable() {
	if (!postsTableBody) return;

	if (posts.length === 0) {
		postsTableBody.innerHTML = `
		<tr>
			<td colspan="7" class="text-center py-4 text-muted">
				<i class="ti ti-folder-off fs-1 d-block mb-2"></i>
				Chưa có bài viết nào
			</td>
		</tr>`;
		return;
	}

	postsTableBody.innerHTML = posts
		.map(
			(post, index) => `
		<tr>
			<td>${index + 1}</td>

			<td>
				<span class="fw-semibold">${escapeHtml(post.name)}</span>
			</td>

			<td>
				<code>${escapeHtml(post.slug) || "placeholder-slug"}</code>
			</td>

			<td>
				<span>${escapeHtml(post.user_name)}</span>
			</td>

			<td>
				<img src="${post.image || "#"}" width="70" class="rounded" />
			</td>

			<td>${formatDate(post.created_at)}</td>

			<td>
				<div class="d-flex gap-2">
					<button class="btn btn-sm btn-outline-primary" onclick="editPost(${post.id})">
						<i class="ti ti-edit"></i>
					</button>

					<button class="btn btn-sm btn-outline-danger" onclick="confirmDelete(${post.id}, '${escapeHtml(post.name)}')">
						<i class="ti ti-trash"></i>
					</button>
				</div>
			</td>
			
		</tr>
		`
		)
		.join("");
}

/* ============================
LẤY DANH SÁCH POSTS
=============================== */
async function getPostData() {
	try {
		loadingIndicator(true);
		const response = await api.get("/posts");
		posts = response.data.data || [];

		// Gắn user name vào từng bài viết
		await attachUserNamesToPosts(posts);

		// Render bảng
		renderPostsTable();
		// postsTableBodyLoading.style.display = "unset";
		loadingIndicator(false);
		postsTableBodyLoading.style.display = "none";
	} catch (error) {
		console.error("Lỗi khi lấy bài viết:", error);
		Toast.fire({ icon: "error", title: "Không thể tải danh sách bài viết" });
		loadingIndicator(false);
	}
}


async function deletePost(id, confirmDelete = false) {
	try {
		const url = confirmDelete
			? `/posts/${id}?confirm=true`
			: `/posts/${id}`;

		const response = await api.delete(url);
		if (response.data.requires_confirmation) {
			const result = await Swal.fire({
				title: "Xác nhận xóa bài viết",
				html: `<p>${response.data.message}</p>`,
				icon: "warning",
				showCancelButton: true,
				confirmButtonColor: "#d33",
				cancelButtonColor: "#3085d6",
				confirmButtonText: "Xóa tất cả",
				cancelButtonText: "Hủy",
			});

			if (result.isConfirmed) {
				await deletePost(id, true);
			}
			return;
		}

		Toast.fire({
			icon: "success",
			title: response.data.message || "Xóa bài viết thành công",
		});

		getPostData(); // load lại danh sách bài viết

	} catch (error) {
		console.error("Lỗi khi xóa bài viết:", error);
		const errorMsg =
			error.response?.data?.error || "Không thể xóa bài viết";
		Toast.fire({
			icon: "error",
			title: errorMsg,
		});
	}
}

// ================ edit post ===================
window.editPost = (id) => {
	window.location.href = `/src/pages/admin/posts-edit.html?id=${id}`;
}







/**
 * Xác nhận xóa bài viết
 */
window.confirmDelete = function (id, name) {
	Swal.fire({
		title: "Xác nhận xóa?",
		html: `Bạn có chắc muốn xóa danh mục <strong>${name}</strong>?`,
		icon: "warning",
		showCancelButton: true,
		confirmButtonColor: "#d33",
		cancelButtonColor: "#3085d6",
		confirmButtonText: "Xóa",
		cancelButtonText: "Hủy",
	}).then((result) => {
		if (result.isConfirmed) {
			deletePost(id);
		}
	});
};



/* ============================
UTILITIES
=============================== */
function escapeHtml(text) {
	if (!text) return "";
	const div = document.createElement("div");
	div.textContent = text;
	return div.innerHTML;
}

function formatDate(dateString) {
	if (!dateString) return "-";
	const date = new Date(dateString);
	return date.toLocaleDateString("vi-VN", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

/* ============================
INIT
=============================== */
document.addEventListener("DOMContentLoaded", () => {
	getPostData();
	loadCategories()
});

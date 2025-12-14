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
let allPosts = []; // Lưu tất cả để lọc phía client

// State phân trang
let paginationState = {
	current_page: 1,
	per_page: 10,
	total: 0,
	total_pages: 0
};

// State filter
let filterState = {
	search: '',
	category: '',
	date_from: '',
	date_to: ''
};



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

	if (!posts || posts.length === 0) {
		postsTableBody.innerHTML = `
		<tr>
			<td colspan="7" class="text-center py-4 text-muted">
				<i class="ti ti-folder-off fs-1 d-block mb-2"></i>
				${allPosts.length === 0 ? 'Chưa có bài viết nào' : 'Không có bài viết nào khớp với tiêu chí tìm kiếm/lọc'}
			</td>
		</tr>`;
		return;
	}

	// Tính STT dựa trên trang hiện tại
	const startIndex = (paginationState.current_page - 1) * paginationState.per_page;

	postsTableBody.innerHTML = posts
		.map(
			(post, index) => `
		<tr>
			<td>${startIndex + index + 1}</td>

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
		allPosts = response.data.data || [];

		// Gắn user name vào từng bài viết
		await attachUserNamesToPosts(allPosts);

		// Áp dụng filter và phân trang
		applyFiltersAndPagination();
		
		loadingIndicator(false);
		postsTableBodyLoading.style.display = "none";
	} catch (error) {
		console.error("Lỗi khi lấy bài viết:", error);
		Toast.fire({ icon: "error", title: "Không thể tải danh sách bài viết" });
		loadingIndicator(false);
	}
}

/* ============================
ÁP DỤNG FILTER VÀ PHÂN TRANG
=============================== */
function applyFiltersAndPagination() {
	let filtered = [...allPosts];
	
	// Lọc theo search
	if (filterState.search) {
		const searchLower = filterState.search.toLowerCase().trim();
		filtered = filtered.filter(post => {
			const searchableText = [
				post.name || '',
				post.slug || '',
				post.user_name || ''
			].map(s => s.toLowerCase()).join(' | ');
			return searchableText.includes(searchLower);
		});
	}
	
	// Lọc theo category
	if (filterState.category) {
		filtered = filtered.filter(post => {
			return String(post.category_id) === String(filterState.category);
		});
	}
	
	// Lọc theo date range
	if (filterState.date_from) {
		const fromDate = new Date(filterState.date_from);
		fromDate.setHours(0, 0, 0, 0);
		filtered = filtered.filter(post => {
			const postDate = new Date(post.created_at);
			postDate.setHours(0, 0, 0, 0);
			return postDate >= fromDate;
		});
	}
	
	if (filterState.date_to) {
		const toDate = new Date(filterState.date_to);
		toDate.setHours(23, 59, 59, 999);
		filtered = filtered.filter(post => {
			const postDate = new Date(post.created_at);
			return postDate <= toDate;
		});
	}
	
	// Cập nhật pagination state
	const total = filtered.length;
	const total_pages = Math.ceil(total / paginationState.per_page);
	paginationState.total = total;
	paginationState.total_pages = total_pages;
	
	// Phân trang
	const offset = (paginationState.current_page - 1) * paginationState.per_page;
	posts = filtered.slice(offset, offset + paginationState.per_page);
	
	renderPostsTable();
	renderPagination();
	updatePostsInfo();
}

/* ============================
RENDER PHÂN TRANG
=============================== */
function renderPagination() {
	const paginationEl = document.getElementById('posts-pagination');
	if (!paginationEl) return;
	
	const { current_page: p, total_pages: t, per_page, total } = paginationState;
	
	// Nếu chỉ có 1 trang hoặc không có dữ liệu, không hiển thị phân trang
	if (t <= 1) {
		paginationEl.innerHTML = '';
		return;
	}
	
	let html = `<nav><ul class="pagination justify-content-center mb-0">
		<li class="page-item ${p === 1 ? 'disabled' : ''}">
			<a class="page-link" href="#" data-page="${p - 1}">
				<i class="ti ti-chevron-left"></i>
			</a>
		</li>`;
	
	// Hiển thị các số trang
	for (let i = 1; i <= t; i++) {
		if (i === 1 || i === t || (i >= p - 2 && i <= p + 2)) {
			html += `<li class="page-item ${i === p ? 'active' : ''}">
				<a class="page-link" href="#" data-page="${i}">${i}</a>
			</li>`;
		} else if (i === p - 3 || i === p + 3) {
			html += `<li class="page-item disabled">
				<span class="page-link">...</span>
			</li>`;
		}
	}
	
	html += `<li class="page-item ${p === t ? 'disabled' : ''}">
		<a class="page-link" href="#" data-page="${p + 1}">
			<i class="ti ti-chevron-right"></i>
		</a>
	</li></ul></nav>`;
	
	paginationEl.innerHTML = html;
	
	// Thêm event listener cho các link phân trang
	paginationEl.querySelectorAll('a[data-page]').forEach(link => {
		link.addEventListener('click', (e) => {
			e.preventDefault();
			const page = parseInt(link.dataset.page);
			if (page > 0 && page <= t) {
				paginationState.current_page = page;
				applyFiltersAndPagination();
			}
		});
	});
}

/* ============================
CẬP NHẬT THÔNG TIN
=============================== */
function updatePostsInfo() {
	const infoEl = document.getElementById('posts-info');
	if (!infoEl) return;
	
	const { current_page: p, per_page, total } = paginationState;
	if (total === 0) {
		infoEl.textContent = '';
		return;
	}
	
	const start = (p - 1) * per_page + 1;
	const end = Math.min(p * per_page, total);
	infoEl.textContent = `Hiển thị ${start}-${end} / ${total} bài viết`;
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
TÌM KIẾM BÀI VIẾT
=============================== */
window.searchPosts = function() {
	const searchInput = document.getElementById('search-input');
	filterState.search = searchInput ? searchInput.value : '';
	
	// Reset về trang 1 khi tìm kiếm
	paginationState.current_page = 1;
	
	// Nếu đã có dữ liệu, chỉ cần lọc lại
	if (allPosts.length > 0) {
		applyFiltersAndPagination();
	} else {
		getPostData();
	}
};

/* ============================
INIT
=============================== */
document.addEventListener("DOMContentLoaded", () => {
	getPostData();
	loadCategories();
	
	// Event listener cho category filter
	const categorySelect = document.getElementById('post-category');
	if (categorySelect) {
		categorySelect.addEventListener('change', function() {
			filterState.category = this.value;
			paginationState.current_page = 1;
			if (allPosts.length > 0) {
				applyFiltersAndPagination();
			}
		});
	}
	
	// Event listener cho date filters
	const dateFromInput = document.getElementById('filter-date-from');
	const dateToInput = document.getElementById('filter-date-to');
	
	if (dateFromInput) {
		dateFromInput.addEventListener('change', function() {
			filterState.date_from = this.value;
			paginationState.current_page = 1;
			if (allPosts.length > 0) {
				applyFiltersAndPagination();
			}
		});
	}
	
	if (dateToInput) {
		dateToInput.addEventListener('change', function() {
			filterState.date_to = this.value;
			paginationState.current_page = 1;
			if (allPosts.length > 0) {
				applyFiltersAndPagination();
			}
		});
	}
	
	// Enter key để search
	const searchInput = document.getElementById('search-input');
	if (searchInput) {
		searchInput.addEventListener('keypress', function(e) {
			if (e.key === 'Enter') {
				searchPosts();
			}
		});
	}
});

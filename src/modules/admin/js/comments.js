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
// dom el
const TableBody = document.getElementById('commentsTableBody')


// để dễ dùng, và lấy tên user và tên sản phẩm
let allCommentsData = [];
let allCommentsDataFull = []; // Lưu tất cả để lọc phía client
let userNameCache = {};

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
	rating: { min: 0, max: 5 },
	status: '2' // '2' = tất cả, '1' = hiển thị, '0' = ẩn
};


// filter funciton==============================================================
const reviewsTableBody = document.getElementById('commentsTableBody');

window.updateCommentsList = function(commentsToRender) {
    if (!reviewsTableBody ) return;

    if (!commentsToRender || commentsToRender.length === 0) {
        reviewsTableBody.innerHTML = `
        <tr>
            <td colspan="9" class="text-center py-4 text-muted">
            <i class="ti ti-folder-off fs-1 d-block mb-2"></i>
            Không có bình luận nào khớp với tiêu chí tìm kiếm/lọc
            </td>
        </tr>
        `;
        return;
    }

    reviewsTableBody.innerHTML = commentsToRender
        .map(
            (comment, index) => {
                // Lấy trạng thái cho nút Ẩn/Hiện
                const isVisible = comment.status == 1;
                
                return `
                <tr>
                    <td>${index + 1}</td>
                    <td class="d-flex flex-column">
                        <span class="fw-semibold">${escapeHtml(comment.user_name)}</span>
                        <span class="fw-semibold" style="color:rgba(42, 53, 71, 0.6);">${escapeHtml(comment.user_email)}</span>
                    </td>
                    <td>
                        <code>${escapeHtml(comment.product_name)}</code>
                    </td>
                    <td>${escapeHtml(comment.content)}</td>
                    <td>
                        <div class="d-flex flex-row align-items-center gap-1 h-100">
                            <span>${comment.rating}</span>
                            <span class="d-flex flex-row align-items-center justify-center">⭐</span>
                        </div>
                    </td>
                    <td class="d-flex flex-column">
                        <span class="fw-semibold">${getAdminNameFromCache(comment.admin_id)}</span>
                        <span class="fw-semibold" style="color:rgba(42, 53, 71, 0.6);">
                            ${comment.reply == undefined || comment.reply == null ? "<span>chưa có câu trả lời</span>" : escapeHtml(comment.reply)}
                        </span>
                    </td>
                    <td>
                        <span class="badge ${isVisible
                            ? "bg-success-subtle text-success"
                            : "bg-danger-subtle text-danger"
                        }">
                            ${isVisible ? "Hiển thị" : "Ẩn"}
                        </span>
                    </td>
                    <td>${formatDate(comment.created_at)}</td>
                    <td>
                        <div class="dropdown">
                            <a
                                class="fs-6 text-muted"
                                href="javascript:void(0)"
                                role="button"
                                id="product-actions-${comment.id}"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                            >
                                <i class="ti ti-dots-vertical"></i>
                            </a>
                            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="product-actions-${comment.id}">
                                <li>
                                    <button
                                        class="dropdown-item"
                                        title="Xem Chi Tiết"
                                        onclick="handleViewDetails(${comment.id})"
                                    >
                                        <i class="ti ti-eye me-2"></i>Chi tiết
                                    </button>
                                </li>
                                <li>
                                    <button class="dropdown-item" title="Trả lời" onclick="handleReply(${comment.id})">
                                        <i class="ti ti-message-dots me-2"></i>Trả lời
                                    </button>
                                </li>
                                <li>
                                    <button 
                                        class="dropdown-item" 
                                        title="Ẩn hoặc hiển thị" 
                                        onclick="handleToggleStatus(${comment.id})">
                                        <i class="ti ${isVisible ? "ti-eye-off" : "ti-eye"} me-2"></i>${isVisible ? "Ẩn" : "Hiện"}
                                    </button>
                                </li>
                                <li>
                                    <button
                                        class="dropdown-item text-danger"
                                        href="javascript:void(0)"
                                        title="Xóa Vĩnh Viễn"
                                        onclick="handleDeleteComment(${comment.id})"
                                    >
                                        <i class="ti ti-trash me-2"></i>Xóa
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </td>
                </tr>
            `
            }
        )
        .join("");
};


const searchCommentsByContentLogic = (commentsArray, keyword) => {
    const normalizedKeyword = keyword.toLowerCase().trim();
    if (!normalizedKeyword) {
        return commentsArray; 
    }
    const searchResults = commentsArray.filter(comment => {
        const adminName = comment.admin_id ? userNameCache[comment.admin_id] : '';
        const searchableText = [
            comment.content,            
            comment.product_name,       
            comment.user_name,          
            adminName                  
        ].map(s => (s || '').toLowerCase()).join(' | ');
        return searchableText.includes(normalizedKeyword);
    });
    return searchResults;
};

const filterCommentsByStatus = (commentsArray, statusFilter) => {
    const status = parseInt(statusFilter);

    if (status === 2) {
        return commentsArray;
    }

    return commentsArray.filter(comment => {
        return parseInt(comment.status) === status;
    });
};

const getCurrentStatusFilter = () => {
    const activeItem = document.querySelector('#status-filter-list li.active');
    return activeItem ? activeItem.getAttribute('data-status') : '2'; 
};


// todo: tìm kiếm theo nội dung của comment
window.searchCommentsByContent = function() {
    const searchInput = document.getElementById('search-input');
    filterState.search = searchInput ? searchInput.value : '';
    
    // Reset về trang 1 khi tìm kiếm
    paginationState.current_page = 1;
    
    // Nếu đã có dữ liệu, chỉ cần lọc lại
    if (allCommentsDataFull.length > 0) {
        applyFiltersAndPagination();
    } else {
        fetchAllComments();
    }
};

//todo: tìm kiếm theo sao
const filterCommentsByRating = (commentsArray, minRating, maxRating) => {
	if (minRating > maxRating) {
		[minRating, maxRating] = [maxRating, minRating];
	}
	const filteredComments = commentsArray.filter(comment => {
		const rating = comment.rating;
		return rating >= minRating && rating <= maxRating;
	});
	return filteredComments;
};

//todo: handle tìm kiếm
window.handleStarFilter = (element) => {
    const minRating = parseInt(element.getAttribute('data-min-rating')) || 0;
    const maxRating = parseInt(element.getAttribute('data-max-rating')) || 5;
    
    filterState.rating = { min: minRating, max: maxRating };
    
    // Reset về trang 1 khi filter
    paginationState.current_page = 1;
    
    // Nếu đã có dữ liệu, chỉ cần lọc lại
    if (allCommentsDataFull.length > 0) {
        applyFiltersAndPagination();
    } else {
        fetchAllComments();
    }
};


window.handleStarFilterAndClose = (element) => {
    const label = element.textContent.trim();
    document.getElementById('current-filter-label').textContent = label;
    element.closest('.rating-filter-list').querySelectorAll('.dropdown-item').forEach(li => {
        li.classList.remove('active');
    });
    element.classList.add('active');
    const minRating = element.getAttribute('data-min-rating');
    const maxRating = element.getAttribute('data-max-rating');
    window.handleStarFilter(element);
};




window.handleStatusFilterAndRender = (element) => {
    const listItems = element.closest('#status-filter-list').querySelectorAll('li');
    listItems.forEach(li => { li.classList.remove('active'); });
    element.classList.add('active');
    const label = element.textContent.replace(/(\(|\)|✅|❌|⭐)/g, '').trim();
    document.getElementById('current-status-label').textContent = label;
    
    const status = element.getAttribute('data-status') || '2';
    filterState.status = status;
    
    // Reset về trang 1 khi filter
    paginationState.current_page = 1;
    
    // Nếu đã có dữ liệu, chỉ cần lọc lại
    if (allCommentsDataFull.length > 0) {
        applyFiltersAndPagination();
    } else {
        fetchAllComments();
    }
};




// html layout render=======================================================
function renderTable() {
	if (!TableBody) return;

	if (!allCommentsData || allCommentsData.length === 0) {
		TableBody.innerHTML = `
		<tr>
			<td colspan="9" class="text-center py-4 text-muted">
			<i class="ti ti-folder-off fs-1 d-block mb-2"></i>
			Chưa có bình luận nào
			</td>
		</tr>
		`;
		return;
	}

	// Tính STT dựa trên trang hiện tại
	const startIndex = (paginationState.current_page - 1) * paginationState.per_page;

	TableBody.innerHTML = allCommentsData
		.map(
			(comment, index) => `
		<tr>
		<td>${startIndex + index + 1}</td>
		<td class="d-flex flex-column">
			<span class="fw-semibold">${escapeHtml(comment.user_name)}</span>
			<span class="fw-semibold" style="color:rgba(42, 53, 71, 0.6);">${escapeHtml(comment.user_email)}</span>
		</td>
		<td>
			<code>${escapeHtml(comment.product_name)}</code>
		</td>
		<td>${comment.content}</td>
		<td>
			<div  class="d-flex flex-row align-items-center gap-1 h-100">
				<span>${comment.rating}</span>
				<span class="d-flex flex-row align-items-center justify-center">⭐</span>
			</div>
		</td>
		<td class="d-flex flex-column">
			<span class="fw-semibold">${getAdminNameFromCache(comment.admin_id)}</span>
			<span class="fw-semibold" style="color:rgba(42, 53, 71, 0.6);">${comment.reply == undefined || comment.reply == null ? "<span>chưa có câu trả lời</span>" : comment.reply}</span>
		</td>
		<td>
			<span class="badge ${comment.status == 1
					? "bg-success-subtle text-success"
					: "bg-danger-subtle text-danger"
				}">
				${comment.status == 1 ? "Hiển thị" : "Ẩn"}
			</span>
		</td>
		<td>${formatDate(comment.created_at)}</td>
		<td>
			<div class="dropdown">
				<a
					class="fs-6 text-muted"
					href="javascript:void(0)"
					role="button"
					id="product-actions-${comment.id}"
					data-bs-toggle="dropdown"
					aria-expanded="false"
				>
					<i class="ti ti-dots-vertical"></i>
				</a>
				<ul class="dropdown-menu dropdown-menu-end" aria-labelledby="product-actions-${comment.id}">
					<li>
						<button
							class="dropdown-item"
							title="Xem Chi Tiết"
							onclick="handleViewDetails(${comment.id})"

						>
							<i class="ti ti-eye me-2"></i>Chi tiết
						</button>
					</li>
					<li>
						<button class="dropdown-item" title="Trả lời" onclick="handleReply(${comment.id})">
							<i class="ti ti-message-dots me-2"></i>Trả lời
						</button>
						
					</li>
					<li>
						<button 
							class="dropdown-item" 
							title="Ẩn hoặc hiển thị" 
							onclick="handleToggleStatus(${comment.id})">
							<i class="ti ${comment.status == 1 ? "ti-eye-off" : "ti-eye"}  me-2"></i>${comment.status == 1 ? "Ẩn" : "Hiện"}
						</button>
					</li>
					<li>
						<button
							class="dropdown-item text-danger"
							href="javascript:void(0)"
							title="Xóa Vĩnh Viễn"
							onclick="handleDeleteComment(${comment.id})"
						>
							<i class="ti ti-trash me-2"></i>Xóa
						</button>
					</li>
				</ul>
			</div>
		</td>
		</tr>
	`
		)
		.join("");
}


// call api ========================================================================================
const getAdminNameFromCache = (adminId) => {
	if (adminId === null || adminId === undefined) {
		return "nobody";
	}
	return userNameCache[parseInt(adminId)] || `Admin ID ${adminId}`;
};


const getUserNameById = async (userId) => {
	console.log(userId)
	if (!userId || typeof userId !== 'number' || userId <= 0) {
		console.error("ID người dùng không hợp lệ.");
		return null;
	}

	try {
		const response = await api.get(`/user/${userId}`);
		console.log(response)
		if (response && response.data && response.data.data.fullname) {
			return response.data.data.fullname;
		} else {

			console.warn(`Không tìm thấy tên người dùng cho ID: ${userId}`);
			return null;
		}

	} catch (error) {
		console.error(`Lỗi khi gọi API lấy tên người dùng ID ${userId}:`, error);
		return null;
	}
};





const fetchAllComments = async (page = 1, limit = 1000) => {
	try {
		// Fetch tất cả để lọc phía client
		const response = await api.get(`/reviews?page=1&limit=${limit}`);

		if (response && response.data && response.data.data) {
			const data = response.data.data;
			
			// Lưu tất cả dữ liệu để lọc phía client
			allCommentsDataFull = data.data || data.reviews || [];
			
			// Lấy tên admin
			const adminIds = [...new Set(allCommentsDataFull
				.map(c => c.admin_id)
				.filter(id => id !== null && id !== undefined)
				.map(id => parseInt(id))
			)];
			const fetchPromises = adminIds.map(async id => {
				const name = await getUserNameById(id);
				if (name) {
					userNameCache[id] = name;
				}
			});
			await Promise.all(fetchPromises);
			console.log("Cache tên Admin đã sẵn sàng:", userNameCache);
			
			// Áp dụng filter và phân trang
			applyFiltersAndPagination();
		} else {
			console.error("Cấu trúc phản hồi API không đúng hoặc không có dữ liệu.");
		}
	} catch (error) {
		console.error("Lỗi khi tải dữ liệu bình luận từ API:", error);
	}
};

// Áp dụng filter và phân trang phía client
const applyFiltersAndPagination = () => {
	let filtered = [...allCommentsDataFull];
	
	// Lọc theo search
	if (filterState.search) {
		const searchLower = filterState.search.toLowerCase().trim();
		filtered = filtered.filter(comment => {
			const adminName = comment.admin_id ? userNameCache[comment.admin_id] : '';
			const searchableText = [
				comment.content,
				comment.product_name,
				comment.user_name,
				adminName
			].map(s => (s || '').toLowerCase()).join(' | ');
			return searchableText.includes(searchLower);
		});
	}
	
	// Lọc theo rating
	if (filterState.rating.min > 0 || filterState.rating.max < 5) {
		filtered = filtered.filter(comment => {
			const rating = comment.rating;
			return rating >= filterState.rating.min && rating <= filterState.rating.max;
		});
	}
	
	// Lọc theo status
	const statusFilter = String(filterState.status);
	if (statusFilter !== '2') {
		filtered = filtered.filter(comment => {
			const commentStatus = String(comment.status || '');
			return commentStatus === statusFilter;
		});
	}
	
	// Cập nhật pagination state
	const total = filtered.length;
	const total_pages = Math.ceil(total / paginationState.per_page);
	paginationState.total = total;
	paginationState.total_pages = total_pages;
	
	// Phân trang
	const offset = (paginationState.current_page - 1) * paginationState.per_page;
	allCommentsData = filtered.slice(offset, offset + paginationState.per_page);
	
	renderTable();
	renderPagination();
};
fetchAllComments()




window.handleViewDetails = async (reviewId) => {
	const modal = new bootstrap.Modal(document.getElementById('commentDetailsModal'));
	modal.show();
	const loadingSpinner = document.getElementById('loading-spinner');
	const detailsContent = document.getElementById('comment-details-content');
	document.getElementById('detail-id').textContent = reviewId;
	detailsContent.style.display = 'none';
	loadingSpinner.style.display = 'block';

	try {
		const response = await api.get(`/reviews/${reviewId}`);
		const data = response.data.data;
		console.log(data)
		if (data) {
			document.getElementById('detail-review-id').textContent = data.id;
			document.getElementById('detail-product-name').textContent = data.product_name;
			
			// Thêm link sản phẩm
			const productLinkElement = document.getElementById('detail-product-link');
			if (data.product_id) {
				const productUrl = `/src/pages/client/product-detail.html?id=${data.product_id}`;
				productLinkElement.innerHTML = `
					<a href="${productUrl}" target="_blank" class="text-primary text-decoration-none">
						<i class="ti ti-external-link me-1"></i>
						Xem sản phẩm
					</a>
					<span class="text-muted ms-2">(ID: ${data.product_id})</span>
				`;
			} else {
				productLinkElement.textContent = 'Không có ID sản phẩm';
			}
			
			document.getElementById('detail-user-name').textContent = data.user_name;
			document.getElementById('detail-user-email').textContent = data.user_email;
			document.getElementById('detail-rating').innerHTML = '⭐'.repeat(data.rating);
			document.getElementById('detail-content').textContent = data.content;
			document.getElementById('detail-created-at').textContent = new Date(data.created_at).toLocaleString('vi-VN');
			document.getElementById('detail-admin-reply').textContent = data.reply || "Chưa có phản hồi.";
			document.getElementById('detail-admin-name').textContent = getAdminNameFromCache(data.admin_id);
			loadingSpinner.style.display = 'none';
			detailsContent.style.display = 'block';
		} else {
			document.getElementById('detail-content').textContent = "Không tìm thấy dữ liệu chi tiết.";
		}

	} catch (error) {
		console.error("Lỗi khi tải chi tiết bình luận:", error);
		loadingSpinner.style.display = 'none';
		detailsContent.style.display = 'block';
		document.getElementById('detail-content').textContent = "Đã xảy ra lỗi khi tải dữ liệu.";
	}
};






const getAdminIdFromLocalStorage = () => {
	try {
		const admin = JSON.parse(localStorage.getItem("user"));
		const adminId = admin.id;

		if (adminId) {
			return parseInt(adminId);
		}
	} catch (e) {
		console.error("Lỗi khi đọc Local Storage:", e);
	}
	return null;
};





window.handleReply = (reviewId) => {
	document.getElementById('reply-review-id-display').textContent = reviewId;
	document.getElementById('reply-review-id').value = reviewId;
	document.getElementById('reply-content').value = '';
	document.getElementById('reply-error-alert').style.display = 'none';
	document.getElementById('reply-status-check').checked = true;

	const modal = new bootstrap.Modal(document.getElementById('replyModal'));
	modal.show();
};



window.submitAdminReply = async () => {
	const reviewId = document.getElementById('reply-review-id').value;
	const replyContent = document.getElementById('reply-content').value.trim();
	const status = document.getElementById('reply-status-check').checked ? 1 : 0;
	const adminId = getAdminIdFromLocalStorage();
	if (!replyContent) {
		document.getElementById('reply-error-alert').textContent = 'Nội dung trả lời không được để trống.';
		document.getElementById('reply-error-alert').style.display = 'block';
		return;
	}
	if (!adminId) {
		document.getElementById('reply-error-alert').textContent = 'Lỗi: Không tìm thấy ID quản trị viên trong Local Storage.';
		document.getElementById('reply-error-alert').style.display = 'block';
		return;
	}

	const submitBtn = document.getElementById('submitReplyBtn');
	const spinner = document.getElementById('reply-spinner');
	submitBtn.disabled = true;
	spinner.style.display = 'inline-block';
	document.getElementById('reply-error-alert').style.display = 'none';

	try {
		const payload = {
			admin_id: adminId,
			reply_content: replyContent,
			status: status
		};

		const response = await api.post(`/reviews/reply/${reviewId}`, payload);

		if (response.data.status === 'success') {
			Toast.fire({
				icon: "success",
				title: "Đã gửi câu trả lời!",
			});
			const modalInstance = bootstrap.Modal.getInstance(document.getElementById('replyModal'));
			modalInstance.hide();
			await fetchAllComments();
		} else {
			document.getElementById('reply-error-alert').textContent = 'Lỗi API: Không thể gửi trả lời.';
			document.getElementById('reply-error-alert').style.display = 'block';
		}

	} catch (error) {
		console.error('Lỗi khi gửi trả lời:', error);
		document.getElementById('reply-error-alert').textContent = 'Lỗi hệ thống hoặc kết nối.';
		document.getElementById('reply-error-alert').style.display = 'block';

	} finally {
		submitBtn.disabled = false;
		spinner.style.display = 'none';
	}
};



window.handleToggleStatus = async (reviewId) => {
    const currentAdminId = getAdminIdFromLocalStorage();
    if (!currentAdminId) {
        alert('Lỗi: Không tìm thấy ID quản trị viên trong Local Storage.');
        return;
    }
    let currentCommentData;
    try {
        const detailResponse = await api.get(`/reviews/${reviewId}`);
        currentCommentData = detailResponse.data.data;
        
        if (!currentCommentData) {
            alert('Lỗi: Không tìm thấy dữ liệu chi tiết bình luận.');
            return;
        }
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu bình luận cũ:', error);
        alert('Lỗi: Không tải được dữ liệu cũ của bình luận để xác định trạng thái.');
        return;
    }

    const currentStatus = parseInt(currentCommentData.status);
    const newStatus = currentStatus === 1 ? 0 : 1;
    const actionText = newStatus === 1 ? 'HIỂN THỊ' : 'ẨN';
    const actionColor = newStatus === 1 ? '#28a745' : '#ffc107';
    Swal.fire({
        title: `Xác nhận ${actionText}?`,
        html: `Bạn có chắc muốn chuyển trạng thái bình luận **#${reviewId}** sang **${actionText}**?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: actionColor, 
        cancelButtonColor: "#3085d6",
        confirmButtonText: actionText,
        cancelButtonText: "Hủy",
    }).then(async (result) => { 
        
        if (result.isConfirmed) {
            try {
                const oldReplyContent = currentCommentData.reply || '';
                const payload = {
                    admin_id: currentAdminId,
                    reply_content: oldReplyContent, 
                    status: newStatus              
                };
                const updateResponse = await api.post(`/reviews/reply/${reviewId}`, payload);
                if (updateResponse.data.status === 'success') {
                    Swal.fire({
                        title: "Thành công!",
                        text: `Bình luận #${reviewId} đã được chuyển sang trạng thái ${actionText}.`,
                        icon: "success",
                        confirmButtonColor: "#3085d6",
                    });
                    await fetchAllComments(); 
                } else {
                    Swal.fire('Lỗi API!', 'Không thể cập nhật trạng thái.', 'error');
                }
            } catch (error) {
                console.error('Lỗi khi cập nhật trạng thái:', error);
                Swal.fire('Lỗi hệ thống!', 'Đã xảy ra lỗi kết nối.', 'error');
            }
        }
    });
};



window.handleDeleteComment = (reviewId) => {
    Swal.fire({
        title: "Xác nhận XÓA?",
        html: `Bạn có chắc muốn **xóa vĩnh viễn** bình luận có ID <strong>#${reviewId}</strong>? Thao tác này không thể hoàn tác!`,
        icon: "error", 
        showCancelButton: true,
        confirmButtonColor: "#d33", 
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Xóa Vĩnh Viễn",
        cancelButtonText: "Hủy",
    }).then(async (result) => { 
        if (result.isConfirmed) {
            try {
                const response = await api.delete(`/reviews/${reviewId}`);
                if (response.status === 200 || response.status === 204 || (response.data && response.data.status === 'success')) {
                    Toast.fire({
						icon: "success",
						title: "Đã XÓA bình luận!",
					});
                    await fetchAllComments(); 
                } else {
                    Swal.fire('Lỗi API!', 'Không thể xóa bình luận.', 'error');
                }
            } catch (error) {
                console.error(`Lỗi khi xóa bình luận #${reviewId}:`, error);
                Swal.fire('Lỗi hệ thống!', 'Đã xảy ra lỗi kết nối hoặc bình luận không tồn tại.', 'error');
            }
        }
    });
};




let globalStats = {
    totalReviews: 0,
    totalRatingSum: 0,
    distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
};


const fetchReviewStats = async () => {
    // 1. Reset thống kê toàn cục
    globalStats = {
        totalReviews: 0,
        totalRatingSum: 0,
        distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
    };
    
    if (allCommentsData.length === 0) {
        // Nếu không có bình luận nào, render với số liệu 0
        renderAggregatedStats();
        return; 
    }

    // 2. Thu thập các Product ID duy nhất từ dữ liệu bình luận
    const productIds = [...new Set(allCommentsDataFull
        .map(c => c.product_id)
        .filter(id => id !== null && id !== undefined)
    )];

    if (productIds.length === 0) {
        renderAggregatedStats();
        return; 
    }

    console.log(`Tìm thấy ${productIds.length} sản phẩm cần thống kê.`);

    // 3. Tạo Promises để gọi API stats cho TẤT CẢ các sản phẩm
    const statPromises = productIds.map(async (productId) => {
        try {
            const response = await api.get(`/reviews/stats/${productId}`);
            const stats = response.data.data;
            return stats;
        } catch (error) {
            console.error(`Lỗi khi tải thống kê cho Product ID ${productId}:`, error);
            return null; // Trả về null để Promise.all không bị dừng
        }
    });

    // 4. Chờ tất cả API hoàn thành
    const results = await Promise.all(statPromises);

    // 5. Tổng hợp (Aggregation) kết quả
    results.forEach(stats => {
        if (stats && stats.total_reviews > 0) {
            
            // a) Tổng số bình luận
            globalStats.totalReviews += stats.total_reviews;
            
            // b) Tổng điểm đánh giá (Total Rating Sum)
            // Tính lại tổng điểm: total_reviews * average_rating
            globalStats.totalRatingSum += stats.total_reviews * stats.average_rating;
            
            // c) Phân phối (Distribution)
            for (const rating in stats.rating_distribution) {
                const count = stats.rating_distribution[rating];
                if (count) {
                    globalStats.distribution[rating] += count;
                }
            }
        }
    });

    // 6. Tính toán và Render thống kê tổng hợp
    renderAggregatedStats();
};

const renderDistribution = (distribution, totalReviews) => {
    const container = document.getElementById('stats-distribution');
    container.innerHTML = '';
    const ratings = ['5', '4', '3', '2', '1'];

    ratings.forEach(rating => {
        const count = distribution[rating] || 0;
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
        
        const item = document.createElement('div');
        item.className = 'd-flex align-items-center mb-1 w-100';
        item.innerHTML = `
            <span class="fw-semibold me-2">${rating} ⭐:</span>
            <div class="progress w-50 me-2" style="height: 10px;">
                <div 
                    class="progress-bar" 
                    role="progressbar" 
                    style="width: ${percentage.toFixed(0)}%; background-color: #0d6efd;" 
                    aria-valuenow="${percentage.toFixed(0)}" 
                    aria-valuemin="0" 
                    aria-valuemax="100">
                </div>
            </div>
            <span class="text-muted small">${count} (${percentage.toFixed(0)}%)</span>
        `;
        container.appendChild(item);
    });
};


const renderAggregatedStats = () => {
    
    const avgRating = globalStats.totalReviews > 0
        ? (globalStats.totalRatingSum / globalStats.totalReviews)
        : 0;
    document.getElementById('stats-total-reviews').textContent = globalStats.totalReviews.toLocaleString();
    document.getElementById('stats-average-rating').innerHTML = `${avgRating.toFixed(1)} <i class="fa-solid fa-star-filled text-warning"></i>`;
    const totalProductsReviewed = [...new Set(allCommentsDataFull.map(c => c.product_id))].length;
    document.getElementById('stats-total-products').innerHTML = `<i class="ti ti-package me-1"></i><span>${totalProductsReviewed} Sản phẩm</span> đã được đánh giá`;
    const repliedCount = allCommentsDataFull.filter(c => c.reply !== null).length; 
    const repliedRate = globalStats.totalReviews > 0 ? (repliedCount / globalStats.totalReviews) * 100 : 0;
    document.getElementById('stats-total-replied').textContent = repliedCount.toLocaleString();
    document.getElementById('stat-replied-rate').innerHTML = `<i class="ti ti-check me-1"></i><span>${repliedRate.toFixed(1)}%</span> Tỷ lệ phản hồi`;
    renderDistribution(globalStats.distribution, globalStats.totalReviews);
};


// Render phân trang
const renderPagination = () => {
	const paginationEl = document.getElementById('comments-pagination');
	const infoEl = document.getElementById('comments-info');
	
	if (!paginationEl) return;
	
	const { current_page: p, total_pages: t, per_page, total } = paginationState;
	
	// Hiển thị thông tin
	if (infoEl) {
		if (total === 0) {
			infoEl.textContent = '';
		} else {
			const start = (p - 1) * per_page + 1;
			const end = Math.min(p * per_page, total);
			infoEl.textContent = `Hiển thị ${start}-${end} / ${total} bình luận`;
		}
	}
	
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
};

// Xử lý click phân trang
const handlePaginationClick = (e) => {
	const link = e.target.closest('[data-page]');
	if (!link) return;
	
	e.preventDefault();
	const page = parseInt(link.dataset.page);
	if (page > 0 && page <= paginationState.total_pages) {
		paginationState.current_page = page;
		applyFiltersAndPagination();
	}
};

const initializeCommentsManager = async () => {
    await fetchAllComments(1, 10); 
    await fetchReviewStats(); 
    document.addEventListener('DOMContentLoaded', () => {
        const defaultFilter = document.querySelector('#rating-filter-stars li[data-min-rating="0"]');
        if (defaultFilter) {
            window.handleStarFilter(defaultFilter);
        }
    });
};

initializeCommentsManager()




//utils========================================================
function escapeHtml(text) {
	if (!text) return "";
	const div = document.createElement("div");
	div.textContent = text;
	return div.innerHTML;
}


/**
 * Format ngày tháng
 */
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

window.confirmChangeStatus = function (id, name) {
	
};

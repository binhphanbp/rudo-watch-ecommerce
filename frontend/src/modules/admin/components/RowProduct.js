import { formatCurrency } from '../../../shared/utils/format.js';
import { getImageUrl } from '../../../shared/services/api.js';

// Hàm helper để lấy status text
function getStatus(statusNumber) {
	if (statusNumber === 0) {
		return "Hết hàng";
	} else {
		return "Còn hàng";
	}
}

export function productRow(product) {
	let displayPrice = 0;
	let originalPrice = 0; // Giá gốc (nếu có giảm giá)

	if (
		product.variants &&
		Array.isArray(product.variants) &&
		product.variants.length > 0
	) {
		const prices = product.variants.map((v) => Number(v.price));
		displayPrice = Math.min(...prices);
	}
	else {
		displayPrice = Number(product.price_sale || product.price || 0);
		if (
			product.price_sale &&
			Number(product.price) > Number(product.price_sale)
		) {
			originalPrice = Number(product.price);
		}
	}

	// Xử lý ảnh
	const imageUrl = getImageUrl(product.image);

	// Xử lý category name (từ API mới có brand_name và category_name)
	const categoryName = product.category_name || product.category?.name || 'Chưa phân loại';

	// Xử lý created_at
	const createdDate = product.created_at
		? new Date(product.created_at).toLocaleDateString('vi-VN', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		})
		: 'N/A';

	// Xử lý status
	const statusClass = product.status === 0
		? 'text-bg-danger'
		: 'text-bg-success';
	const statusText = getStatus(product.status);

	// RENDER HTML
	return `
	<tr>
		<td>
			<div class="form-check mb-0">
				<input
					class="form-check-input"
					type="checkbox"
					value=""
					id="flexCheckDefault-${product.id || Math.random()}"
				/>
			</div>
		</td>
		<td>
			<div class="d-flex align-items-center">
				<img
					src="${imageUrl}"
					class="rounded-circle"
					alt="${product.name || 'Product'}"
					width="56"
					height="56"
					onerror="this.src='https://placehold.co/600x600?text=No+Image'"
				/>
				<div class="ms-3">
					<h6 class="mb-0 fs-4">${product.name || 'N/A'}</h6>
					<p class="mb-0">${categoryName}</p>
				</div>
			</div>
		</td>
		<td>
			<p class="mb-0">${createdDate}</p>
		</td>
		<td>
			<div class="d-flex align-items-center">
				<span
					class="${statusClass} p-1 rounded-circle"
				></span>
				<p class="mb-0 ms-2">${statusText}</p>
			</div>
		</td>
		<td>
			<h6 class="mb-0 fs-4">${formatCurrency(displayPrice)}</h6>
		</td>
		<td>
			<div class="dropdown">
				<a
					class="fs-6 text-muted"
					href="javascript:void(0)"
					role="button"
					id="product-actions-${product.id}"
					data-bs-toggle="dropdown"
					aria-expanded="false"
				>
					<i class="ti ti-dots-vertical"></i>
				</a>
				<ul class="dropdown-menu dropdown-menu-end" aria-labelledby="product-actions-${product.id}">
					<li>
						<a
							class="dropdown-item"
							href="/src/pages/admin/product-edit.html?id=${product.id}"
						>
							<i class="ti ti-edit me-2"></i>Chỉnh sửa
						</a>
					</li>
					<li>
						<a
							class="dropdown-item text-danger"
							href="javascript:void(0)"
							onclick="deleteProduct(${product.id})"
						>
							<i class="ti ti-trash me-2"></i>Xóa
						</a>
					</li>
				</ul>
			</div>
		</td>
	</tr>
    `;
}
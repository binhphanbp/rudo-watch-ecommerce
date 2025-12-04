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

	// 2. TÍNH PHẦN TRĂM GIẢM GIÁ
	let discountTag = '';
	if (originalPrice > displayPrice) {
		const percent = Math.round(
			((originalPrice - displayPrice) / originalPrice) * 100
		);
		if (percent > 0) {
			discountTag = `
            <span class="bg-[#EAD8B1] text-[#5A4010] text-xs font-bold px-2 py-1 rounded">
                -${percent}%
            </span>`;
		}
	}

	// 3. RENDER MÀU SẮC (Nếu có field colors)
	const colorDots =
		product.colors && Array.isArray(product.colors)
			? product.colors
				.map(
					(color) => `
        <span class="w-4 h-4 rounded-full border border-gray-200 dark:border-gray-600 cursor-pointer hover:scale-110 transition-transform" 
            style="background-color: ${color};" title="Màu sắc"></span>
    `
				)
				.join('')
			: '';

	// 4. XỬ LÝ ẢNH (Sử dụng getImageUrl helper)
	const imageUrl = getImageUrl(product.image);

	// 5. Xử lý category name (có thể là object hoặc string)
	const categoryName = product.category?.name || product.category_name || 'Chưa phân loại';

	// 6. Xử lý created_at (format date nếu cần)
	const createdDate = product.created_at
		? new Date(product.created_at).toLocaleDateString('vi-VN')
		: 'N/A';

	// 7. Xử lý status class (màu sắc)
	const statusClass = product.status === 0
		? 'text-bg-danger'
		: 'text-bg-success';
	const statusText = getStatus(product.status);

	// 8. RENDER HTML
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
			<a
				class="fs-6 text-muted"
				href="javascript:void(0)"
				data-bs-toggle="tooltip"
				data-bs-placement="top"
				data-bs-title="Edit"
			>
				<i class="ti ti-dots-vertical"></i>
			</a>
		</td>
	</tr>
    `;
}
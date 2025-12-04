// Component skeleton loading cho product list
export function productSkeletonRow(index = 0) {
	return `
	<tr class="skeleton-row" data-skeleton-index="${index}">
		<td>
			<div class="form-check mb-0">
				<div class="skeleton skeleton-checkbox"></div>
			</div>
		</td>
		<td>
			<div class="d-flex align-items-center">
				<div class="skeleton skeleton-image rounded-circle"></div>
				<div class="ms-3 flex-grow-1">
					<div class="skeleton skeleton-text skeleton-title mb-2"></div>
					<div class="skeleton skeleton-text skeleton-subtitle"></div>
				</div>
			</div>
		</td>
		<td>
			<div class="skeleton skeleton-text skeleton-date"></div>
		</td>
		<td>
			<div class="d-flex align-items-center">
				<div class="skeleton skeleton-dot rounded-circle me-2"></div>
				<div class="skeleton skeleton-text skeleton-status"></div>
			</div>
		</td>
		<td>
			<div class="skeleton skeleton-text skeleton-price"></div>
		</td>
		<td>
			<div class="skeleton skeleton-icon"></div>
		</td>
	</tr>
	`;
}

// Hàm tạo nhiều skeleton rows
export function productSkeletonRows(count = 5) {
	let html = '';
	for (let i = 0; i < count; i++) {
		html += productSkeletonRow(i);
	}
	return html;
}


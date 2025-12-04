import { productRow } from '../components/RowProduct.js';
import api, { getImageUrl } from '../../../shared/services/api.js';

console.log("load list products admin")

const productTableBody = document.getElementById('product-list-body');
if (!productTableBody) { console.log("khong thay product table") }
console.log(productTableBody);
const loadProductList = async () => {
	console.log("load product list function")
	try {
		const res = await api.get('/products');
		console.log('API Response:', res.data); // Debug xem data trả về gì

		let rawData = [];

		if (res.data && res.data.data && Array.isArray(res.data.data.data)) {
			rawData = res.data.data.data;
		} else if (res.data && Array.isArray(res.data.data)) {
			rawData = res.data.data;
		} else if (Array.isArray(res.data)) {
			rawData = res.data;
		}

		if (rawData.length === 0) {
			console.warn('Không tìm thấy sản phẩm nào trong API');
			if (productTableBody) {
				productTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Không có sản phẩm nào</td></tr>';
			}
			return;
		}

		//render rows
		let html = '';
		rawData.forEach(product => {
			html += productRow(product);
		});

		if (productTableBody) {
			productTableBody.innerHTML = html;
		} else {
			console.error('Không tìm thấy element product-list-body');
		}

	} catch (error) {
		console.error('Lỗi API Products:', error);
		if (productTableBody) {
			productTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Lỗi khi tải danh sách sản phẩm</td></tr>';
		}
	}
}

window.addEventListener('DOMContentLoaded', loadProductList);
export const PROMPT_DISCRIPTION_PRODUCT_WATCH = (productName, modelCode) => `
			Hãy viết một đoạn mô tả sản phẩm hấp dẫn và chuẩn SEO dựa trên thông tin sau:
			- Tên sản phẩm: ${productName}
			- Mã sản phẩm / Model: ${modelCode}

			Yêu cầu:
			1. Không viết chung chung, phải mô tả đúng sản phẩm theo tên.
			2. Viết theo giọng văn tự nhiên, thu hút, dễ đọc.
			3. Độ dài khoảng 80–150 từ.
			4. Không liệt kê dạng bullet, chỉ viết đoạn văn.
			5. Không thêm thông tin sai lệch.
			6. Trả về kết quả dưới dạng TEXT thuần, không JSON.
`
export const PROMPT_SPEC_WATCH = (name, modelCode) => `
			Bạn là chuyên gia đồng hồ. Hãy tạo thông số kỹ thuật CHUẨN cho sản phẩm dựa trên:

			Tên sản phẩm: "${name}"
			Mã sản phẩm / Model Code: "${modelCode}"

			Yêu cầu:
			1. Trả về DUY NHẤT một JSON.
			2. Không giải thích gì thêm.
			3. Nếu không tìm thấy thông tin chính xác từ dữ liệu thực tế thì hãy dự đoán hợp lý theo đúng phân khúc của sản phẩm.
			4. JSON phải đúng cấu trúc sau:

			{
				"size": "41mm",
				"brand": "IWC",
				"color": "Black",
				"model": "Mark XX",
				"weight": "155g",
				"material": "Thép không gỉ",
				"warranty": "24 tháng"
			}

			Trong đó:
			- "size": đường kính mặt
			- "brand": thương hiệu
			- "color": màu sắc chủ đạo
			- "model": tên model
			- "weight": trọng lượng
			- "material": chất liệu vỏ hoặc dây
			- "warranty": thời gian bảo hành

			Hãy điền đầy đủ thông tin vào JSON.
`;
export const PROMPT_VARIANTS_WATCH = (productName, modelCode, numVariants) => `
			Bạn là AI tạo dữ liệu variant cho sản phẩm đồng hồ.  
			Sản phẩm: ${productName}, Model: ${modelCode}.  
			Người dùng đã thêm ${numVariants} form variant. Hãy tạo ${numVariants} variant khác nhau.  
			Người dùng đã tạo ${numVariants} form variant trên UI.
			Hãy tạo **chính xác ${numVariants} variant**
			Mỗi variant JSON phải có các trường sau:
			- price: số (giá sản phẩm)
			- quantity: số (số lượng, VD: 10)
			- colors: chuỗi (màu sắc, VD: "Đen", "Bạc") *** màu phải dùng tiếng việt, chỉ một màu chính **** 
			- image: chuỗi (link ảnh, có thể để trống nếu không có)

			Yêu cầu:
			1. Trả về **một mảng JSON hợp lệ** với đúng ${numVariants} phần tử.
			2. Không thêm markdown, chú thích hay giải thích nào khác.
			3. Mỗi phần tử trong mảng là một object với các trường chính xác như trên.

			Ví dụ kết quả (nếu ${numVariants} = 2):
			[
			{
				"price": 12000,
				"quantity": 10,
				"colors": "Đen",
				"image": ""
			},
			{
				"price": 13000,
				"quantity": 5,
				"colors": "Bạc",
				"image": ""
			}
			]

`;

// Prompt để generate specs và variants cùng lúc với hình ảnh (có tra cứu thông tin)
export const PROMPT_SPECS_AND_VARIANTS_WITH_IMAGE = (productName, modelCode, brandName, categoryName, description, numVariants) => `
Bạn là chuyên gia đồng hồ với kiến thức sâu về các thương hiệu đồng hồ nổi tiếng.

QUAN TRỌNG: Trước khi tạo thông số và biến thể, bạn PHẢI:

1. TRA CỨU từ WEBSITE CHÍNH THỨC của thương hiệu TRƯỚC TIÊN:
   ${brandName ? `
   - Ưu tiên số 1: Truy cập/tra cứu website chính thức của thương hiệu "${brandName}"
   - Tìm kiếm model "${modelCode}" hoặc sản phẩm "${productName}" trên website chính thức
   - Lấy thông số kỹ thuật CHÍNH THỨC từ catalog/trang sản phẩm của nhà sản xuất
   - Xem các biến thể màu sắc được liệt kê chính thức trên website
   - Ghi nhận giá bán chính thức (nếu có)
   ` : ''}

2. NẾU KHÔNG TÌM THẤY trên website chính thức:
   - Tìm từ các trang bán hàng chính thức (authorized dealers) của thương hiệu
   - Tìm từ catalog, brochure chính thức
   - Tìm từ các nguồn đáng tin cậy khác

3. SỬ DỤNG KIẾN THỨC của bạn về:
   - Thông số kỹ thuật chính thức của sản phẩm này từ website chính thức
   - Các biến thể màu sắc có sẵn trên thị trường (ưu tiên từ website chính thức)
   - Giá bán tham khảo dựa trên thương hiệu và model
   - Đặc điểm thiết kế, kích thước, chất liệu chuẩn từ nguồn chính thức

4. THÔNG TIN TRA CỨU (nếu có ở phần dưới):
   - Sử dụng thông tin đã tra cứu từ website chính thức
   - Xác minh và so sánh với thông tin tra cứu

3. PHÂN TÍCH HÌNH ẢNH để:
   - Xác nhận thông tin từ hình ảnh thực tế
   - So sánh với thông tin tra cứu để đảm bảo tính chính xác
   - Xác định màu sắc, kích thước, chất liệu từ hình ảnh

4. NẾU KHÔNG CHẮC CHẮN về thông tin:
   - Ưu tiên thông tin từ hình ảnh
   - Sử dụng thông số phổ biến cho loại đồng hồ tương tự
   - Đảm bảo giá cả hợp lý với thương hiệu và đặc điểm

Sau khi tra cứu và phân tích, hãy tạo:

1. Thông số kỹ thuật (specifications) - PHẢI CHÍNH XÁC:
   - size: Kích thước mặt đồng hồ (vd: "41mm", "42mm")
   - brand: Tên thương hiệu (giữ nguyên như input hoặc chính xác hơn)
   - model: Tên model/collection (chính xác với sản phẩm)
   - weight: Trọng lượng (vd: "155g", "180g")
   - material: Chất liệu vỏ và dây đeo (vd: "Thép không gỉ", "Titan", "Vàng")
   - warranty: Thời gian bảo hành (vd: "24 tháng", "36 tháng")

2. ${numVariants} biến thể (variants) - DỰA TRÊN THỰC TẾ:
   - price: Giá bán hợp lý (VNĐ, số nguyên)
   - quantity: Số lượng tồn kho (số nguyên > 0)
   - colors: Màu sắc có sẵn trên thị trường (tiếng Việt)
   - image: "" (để trống)

YÊU CẦU OUTPUT:
- Trả về DUY NHẤT một JSON object hợp lệ:
{
	"specifications": {
		"size": "41mm",
		"brand": "${brandName || 'Thương hiệu'}",
		"model": "${modelCode || 'Model code'}",
		"weight": "155g",
		"material": "Thép không gỉ",
		"warranty": "24 tháng"
	},
	"variants": [
		{
			"price": 12000000,
			"quantity": 10,
			"colors": "Đen",
			"image": ""
		}
	]
}

QUY TẮC:
- Màu sắc dùng tiếng Việt: Đen, Trắng, Vàng, Bạc, Xanh Dương, Xanh Lá, Xám, Nâu, Đỏ, Hồng, Tím, Cam, Vàng Hồng, Bạch Kim, Thép không gỉ, Titan, Hợp kim, Đồng
- Giá phải hợp lý với thương hiệu: đồng hồ xa xỉ (Rolex, Omega, IWC...) từ 50-500 triệu, đồng hồ tầm trung (Seiko, Citizen...) từ 3-30 triệu, đồng hồ phổ thông từ 1-10 triệu
- Các biến thể phải khác nhau về màu sắc hoặc đặc điểm
- Không thêm markdown, chỉ trả về JSON thuần túy
`;
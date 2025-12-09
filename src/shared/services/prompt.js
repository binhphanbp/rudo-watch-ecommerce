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
			- size: chuỗi (kích thước, VD: "41mm", "42mm")
			- quantity: số (số lượng, VD: 10)
			- colors: chuỗi (màu sắc, VD: "Black", "Silver")
			- image: chuỗi (link ảnh, có thể để trống nếu không có)

			Yêu cầu:
			1. Trả về **một mảng JSON hợp lệ** với đúng {numVariants} phần tử.
			2. Không thêm markdown, chú thích hay giải thích nào khác.
			3. Mỗi phần tử trong mảng là một object với các trường chính xác như trên.

			Ví dụ kết quả (nếu {numVariants} = 2):
			[
			{
				"price": 12000,
				"size": "41mm",
				"quantity": 10,
				"colors": "Black",
				"image": "https://example.com/img1.jpg"
			},
			{
				"price": 13000,
				"size": "42mm",
				"quantity": 5,
				"colors": "Silver",
				"image": "https://example.com/img2.jpg"
			}
			]

`;
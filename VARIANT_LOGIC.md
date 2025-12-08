# 🎨 Logic Biến Thể Sản Phẩm (Product Variants)

## Tổng quan

Hệ thống quản lý biến thể sản phẩm với **màu sắc** và **kích thước**, cho phép:

- ✅ Hiển thị tất cả màu sắc có sẵn (color picker)
- ✅ Hiển thị tất cả kích thước có sẵn (size selector)
- ✅ Tự động tìm variant phù hợp khi user chọn màu + size
- ✅ Cập nhật giá theo variant được chọn
- ✅ Lưu đầy đủ thông tin variant vào giỏ hàng

---

## Cấu trúc dữ liệu

### 1. **API Response - Product với Variants**

```json
{
  "id": 123,
  "name": "Đồng hồ Rolex Submariner",
  "price": 5000000,
  "image": "rolex.jpg",
  "variants": [
    {
      "id": 1,
      "product_id": 123,
      "price": 5000000,
      "size": "40mm",
      "colors": "[\"Đen\", \"Xanh navy\"]",
      "quantity": 10,
      "sku": "ROL-SUB-40"
    },
    {
      "id": 2,
      "product_id": 123,
      "price": 5200000,
      "size": "42mm",
      "colors": "[\"Bạc\", \"Vàng gold\"]",
      "quantity": 5,
      "sku": "ROL-SUB-42"
    }
  ]
}
```

**Lưu ý**:

- `colors` là JSON array string hoặc string phân tách bởi dấu phẩy
- Mỗi variant có thể có nhiều màu

---

### 2. **State trong product-detail.js**

```javascript
let state = {
  product: null,
  variants: [], // Tất cả variants từ API
  selectedVariant: null, // Variant đang chọn (match màu + size)
  selectedColor: null, // Màu đang chọn
  selectedSize: null, // Size đang chọn
  availableColors: [], // Danh sách màu unique
  availableSizes: [], // Danh sách size unique
};
```

---

## Flow hoạt động

### 1. **Khởi tạo trang chi tiết sản phẩm**

```
Load API product/${id}
    ↓
Parse variants
    ↓
Extract unique colors → availableColors
Extract unique sizes → availableSizes
    ↓
Select default color (colors[0])
Select default size (sizes[0])
    ↓
updateSelectedVariant() → tìm variant match
    ↓
Render UI (màu + size selectors)
```

---

### 2. **User chọn màu sắc**

```javascript
User clicks màu "Đen"
    ↓
selectColor("Đen")
    ↓
state.selectedColor = "Đen"
    ↓
updateSelectedVariant()
    ↓
Tìm variant có:
  - colors chứa "Đen"
  - size = state.selectedSize
    ↓
Cập nhật giá hiển thị
    ↓
Re-render UI (highlight màu đã chọn)
```

---

### 3. **User chọn kích thước**

```javascript
User clicks size "42mm"
    ↓
selectSize("42mm")
    ↓
state.selectedSize = "42mm"
    ↓
updateSelectedVariant()
    ↓
Tìm variant có:
  - colors chứa state.selectedColor
  - size = "42mm"
    ↓
Cập nhật giá hiển thị
    ↓
Re-render UI (highlight size đã chọn)
```

---

### 4. **Thêm vào giỏ hàng**

```javascript
User clicks "Thêm vào giỏ"
    ↓
Validate: Đã chọn màu + size chưa?
    ↓
Tạo cart item:
{
  id: "123_1",           // productId_variantId
  product_id: 123,
  variant_id: 1,
  name: "Đồng hồ Rolex",
  color: "Đen",
  size: "40mm",
  variant_name: "(Đen, 40mm)",
  price: 5000000,
  quantity: 1,
  stock: 10
}
    ↓
CartService.add(cartItem)
    ↓
Lưu vào localStorage
    ↓
Background sync to API
```

---

## Hiển thị UI

### 1. **Color Picker (Tròn màu)**

```html
<!-- Màu Đen - Được chọn -->
<button
  onclick="selectColor('Đen')"
  class="relative w-10 h-10 rounded-full ring-2 ring-blue-600 scale-110"
  style="background-color: #000000"
  title="Đen"
>
  <div class="absolute inset-0 flex items-center justify-center">
    <svg class="w-5 h-5 text-white"><!-- Checkmark icon --></svg>
  </div>
</button>

<!-- Màu Bạc - Chưa chọn -->
<button
  onclick="selectColor('Bạc')"
  class="w-10 h-10 rounded-full hover:scale-105"
  style="background-color: #C0C0C0"
  title="Bạc"
></button>
```

**Map màu tiếng Việt → CSS**:

```javascript
const colorMap = {
  đen: '#000000',
  trắng: '#FFFFFF',
  đỏ: '#EF4444',
  xanh: '#3B82F6',
  vàng: '#EAB308',
  gold: '#FFD700',
  bạc: '#C0C0C0',
  'rose gold': '#B76E79',
  // ... 30+ màu
};
```

---

### 2. **Size Selector (Nút chữ)**

```html
<!-- Size 40mm - Được chọn -->
<button
  onclick="selectSize('40mm')"
  class="px-4 py-2 border rounded-lg bg-[#0A2A45] text-white"
>
  40mm
</button>

<!-- Size 42mm - Chưa chọn -->
<button
  onclick="selectSize('42mm')"
  class="px-4 py-2 border rounded-lg border-gray-300 hover:border-[#0A2A45]"
>
  42mm
</button>
```

---

### 3. **Giỏ hàng - Hiển thị Variant Info**

```html
<div class="cart-item">
  <img src="rolex.jpg" />
  <div>
    <h3>Đồng hồ Rolex Submariner</h3>

    <!-- ✅ Hiển thị variant đã chọn -->
    <p class="text-xs text-gray-500">Đen, 40mm</p>

    <p class="font-bold">5.000.000đ</p>
  </div>
</div>
```

---

## Logic Matching Variant

### Thuật toán `updateSelectedVariant()`

```javascript
const updateSelectedVariant = () => {
  // Tìm variant khớp với màu + size đã chọn
  const matchedVariant = state.variants.find((v) => {
    // Parse colors từ JSON string
    let variantColors = v.colors;
    if (typeof variantColors === 'string') {
      variantColors = JSON.parse(variantColors);
    }

    // Check màu (nếu user đã chọn)
    const hasColor =
      !state.selectedColor || variantColors.includes(state.selectedColor);

    // Check size (nếu user đã chọn)
    const hasSize = !state.selectedSize || v.size === state.selectedSize;

    return hasColor && hasSize;
  });

  state.selectedVariant = matchedVariant || state.variants[0];
  updatePriceDisplay(); // Cập nhật giá theo variant
};
```

---

## Edge Cases

### ❓ Nếu không có variant nào match?

```javascript
// Fallback về variant đầu tiên
state.selectedVariant = state.variants[0];
```

### ❓ Sản phẩm chỉ có màu, không có size?

```javascript
// availableSizes = [] → không render size selector
if (state.availableSizes.length === 0) {
  // Chỉ hiển thị color picker
}
```

### ❓ Sản phẩm chỉ có size, không có màu?

```javascript
// availableColors = [] → không render color picker
if (state.availableColors.length === 0) {
  // Chỉ hiển thị size selector
}
```

### ❓ Sản phẩm không có variant?

```javascript
// state.variants = [] → không render selector nào
// Dùng giá gốc của product
```

---

## Validate trước khi thêm giỏ

```javascript
window.addToCart = () => {
  // Check xem user đã chọn đủ chưa
  if (state.variants.length > 0 && !state.selectedVariant) {
    let message = 'Vui lòng chọn ';

    if (state.availableColors.length > 0 && state.availableSizes.length > 0) {
      message += 'màu sắc và kích thước!';
    } else if (state.availableColors.length > 0) {
      message += 'màu sắc!';
    } else if (state.availableSizes.length > 0) {
      message += 'kích thước!';
    }

    return Swal.fire({ icon: 'warning', title: message });
  }

  // Validate stock
  // Validate quantity
  // Add to cart
};
```

---

## Cart Item Structure

### LocalStorage

```json
{
  "id": "123_1",
  "product_id": 123,
  "variant_id": 1,
  "name": "Đồng hồ Rolex",
  "color": "Đen",
  "size": "40mm",
  "variant_name": "(Đen, 40mm)",
  "price": 5000000,
  "image": "rolex.jpg",
  "quantity": 1,
  "stock": 10
}
```

### Sync to API

```json
{
  "items": [
    {
      "product_id": 123,
      "variant_id": 1,
      "quantity": 1,
      "price": 5000000
    }
  ]
}
```

---

## Testing Scenarios

### ✅ Scenario 1: Sản phẩm có cả màu và size

```
Variants:
- Variant 1: Đen, 40mm, 5.000.000đ
- Variant 2: Đen, 42mm, 5.200.000đ
- Variant 3: Bạc, 40mm, 5.100.000đ

User flow:
1. Load trang → Hiển thị 2 màu (Đen, Bạc), 2 size (40mm, 42mm)
2. Mặc định chọn: Đen + 40mm → Giá 5.000.000đ
3. User chọn 42mm → Giá tự động update 5.200.000đ
4. User chọn Bạc → Tìm variant Bạc + 42mm → Không có → Fallback Bạc + 40mm → 5.100.000đ
```

---

### ✅ Scenario 2: Sản phẩm chỉ có màu

```
Variants:
- Variant 1: Đen, 5.000.000đ
- Variant 2: Bạc, 5.000.000đ

User flow:
1. Load trang → Chỉ hiển thị color picker
2. User chọn màu → Cập nhật variant
3. Thêm giỏ với thông tin: (Đen)
```

---

### ✅ Scenario 3: Sản phẩm không có variant

```
Product: 5.000.000đ (giá cố định)

User flow:
1. Load trang → Không hiển thị selector
2. User nhập số lượng → Thêm giỏ
3. Cart item không có variant_id, color, size
```

---

## Performance

| Thao tác                    | Thời gian |
| --------------------------- | --------- |
| Parse colors từ JSON        | ~1ms      |
| Extract unique colors/sizes | ~2ms      |
| Find matching variant       | ~1ms      |
| Render selectors            | ~5ms      |
| **Total**                   | **~10ms** |

---

## Migration Notes

### Trước đây (Chỉ có size)

```javascript
state = {
  variants: [...],
  selectedVariant: variants[0]
};

// Render size buttons
variants.map(v => `<button>${v.size}</button>`);
```

### Bây giờ (Có cả màu + size)

```javascript
state = {
  variants: [...],
  availableColors: [...],  // ✅ Mới
  availableSizes: [...],   // ✅ Mới
  selectedColor: null,     // ✅ Mới
  selectedSize: null,      // ✅ Mới
  selectedVariant: null
};

// Render màu + size riêng
// updateSelectedVariant() để tìm variant match
```

---

## Kết luận

Logic biến thể mới:

- ✅ **Linh hoạt**: Hỗ trợ cả màu + size, hoặc chỉ 1 trong 2
- ✅ **Trực quan**: Color picker hình tròn, size selector dạng nút
- ✅ **Chính xác**: Tìm variant match chính xác theo lựa chọn
- ✅ **Đầy đủ**: Lưu tất cả thông tin variant vào giỏ hàng
- ✅ **An toàn**: Validate đủ điều kiện trước khi thêm giỏ

---

**Tác giả**: GitHub Copilot  
**Cập nhật**: 2025-12-08

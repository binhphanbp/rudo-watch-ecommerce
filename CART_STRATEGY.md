# 🛒 Hybrid Cart Strategy

## Tổng quan

Hệ thống giỏ hàng sử dụng **Hybrid Strategy** kết hợp ưu điểm của cả Local Storage và API:

- ✅ **Nhanh như Local Storage** - Thao tác tức thì, không lag
- ✅ **Đáng tin cậy như API** - Đồng bộ cross-device, validate stock realtime
- ✅ **Offline-first** - Hoạt động khi mất mạng, tự sync khi online lại

## Kiến trúc

```
┌─────────────────────────────────────────────────────────┐
│                    USER ACTIONS                         │
│  (Add/Remove/Update Cart)                              │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│             1. UPDATE LOCAL STORAGE (Instant)           │
│  • Lưu vào localStorage ngay lập tức                    │
│  • Dispatch event để update UI                          │
│  • User thấy thay đổi NGAY (< 10ms)                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│        2. SCHEDULE BACKGROUND SYNC (Debounced)         │
│  • Đợi 1s sau thao tác cuối cùng                        │
│  • Gộp nhiều thao tác thành 1 API call                  │
│  • Chỉ sync nếu user đã đăng nhập                       │
│  • Cooldown 5s giữa các lần sync (tránh spam)           │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│           3. SYNC TO API (Background, Silent)          │
│  • Chạy ngầm, không block UI                            │
│  • Nếu fail → log warning, không hiển thị lỗi           │
│  • Nếu success → đánh dấu last_sync timestamp           │
└─────────────────────────────────────────────────────────┘
```

## Flow chi tiết

### 1. **Add to Cart** (Thêm sản phẩm)

```javascript
User clicks "Thêm vào giỏ"
    ↓
CartService.add(product)
    ↓
[SYNC] Cập nhật localStorage ngay lập tức
    ↓
[ASYNC] Trigger UI update (event)
    ↓
[ASYNC] Schedule sync lên API sau 1s
```

**Thời gian user chờ**: **0ms** (localStorage là synchronous)

---

### 2. **View Cart** (Xem giỏ hàng)

```javascript
User vào trang /cart.html
    ↓
[IF LOGGED IN] CartService.syncFromAPI()
    ↓
Lấy cart từ server (có stock/price mới nhất)
    ↓
Merge với localStorage (cộng dồn quantity)
    ↓
Render UI
```

**Mục đích**: Đảm bảo hiển thị stock và giá chính xác từ server

---

### 3. **Checkout** (Thanh toán)

```javascript
User click "Đặt hàng"
    ↓
[CRITICAL] CartService.validateForCheckout()
    ↓
Sync cart từ API + validate:
  • Stock có đủ không?
  • Giá có thay đổi không?
  • Số lượng có vượt giới hạn không?
    ↓
[IF VALID] Tiến hành đặt hàng
[IF INVALID] Hiển thị lỗi, redirect về /cart.html
```

**Mục đích**: Tránh đặt hàng với dữ liệu cũ/sai

---

### 4. **Login** (Đăng nhập)

```javascript
User login thành công
    ↓
Lưu token vào localStorage
    ↓
[ASYNC] CartService.syncFromAPI()
    ↓
Merge giỏ hàng từ server + local
    ↓
Redirect về trang chủ
```

**Mục đích**: Đồng bộ giỏ hàng cross-device

---

## API Endpoints

### 1. `POST /api/v1/cart/sync`

**Mục đích**: Sync cart từ client lên server

**Request Body**:

```json
{
  "items": [
    {
      "product_id": 123,
      "variant_id": 456,
      "quantity": 2,
      "price": 5000000
    }
  ]
}
```

**Response**: Server lưu/cập nhật cart của user

---

### 2. `GET /api/v1/cart`

**Mục đích**: Lấy cart từ server (với stock/price mới nhất)

**Response**:

```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": 123,
        "name": "Đồng hồ Rolex",
        "price": 5000000,
        "quantity": 2,
        "stock": 5,
        "image": "...",
        "variant_id": 456
      }
    ]
  }
}
```

---

### 3. `DELETE /api/v1/cart/clear`

**Mục đích**: Xóa giỏ hàng trên server (sau khi thanh toán)

---

## Merge Strategy

Khi có 2 nguồn dữ liệu (Local + Server), merge như sau:

```javascript
function mergeCart(localCart, serverCart) {
  // 1. Duyệt server cart trước (ưu tiên stock/price từ server)
  // 2. Cộng dồn quantity nếu item có ở cả 2 nguồn
  // 3. Thêm item chỉ có ở local

  return merged;
}
```

**Ví dụ**:

- **Local**: Đồng hồ A (qty: 2), Đồng hồ B (qty: 1)
- **Server**: Đồng hồ A (qty: 3), Đồng hồ C (qty: 1)

**Kết quả merge**:

- Đồng hồ A: qty = 2 + 3 = 5, stock/price từ server
- Đồng hồ B: qty = 1 (giữ nguyên từ local)
- Đồng hồ C: qty = 1 (từ server)

---

## Debouncing & Cooldown

### Debouncing (1 giây)

```
User: Add A → Add B → Add C (trong vòng 3s)
           ↓
Chỉ sync 1 lần sau thao tác cuối (Add C + 1s)
```

**Lợi ích**: Giảm số lượng API calls từ 3 → 1

---

### Cooldown (5 giây)

```
t=0s:  Sync thành công
t=2s:  User update cart → Skip (chưa đủ 5s)
t=6s:  User update cart → Sync (đã đủ 5s)
```

**Lợi ích**: Tránh spam API khi user thao tác liên tục

---

## Error Handling

### Background Sync Fail

```javascript
// KHÔNG hiển thị lỗi cho user
console.warn('⚠️ Cart sync failed (silent)');
// Lý do: Background task, không ảnh hưởng UX
```

### Checkout Validation Fail

```javascript
// HIỂN thị lỗi chi tiết
Swal.fire({
  icon: 'error',
  title: 'Giỏ hàng có vấn đề',
  html: validation.errors.join('<br>'),
});
```

---

## Performance Metrics

| Thao tác        | Local Storage | API Only | Hybrid (Chúng ta)              |
| --------------- | ------------- | -------- | ------------------------------ |
| Add to Cart     | ~5ms          | ~300ms   | **~5ms**                       |
| Update Quantity | ~3ms          | ~300ms   | **~3ms**                       |
| View Cart       | ~10ms         | ~400ms   | **~400ms** (1 lần/session)     |
| Checkout        | ~10ms         | ~500ms   | **~500ms** (validate bắt buộc) |

**Kết luận**:

- ✅ Thao tác thường xuyên (add/update): **Nhanh như Local**
- ✅ Thao tác quan trọng (checkout): **An toàn như API**

---

## Testing Scenarios

### ✅ Scenario 1: Offline → Online

```
1. User mất mạng
2. Thêm 3 sản phẩm vào giỏ (lưu local)
3. Mạng về
4. → Tự động sync lên server
```

### ✅ Scenario 2: Cross-Device

```
1. User thêm sản phẩm trên điện thoại
2. Login trên laptop
3. → Giỏ hàng đã có sản phẩm từ điện thoại
```

### ✅ Scenario 3: Stock Out

```
1. User thêm 5 sản phẩm vào giỏ (stock: 10)
2. Ai đó mua 8 sản phẩm (stock còn: 2)
3. User checkout
4. → Validate fail: "Chỉ còn 2 sản phẩm trong kho"
```

### ✅ Scenario 4: Price Change

```
1. User thêm sản phẩm giá 5tr vào giỏ
2. Admin giảm giá xuống 4tr
3. User checkout
4. → Sync from API → Giá cập nhật thành 4tr
```

---

## Migration Path (Nâng cấp dần)

### Phase 1: ✅ Hiện tại (Hybrid Basic)

- Local first, background sync
- Validate trước checkout
- Merge on login

### Phase 2: 🔜 Tương lai (Advanced)

- **WebSocket**: Realtime sync giữa các tab
- **Service Worker**: Cache API responses, offline queue
- **Optimistic Locking**: Tránh conflict khi multi-tab editing
- **Delta Sync**: Chỉ sync phần thay đổi, không sync toàn bộ cart

### Phase 3: 🚀 Long-term

- **Redis Session**: Server-side cart session
- **GraphQL Subscriptions**: Realtime cart updates
- **Edge Caching**: CDN cache cho product info

---

## Code Examples

### Sử dụng trong component

```javascript
import CartService from '@/shared/services/cart.js';

// Thêm sản phẩm (instant)
CartService.add(product, quantity);

// Lấy giỏ hàng (sync)
const cart = CartService.getCart();

// Sync từ API (async, khi cần fresh data)
await CartService.syncFromAPI();

// Validate trước checkout (async, bắt buộc)
const { valid, errors, cart } = await CartService.validateForCheckout();
if (!valid) {
  alert(errors.join('\n'));
}
```

---

## Kết luận

**Hybrid Strategy** là giải pháp cân bằng giữa:

- ⚡ **Performance**: Nhanh như Local Storage
- 🔒 **Reliability**: Đáng tin cậy như API
- 🌐 **Consistency**: Đồng bộ cross-device
- 💪 **Resilience**: Hoạt động offline

**Trade-offs**:

- ❌ Phức tạp hơn pure Local hoặc pure API
- ❌ Cần xử lý merge conflicts
- ✅ Nhưng mang lại UX tốt nhất cho user

---

**Tác giả**: GitHub Copilot  
**Cập nhật**: 2025-12-08

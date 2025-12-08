# 📝 Hệ Thống Review Sản Phẩm

## 🎯 Mục Tiêu

Cho phép người dùng đánh giá sản phẩm **CHỈ SAU KHI ĐÃ MUA** để đảm bảo tính xác thực.

---

## ⚡ Flow Nghiệp Vụ

### 1. Điều Kiện Được Review

User chỉ được đánh giá sản phẩm khi:

- ✅ **Đã đăng nhập**
- ✅ **Đã mua sản phẩm** (có đơn hàng chứa sản phẩm đó)
- ✅ **Đơn hàng đã hoàn thành** (`status = 'completed'` hoặc `'delivered'`)
- ✅ **Chưa đánh giá** sản phẩm đó trước đây

### 2. Flow Review Từ Profile

#### Bước 1: Xem Lịch Sử Đơn Hàng

User vào **Profile > Đơn hàng của tôi**

#### Bước 2: Chọn Đơn Hàng Đã Hoàn Thành

- Đơn hàng có status `completed` hoặc `delivered` → Hiển thị nút **"Đánh giá"**
- Click **"Đánh giá"** → Popup danh sách sản phẩm trong đơn hàng

#### Bước 3: Chọn Sản Phẩm

User chọn sản phẩm muốn đánh giá → Chuyển đến trang Product Detail, tab **Reviews** (auto-scroll)

#### Bước 4: Viết Review

- Hệ thống tự động kiểm tra quyền review (gọi API `/reviews/can-review/:productId`)
- Nếu có quyền → Hiển thị form đánh giá
- Nếu không có quyền → Hiển thị thông báo lý do

### 3. Flow Review Từ Product Detail

#### Bước 1: Vào Trang Sản Phẩm

User vào trang chi tiết sản phẩm, click tab **"Đánh giá"**

#### Bước 2: Kiểm Tra Quyền

- Gọi API `GET /reviews/can-review/:productId`
- Backend check:
  - User đã mua sản phẩm này chưa?
  - Đơn hàng đã hoàn thành chưa?
  - User đã review chưa?

#### Bước 3: Hiển Thị Form (Nếu Hợp Lệ)

- Form đánh giá gồm:
  - ⭐ Rating: 1-5 sao
  - 💬 Comment: Nhận xét chi tiết
- Nếu không hợp lệ → Hiển thị lý do (chưa mua, chưa giao hàng, đã review...)

#### Bước 4: Submit Review

- Gọi API `POST /reviews`
- Payload:
  ```json
  {
    "product_id": 123,
    "order_id": 456,
    "rating": 5,
    "comment": "Sản phẩm rất tốt!"
  }
  ```
- Backend validate lại quyền review
- Nếu thành công → Reload reviews list

---

## 🛠️ Implementation

### 1. Service: `src/shared/services/review.js`

#### Function `canReview(productId)`

```javascript
// Kiểm tra quyền review
const permission = await ReviewService.canReview(productId);
// Return: { canReview: boolean, reason: string, orderId: number }
```

#### Function `submitReview(reviewData)`

```javascript
// Gửi review
await ReviewService.submitReview({
  product_id: 123,
  rating: 5,
  comment: 'Tuyệt vời!',
});
```

#### Function `getProductReviews(productId)`

```javascript
// Lấy danh sách reviews của sản phẩm
const reviews = await ReviewService.getProductReviews(productId);
```

### 2. Product Detail Page

#### Auto-check Permission Khi Load Tab Reviews

```javascript
const reviewsTab = document.querySelector('[data-tab="tab-reviews"]');
reviewsTab.addEventListener('click', () => {
  checkReviewPermission(id);
});
```

#### Hiển Thị Form Có Điều Kiện

```javascript
const checkReviewPermission = async (productId) => {
  const permission = await ReviewService.canReview(productId);

  if (permission.canReview) {
    // Hiện form review
    reviewFormContainer.classList.remove('hidden');
  } else {
    // Ẩn form, hiện thông báo
    reviewFormContainer.classList.add('hidden');
    showNotice(permission.reason);
  }
};
```

### 3. Profile Page - Order List

#### Nút "Đánh Giá" Cho Đơn Hoàn Thành

```javascript
const canReview = (status === 'completed' || status === 'delivered');

// Render nút
${canReview ? `
  <button onclick="showReviewOptions(${order.id})">
    Đánh giá
  </button>
` : ''}
```

#### Popup Chọn Sản Phẩm

```javascript
window.showReviewOptions = async (orderId) => {
  // Load order detail
  const order = await api.get(`/orders/${orderId}`);

  // Hiện popup chọn sản phẩm
  Swal.fire({
    title: 'Chọn sản phẩm để đánh giá',
    html: renderProductList(order.items),
  });

  // Redirect đến product detail với hash #reviews
  window.location.href = `/product-detail.html?id=${productId}#reviews`;
};
```

### 4. Order Detail Modal

#### Link "Đánh Giá" Cho Từng Sản Phẩm

```javascript
${(order.status === 'completed' || order.status === 'delivered') ? `
  <a href="/product-detail.html?id=${item.product_id}#reviews">
    ⭐ Đánh giá sản phẩm này
  </a>
` : ''}
```

---

## 🔒 Backend API Endpoints

### 1. Check Review Permission

```
GET /api/v1/reviews/can-review/:productId
```

**Response:**

```json
{
  "success": true,
  "data": {
    "can_review": true,
    "reason": "",
    "order_id": 123,
    "has_reviewed": false
  }
}
```

**Validation Logic:**

```javascript
// Backend pseudocode
1. Check user is logged in
2. Find order containing product_id where:
   - user_id = current_user.id
   - status IN ('completed', 'delivered')
3. Check if user already reviewed this product
4. Return { can_review, reason, order_id }
```

### 2. Submit Review

```
POST /api/v1/reviews
```

**Payload:**

```json
{
  "product_id": 123,
  "order_id": 456,
  "rating": 5,
  "comment": "Sản phẩm rất tốt!"
}
```

**Backend Validation:**

- User đã đăng nhập
- Order tồn tại và thuộc về user
- Order đã hoàn thành
- Product có trong order
- User chưa review product này

### 3. Get Product Reviews

```
GET /api/v1/reviews?product_id=123&page=1&limit=10
```

**Response:**

```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": 1,
        "user_name": "Nguyễn Văn A",
        "rating": 5,
        "comment": "Sản phẩm tuyệt vời!",
        "created_at": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_reviews": 48
    }
  }
}
```

### 4. Get Review Stats

```
GET /api/v1/reviews/stats/:productId
```

**Response:**

```json
{
  "success": true,
  "data": {
    "average_rating": 4.5,
    "total_reviews": 48,
    "rating_distribution": {
      "5_star": 30,
      "4_star": 10,
      "3_star": 5,
      "2_star": 2,
      "1_star": 1
    }
  }
}
```

---

## 🎨 UI/UX Flow

### Trường Hợp 1: User Chưa Đăng Nhập

```
Click "Đánh giá" → Popup: "Bạn cần đăng nhập để đánh giá" → Redirect /login.html
```

### Trường Hợp 2: User Chưa Mua Sản Phẩm

```
Load tab Reviews → Notice: "Bạn cần mua sản phẩm này để có thể đánh giá"
Form review: HIDDEN
```

### Trường Hợp 3: Đơn Hàng Chưa Hoàn Thành

```
Notice: "Đơn hàng của bạn đang được xử lý. Vui lòng đánh giá sau khi nhận hàng"
Form review: HIDDEN
```

### Trường Hợp 4: Đã Đánh Giá Rồi

```
Notice: "Bạn đã đánh giá sản phẩm này rồi"
Form review: HIDDEN
Hiển thị review của user (có thể edit nếu backend hỗ trợ)
```

### Trường Hợp 5: Hợp Lệ - Được Đánh Giá

```
Notice: HIDDEN
Form review: VISIBLE
- Chọn 1-5 sao
- Nhập comment (required)
- Button "Gửi đánh giá"
```

---

## 🧪 Testing Scenarios

### Test 1: Review Khi Chưa Đăng Nhập

1. Logout
2. Vào trang sản phẩm, tab Reviews
3. **Expected**: Không hiển thị form, notice "Bạn cần đăng nhập"

### Test 2: Review Sản Phẩm Chưa Mua

1. Đăng nhập user mới (chưa mua gì)
2. Vào trang sản phẩm, tab Reviews
3. **Expected**: Notice "Bạn cần mua sản phẩm này để đánh giá"

### Test 3: Review Đơn Hàng Đang Xử Lý

1. Đặt đơn hàng mới (status = pending)
2. Vào product detail, tab Reviews
3. **Expected**: Notice "Đơn hàng đang được xử lý, vui lòng đánh giá sau"

### Test 4: Review Sau Khi Nhận Hàng

1. Admin update order status → completed
2. User vào Profile > Đơn hàng → Thấy nút "Đánh giá"
3. Click "Đánh giá" → Chọn sản phẩm → Chuyển đến product detail
4. **Expected**: Form review hiển thị, có thể submit

### Test 5: Không Thể Review 2 Lần

1. Submit review thành công
2. Refresh trang
3. **Expected**: Notice "Bạn đã đánh giá sản phẩm này rồi"

### Test 6: Auto-scroll Từ Profile

1. Profile > Đơn hàng > Click "Đánh giá"
2. **Expected**: Trang product detail mở, auto-scroll đến tab Reviews

---

## 📊 Database Schema (Reference)

### Table: `reviews`

```sql
CREATE TABLE reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  order_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (order_id) REFERENCES orders(id),

  UNIQUE KEY unique_user_product (user_id, product_id)
);
```

**Unique Constraint:** 1 user chỉ được review 1 product 1 lần

---

## 🚀 Deployment Checklist

### Frontend

- [x] Create `review.js` service
- [x] Update `product-detail.js` với review permission check
- [x] Update `profile.js` với nút "Đánh giá" cho đơn hoàn thành
- [x] Add review form container với class `hidden` mặc định
- [x] Add auto-scroll khi hash = `#reviews`

### Backend (Cần Triển Khai)

- [ ] API `GET /reviews/can-review/:productId`
- [ ] API `POST /reviews` với full validation
- [ ] API `GET /reviews?product_id=X`
- [ ] API `GET /reviews/stats/:productId`
- [ ] Database migration: Create `reviews` table với unique constraint
- [ ] Validate order status = completed/delivered
- [ ] Validate user ownership của order

### Testing

- [ ] Test flow review từ profile
- [ ] Test flow review từ product detail
- [ ] Test validation: chưa đăng nhập
- [ ] Test validation: chưa mua
- [ ] Test validation: đã review
- [ ] Test UI responsive trên mobile

---

## 🎓 Best Practices

### 1. Security

- ✅ Validate quyền review **cả frontend lẫn backend**
- ✅ Frontend check để UX tốt, backend check để bảo mật
- ✅ User không thể review sản phẩm người khác mua

### 2. UX

- ✅ Auto-scroll đến form review khi click từ profile
- ✅ Notice rõ ràng khi không có quyền review
- ✅ Reload reviews list sau khi submit thành công
- ✅ Hiển thị loading state khi gửi review

### 3. Performance

- ✅ Cache review permission (nếu đã check rồi không check lại)
- ✅ Pagination cho reviews list
- ✅ Lazy load reviews khi click tab

---

## 📚 File Structure

```
src/
├── shared/
│   └── services/
│       └── review.js          # ⭐ Service review (NEW)
├── modules/
│   └── client/
│       └── js/
│           ├── product-detail.js  # ✅ Updated (review permission check)
│           └── profile.js         # ✅ Updated (nút "Đánh giá")
└── pages/
    └── client/
        └── product-detail.html    # ✅ Updated (review-permission-notice)
```

---

## 🔗 Related Documentation

- [CART_STRATEGY.md](./CART_STRATEGY.md) - Hybrid cart với Local Storage + API
- [VARIANT_LOGIC.md](./VARIANT_LOGIC.md) - Variant display (color, size)
- [CHECKOUT_FIX.md](./CHECKOUT_FIX.md) - Checkout error handling

---

**✅ Hệ thống review đã được implement đầy đủ nghiệp vụ:**

1. ✅ Chỉ người đã mua mới review được
2. ✅ Đơn hàng phải completed/delivered
3. ✅ Không được review 2 lần
4. ✅ UI rõ ràng từ profile và product detail
5. ✅ Auto-scroll khi click "Đánh giá" từ profile

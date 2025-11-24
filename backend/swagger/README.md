# Swagger API Documentation

## Truy cập Swagger UI

Sau khi cấu hình, bạn có thể truy cập Swagger UI tại:

- **Local:** `http://localhost/backend/swagger` hoặc `http://localhost/backend/api-docs`
- **Production:** `https://yourdomain.com/backend/swagger`

## Cấu trúc

- `swagger.json` - File OpenAPI 3.0 specification chứa tất cả các endpoint
- `index.html` - File HTML hiển thị Swagger UI
- `README.md` - File hướng dẫn này

## Cách sử dụng

1. Truy cập URL Swagger UI
2. Click vào nút **Authorize** (🔓) ở góc trên bên phải
3. Nhập token của bạn (lấy từ `/api/v1/login` hoặc `/api/v1/register`)
4. Click **Authorize** để lưu token
5. Bây giờ bạn có thể test các API cần authentication

## Cập nhật Documentation

Để thêm hoặc cập nhật endpoint trong Swagger:

1. Mở file `swagger.json`
2. Thêm endpoint mới vào phần `paths`
3. Thêm schema mới vào phần `components/schemas` nếu cần
4. Refresh trang Swagger UI để xem thay đổi

## Lưu ý

- File `swagger.json` phải tuân theo chuẩn OpenAPI 3.0
- Có thể validate file tại: https://editor.swagger.io/
- Token được lưu trong session của browser, refresh trang sẽ mất token


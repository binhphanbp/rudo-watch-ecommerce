# Floating Actions Component

Component hiển thị 3 nút floating actions ở góc phải màn hình:

1. **Back to Top** - Nút cuộn về đầu trang (hiện khi scroll > 300px)
2. **Facebook Messenger** - Liên kết chat qua Messenger
3. **Hotline** - Gọi điện thoại trực tiếp

## 🎨 Features

- ✅ Responsive design
- ✅ Smooth animations (slide-in từ phải)
- ✅ Back to top với smooth scroll
- ✅ Pulse animation cho nút phone
- ✅ Hover effects đẹp mắt
- ✅ Dark mode support
- ✅ Performance optimized (throttled scroll)
- ✅ Accessibility (ARIA labels)

## 📋 Cấu hình

Cập nhật thông tin liên hệ tại: `src/shared/config/contact.js`

```javascript
export const CONTACT_INFO = {
  phone: '+84901234567', // Số điện thoại
  phoneDisplay: '090 123 4567', // Hiển thị
  messengerUsername: 'rudowatch', // Facebook page username
};
```

## 🚀 Sử dụng

Component tự động khởi tạo khi import vào `main.js`:

```javascript
import '../components/FloatingActions.js';
```

## 🎯 Customization

### Thay đổi scroll threshold

```javascript
window.floatingActions.scrollThreshold = 500; // Hiện back-to-top sau 500px
```

### Update số điện thoại động

```javascript
window.floatingActions.updatePhoneNumber('+84987654321');
```

### Update messenger link động

```javascript
window.floatingActions.updateMessengerLink('yourfacebookpage');
```

## 🎨 Styling

Tất cả styles được inline trong component. Để tùy chỉnh:

- **Vị trí**: Sửa class `right-6 bottom-6`
- **Màu sắc**: Sửa `from-[color] to-[color]` trong gradient
- **Kích thước**: Sửa `w-[56px] h-[56px]`
- **Animation timing**: Sửa `animation-delay` trong style attribute

## 📱 Responsive

- Desktop: 56x56px buttons
- Mobile: 48x48px buttons
- Auto adjust spacing

## ♿ Accessibility

- ARIA labels cho screen readers
- Title tooltips khi hover
- Keyboard accessible
- Focus visible styles

## 🔧 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## 📝 Notes

- Component tự động hide back-to-top khi ở đầu trang
- Pulse animation chỉ áp dụng cho nút phone
- Haptic feedback trên mobile (nếu supported)
- Smooth scroll behavior tự động

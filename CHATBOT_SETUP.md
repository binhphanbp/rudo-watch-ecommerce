# 🤖 AI Chatbot với Google Gemini

## ✨ Tính Năng

### Chat Widget

- 💬 Giao diện chat đẹp, hiện đại với Tailwind CSS
- 🎨 Dark mode support
- 📱 Responsive (desktop + mobile)
- ⚡ Real-time typing indicator
- 🔔 Unread message badge
- 🔄 Reset conversation
- ⌨️ Quick replies

### AI Capabilities (Gemini Pro)

- 🧠 Tư vấn sản phẩm đồng hồ
- 💎 Gợi ý theo ngân sách, phong cách
- 📦 Hướng dẫn mua hàng, thanh toán
- 🛡️ Giải đáp chính sách bảo hành
- 🔍 Hỗ trợ tra cứu đơn hàng

---

## 🚀 Cài Đặt

### 1. Lấy Gemini API Key

1. Truy cập: https://makersuite.google.com/app/apikey
2. Đăng nhập Google Account
3. Click **"Get API Key"** → **"Create API key in new project"**
4. Copy API key (dạng: `AIzaSy...`)

### 2. Cấu Hình API Key

Tạo file `.env` ở root project:

```bash
VITE_GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**⚠️ Quan trọng:** Thêm `.env` vào `.gitignore` để không push lên GitHub!

### 3. Import Chat Widget

Thêm vào file HTML cần chat (vd: `index.html`, `products.html`):

```html
<!-- Trong <head> hoặc trước </body> -->
<script type="module">
  import '../src/modules/client/components/ChatWidget.js';
</script>
```

Hoặc import trong `main.js`:

```javascript
import './components/ChatWidget.js';
```

---

## 📂 Cấu Trúc File

```
src/
├── shared/
│   └── services/
│       └── chatbot.js          # Gemini API integration
└── modules/
    └── client/
        └── components/
            └── ChatWidget.js    # UI component
```

---

## 🎨 Customization

### Thay Đổi Context (Tính cách AI)

Edit `chatbot.js`:

```javascript
const SHOP_CONTEXT = `
Bạn là trợ lý AI của [Tên shop]...
Chuyên về: [Sản phẩm]...
`;
```

### Thay Đổi Màu Sắc

Edit `ChatWidget.js`, tìm class:

- `from-blue-600 to-blue-700` → Đổi màu header
- `bg-blue-600` → Đổi màu button gửi
- `text-blue-600` → Đổi màu text

### Thay Đổi Vị Trí Widget

Edit CSS trong `ChatWidget.js`:

```javascript
// Từ bottom-right sang bottom-left
bottom-6 right-6  →  bottom-6 left-6
```

---

## 🧪 Testing

### 1. Khởi động dev server:

```bash
npm run dev
```

### 2. Mở trình duyệt:

```
http://localhost:3000
```

### 3. Test chatbot:

- Click button chat (góc phải màn hình)
- Nhập: "Tư vấn đồng hồ nam dưới 5 triệu"
- Check phản hồi từ AI

### 4. Check Console:

```javascript
// Xem logs
🤖 Chatbot initialized
📤 Sending message: ...
📥 AI response: ...
```

---

## 🔧 Troubleshooting

### Lỗi: "Chưa cấu hình API Key"

**Nguyên nhân:** Chưa tạo file `.env` hoặc key sai

**Fix:**

1. Tạo file `.env` ở root (cùng cấp `package.json`)
2. Thêm: `VITE_GEMINI_API_KEY=your_key_here`
3. Restart dev server (`Ctrl+C` → `npm run dev`)

### Lỗi: "API key not valid"

**Nguyên nhân:** API key hết hạn hoặc sai

**Fix:**

1. Vào https://makersuite.google.com/app/apikey
2. Tạo key mới
3. Update lại file `.env`

### Lỗi: "CORS error"

**Nguyên nhân:** Gemini API không hỗ trợ CORS từ browser

**Fix:**
Gemini API v1beta **HỖ TRỢ** gọi trực tiếp từ browser, không cần proxy. Nếu vẫn lỗi CORS:

1. Check API key có đúng không
2. Dùng endpoint: `https://generativelanguage.googleapis.com/v1beta/...`
3. Nếu vẫn lỗi, cần tạo backend proxy (Node.js/Express)

### Chat không hiện

**Fix:**

1. Check console có lỗi không
2. Check `ChatWidget.js` đã import chưa
3. Check Tailwind CSS đã load chưa

---

## 🎯 Use Cases

### 1. Tư Vấn Sản Phẩm

```
User: "Tìm đồng hồ nam công sở dưới 5 triệu"
AI: "⌚ Với ngân sách 5 triệu, tôi gợi ý:
- Casio Edifice: Thiết kế sang trọng, tính năng đa dạng
- Citizen Eco-Drive: Pin năng lượng mặt trời, bền bỉ
- Orient Bambino: Automatic, phong cách cổ điển

Bạn thích kiểu nào? 💼"
```

### 2. Chính Sách

```
User: "Chính sách đổi trả thế nào?"
AI: "🛡️ Chính sách đổi trả Rudo Watch:
- Đổi trả trong 7 ngày nếu lỗi nhà sản xuất
- Sản phẩm chưa qua sử dụng, còn nguyên hộp
- Bảo hành 12-24 tháng tùy hãng

Bạn cần hỗ trợ gì thêm? 😊"
```

### 3. Hướng Dẫn Mua Hàng

```
User: "Làm sao để đặt hàng?"
AI: "📦 Đặt hàng rất dễ:
1. Chọn sản phẩm → Thêm vào giỏ hàng
2. Điền thông tin giao hàng
3. Chọn thanh toán COD hoặc chuyển khoản
4. Xác nhận đơn → Nhận hàng trong 2-3 ngày

Tôi có thể giúp bạn tìm sản phẩm ngay! ⌚"
```

---

## 📊 API Usage & Costs

### Gemini API Pricing (Free Tier)

- **60 requests/minute**
- **1,500 requests/day**
- **1 million tokens/month** (FREE)

### Production Considerations

- Cân nhắc cache responses (giảm API calls)
- Rate limiting (tránh spam)
- Fallback responses (khi hết quota)
- Monitor usage: https://makersuite.google.com/

---

## 🔐 Security Best Practices

### 1. Không Expose API Key

```javascript
// ❌ ĐỪNG LÀM THẾ NÀY
const API_KEY = 'AIzaSyXXXXXX'; // Hard-code trong code

// ✅ ĐÚNG CÁCH
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
```

### 2. Gitignore API Key

```
# .gitignore
.env
.env.local
.env.*.local
```

### 3. Validate User Input

```javascript
// Giới hạn độ dài tin nhắn
if (message.length > 500) {
  return 'Tin nhắn quá dài. Vui lòng ngắn gọn hơn!';
}
```

### 4. Rate Limiting

```javascript
// Giới hạn số tin nhắn/phút
const MAX_MESSAGES_PER_MINUTE = 10;
```

---

## 🚀 Deployment

### Vercel / Netlify

```bash
# Set environment variable
VITE_GEMINI_API_KEY=your_key_here
```

### Production .env

```bash
VITE_GEMINI_API_KEY=AIzaSy...
VITE_API_BASE_URL=https://api.yoursite.com
```

---

## 🎓 Next Steps

### Nâng Cao

- [ ] Lưu conversation vào localStorage (persist chat history)
- [ ] Voice input (speech-to-text)
- [ ] Multi-language support
- [ ] Sentiment analysis (phân tích cảm xúc user)
- [ ] Admin dashboard (xem chat logs)
- [ ] Integration với CRM (Zalo, Facebook Messenger)

### Backend Integration

- [ ] Tạo proxy API (ẩn Gemini key)
- [ ] Store chat logs vào database
- [ ] Analytics (track conversation quality)
- [ ] A/B testing (test các prompt khác nhau)

---

## 📚 Resources

- [Gemini API Docs](https://ai.google.dev/docs)
- [Get API Key](https://makersuite.google.com/app/apikey)
- [Prompt Engineering Guide](https://ai.google.dev/docs/prompt_best_practices)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## ✅ Checklist Setup

- [ ] Lấy Gemini API key
- [ ] Tạo file `.env` với `VITE_GEMINI_API_KEY`
- [ ] Import `ChatWidget.js` vào trang cần chat
- [ ] Restart dev server
- [ ] Test chat widget
- [ ] Customize context cho shop của bạn
- [ ] Deploy lên production

---

**🎉 Hoàn tất! Giờ bạn có AI Chatbot xịn rồi đó!**

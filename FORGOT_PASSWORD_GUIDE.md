# 🔐 Hướng Dẫn Tích Hợp Forgot Password & Reset Password

## 📋 Mô Tả Tổng Quan

Hệ thống Forgot Password & Reset Password cho phép người dùng khôi phục mật khẩu thông qua email. Flow hoàn chỉnh bao gồm:

1. **Forgot Password Page**: Người dùng nhập email để nhận link reset
2. **Email với Reset Link**: Hệ thống gửi email chứa token reset (hiệu lực 1 giờ)
3. **Reset Password Page**: Người dùng nhập mật khẩu mới với token từ email
4. **Login**: Người dùng đăng nhập bằng mật khẩu mới

---

## 🎨 Files Đã Tạo

### Frontend Files

```
src/pages/client/
├── forgot-password.html    # Trang nhập email
└── reset-password.html     # Trang đặt lại mật khẩu

src/modules/client/js/
├── forgot-password.js      # Logic gửi email reset
└── reset-password.js       # Logic đặt lại mật khẩu mới
```

---

## 🔄 Flow Hoạt Động

### 1. Forgot Password Flow

```
User → Forgot Password Page → Nhập Email → API Request
                                              ↓
                                    Backend gửi email
                                              ↓
                                    User nhận email
                                              ↓
                                    Click vào link
                                              ↓
                                  Reset Password Page
```

### 2. Reset Password Flow

```
Reset Password Page → Nhập mật khẩu mới → Xác nhận mật khẩu
                                                  ↓
                                          API Request với token
                                                  ↓
                                          Backend verify token
                                                  ↓
                                          Cập nhật mật khẩu
                                                  ↓
                                          Redirect to Login
```

---

## 🛠️ Backend API Requirements

### 1. Forgot Password Endpoint

**POST** `/api/v1/auth/forgot-password`

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response Success (200):**

```json
{
  "success": true,
  "message": "Email reset password đã được gửi"
}
```

**Response Error (404):**

```json
{
  "success": false,
  "message": "Email không tồn tại trong hệ thống"
}
```

**Response Error (429):**

```json
{
  "success": false,
  "message": "Vui lòng đợi 15 phút trước khi gửi lại"
}
```

---

### 2. Reset Password Endpoint

**POST** `/api/v1/auth/reset-password`

**Request Body:**

```json
{
  "token": "abc123xyz...",
  "password": "newPassword123",
  "password_confirmation": "newPassword123"
}
```

**Response Success (200):**

```json
{
  "success": true,
  "message": "Mật khẩu đã được đặt lại thành công"
}
```

**Response Error (400):**

```json
{
  "success": false,
  "message": "Token không hợp lệ hoặc đã hết hạn"
}
```

**Response Error (422):**

```json
{
  "success": false,
  "message": "Mật khẩu phải có ít nhất 8 ký tự",
  "errors": {
    "password": ["Mật khẩu quá ngắn"]
  }
}
```

---

## 📧 Email Template Requirements

Backend cần gửi email với format sau:

**Subject:** `Đặt lại mật khẩu - Rudo Watch`

**Body HTML:**

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #0A2A45;">Rudo Watch</h1>
      </div>

      <h2>Đặt lại mật khẩu</h2>

      <p>Xin chào,</p>

      <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản Rudo Watch của mình.</p>

      <p>Nhấp vào nút bên dưới để đặt lại mật khẩu:</p>

      <div style="text-align: center; margin: 30px 0;">
        <a
          href="{{RESET_URL}}"
          style="background: linear-gradient(to right, #0A2A45, #0d3557);
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                display: inline-block;"
        >
          Đặt lại mật khẩu
        </a>
      </div>

      <p>Hoặc copy link này vào trình duyệt:</p>
      <p
        style="background: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all;"
      >
        {{RESET_URL}}
      </p>

      <p><strong>Lưu ý:</strong></p>
      <ul>
        <li>Link này có hiệu lực trong <strong>1 giờ</strong></li>
        <li>
          Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này
        </li>
      </ul>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />

      <p style="font-size: 12px; color: #666;">
        Email này được gửi tự động, vui lòng không trả lời.<br />
        © 2024 Rudo Watch. All rights reserved.
      </p>
    </div>
  </body>
</html>
```

**Reset URL Format:**

```
https://yourdomain.com/reset-password.html?token={TOKEN}
```

---

## 💻 Cách Sử Dụng Frontend

### 1. Test Forgot Password

1. Mở trình duyệt: `http://localhost:5173/forgot-password.html`
2. Nhập email đã đăng ký
3. Click "Gửi link đặt lại mật khẩu"
4. Kiểm tra email (cả Spam folder)

### 2. Test Reset Password

1. Nhận email và click vào link
2. Hoặc truy cập: `http://localhost:5173/reset-password.html?token=YOUR_TOKEN`
3. Nhập mật khẩu mới (tối thiểu 8 ký tự)
4. Xác nhận mật khẩu
5. Click "Đặt lại mật khẩu"
6. Redirect to Login page

---

## 🎯 Features Đã Implement

### Forgot Password Page

- ✅ Form nhập email với validation
- ✅ Email format validation
- ✅ Loading state khi gửi request
- ✅ Success message sau khi gửi
- ✅ Error handling (404, 429, 500)
- ✅ Rate limiting message
- ✅ Responsive design
- ✅ Dark mode support
- ✅ Link quay về Login

### Reset Password Page

- ✅ Token validation từ URL
- ✅ Password strength indicator (5 levels)
- ✅ Show/hide password toggle
- ✅ Password confirmation matching
- ✅ Minimum 8 characters validation
- ✅ Loading state khi submit
- ✅ Success redirect to Login
- ✅ Token expiry handling
- ✅ Responsive design
- ✅ Dark mode support
- ✅ Security notice

### Login Page

- ✅ Added "Quên mật khẩu?" link
- ✅ Link to `/forgot-password.html`

---

## 🔒 Security Features

1. **Token Expiry**: Token chỉ có hiệu lực 1 giờ
2. **Rate Limiting**: Giới hạn số lần gửi email (15 phút cooldown)
3. **Password Strength**: Kiểm tra độ mạnh mật khẩu
4. **Validation**: Email format, password length, password matching
5. **HTTPS Required**: Sử dụng HTTPS cho production
6. **Token One-Time Use**: Token chỉ dùng được 1 lần

---

## 🧪 Test Cases

### Forgot Password Test Cases

```javascript
// Test 1: Valid email
Email: "user@example.com"
Expected: Success message, email sent

// Test 2: Invalid email format
Email: "invalid-email"
Expected: Error "Email không hợp lệ"

// Test 3: Email not registered
Email: "notfound@example.com"
Expected: Error "Email này chưa được đăng ký"

// Test 4: Rate limiting
Action: Gửi 3 requests liên tiếp
Expected: Error "Quá nhiều yêu cầu, đợi 15 phút"
```

### Reset Password Test Cases

```javascript
// Test 1: Valid password reset
Token: "valid_token_123"
Password: "newPass123"
Confirm: "newPass123"
Expected: Success, redirect to login

// Test 2: Password too short
Password: "123"
Expected: Error "Mật khẩu phải có ít nhất 8 ký tự"

// Test 3: Password mismatch
Password: "newPass123"
Confirm: "different123"
Expected: Error "Mật khẩu không khớp"

// Test 4: Expired token
Token: "expired_token"
Expected: Error "Link đã hết hạn"

// Test 5: Invalid token
Token: "invalid_token"
Expected: Error "Token không hợp lệ"
```

---

## 📝 Backend Implementation Guide

### Database Schema

```sql
-- Reset Password Tokens Table
CREATE TABLE password_reset_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used_at TIMESTAMP NULL,

  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_token (token),
  INDEX idx_email (email),
  INDEX idx_expires (expires_at)
);
```

### Node.js/Express Example

```javascript
// forgot-password.controller.js
const crypto = require('crypto');
const nodemailer = require('nodemailer');

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Email không tồn tại trong hệ thống',
      });
    }

    // Check rate limiting (15 minutes)
    const recentToken = await PasswordResetToken.findOne({
      email,
      created_at: { $gte: new Date(Date.now() - 15 * 60 * 1000) },
    });

    if (recentToken) {
      return res.status(429).json({
        success: false,
        message: 'Vui lòng đợi 15 phút trước khi gửi lại',
      });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save token
    await PasswordResetToken.create({
      user_id: user.id,
      email: user.email,
      token,
      expires_at: expires,
    });

    // Send email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password.html?token=${token}`;
    await sendResetEmail(user.email, resetUrl);

    res.json({
      success: true,
      message: 'Email reset password đã được gửi',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra',
    });
  }
};

// reset-password.controller.js
exports.resetPassword = async (req, res) => {
  try {
    const { token, password, password_confirmation } = req.body;

    // Validate
    if (password !== password_confirmation) {
      return res.status(422).json({
        success: false,
        message: 'Mật khẩu xác nhận không khớp',
      });
    }

    if (password.length < 8) {
      return res.status(422).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 8 ký tự',
      });
    }

    // Find token
    const resetToken = await PasswordResetToken.findOne({
      token,
      used_at: null,
      expires_at: { $gt: new Date() },
    });

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn',
      });
    }

    // Update password
    const user = await User.findById(resetToken.user_id);
    user.password = await bcrypt.hash(password, 10);
    await user.save();

    // Mark token as used
    resetToken.used_at = new Date();
    await resetToken.save();

    res.json({
      success: true,
      message: 'Mật khẩu đã được đặt lại thành công',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra',
    });
  }
};
```

---

## 🚀 Deployment Checklist

- [ ] Backend API endpoints hoàn chỉnh
- [ ] Email service configured (SMTP/SendGrid/etc)
- [ ] Database tables created
- [ ] Environment variables set:
  - `FRONTEND_URL`
  - `EMAIL_HOST`
  - `EMAIL_PORT`
  - `EMAIL_USER`
  - `EMAIL_PASSWORD`
- [ ] Test với real email accounts
- [ ] Rate limiting configured
- [ ] HTTPS enabled
- [ ] CORS configured properly
- [ ] Error logging setup
- [ ] Email template tested

---

## 🐛 Troubleshooting

### Email không nhận được

1. Kiểm tra Spam folder
2. Verify SMTP credentials
3. Check email service logs
4. Test với different email providers (Gmail, Outlook, etc)

### Token invalid/expired error

1. Check server time sync
2. Verify token generation logic
3. Check database token storage
4. Verify token expiry time (default: 1 hour)

### Rate limiting không hoạt động

1. Check timestamp comparison logic
2. Verify database indexes
3. Test cooldown period

---

## 📞 Support

Nếu cần hỗ trợ:

- Email: support@rudowatch.com
- Docs: /docs/forgot-password

---

**Tạo bởi:** GitHub Copilot  
**Ngày:** December 8, 2025  
**Version:** 1.0.0

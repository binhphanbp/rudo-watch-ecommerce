import Swal from '../../../shared/utils/swal';

// Initialize contact page
document.addEventListener('DOMContentLoaded', () => {
  initContactForm();
});

// Initialize contact form handling
function initContactForm() {
  const form = document.getElementById('contact-form');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get form values
    const formData = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      subject: document.getElementById('subject').value,
      message: document.getElementById('message').value.trim(),
    };

    // Validate
    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.subject ||
      !formData.message
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Thiếu thông tin',
        text: 'Vui lòng điền đầy đủ các trường bắt buộc',
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Swal.fire({
        icon: 'warning',
        title: 'Email không hợp lệ',
        text: 'Vui lòng nhập địa chỉ email đúng định dạng',
      });
      return;
    }

    // Validate phone format (if provided)
    if (formData.phone) {
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
        Swal.fire({
          icon: 'warning',
          title: 'Số điện thoại không hợp lệ',
          text: 'Vui lòng nhập số điện thoại 10-11 chữ số',
        });
        return;
      }
    }

    // Show loading
    Swal.fire({
      title: 'Đang gửi...',
      text: 'Vui lòng đợi trong giây lát',
      allowOutsideClick: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      },
    });

    // Simulate API call (replace with actual API call when backend is ready)
    setTimeout(() => {
      // Success
      Swal.fire({
        icon: 'success',
        title: 'Gửi thành công!',
        text: 'Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi trong thời gian sớm nhất.',
        confirmButtonText: 'Đóng',
      }).then(() => {
        // Reset form
        form.reset();
      });

      // Log to console (for testing)
      console.log('Contact form submitted:', formData);

      // TODO: Replace with actual API call when backend is ready
      // Example:
      // try {
      //   const response = await fetch(`${API_BASE_URL}/contact`, {
      //     method: 'POST',
      //     headers: {
      //       'Content-Type': 'application/json',
      //     },
      //     body: JSON.stringify(formData),
      //   });
      //
      //   if (response.ok) {
      //     Swal.fire({
      //       icon: 'success',
      //       title: 'Gửi thành công!',
      //       text: 'Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi trong thời gian sớm nhất.',
      //     }).then(() => {
      //       form.reset();
      //     });
      //   } else {
      //     throw new Error('Failed to send message');
      //   }
      // } catch (error) {
      //   console.error('Error sending contact form:', error);
      //   Swal.fire({
      //     icon: 'error',
      //     title: 'Có lỗi xảy ra',
      //     text: 'Không thể gửi tin nhắn. Vui lòng thử lại sau.',
      //   });
      // }
    }, 1500);
  });
}

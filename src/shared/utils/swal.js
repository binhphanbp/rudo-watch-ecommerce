import Swal from 'sweetalert2';

// Cấu hình Toast
export const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  },
});

// Loading helper
export const showLoading = (title = 'Đang xử lý...') => {
  return Swal.fire({
    title,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
};

// Success toast
export const showSuccess = (message, title = 'Thành công!') => {
  return Toast.fire({
    icon: 'success',
    title,
    text: message
  });
};

// Error toast
export const showError = (message, title = 'Lỗi!') => {
  return Toast.fire({
    icon: 'error',
    title,
    text: message
  });
};

// Success dialog
export const showSuccessDialog = (message, title = 'Thành công!', timer = 2000) => {
  return Swal.fire({
    icon: 'success',
    title,
    text: message,
    timer,
    showConfirmButton: false
  });
};

// Error dialog
export const showErrorDialog = (message, title = 'Lỗi!') => {
  return Swal.fire({
    icon: 'error',
    title,
    text: message,
    confirmButtonText: 'Đóng'
  });
};

// Confirm dialog
export const showConfirm = (message, title = 'Xác nhận', confirmText = 'Xác nhận', cancelText = 'Hủy') => {
  return Swal.fire({
    title,
    text: message,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: confirmText,
    cancelButtonText: cancelText
  });
};

export default Swal;

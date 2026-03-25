import Swal from 'sweetalert2';

// Toast notification (auto-dismiss)
export const toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

// Success toast
export const showSuccess = (message: string) => {
  toast.fire({ icon: 'success', title: message });
};

// Error toast
export const showError = (message: string) => {
  toast.fire({ icon: 'error', title: message });
};

// Warning toast
export const showWarning = (message: string) => {
  toast.fire({ icon: 'warning', title: message });
};

// Confirm dialog
export const showConfirm = async (
  title: string,
  text: string,
  confirmText = 'Xác nhận',
  cancelText = 'Huỷ'
) => {
  const result = await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#ef4444',
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  });
  return result.isConfirmed;
};

// Loading
export const showLoading = (title = 'Đang xử lý...') => {
  Swal.fire({
    title,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

export const hideLoading = () => {
  Swal.close();
};

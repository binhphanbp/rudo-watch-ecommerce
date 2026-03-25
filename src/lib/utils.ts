import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Classname merge utility (kết hợp clsx + tailwind-merge)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format giá tiền VNĐ
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
}

// Format ngày tháng
export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(dateString));
}

// Format ngày tháng đầy đủ
export function formatDateTime(dateString: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Tính phần trăm giảm giá
export function getDiscountPercent(price: number, salePrice: number): number {
  if (!price || !salePrice || salePrice >= price) return 0;
  return Math.round(((price - salePrice) / price) * 100);
}

// Generate avatar URL từ tên
export function getAvatarUrl(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;
}

// Order status mapping
export const ORDER_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800' },
  shipping: { label: 'Đang giao', color: 'bg-purple-100 text-purple-800' },
  delivered: { label: 'Đã giao', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Đã huỷ', color: 'bg-red-100 text-red-800' },
};

export const PAYMENT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'Chưa thanh toán', color: 'bg-yellow-100 text-yellow-800' },
  paid: { label: 'Đã thanh toán', color: 'bg-green-100 text-green-800' },
  failed: { label: 'Thanh toán lỗi', color: 'bg-red-100 text-red-800' },
  refunded: { label: 'Đã hoàn tiền', color: 'bg-gray-100 text-gray-800' },
};

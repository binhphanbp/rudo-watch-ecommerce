import api from '@/lib/api';
import type { IApiResponse, IProduct, ICategory, IBrand, IReview, IPost, IVoucher, IShippingMethod, IFavorite, IAddress } from '@/types';

// ============================================
// PRODUCTS (ADMIN)
// ============================================
export const productApi = {
  getProducts: (params?: { page?: number; per_page?: number; category_id?: string; brand_id?: string; search?: string; sort?: string; status?: string }) =>
    api.get<IApiResponse<IProduct[]>>('/products', { params }),

  getProduct: (slug: string) =>
    api.get<IApiResponse<IProduct>>(`/products/${slug}`),

  createProduct: (data: Record<string, unknown>) =>
    api.post<IApiResponse<IProduct>>('/products', data),

  updateProduct: (id: string, data: Record<string, unknown>) =>
    api.put<IApiResponse<IProduct>>(`/products/${id}`, data),

  deleteProduct: (id: string) =>
    api.delete<IApiResponse<null>>(`/products/${id}`),
};

// ============================================
// CATEGORIES
// ============================================
export const categoryApi = {
  getCategories: () =>
    api.get<IApiResponse<ICategory[]>>('/categories'),

  getCategory: (id: string) =>
    api.get<IApiResponse<ICategory>>(`/categories/${id}`),

  createCategory: (data: Record<string, unknown>) =>
    api.post<IApiResponse<ICategory>>('/categories', data),

  updateCategory: (id: string, data: Record<string, unknown>) =>
    api.put<IApiResponse<ICategory>>(`/categories/${id}`, data),

  deleteCategory: (id: string) =>
    api.delete<IApiResponse<null>>(`/categories/${id}`),
};

// ============================================
// BRANDS
// ============================================
export const brandApi = {
  getBrands: () =>
    api.get<IApiResponse<IBrand[]>>('/brands'),

  getBrand: (id: string) =>
    api.get<IApiResponse<IBrand>>(`/brands/${id}`),

  createBrand: (data: Record<string, unknown>) =>
    api.post<IApiResponse<IBrand>>('/brands', data),

  updateBrand: (id: string, data: Record<string, unknown>) =>
    api.put<IApiResponse<IBrand>>(`/brands/${id}`, data),

  deleteBrand: (id: string) =>
    api.delete<IApiResponse<null>>(`/brands/${id}`),
};

// ============================================
// CART
// ============================================
export const cartApi = {
  getCart: () =>
    api.get<IApiResponse<{ items: import('@/types').ICartItem[] }>>('/cart'),

  addToCart: (data: { product_id: string; variant_id: string; quantity: number }) =>
    api.post<IApiResponse<null>>('/cart', data),

  updateCartItem: (itemId: string, quantity: number) =>
    api.put<IApiResponse<null>>(`/cart/${itemId}`, { quantity }),

  removeCartItem: (itemId: string) =>
    api.delete<IApiResponse<null>>(`/cart/${itemId}`),

  clearCart: () =>
    api.delete<IApiResponse<null>>('/cart'),
};

// ============================================
// ORDERS
// ============================================
export const orderApi = {
  createOrder: (data: Record<string, unknown>) =>
    api.post<IApiResponse<import('@/types').IOrder>>('/orders', data),

  getOrders: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<IApiResponse<import('@/types').IOrder[]>>('/orders', { params }),

  getOrder: (id: string) =>
    api.get<IApiResponse<import('@/types').IOrder>>(`/orders/${id}`),

  cancelOrder: (id: string) =>
    api.put<IApiResponse<null>>(`/orders/${id}/cancel`),
};

// ============================================
// REVIEWS
// ============================================
export const reviewApi = {
  getReviews: (productId: string) =>
    api.get<IApiResponse<IReview[]>>(`/reviews`, { params: { product_id: productId } }),

  createReview: (data: { product_id: string; rating: number; comment: string }) =>
    api.post<IApiResponse<IReview>>('/reviews', data),
};

// ============================================
// FAVORITES
// ============================================
export const favoriteApi = {
  getFavorites: () =>
    api.get<IApiResponse<IFavorite[]>>('/favorites'),

  toggleFavorite: (productId: string) =>
    api.post<IApiResponse<null>>(`/favorites/${productId}`),
};

// ============================================
// POSTS (BLOG)
// ============================================
export const postApi = {
  getPosts: (params?: { page?: number; limit?: number; category?: string }) =>
    api.get<IApiResponse<IPost[]>>('/posts', { params }),

  getPost: (slug: string) =>
    api.get<IApiResponse<IPost>>(`/posts/${slug}`),
};

// ============================================
// VOUCHERS
// ============================================
export const voucherApi = {
  getVouchers: () =>
    api.get<IApiResponse<IVoucher[]>>('/vouchers'),

  checkVoucher: (code: string, orderTotal: number) =>
    api.post<IApiResponse<IVoucher>>('/vouchers/check', { code, order_total: orderTotal }),
};

// ============================================
// ADDRESSES
// ============================================
export const addressApi = {
  getAddresses: () =>
    api.get<IApiResponse<IAddress[]>>('/addresses'),

  createAddress: (data: Omit<IAddress, '_id' | 'id' | 'user_id'>) =>
    api.post<IApiResponse<IAddress>>('/addresses', data),

  updateAddress: (id: string, data: Partial<IAddress>) =>
    api.put<IApiResponse<IAddress>>(`/addresses/${id}`, data),

  deleteAddress: (id: string) =>
    api.delete<IApiResponse<null>>(`/addresses/${id}`),

  setDefault: (id: string) =>
    api.patch<IApiResponse<null>>(`/addresses/${id}/default`),
};

// ============================================
// SHIPPING METHODS
// ============================================
export const shippingApi = {
  getShippingMethods: () =>
    api.get<IApiResponse<IShippingMethod[]>>('/shipping-methods'),
};

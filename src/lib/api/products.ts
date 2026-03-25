import api from '@/lib/api';
import type { IApiResponse, IProduct, IPaginatedData } from '@/types';

export interface ProductsParams {
  page?: number;
  limit?: number;
  category?: string;
  brand?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  min_price?: number;
  max_price?: number;
  status?: string;
}

export const productApi = {
  // Danh sách sản phẩm (có filter, sort, pagination)
  getProducts: (params?: ProductsParams) =>
    api.get<IApiResponse<IPaginatedData<IProduct>>>('/products', { params }),

  // Chi tiết sản phẩm theo ID
  getProduct: (id: string) =>
    api.get<IApiResponse<IProduct>>(`/products/${id}`),

  // Chi tiết sản phẩm theo slug
  getProductBySlug: (slug: string) =>
    api.get<IApiResponse<IProduct>>(`/products/slug/${slug}`),

  // Sản phẩm mới nhất
  getNewArrivals: (limit = 8) =>
    api.get<IApiResponse<IProduct[]>>('/products', {
      params: { sort: 'created_at', order: 'desc', limit, status: 'active' },
    }),

  // Sản phẩm bán chạy
  getBestSellers: (limit = 8) =>
    api.get<IApiResponse<IProduct[]>>('/products', {
      params: { sort: 'sold', order: 'desc', limit, status: 'active' },
    }),

  // Sản phẩm nổi bật
  getFeatured: (limit = 8) =>
    api.get<IApiResponse<IProduct[]>>('/products', {
      params: { sort: 'views', order: 'desc', limit, status: 'active' },
    }),

  // Sản phẩm liên quan
  getRelated: (productId: string, limit = 4) =>
    api.get<IApiResponse<IProduct[]>>(`/products/${productId}/related`, {
      params: { limit },
    }),
};

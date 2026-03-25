import useSWR, { type SWRConfiguration } from 'swr';
import api from '@/lib/api';
import type { IProduct, ICategory, IBrand, IPost, IOrder, IAddress, IFavorite, IShippingMethod, IPaginatedData } from '@/types';

// ============================================
// GLOBAL FETCHER — dùng Axios instance có sẵn JWT interceptor
// ============================================
export const fetcher = <T>(url: string): Promise<T> =>
  api.get(url).then((res) => res.data.data);

// Helper: fetcher with params (serialize params into key)
const fetcherWithParams = <T>(url: string): Promise<T> =>
  api.get(url).then((res) => res.data.data);

// ============================================
// PRODUCT HOOKS
// ============================================

/** Hook lấy danh sách sản phẩm theo params (page, sort, filter...) */
export function useProducts(params?: Record<string, string | number | undefined>, config?: SWRConfiguration) {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== '') searchParams.set(key, String(val));
    });
  }
  const queryString = searchParams.toString();
  const key = `/products${queryString ? `?${queryString}` : ''}`;

  return useSWR<IPaginatedData<IProduct>>(key, fetcherWithParams, {
    keepPreviousData: true,
    ...config,
  });
}

/** Hook lấy sản phẩm theo slug */
export function useProductBySlug(slug: string | null, config?: SWRConfiguration) {
  return useSWR<IProduct>(
    slug ? `/products/slug/${slug}` : null,
    fetcher,
    config,
  );
}

/** Hook lấy sản phẩm liên quan */
export function useRelatedProducts(productId: string | null, limit = 4, config?: SWRConfiguration) {
  return useSWR<IProduct[]>(
    productId ? `/products/${productId}/related?limit=${limit}` : null,
    fetcher,
    config,
  );
}

/** Hook lấy sản phẩm cho trang Home (new, best, featured) */
export function useHomeProducts(type: 'new' | 'best' | 'featured', limit = 8, config?: SWRConfiguration) {
  const paramsMap = {
    new: { sort: 'created_at', order: 'desc', limit, status: 'active' },
    best: { sort: 'sold', order: 'desc', limit, status: 'active' },
    featured: { sort: 'views', order: 'desc', limit, status: 'active' },
  };
  const p = paramsMap[type];
  const key = `/products?sort=${p.sort}&order=${p.order}&limit=${p.limit}&status=${p.status}`;

  return useSWR<IProduct[] | IPaginatedData<IProduct>>(key, fetcher, config);
}

// ============================================
// CATEGORY & BRAND HOOKS
// ============================================

export function useCategories(config?: SWRConfiguration) {
  return useSWR<ICategory[]>('/categories', fetcher, config);
}

export function useBrands(config?: SWRConfiguration) {
  return useSWR<IBrand[]>('/brands', fetcher, config);
}

// ============================================
// POST HOOKS
// ============================================

export function usePosts(params?: { page?: number; limit?: number }, config?: SWRConfiguration) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  const qs = searchParams.toString();
  return useSWR<IPost[]>(`/posts${qs ? `?${qs}` : ''}`, fetcher, config);
}

// ============================================
// ORDER HOOKS
// ============================================

export function useOrders(params?: { page?: number; limit?: number; status?: string }, config?: SWRConfiguration) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.status) searchParams.set('status', params.status);
  const qs = searchParams.toString();
  return useSWR<IOrder[]>(`/orders${qs ? `?${qs}` : ''}`, fetcher, config);
}

// ============================================
// ADDRESS HOOKS
// ============================================

export function useAddresses(shouldFetch = true, config?: SWRConfiguration) {
  return useSWR<IAddress[]>(shouldFetch ? '/addresses' : null, fetcher, config);
}

// ============================================
// SHIPPING HOOKS
// ============================================

export function useShippingMethods(shouldFetch = true, config?: SWRConfiguration) {
  return useSWR<IShippingMethod[]>(shouldFetch ? '/shipping-methods' : null, fetcher, config);
}

// ============================================
// FAVORITE HOOKS
// ============================================

export function useFavorites(shouldFetch = true, config?: SWRConfiguration) {
  return useSWR<IFavorite[]>(shouldFetch ? '/favorites' : null, fetcher, config);
}

// ============================================
// DASHBOARD HOOKS (Admin)
// ============================================

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  newUsersThisMonth?: number;
  newOrdersToday?: number;
  pendingOrders?: number;
}

export function useDashboardStats(config?: SWRConfiguration) {
  return useSWR<DashboardStats>('/users/dashboard', fetcher, config);
}

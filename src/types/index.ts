// ============================================
// PRODUCT TYPES
// ============================================
export interface IProduct {
  _id: string;
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  category_id: string | ICategory;
  brand_id: string | IBrand;
  specifications?: Record<string, unknown>;
  model_code?: string;
  status: 'active' | 'inactive';
  variants?: IProductVariant[];
  reviews?: IReview[];
  created_at: string;
  updated_at: string;
}

export interface IProductVariant {
  _id: string;
  id: string;
  product_id: string;
  sku: string;
  color?: string;
  size?: string;
  price: number;
  sale_price?: number;
  stock: number;
  image?: string;
  is_default: boolean;
  status: 'active' | 'inactive';
}

// ============================================
// CATEGORY & BRAND
// ============================================
export interface ICategory {
  _id: string;
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent_id?: string | null;
  status: 'active' | 'inactive';
}

export interface IBrand {
  _id: string;
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  status: 'active' | 'inactive';
}

// ============================================
// USER & AUTH
// ============================================
export interface IUser {
  _id: string;
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive';
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  full_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
}

export interface IAuthResponse {
  token: string;
  user: IUser;
}

// ============================================
// CART
// ============================================
export interface ICart {
  _id: string;
  user_id: string;
  items: ICartItem[];
}

export interface ICartItem {
  _id: string;
  product_id: string | IProduct;
  variant_id: string | IProductVariant;
  quantity: number;
  product?: IProduct;
  variant?: IProductVariant;
}

// ============================================
// ORDER
// ============================================
export interface IOrder {
  _id: string;
  id: string;
  user_id: string;
  order_code: string;
  items: IOrderItem[];
  shipping_address: IAddress;
  shipping_method_id?: string;
  payment_method: string;
  subtotal: number;
  shipping_fee: number;
  discount: number;
  total: number;
  status: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface IOrderItem {
  product_id: string | IProduct;
  variant_id: string | IProductVariant;
  quantity: number;
  price: number;
  product_name: string;
  variant_info?: string;
}

// ============================================
// ADDRESS
// ============================================
export interface IAddress {
  _id: string;
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  detail: string;
  is_default: boolean;
}

// ============================================
// REVIEW
// ============================================
export interface IReview {
  _id: string;
  id: string;
  user_id: string | IUser;
  product_id: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

// ============================================
// POST (BLOG)
// ============================================
export interface IPost {
  _id: string;
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  image?: string;
  category_id?: string | IPostCategory;
  author_id?: string | IUser;
  status: 'published' | 'draft';
  views: number;
  created_at: string;
  updated_at: string;
}

export interface IPostCategory {
  _id: string;
  id: string;
  name: string;
  slug: string;
}

// ============================================
// VOUCHER
// ============================================
export interface IVoucher {
  _id: string;
  id: string;
  code: string;
  name: string;
  description?: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order_value: number;
  max_discount?: number;
  usage_limit: number;
  used_count: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'inactive';
}

// ============================================
// FAVORITE
// ============================================
export interface IFavorite {
  _id: string;
  user_id: string;
  product_id: string | IProduct;
  product?: IProduct;
}

// ============================================
// SHIPPING
// ============================================
export interface IShippingMethod {
  _id: string;
  id: string;
  name: string;
  description?: string;
  price: number;
  estimated_days: string;
  status: 'active' | 'inactive';
}

// ============================================
// API RESPONSE
// ============================================
export interface IApiResponse<T = unknown> {
  status: 'success' | 'error';
  statusCode: number;
  data: T;
  message?: string;
}

export interface IPaginatedData<T> {
  items: T[];
  pagination: IPagination;
}

export interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

'use client';

import { useEffect, useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ShoppingCart, Heart, Minus, Plus } from 'lucide-react';
import { productApi } from '@/lib/api/products';
import { getImageUrl } from '@/lib/api';
import { formatPrice, getDiscountPercent } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToCart } from '@/store/cartSlice';
import { showSuccess, showError } from '@/lib/swal';
import ProductCard from '@/components/client/ProductCard';
import type { IProduct, IProductVariant } from '@/types';

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [product, setProduct] = useState<IProduct | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<IProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<IProduct[]>([]);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');

  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const { data: res } = await productApi.getProductBySlug(slug);
        const prod = res.data;
        setProduct(prod);

        // Set default variant
        const defVariant = prod.variants?.find((v) => v.is_default) || prod.variants?.[0];
        if (defVariant) setSelectedVariant(defVariant);

        // Fetch related
        try {
          const { data: relRes } = await productApi.getRelated(prod._id, 4);
          const relData = relRes.data;
          setRelatedProducts(Array.isArray(relData) ? relData : []);
        } catch { /* ignore */ }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      showError('Bạn cần đăng nhập để thêm vào giỏ hàng');
      return;
    }
    if (!product || !selectedVariant) return;
    try {
      await dispatch(addToCart({ productId: product._id, variantId: selectedVariant._id, quantity })).unwrap();
      showSuccess('Đã thêm vào giỏ hàng!');
    } catch {
      showError('Không thể thêm vào giỏ hàng');
    }
  };

  if (loading) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
          <div className="aspect-square bg-gray-200 dark:bg-slate-700 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4" />
            <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
            <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/3" />
            <div className="h-20 bg-gray-200 dark:bg-slate-700 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Không tìm thấy sản phẩm</h2>
        <Link href="/products" className="text-blue-500 mt-4 inline-block">← Quay lại danh sách</Link>
      </div>
    );
  }

  const price = selectedVariant?.price || 0;
  const salePrice = selectedVariant?.sale_price;
  const discount = salePrice ? getDiscountPercent(price, salePrice) : 0;
  const displayPrice = salePrice || price;

  return (
    <div className="py-8 bg-white dark:bg-[#0f172a]">
      <div className="max-w-screen-xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-blue-500">Trang chủ</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-blue-500">Sản phẩm</Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-medium">{product.name}</span>
        </div>

        {/* Product detail */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Image */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 dark:bg-slate-800">
            <Image
              src={getImageUrl(selectedVariant?.image || product.image)}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
            {discount > 0 && (
              <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-lg">
                -{discount}%
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            {/* Brand */}
            {product.brand_id && typeof product.brand_id === 'object' && (
              <span className="text-sm text-gray-400 uppercase tracking-wider font-medium mb-2">
                {product.brand_id.name}
              </span>
            )}

            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mb-4">
              {product.name}
            </h1>

            {/* Rating placeholder */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <span className="text-sm text-gray-500">(0 đánh giá)</span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {formatPrice(displayPrice)}
              </span>
              {salePrice && salePrice < price && (
                <span className="text-lg text-gray-400 line-through">{formatPrice(price)}</span>
              )}
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 1 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-3">Phân loại:</h3>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant._id}
                      onClick={() => { setSelectedVariant(variant); setQuantity(1); }}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                        selectedVariant?._id === variant._id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                          : 'border-gray-200 dark:border-slate-700 hover:border-blue-300'
                      }`}
                    >
                      {variant.color || variant.sku}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock */}
            {selectedVariant && (
              <p className="text-sm text-gray-500 mb-6">
                Còn lại: <span className="font-semibold text-green-600">{selectedVariant.stock}</span> sản phẩm
              </p>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-8">
              <span className="text-sm font-semibold">Số lượng:</span>
              <div className="flex items-center border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(selectedVariant?.stock || 99, quantity + 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-semibold transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                Thêm vào giỏ hàng
              </button>
              <button className="w-14 h-14 border border-gray-200 dark:border-slate-700 rounded-xl flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 transition-colors">
                <Heart className="w-5 h-5 text-gray-500 hover:text-red-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-slate-700 mb-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('description')}
              className={`py-4 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'description'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Mô tả sản phẩm
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-4 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'reviews'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Đánh giá
            </button>
          </div>
        </div>

        {activeTab === 'description' && (
          <div className="prose dark:prose-invert max-w-none mb-16" dangerouslySetInnerHTML={{ __html: product.description || 'Chưa có mô tả.' }} />
        )}

        {activeTab === 'reviews' && (
          <div className="mb-16">
            <p className="text-gray-500">Chưa có đánh giá nào.</p>
          </div>
        )}

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Sản phẩm liên quan</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

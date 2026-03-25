'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, Eye } from 'lucide-react';
import { formatPrice, getDiscountPercent } from '@/lib/utils';
import { getImageUrl } from '@/lib/api';
import type { IProduct, IProductVariant } from '@/types';

interface ProductCardProps {
  product: IProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  // Get default variant or first variant
  const defaultVariant: IProductVariant | undefined =
    product.variants?.find((v) => v.is_default) || product.variants?.[0];

  const price = defaultVariant?.price || 0;
  const salePrice = defaultVariant?.sale_price;
  const discount = salePrice ? getDiscountPercent(price, salePrice) : 0;
  const displayPrice = salePrice || price;
  const imageUrl = getImageUrl(product.image);

  return (
    <Link href={`/products/${product.slug}`} className="block group">
      <div className="product-card bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-white/5 h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-square rounded-xl overflow-hidden mb-4 bg-gray-50 dark:bg-slate-700">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Discount badge */}
          {discount > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
              -{discount}%
            </div>
          )}
          {/* Hover actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors transform translate-y-4 group-hover:translate-y-0 duration-300"
            >
              <Heart className="w-4 h-4 text-gray-700 dark:text-white" />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors transform translate-y-4 group-hover:translate-y-0 duration-300 delay-75"
            >
              <ShoppingCart className="w-4 h-4 text-gray-700 dark:text-white" />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors transform translate-y-4 group-hover:translate-y-0 duration-300 delay-150"
            >
              <Eye className="w-4 h-4 text-gray-700 dark:text-white" />
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col flex-1">
          {/* Brand */}
          {product.brand_id && typeof product.brand_id === 'object' && (
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider mb-1">
              {product.brand_id.name}
            </span>
          )}

          {/* Name */}
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors min-h-[2.5rem]">
            {product.name}
          </h3>

          {/* Price */}
          <div className="mt-auto flex items-center gap-2">
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {formatPrice(displayPrice)}
            </span>
            {salePrice && salePrice < price && (
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(price)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

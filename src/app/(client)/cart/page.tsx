'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCart, updateQuantity, removeItem, clearCart } from '@/store/cartSlice';
import { getImageUrl } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { showConfirm, showSuccess, showError } from '@/lib/swal';
import type { IProduct, IProductVariant } from '@/types';

export default function CartPage() {
  const dispatch = useAppDispatch();
  const { items, isLoading } = useAppSelector((s) => s.cart);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchCart());
  }, [isAuthenticated, dispatch]);

  const getItemProduct = (item: typeof items[0]): IProduct | null =>
    typeof item.product_id === 'object' ? item.product_id as IProduct : item.product || null;

  const getItemVariant = (item: typeof items[0]): IProductVariant | null =>
    typeof item.variant_id === 'object' ? item.variant_id as IProductVariant : item.variant || null;

  const subtotal = items.reduce((sum, item) => {
    const variant = getItemVariant(item);
    const price = variant?.sale_price || variant?.price || 0;
    return sum + price * item.quantity;
  }, 0);

  const handleRemove = async (itemId: string) => {
    const confirmed = await showConfirm('Xoá sản phẩm?', 'Bạn có chắc muốn xoá khỏi giỏ hàng?');
    if (!confirmed) return;
    try { await dispatch(removeItem(itemId)).unwrap(); showSuccess('Đã xoá'); } catch { showError('Lỗi'); }
  };

  const handleClear = async () => {
    const confirmed = await showConfirm('Xoá tất cả?', 'Bạn có chắc muốn xoá toàn bộ giỏ hàng?');
    if (!confirmed) return;
    try { await dispatch(clearCart()).unwrap(); showSuccess('Đã xoá'); } catch { showError('Lỗi'); }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-20 px-4">
        <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold mb-2">Bạn cần đăng nhập</h2>
        <p className="text-gray-500 mb-6">Đăng nhập để xem giỏ hàng của bạn</p>
        <Link href="/login" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">Đăng nhập</Link>
      </div>
    );
  }

  if (items.length === 0 && !isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-20 px-4">
        <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold mb-2">Giỏ hàng trống</h2>
        <p className="text-gray-500 mb-6">Hãy thêm sản phẩm yêu thích vào giỏ hàng</p>
        <Link href="/products" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">Mua sắm ngay</Link>
      </div>
    );
  }

  return (
    <div className="py-8 bg-white dark:bg-[#0f172a] min-h-screen">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Giỏ hàng ({items.length})</h1>
          {items.length > 0 && (
            <button onClick={handleClear} className="text-sm text-red-500 hover:text-red-600 font-medium">Xoá tất cả</button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const product = getItemProduct(item);
              const variant = getItemVariant(item);
              if (!product || !variant) return null;
              const price = variant.sale_price || variant.price;

              return (
                <div key={item._id} className="flex gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700">
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-white dark:bg-slate-700 shrink-0">
                    <Image src={getImageUrl(product.image)} alt={product.name} width={96} height={96} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${product.slug}`} className="font-semibold text-sm hover:text-blue-600 line-clamp-2">{product.name}</Link>
                    <p className="text-xs text-gray-500 mt-1">{variant.color || variant.sku}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden">
                        <button onClick={() => dispatch(updateQuantity({ itemId: item._id, quantity: Math.max(1, item.quantity - 1) }))} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700"><Minus className="w-3 h-3" /></button>
                        <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                        <button onClick={() => dispatch(updateQuantity({ itemId: item._id, quantity: item.quantity + 1 }))} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700"><Plus className="w-3 h-3" /></button>
                      </div>
                      <span className="font-bold text-blue-600">{formatPrice(price * item.quantity)}</span>
                    </div>
                  </div>
                  <button onClick={() => handleRemove(item._id)} className="text-gray-400 hover:text-red-500 transition-colors self-start"><Trash2 className="w-4 h-4" /></button>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 sticky top-24">
              <h3 className="font-bold text-lg mb-4">Tóm tắt đơn hàng</h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Tạm tính</span><span className="font-medium">{formatPrice(subtotal)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Phí vận chuyển</span><span className="text-green-600 font-medium">Miễn phí</span></div>
                <hr className="border-gray-200 dark:border-slate-700" />
                <div className="flex justify-between"><span className="font-bold">Tổng cộng</span><span className="font-bold text-lg text-blue-600">{formatPrice(subtotal)}</span></div>
              </div>
              <Link href="/checkout" className="block w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-center transition-colors">Thanh toán</Link>
              <Link href="/products" className="flex items-center justify-center gap-2 mt-3 text-sm text-gray-500 hover:text-blue-600 transition-colors"><ArrowLeft className="w-4 h-4" />Tiếp tục mua sắm</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

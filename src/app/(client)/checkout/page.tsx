'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Truck, CreditCard, Tag, FileText, ChevronRight, Plus, Check } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearCart } from '@/store/cartSlice';
import { addressApi, shippingApi, voucherApi, orderApi } from '@/lib/api/services';
import { getImageUrl } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import type { IAddress, IShippingMethod, ICartItem } from '@/types';
import Swal from 'sweetalert2';

const PAYMENT_METHODS = [
  { id: 'cod', label: 'Thanh toán khi nhận hàng (COD)', icon: '💵' },
  { id: 'bank_transfer', label: 'Chuyển khoản ngân hàng', icon: '🏦' },
  { id: 'momo', label: 'Ví MoMo', icon: '📱' },
  { id: 'vnpay', label: 'VNPay', icon: '💳' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const { items, totalCount } = useAppSelector((s) => s.cart);

  const [addresses, setAddresses] = useState<IAddress[]>([]);
  const [shippingMethods, setShippingMethods] = useState<IShippingMethod[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [selectedShipping, setSelectedShipping] = useState<string>('');
  const [selectedPayment, setSelectedPayment] = useState('cod');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherApplied, setVoucherApplied] = useState(false);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // New address form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    receiver_name: '',
    receiver_phone: '',
    province: '',
    ward: '',
    street: '',
    is_default: false,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (totalCount === 0) {
      router.push('/cart');
      return;
    }
    fetchData();
  }, [isAuthenticated, totalCount, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [addrRes, shipRes] = await Promise.allSettled([
        addressApi.getAddresses(),
        shippingApi.getShippingMethods(),
      ]);
      if (addrRes.status === 'fulfilled') {
        const data = addrRes.value.data.data;
        const addrs = Array.isArray(data) ? data : [];
        setAddresses(addrs);
        const defaultAddr = addrs.find((a) => a.is_default);
        if (defaultAddr) setSelectedAddress(defaultAddr._id);
        else if (addrs.length > 0) setSelectedAddress(addrs[0]._id);
      }
      if (shipRes.status === 'fulfilled') {
        const data = shipRes.value.data.data;
        const methods = Array.isArray(data) ? data : [];
        setShippingMethods(methods);
        if (methods.length > 0) setSelectedShipping(methods[0]._id);
      }
    } catch (error) {
      console.error('Error fetching checkout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getItemPrice = (item: ICartItem) => {
    const variant = typeof item.variant_id === 'object' ? item.variant_id : item.variant;
    return variant ? (variant.sale_price || variant.price) : 0;
  };

  const subtotal = items.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0);

  const shippingFee = shippingMethods.find((m) => m._id === selectedShipping)?.price || 0;
  const total = subtotal + shippingFee - voucherDiscount;

  const handleCheckVoucher = async () => {
    if (!voucherCode.trim()) return;
    try {
      const { data: res } = await voucherApi.checkVoucher(voucherCode, subtotal);
      const voucher = res.data;
      let discount = 0;
      if (voucher.discount_type === 'percent') {
        discount = (subtotal * voucher.discount_value) / 100;
        if (voucher.max_discount && discount > voucher.max_discount) {
          discount = voucher.max_discount;
        }
      } else {
        discount = voucher.discount_value;
      }
      setVoucherDiscount(discount);
      setVoucherApplied(true);
      Swal.fire({ icon: 'success', title: 'Áp dụng thành công!', text: `Giảm ${formatPrice(discount)}`, timer: 2000, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: 'error', title: 'Mã không hợp lệ', text: 'Vui lòng kiểm tra lại mã giảm giá', timer: 2000, showConfirmButton: false });
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.receiver_name || !newAddress.receiver_phone || !newAddress.province || !newAddress.street) {
      Swal.fire({ icon: 'warning', title: 'Thiếu thông tin', text: 'Vui lòng điền đầy đủ thông tin địa chỉ' });
      return;
    }
    try {
      const { data: res } = await addressApi.createAddress(newAddress as Omit<IAddress, '_id' | 'id' | 'user_id'>);
      const addr = res.data;
      setAddresses((prev) => [...prev, addr]);
      setSelectedAddress(addr._id);
      setShowAddressForm(false);
      setNewAddress({ receiver_name: '', receiver_phone: '', province: '', ward: '', street: '', is_default: false });
    } catch {
      Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không thể thêm địa chỉ' });
    }
  };

  const handlePlaceOrder = async () => {
    const addr = addresses.find((a) => a._id === selectedAddress);
    if (!addr) {
      Swal.fire({ icon: 'warning', title: 'Chưa chọn địa chỉ', text: 'Vui lòng chọn hoặc thêm địa chỉ giao hàng' });
      return;
    }

    setSubmitting(true);
    try {
      const orderItems = items.map((item) => {
        const variant = typeof item.variant_id === 'object' ? item.variant_id : item.variant;
        return { variant_id: variant?._id || '', quantity: item.quantity };
      });

      const orderData: Record<string, unknown> = {
        items: orderItems,
        receiver_name: addr.receiver_name,
        receiver_phone: addr.receiver_phone,
        receiver_address: `${addr.street}, ${addr.ward}, ${addr.province}`,
        payment_method: selectedPayment,
        note,
      };
      if (voucherApplied && voucherCode) {
        orderData.voucher_code = voucherCode;
      }

      await orderApi.createOrder(orderData);
      await dispatch(clearCart()).unwrap();

      await Swal.fire({
        icon: 'success',
        title: 'Đặt hàng thành công!',
        text: 'Cảm ơn bạn đã mua hàng tại Rudo Watch',
        confirmButtonText: 'Xem đơn hàng',
        confirmButtonColor: '#1e3a5f',
      });

      router.push('/profile?tab=orders');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      Swal.fire({
        icon: 'error',
        title: 'Đặt hàng thất bại',
        text: err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] py-8">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="animate-pulse space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 dark:bg-slate-800 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] py-8">
      <div className="max-w-screen-xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/cart" className="hover:text-blue-500">Giỏ hàng</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-900 dark:text-white font-medium">Thanh toán</span>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Thanh toán</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Form sections */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Address */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                  <MapPin className="w-5 h-5 text-blue-500" /> Địa chỉ giao hàng
                </h2>
                <button onClick={() => setShowAddressForm(!showAddressForm)} className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600 font-medium">
                  <Plus className="w-4 h-4" /> Thêm mới
                </button>
              </div>

              {addresses.length > 0 ? (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <label key={addr._id} className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedAddress === addr._id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'}`}>
                      <input type="radio" name="address" className="mt-1 accent-blue-500" checked={selectedAddress === addr._id} onChange={() => setSelectedAddress(addr._id)} />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{addr.receiver_name} <span className="text-gray-500 font-normal">| {addr.receiver_phone}</span></p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{addr.street}, {addr.ward}, {addr.province}</p>
                        {addr.is_default && <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full font-medium">Mặc định</span>}
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Chưa có địa chỉ. Vui lòng thêm địa chỉ giao hàng.</p>
              )}

              {/* New address form */}
              {showAddressForm && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl space-y-3 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input type="text" placeholder="Tên người nhận *" value={newAddress.receiver_name} onChange={(e) => setNewAddress({ ...newAddress, receiver_name: e.target.value })} className="px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="text" placeholder="Số điện thoại *" value={newAddress.receiver_phone} onChange={(e) => setNewAddress({ ...newAddress, receiver_phone: e.target.value })} className="px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <input type="text" placeholder="Tỉnh/Thành phố *" value={newAddress.province} onChange={(e) => setNewAddress({ ...newAddress, province: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="text" placeholder="Phường/Xã" value={newAddress.ward} onChange={(e) => setNewAddress({ ...newAddress, ward: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="text" placeholder="Địa chỉ chi tiết (số nhà, đường...) *" value={newAddress.street} onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={newAddress.is_default} onChange={(e) => setNewAddress({ ...newAddress, is_default: e.target.checked })} className="accent-blue-500" />
                      Đặt làm mặc định
                    </label>
                    <div className="flex gap-2">
                      <button onClick={() => setShowAddressForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg">Huỷ</button>
                      <button onClick={handleAddAddress} className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600">Lưu</button>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* 2. Shipping */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white mb-4">
                <Truck className="w-5 h-5 text-blue-500" /> Phương thức vận chuyển
              </h2>
              <div className="space-y-3">
                {shippingMethods.map((method) => (
                  <label key={method._id} className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedShipping === method._id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="shipping" className="accent-blue-500" checked={selectedShipping === method._id} onChange={() => setSelectedShipping(method._id)} />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{method.name}</p>
                        {method.estimated_days && <p className="text-xs text-gray-500 mt-0.5">Dự kiến {method.estimated_days}</p>}
                      </div>
                    </div>
                    <span className="font-semibold text-blue-600">{formatPrice(method.price)}</span>
                  </label>
                ))}
                {shippingMethods.length === 0 && <p className="text-sm text-gray-500">Không có phương thức vận chuyển khả dụng</p>}
              </div>
            </section>

            {/* 3. Payment */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white mb-4">
                <CreditCard className="w-5 h-5 text-blue-500" /> Phương thức thanh toán
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PAYMENT_METHODS.map((pm) => (
                  <label key={pm.id} className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedPayment === pm.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'}`}>
                    <input type="radio" name="payment" className="accent-blue-500" checked={selectedPayment === pm.id} onChange={() => setSelectedPayment(pm.id)} />
                    <span className="text-xl">{pm.icon}</span>
                    <span className="font-medium text-sm text-slate-900 dark:text-white">{pm.label}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* 4. Note */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white mb-4">
                <FileText className="w-5 h-5 text-blue-500" /> Ghi chú
              </h2>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Ghi chú cho đơn hàng (không bắt buộc)..." className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </section>
          </div>

          {/* Right: Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm sticky top-24">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Đơn hàng ({totalCount} sản phẩm)</h2>

              {/* Items */}
              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-1">
                {items.map((item) => {
                  const product = typeof item.product_id === 'object' ? item.product_id : item.product;
                  const variant = typeof item.variant_id === 'object' ? item.variant_id : item.variant;
                  return (
                    <div key={item._id} className="flex gap-3">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 shrink-0">
                        <Image src={getImageUrl(variant?.image || product?.image)} alt={product?.name || ''} width={56} height={56} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{product?.name}</p>
                        {variant?.color && <p className="text-xs text-gray-500">{variant.color}</p>}
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500">x{item.quantity}</span>
                          <span className="text-sm font-semibold text-blue-600">{formatPrice(getItemPrice(item) * item.quantity)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Voucher */}
              <div className="mb-6">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" value={voucherCode} onChange={(e) => { setVoucherCode(e.target.value.toUpperCase()); setVoucherApplied(false); setVoucherDiscount(0); }} placeholder="Mã giảm giá" disabled={voucherApplied} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60" />
                  </div>
                  <button onClick={handleCheckVoucher} disabled={voucherApplied || !voucherCode.trim()} className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${voucherApplied ? 'bg-green-500 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'} disabled:opacity-60`}>
                    {voucherApplied ? <Check className="w-4 h-4" /> : 'Áp dụng'}
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-3 border-t border-gray-100 dark:border-slate-700 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tạm tính</span>
                  <span className="text-slate-900 dark:text-white">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Phí vận chuyển</span>
                  <span className="text-slate-900 dark:text-white">{shippingFee > 0 ? formatPrice(shippingFee) : 'Miễn phí'}</span>
                </div>
                {voucherDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Giảm giá</span>
                    <span className="text-green-600 font-medium">-{formatPrice(voucherDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-gray-100 dark:border-slate-700 pt-3">
                  <span className="text-slate-900 dark:text-white">Tổng cộng</span>
                  <span className="text-blue-600">{formatPrice(total > 0 ? total : 0)}</span>
                </div>
              </div>

              <button onClick={handlePlaceOrder} disabled={submitting || !selectedAddress} className="w-full mt-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wider">
                {submitting ? 'Đang xử lý...' : 'Đặt hàng'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

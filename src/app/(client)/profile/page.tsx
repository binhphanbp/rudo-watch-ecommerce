'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { User, Package, MapPin, Heart, Settings, LogOut, Eye, X as XIcon, Edit, Trash2, Plus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout, setUser } from '@/store/authSlice';
import { authApi } from '@/lib/api/auth';
import { orderApi, addressApi, favoriteApi } from '@/lib/api/services';
import { getImageUrl } from '@/lib/api';
import { formatPrice, formatDateTime, getAvatarUrl, ORDER_STATUS_MAP, PAYMENT_STATUS_MAP } from '@/lib/utils';
import type { IOrder, IAddress, IFavorite } from '@/types';
import Swal from 'sweetalert2';

const TABS = [
  { id: 'account', label: 'Tài khoản', icon: User },
  { id: 'orders', label: 'Đơn hàng', icon: Package },
  { id: 'addresses', label: 'Địa chỉ', icon: MapPin },
  { id: 'favorites', label: 'Yêu thích', icon: Heart },
];

function ProfileContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading: authLoading } = useAppSelector((s) => s.auth);

  const activeTab = searchParams.get('tab') || 'account';

  const [orders, setOrders] = useState<IOrder[]>([]);
  const [addresses, setAddresses] = useState<IAddress[]>([]);
  const [favorites, setFavorites] = useState<IFavorite[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderDetail, setOrderDetail] = useState<IOrder | null>(null);

  // Profile form
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '' });

  // Password form
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', new_password_confirmation: '' });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Address form
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [editingAddr, setEditingAddr] = useState<IAddress | null>(null);
  const [addrForm, setAddrForm] = useState({ receiver_name: '', receiver_phone: '', province: '', ward: '', street: '', is_default: false });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'addresses') fetchAddresses();
    if (activeTab === 'favorites') fetchFavorites();
    if (activeTab === 'account' && user) {
      setProfileForm({ full_name: user.full_name, phone: user.phone || '' });
    }
  }, [activeTab, isAuthenticated, user]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data: res } = await orderApi.getOrders();
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch { /* empty */ } finally { setLoading(false); }
  };

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const { data: res } = await addressApi.getAddresses();
      setAddresses(Array.isArray(res.data) ? res.data : []);
    } catch { /* empty */ } finally { setLoading(false); }
  };

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const { data: res } = await favoriteApi.getFavorites();
      setFavorites(Array.isArray(res.data) ? res.data : []);
    } catch { /* empty */ } finally { setLoading(false); }
  };

  const handleUpdateProfile = async () => {
    try {
      const { data: res } = await authApi.updateProfile(profileForm);
      dispatch(setUser(res.data));
      setEditMode(false);
      Swal.fire({ icon: 'success', title: 'Cập nhật thành công!', timer: 1500, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không thể cập nhật thông tin' });
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      Swal.fire({ icon: 'warning', title: 'Mật khẩu không khớp' }); return;
    }
    try {
      await authApi.changePassword(passwordForm);
      setShowPasswordForm(false);
      setPasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' });
      Swal.fire({ icon: 'success', title: 'Đổi mật khẩu thành công!', timer: 1500, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Mật khẩu hiện tại không đúng' });
    }
  };

  const handleCancelOrder = async (id: string) => {
    const result = await Swal.fire({ title: 'Huỷ đơn hàng?', text: 'Bạn có chắc muốn huỷ đơn hàng này?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Huỷ đơn', cancelButtonText: 'Không' });
    if (result.isConfirmed) {
      try {
        await orderApi.cancelOrder(id);
        fetchOrders();
        Swal.fire({ icon: 'success', title: 'Đã huỷ đơn hàng', timer: 1500, showConfirmButton: false });
      } catch { Swal.fire({ icon: 'error', title: 'Không thể huỷ' }); }
    }
  };

  const handleViewOrder = async (id: string) => {
    try {
      const { data: res } = await orderApi.getOrder(id);
      setOrderDetail(res.data);
    } catch { /* empty */ }
  };

  const handleSaveAddress = async () => {
    if (!addrForm.receiver_name || !addrForm.receiver_phone || !addrForm.province || !addrForm.street) {
      Swal.fire({ icon: 'warning', title: 'Thiếu thông tin' }); return;
    }
    try {
      if (editingAddr) {
        await addressApi.updateAddress(editingAddr._id, addrForm);
      } else {
        await addressApi.createAddress(addrForm as Omit<IAddress, '_id' | 'id' | 'user_id'>);
      }
      fetchAddresses();
      setShowAddrForm(false);
      setEditingAddr(null);
      setAddrForm({ receiver_name: '', receiver_phone: '', province: '', ward: '', street: '', is_default: false });
    } catch { Swal.fire({ icon: 'error', title: 'Lỗi' }); }
  };

  const handleDeleteAddress = async (id: string) => {
    const result = await Swal.fire({ title: 'Xoá địa chỉ?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Xoá', cancelButtonText: 'Không' });
    if (result.isConfirmed) {
      try { await addressApi.deleteAddress(id); fetchAddresses(); } catch { /* empty */ }
    }
  };

  const handleRemoveFavorite = async (productId: string) => {
    try { await favoriteApi.toggleFavorite(productId); fetchFavorites(); } catch { /* empty */ }
  };

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  const userAvatar = user?.avatar ? getImageUrl(user.avatar) : getAvatarUrl(user?.full_name || 'User');

  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] py-8">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm sticky top-24">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-500 mb-3">
                  <Image src={userAvatar} alt="Avatar" width={80} height={80} className="w-full h-full object-cover" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">{user.full_name}</h3>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <nav className="space-y-1">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <Link key={tab.id} href={`/profile?tab=${tab.id}`} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                      <Icon className="w-4 h-4" /> {tab.label}
                    </Link>
                  );
                })}
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <LogOut className="w-4 h-4" /> Đăng xuất
                </button>
              </nav>
            </div>
          </aside>

          {/* Content */}
          <main className="lg:col-span-3">
            {/* ACCOUNT TAB */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="flex items-center gap-2 text-lg font-bold"><Settings className="w-5 h-5 text-blue-500" /> Thông tin cá nhân</h2>
                    <button onClick={() => setEditMode(!editMode)} className="text-sm text-blue-500 hover:text-blue-600 font-medium">
                      {editMode ? 'Huỷ' : 'Chỉnh sửa'}
                    </button>
                  </div>
                  {editMode ? (
                    <div className="space-y-4 max-w-md">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Họ tên</label>
                        <input type="text" value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Số điện thoại</label>
                        <input type="text" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <button onClick={handleUpdateProfile} disabled={authLoading} className="px-6 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50">Lưu thay đổi</button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4"><span className="text-sm text-gray-500 w-28">Họ tên:</span><span className="font-medium">{user.full_name}</span></div>
                      <div className="flex items-center gap-4"><span className="text-sm text-gray-500 w-28">Email:</span><span className="font-medium">{user.email}</span></div>
                      <div className="flex items-center gap-4"><span className="text-sm text-gray-500 w-28">Điện thoại:</span><span className="font-medium">{user.phone || 'Chưa cập nhật'}</span></div>
                      <div className="flex items-center gap-4"><span className="text-sm text-gray-500 w-28">Vai trò:</span><span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full font-medium">{user.role === 'admin' ? 'Admin' : 'Khách hàng'}</span></div>
                    </div>
                  )}
                </div>

                {/* Change password */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">Đổi mật khẩu</h2>
                    <button onClick={() => setShowPasswordForm(!showPasswordForm)} className="text-sm text-blue-500 hover:text-blue-600 font-medium">{showPasswordForm ? 'Huỷ' : 'Đổi mật khẩu'}</button>
                  </div>
                  {showPasswordForm && (
                    <div className="space-y-4 max-w-md animate-fade-in">
                      <input type="password" placeholder="Mật khẩu hiện tại" value={passwordForm.current_password} onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <input type="password" placeholder="Mật khẩu mới" value={passwordForm.new_password} onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <input type="password" placeholder="Xác nhận mật khẩu mới" value={passwordForm.new_password_confirmation} onChange={(e) => setPasswordForm({ ...passwordForm, new_password_confirmation: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <button onClick={handleChangePassword} className="px-6 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600">Xác nhận</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                  <h2 className="flex items-center gap-2 text-lg font-bold"><Package className="w-5 h-5 text-blue-500" /> Đơn hàng của tôi</h2>
                </div>
                {loading ? (
                  <div className="p-6 space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />)}</div>
                ) : orders.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-slate-700">
                    {orders.map((order) => {
                      const status = ORDER_STATUS_MAP[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-800' };
                      const payStatus = PAYMENT_STATUS_MAP[order.payment_status] || { label: order.payment_status, color: 'bg-gray-100 text-gray-800' };
                      return (
                        <div key={order._id} className="p-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">#{order.order_code}</p>
                              <p className="text-sm text-gray-500 mt-1">{formatDateTime(order.created_at)}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-3 py-1 text-xs font-medium rounded-full ${status.color}`}>{status.label}</span>
                              <span className={`px-3 py-1 text-xs font-medium rounded-full ${payStatus.color}`}>{payStatus.label}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">{order.items?.length || 0} sản phẩm</span>
                              <span className="text-sm text-gray-300 dark:text-slate-600">|</span>
                              <span className="font-bold text-blue-600">{formatPrice(order.total)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleViewOrder(order._id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                <Eye className="w-3 h-3" /> Chi tiết
                              </button>
                              {order.status === 'pending' && (
                                <button onClick={() => handleCancelOrder(order._id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                  <XIcon className="w-3 h-3" /> Huỷ
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">Chưa có đơn hàng nào</p>
                    <Link href="/products" className="inline-block mt-4 text-sm text-blue-500 hover:underline">Mua sắm ngay →</Link>
                  </div>
                )}
              </div>
            )}

            {/* ORDER DETAIL MODAL */}
            {orderDetail && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setOrderDetail(null)}>
                <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">Chi tiết đơn #{orderDetail.order_code}</h3>
                    <button onClick={() => setOrderDetail(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"><XIcon className="w-5 h-5" /></button>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Trạng thái:</span><span className={`px-2 py-0.5 text-xs rounded-full font-medium ${ORDER_STATUS_MAP[orderDetail.status]?.color}`}>{ORDER_STATUS_MAP[orderDetail.status]?.label}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Thanh toán:</span><span>{orderDetail.payment_method?.toUpperCase()}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Ngày đặt:</span><span>{formatDateTime(orderDetail.created_at)}</span></div>
                    </div>
                    <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
                      <p className="font-medium mb-2">Sản phẩm:</p>
                      {orderDetail.items?.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm py-2 border-b border-gray-50 dark:border-slate-700 last:border-0">
                          <span className="flex-1">{item.product_name} {item.variant_info && <span className="text-gray-500">({item.variant_info})</span>} x{item.quantity}</span>
                          <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-gray-100 dark:border-slate-700 pt-4 space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Tạm tính:</span><span>{formatPrice(orderDetail.subtotal)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Phí ship:</span><span>{formatPrice(orderDetail.shipping_fee)}</span></div>
                      {orderDetail.discount > 0 && <div className="flex justify-between text-green-600"><span>Giảm giá:</span><span>-{formatPrice(orderDetail.discount)}</span></div>}
                      <div className="flex justify-between font-bold text-base border-t border-gray-100 dark:border-slate-700 pt-2"><span>Tổng:</span><span className="text-blue-600">{formatPrice(orderDetail.total)}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ADDRESSES TAB */}
            {activeTab === 'addresses' && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-lg font-bold"><MapPin className="w-5 h-5 text-blue-500" /> Sổ địa chỉ</h2>
                  <button onClick={() => { setShowAddrForm(true); setEditingAddr(null); setAddrForm({ receiver_name: '', receiver_phone: '', province: '', ward: '', street: '', is_default: false }); }} className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600 font-medium"><Plus className="w-4 h-4" /> Thêm mới</button>
                </div>
                {showAddrForm && (
                  <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/30 animate-fade-in">
                    <h3 className="font-bold mb-4">{editingAddr ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</h3>
                    <div className="space-y-3 max-w-lg">
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="Tên người nhận *" value={addrForm.receiver_name} onChange={(e) => setAddrForm({ ...addrForm, receiver_name: e.target.value })} className="px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <input type="text" placeholder="Số điện thoại *" value={addrForm.receiver_phone} onChange={(e) => setAddrForm({ ...addrForm, receiver_phone: e.target.value })} className="px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <input type="text" placeholder="Tỉnh/Thành phố *" value={addrForm.province} onChange={(e) => setAddrForm({ ...addrForm, province: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <input type="text" placeholder="Phường/Xã" value={addrForm.ward} onChange={(e) => setAddrForm({ ...addrForm, ward: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <input type="text" placeholder="Địa chỉ chi tiết *" value={addrForm.street} onChange={(e) => setAddrForm({ ...addrForm, street: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={addrForm.is_default} onChange={(e) => setAddrForm({ ...addrForm, is_default: e.target.checked })} className="accent-blue-500" /> Mặc định</label>
                        <div className="flex gap-2">
                          <button onClick={() => { setShowAddrForm(false); setEditingAddr(null); }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg">Huỷ</button>
                          <button onClick={handleSaveAddress} className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600">Lưu</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="divide-y divide-gray-100 dark:divide-slate-700">
                  {loading ? (
                    <div className="p-6 space-y-4">{[...Array(2)].map((_, i) => <div key={i} className="h-16 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />)}</div>
                  ) : addresses.length > 0 ? (
                    addresses.map((addr) => (
                      <div key={addr._id} className="p-6 flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{addr.receiver_name} <span className="text-gray-500 font-normal">| {addr.receiver_phone}</span></p>
                          <p className="text-sm text-gray-500 mt-1">{addr.street}, {addr.ward}, {addr.province}</p>
                          {addr.is_default && <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full font-medium">Mặc định</span>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => { setEditingAddr(addr); setAddrForm({ receiver_name: addr.receiver_name, receiver_phone: addr.receiver_phone, province: addr.province, ward: addr.ward, street: addr.street, is_default: addr.is_default }); setShowAddrForm(true); }} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteAddress(addr._id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center">
                      <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500">Chưa có địa chỉ nào</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* FAVORITES TAB */}
            {activeTab === 'favorites' && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                  <h2 className="flex items-center gap-2 text-lg font-bold"><Heart className="w-5 h-5 text-red-500" /> Sản phẩm yêu thích</h2>
                </div>
                {loading ? (
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />)}</div>
                ) : favorites.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-slate-700">
                    {favorites.map((fav) => {
                      const product = typeof fav.product_id === 'object' ? fav.product_id : fav.product;
                      if (!product) return null;
                      const variant = product.variants?.find((v) => v.is_default) || product.variants?.[0];
                      return (
                        <div key={fav._id} className="p-6 flex items-center gap-4">
                          <Link href={`/products/${product.slug}`} className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 shrink-0">
                            <Image src={getImageUrl(product.image)} alt={product.name} width={64} height={64} className="w-full h-full object-cover" />
                          </Link>
                          <div className="flex-1 min-w-0">
                            <Link href={`/products/${product.slug}`} className="font-medium text-slate-900 dark:text-white hover:text-blue-500 truncate block">{product.name}</Link>
                            <div className="flex items-center gap-2 mt-1">
                              {variant?.sale_price ? (
                                <><span className="text-blue-600 font-bold text-sm">{formatPrice(variant.sale_price)}</span><span className="text-gray-400 text-xs line-through">{formatPrice(variant.price)}</span></>
                              ) : variant ? (
                                <span className="text-blue-600 font-bold text-sm">{formatPrice(variant.price)}</span>
                              ) : null}
                            </div>
                          </div>
                          <button onClick={() => handleRemoveFavorite(product._id)} className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Bỏ yêu thích">
                            <Heart className="w-5 h-5 fill-current" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <Heart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">Chưa có sản phẩm yêu thích</p>
                    <Link href="/products" className="inline-block mt-4 text-sm text-blue-500 hover:underline">Khám phá ngay →</Link>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] py-8"><div className="max-w-screen-xl mx-auto px-4"><div className="animate-pulse h-96 bg-gray-200 dark:bg-slate-800 rounded-2xl" /></div></div>}>
      <ProfileContent />
    </Suspense>
  );
}

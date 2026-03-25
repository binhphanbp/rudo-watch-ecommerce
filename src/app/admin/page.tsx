'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Package, ShoppingCart, Users, DollarSign,
  TrendingUp, ArrowUpRight, ArrowDownRight,
  Eye, Clock,
} from 'lucide-react';
import api from '@/lib/api';
import { orderApi } from '@/lib/api/services';
import { formatPrice, formatDateTime, ORDER_STATUS_MAP } from '@/lib/utils';
import type { IOrder } from '@/types';

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  newUsersThisMonth?: number;
  newOrdersToday?: number;
  pendingOrders?: number;
  recentOrders?: IOrder[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes] = await Promise.allSettled([
        api.get('/users/dashboard'),
        orderApi.getOrders({ page: 1, limit: 5 }),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data.data);
      }
      if (ordersRes.status === 'fulfilled') {
        const data = ordersRes.value.data.data;
        setRecentOrders(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Doanh thu', value: formatPrice(stats?.totalRevenue || 0), icon: DollarSign, color: 'from-blue-600 to-blue-400', trend: '+12%', up: true },
    { label: 'Đơn hàng', value: stats?.totalOrders?.toLocaleString() || '0', icon: ShoppingCart, color: 'from-emerald-600 to-emerald-400', trend: `${stats?.newOrdersToday || 0} hôm nay`, up: true },
    { label: 'Sản phẩm', value: stats?.totalProducts?.toLocaleString() || '0', icon: Package, color: 'from-purple-600 to-purple-400', trend: '', up: true },
    { label: 'Người dùng', value: stats?.totalUsers?.toLocaleString() || '0', icon: Users, color: 'from-orange-600 to-orange-400', trend: `+${stats?.newUsersThisMonth || 0} tháng này`, up: true },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-200 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
        </div>
        <div className="h-96 bg-gray-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Tổng quan hoạt động kinh doanh</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700/50 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{card.label}</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{card.value}</p>
                  {card.trend && (
                    <div className="flex items-center gap-1 mt-2">
                      {card.up ? <ArrowUpRight className="w-3 h-3 text-green-500" /> : <ArrowDownRight className="w-3 h-3 text-red-500" />}
                      <span className={`text-xs font-medium ${card.up ? 'text-green-600' : 'text-red-600'}`}>{card.trend}</span>
                    </div>
                  )}
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50">
          <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" /> Đơn hàng gần đây
            </h2>
            <Link href="/admin/orders" className="text-sm text-blue-500 hover:text-blue-600 font-medium">Xem tất cả →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã đơn</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Ngày</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                {recentOrders.length > 0 ? recentOrders.map((order) => {
                  const status = ORDER_STATUS_MAP[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-800' };
                  return (
                    <tr key={order._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-5 py-3.5 text-sm font-medium text-slate-900 dark:text-white">#{order.order_code}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-500 hidden sm:table-cell">{formatDateTime(order.created_at)}</td>
                      <td className="px-5 py-3.5"><span className={`px-2.5 py-1 text-xs font-medium rounded-full ${status.color}`}>{status.label}</span></td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-right text-blue-600">{formatPrice(order.total)}</td>
                      <td className="px-5 py-3.5">
                        <Link href={`/admin/orders`} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg inline-flex"><Eye className="w-4 h-4" /></Link>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-500 text-sm">Chưa có đơn hàng</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick stats panel */}
        <div className="space-y-4">
          {/* Pending orders */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700/50">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" /> Thống kê nhanh
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl">
                <span className="text-sm font-medium text-amber-800 dark:text-amber-300">Đơn chờ xử lý</span>
                <span className="text-lg font-bold text-amber-600">{stats?.pendingOrders || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl">
                <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Đơn hôm nay</span>
                <span className="text-lg font-bold text-blue-600">{stats?.newOrdersToday || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-xl">
                <span className="text-sm font-medium text-green-800 dark:text-green-300">User mới tháng này</span>
                <span className="text-lg font-bold text-green-600">{stats?.newUsersThisMonth || 0}</span>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700/50">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Truy cập nhanh</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: '/admin/products', label: 'Thêm SP', icon: Package, color: 'text-blue-500' },
                { href: '/admin/orders', label: 'Đơn hàng', icon: ShoppingCart, color: 'text-emerald-500' },
                { href: '/admin/users', label: 'Users', icon: Users, color: 'text-purple-500' },
                { href: '/admin/posts', label: 'Bài viết', icon: TrendingUp, color: 'text-orange-500' },
              ].map((link) => {
                const Icon = link.icon;
                return (
                  <Link key={link.href} href={link.href} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    <Icon className={`w-5 h-5 ${link.color}`} />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

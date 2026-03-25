'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, ArrowLeft } from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import { showSuccess, showError } from '@/lib/swal';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
      showSuccess('Email đã được gửi!');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      showError(err.response?.data?.message || 'Gửi email thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-16 px-4 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#0f172a] dark:to-slate-800">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/"><Image src="/images/logo-rudo-watch.svg" alt="Rudo Watch" width={160} height={50} className="mx-auto invert dark:invert-0" /></Link>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 p-8">
          <h2 className="text-xl font-bold mb-2">Quên mật khẩu</h2>
          <p className="text-sm text-gray-500 mb-6">Nhập email để nhận link đặt lại mật khẩu</p>
          {sent ? (
            <div className="text-center py-8">
              <Mail className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <p className="font-semibold mb-2">Email đã được gửi!</p>
              <p className="text-sm text-gray-500">Kiểm tra hộp thư của bạn tại <strong>{email}</strong></p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com" className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50">{loading ? 'Đang gửi...' : 'Gửi email'}</button>
            </form>
          )}
          <Link href="/login" className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-500 hover:text-blue-600"><ArrowLeft className="w-4 h-4" />Quay lại đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}

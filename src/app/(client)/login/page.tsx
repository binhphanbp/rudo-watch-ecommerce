'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { login, register } from '@/store/authSlice';
import { showSuccess, showError } from '@/lib/swal';
import { useRouter } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

const registerSchema = z.object({
  full_name: z.string().min(2, 'Họ tên tối thiểu 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  password_confirmation: z.string(),
}).refine((data) => data.password === data.password_confirmation, {
  message: 'Mật khẩu không khớp',
  path: ['password_confirmation'],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((s) => s.auth.isLoading);
  const router = useRouter();

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const handleLogin = async (data: LoginForm) => {
    try {
      await dispatch(login({ email: data.email, password: data.password })).unwrap();
      showSuccess('Đăng nhập thành công!');
      router.push('/');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      showError(err.response?.data?.message || 'Đăng nhập thất bại');
    }
  };

  const handleRegister = async (data: RegisterForm) => {
    try {
      await dispatch(register(data)).unwrap();
      showSuccess('Đăng ký thành công!');
      router.push('/');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      showError(err.response?.data?.message || 'Đăng ký thất bại');
    }
  };

  const inputCls = "w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen flex items-center justify-center py-16 px-4 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#0f172a] dark:to-slate-800">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/"><Image src="/images/logo-rudo-watch.svg" alt="Rudo Watch" width={160} height={50} className="mx-auto invert dark:invert-0" /></Link>
          <p className="text-gray-500 dark:text-gray-400 mt-3 text-sm">{isLogin ? 'Đăng nhập để tiếp tục mua sắm' : 'Tạo tài khoản mới'}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 p-8">
          <div className="flex rounded-xl bg-gray-100 dark:bg-slate-700 p-1 mb-8">
            <button onClick={() => setIsLogin(true)} className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${isLogin ? 'bg-white dark:bg-slate-600 shadow-sm' : 'text-gray-500'}`}>Đăng nhập</button>
            <button onClick={() => setIsLogin(false)} className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${!isLogin ? 'bg-white dark:bg-slate-600 shadow-sm' : 'text-gray-500'}`}>Đăng ký</button>
          </div>

          {isLogin ? (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <div className="relative"><Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" /><input {...loginForm.register('email')} type="email" placeholder="your@email.com" className={inputCls} /></div>
                {loginForm.formState.errors.email && <p className="text-red-500 text-xs mt-1">{loginForm.formState.errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Mật khẩu</label>
                <div className="relative"><Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" /><input {...loginForm.register('password')} type={showPassword ? 'text' : 'password'} placeholder="••••••" className={`${inputCls} !pr-10`} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div>
                {loginForm.formState.errors.password && <p className="text-red-500 text-xs mt-1">{loginForm.formState.errors.password.message}</p>}
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="rounded" /><span className="text-sm text-gray-500">Ghi nhớ</span></label>
                <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Quên mật khẩu?</Link>
              </div>
              <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50">{isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Họ và tên</label>
                <div className="relative"><User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" /><input {...registerForm.register('full_name')} placeholder="Nguyễn Văn A" className={inputCls} /></div>
                {registerForm.formState.errors.full_name && <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.full_name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <div className="relative"><Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" /><input {...registerForm.register('email')} type="email" placeholder="your@email.com" className={inputCls} /></div>
                {registerForm.formState.errors.email && <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Số điện thoại</label>
                <div className="relative"><Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" /><input {...registerForm.register('phone')} placeholder="0123 456 789" className={inputCls} /></div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Mật khẩu</label>
                <div className="relative"><Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" /><input {...registerForm.register('password')} type={showPassword ? 'text' : 'password'} placeholder="••••••" className={`${inputCls} !pr-10`} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div>
                {registerForm.formState.errors.password && <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.password.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Xác nhận mật khẩu</label>
                <div className="relative"><Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" /><input {...registerForm.register('password_confirmation')} type="password" placeholder="••••••" className={inputCls} /></div>
                {registerForm.formState.errors.password_confirmation && <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.password_confirmation.message}</p>}
              </div>
              <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50">{isLoading ? 'Đang đăng ký...' : 'Đăng ký'}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

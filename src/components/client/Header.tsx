'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/authSlice';
import { getImageUrl } from '@/lib/api';
import { getAvatarUrl } from '@/lib/utils';
import {
  Search,
  ShoppingCart,
  User,
  Sun,
  Moon,
  Monitor,
  Menu,
  X,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Heart,
  Settings,
} from 'lucide-react';

const menuItems = [
  { name: 'Trang chủ', href: '/' },
  { name: 'Sản phẩm', href: '/products' },
  { name: 'Bài viết', href: '/news' },
  { name: 'Giới thiệu', href: '/introduce' },
  { name: 'Liên hệ', href: '/contact' },
];

export default function Header() {
  const { theme, setTheme } = useTheme();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isAdmin } = useAppSelector((s) => s.auth);
  const totalCount = useAppSelector((s) => s.cart.totalCount);
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setUserMenuOpen(false);
      setThemeMenuOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    setUserMenuOpen(false);
    window.location.href = '/login';
  };

  const ThemeIcon = () => {
    if (!mounted) return <Sun className="w-5 h-5" />;
    if (theme === 'dark') return <Moon className="w-5 h-5" />;
    if (theme === 'system') return <Monitor className="w-5 h-5" />;
    return <Sun className="w-5 h-5" />;
  };

  const userAvatar = user?.avatar
    ? getImageUrl(user.avatar)
    : getAvatarUrl(user?.full_name || 'User');

  return (
    <header className="w-full bg-primary text-white sticky top-0 z-50 border-b border-white/10 shadow-lg">
      {/* Scroll progress bar */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-transparent z-[60]">
        <div
          className="h-full bg-gradient-to-r from-blue-400 to-cyan-300 transition-all duration-150 ease-out shadow-[0_0_10px_rgba(56,189,248,0.7)]"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Search overlay */}
      <div
        className={`absolute inset-0 bg-white dark:bg-slate-800 text-slate-900 dark:text-white z-[55] flex items-center px-8 shadow-xl transition-transform duration-300 ${
          searchOpen ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="container mx-auto flex items-center gap-4">
          <Search className="w-6 h-6 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            className="w-full h-12 bg-transparent text-lg outline-none border-none placeholder-gray-400 font-medium"
            autoFocus={searchOpen}
          />
          <button onClick={() => setSearchOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto">
        <div className="container mx-auto px-4 h-[80px] flex items-center justify-between relative z-20">
          {/* Logo */}
          <Link href="/" className="w-[120px] shrink-0">
            <Image src="/images/logo-rudo-watch.svg" alt="Rudo Watch Logo" width={120} height={40} priority />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-1 hover:text-blue-400 transition-colors duration-200 font-medium uppercase text-sm tracking-wide"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              {/* Language */}
              <div className="hidden sm:flex items-center gap-1 cursor-pointer hover:text-blue-400 text-sm font-bold transition-colors">
                <span>VN</span>
                <ChevronDown className="w-4 h-4" />
              </div>

              {/* Theme toggle */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                  className="hover:text-blue-400 transition-colors flex items-center p-2"
                >
                  <ThemeIcon />
                </button>
                {themeMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-36 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden animate-fade-in">
                    <button onClick={() => { setTheme('light'); setThemeMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2">
                      <Sun className="w-4 h-4" /> Light
                    </button>
                    <button onClick={() => { setTheme('dark'); setThemeMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2">
                      <Moon className="w-4 h-4" /> Dark
                    </button>
                    <button onClick={() => { setTheme('system'); setThemeMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2">
                      <Monitor className="w-4 h-4" /> System
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="w-px h-5 bg-white/20 hidden sm:block" />

            <div className="flex items-center gap-5">
              {/* Search */}
              <button onClick={() => setSearchOpen(true)} className="hover:text-blue-400 transition-colors">
                <Search className="w-6 h-6" />
              </button>

              {/* Cart */}
              <Link href="/cart" className="relative hover:text-blue-400 transition-colors">
                <ShoppingCart className="w-6 h-6" />
                {totalCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-primary">
                    {totalCount}
                  </span>
                )}
              </Link>

              {/* User */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                {isAuthenticated && user ? (
                  <>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="block w-8 h-8 rounded-full overflow-hidden border border-white/30 hover:border-blue-400 transition-all"
                    >
                      <Image src={userAvatar} alt="Avatar" width={32} height={32} className="w-full h-full object-cover" />
                    </button>
                    {userMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden animate-fade-in">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                          <p className="text-sm font-bold truncate">{user.full_name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-slate-700">
                          <Settings className="w-4 h-4" /> Tài khoản
                        </Link>
                        <Link href="/profile?tab=favorites" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-slate-700">
                          <Heart className="w-4 h-4" /> Yêu thích
                        </Link>
                        {isAdmin && (
                          <Link href="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-slate-700">
                            <LayoutDashboard className="w-4 h-4" /> Dashboard
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border-t border-gray-100 dark:border-slate-700"
                        >
                          <LogOut className="w-4 h-4" /> Đăng xuất
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <Link href="/login" className="hover:text-blue-400 transition-colors">
                    <User className="w-6 h-6" />
                  </Link>
                )}
              </div>

              {/* Mobile menu button */}
              <button className="lg:hidden hover:text-blue-400 transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-primary border-t border-white/10 animate-fade-in">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-3 px-4 hover:bg-white/5 rounded-lg font-medium uppercase text-sm tracking-wide transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

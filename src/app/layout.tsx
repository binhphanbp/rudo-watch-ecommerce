import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'Rudo Watch - Đồng hồ chính hãng',
    template: '%s | Rudo Watch',
  },
  description:
    'Rudo Watch - Cửa hàng đồng hồ chính hãng hàng đầu. Chuyên cung cấp đồng hồ cao cấp, chính hãng từ các thương hiệu nổi tiếng.',
  keywords: ['đồng hồ', 'đồng hồ chính hãng', 'rudo watch', 'watch store'],
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-50 antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

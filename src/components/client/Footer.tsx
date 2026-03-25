import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';

const footerLinks = {
  about: [
    { name: 'Giới thiệu', href: '/introduce' },
    { name: 'Liên hệ', href: '/contact' },
    { name: 'Bài viết', href: '/news' },
  ],
  policy: [
    { name: 'Chính sách bảo mật', href: '/privacy-policy' },
    { name: 'Điều khoản dịch vụ', href: '/terms-of-service' },
    { name: 'Chính sách đổi trả', href: '/terms-of-service' },
  ],
  support: [
    { name: 'Hướng dẫn mua hàng', href: '/introduce' },
    { name: 'Phương thức thanh toán', href: '/terms-of-service' },
    { name: 'Theo dõi đơn hàng', href: '/profile' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-[#0A2A45] text-white">
      <div className="max-w-screen-xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-block mb-4">
              <Image src="/images/logo-rudo-watch.svg" alt="Rudo Watch" width={120} height={40} />
            </Link>
            <p className="text-sm text-gray-300 mb-6 leading-relaxed">
              Rudo Watch - Cửa hàng đồng hồ chính hãng hàng đầu. Chuyên cung cấp đồng hồ cao cấp từ các thương hiệu nổi tiếng thế giới.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-9 h-9 bg-white/10 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-white/10 hover:bg-pink-600 rounded-lg flex items-center justify-center transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-white/10 hover:bg-red-600 rounded-lg flex items-center justify-center transition-colors">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* About */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Về chúng tôi</h3>
            <ul className="space-y-3">
              {footerLinks.about.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-300 hover:text-blue-400 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policy */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Chính sách</h3>
            <ul className="space-y-3">
              {footerLinks.policy.map((link, i) => (
                <li key={i}>
                  <Link href={link.href} className="text-sm text-gray-300 hover:text-blue-400 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Liên hệ</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 text-blue-400 shrink-0" />
                <span className="text-sm text-gray-300">Tòa nhà FPT Polytechnic, Trịnh Văn Bô, Nam Từ Liêm, Hà Nội</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-sm text-gray-300">0123 456 789</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-sm text-gray-300">contact@rudowatch.store</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <p className="text-center text-sm text-gray-400">
            © {new Date().getFullYear()} Rudo Watch. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

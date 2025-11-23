import logoImg from '../assets/images/logo-rudo-watch.svg';

export function Footer() {
  return `
    <footer class="bg-[#0A2A45] text-slate-300 pt-16 pb-8 border-t border-white/10 text-sm font-sans mt-50">
        <div class="container mx-auto px-4">
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                
                <div class="space-y-4">
                    <a href="/" class="block w-32 mb-4">
                        <img src="${logoImg}" alt="Rudo Watch" class="w-full h-auto brightness-0 invert"> 
                        </a>
                    <p class="text-slate-400 leading-relaxed">
                        Rudo Watch - Hệ thống phân phối đồng hồ chính hãng uy tín hàng đầu tại Việt Nam. Cam kết chất lượng và dịch vụ hậu mãi chuẩn 5 sao.
                    </p>
                    
                    <div class="space-y-2 mt-4">
                        <div class="flex items-start gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-blue-400 mt-0.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                            <span>Số 8, Tôn Thất Thuyết, Cầu Giấy, Hà Nội</span>
                        </div>
                        <div class="flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-blue-400"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                            <span class="text-white font-bold tracking-wide">0987.654.321</span>
                        </div>
                        <div class="flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-blue-400"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                            <span>contact@rudowatch.vn</span>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 class="text-white font-bold uppercase tracking-wider mb-6 relative inline-block">
                        Về RudoWatch
                        <span class="absolute -bottom-2 left-0 w-8 h-0.5 bg-blue-500"></span>
                    </h3>
                    <ul class="space-y-3">
                        <li><a href="/about.html" class="hover:text-blue-400 hover:translate-x-1 transition-all inline-block">Giới thiệu chung</a></li>
                        <li><a href="#" class="hover:text-blue-400 hover:translate-x-1 transition-all inline-block">Tuyển dụng</a></li>
                        <li><a href="#" class="hover:text-blue-400 hover:translate-x-1 transition-all inline-block">Tin tức sự kiện</a></li>
                        <li><a href="#" class="hover:text-blue-400 hover:translate-x-1 transition-all inline-block">Hệ thống cửa hàng</a></li>
                        <li><a href="#" class="hover:text-blue-400 hover:translate-x-1 transition-all inline-block">Liên hệ - Góp ý</a></li>
                    </ul>
                </div>

                <div>
                    <h3 class="text-white font-bold uppercase tracking-wider mb-6 relative inline-block">
                        Hỗ trợ khách hàng
                        <span class="absolute -bottom-2 left-0 w-8 h-0.5 bg-blue-500"></span>
                    </h3>
                    <ul class="space-y-3">
                        <li><a href="#" class="hover:text-blue-400 hover:translate-x-1 transition-all inline-block">Hướng dẫn mua hàng</a></li>
                        <li><a href="#" class="hover:text-blue-400 hover:translate-x-1 transition-all inline-block">Chính sách bảo hành</a></li>
                        <li><a href="#" class="hover:text-blue-400 hover:translate-x-1 transition-all inline-block">Chính sách đổi trả</a></li>
                        <li><a href="#" class="hover:text-blue-400 hover:translate-x-1 transition-all inline-block">Chính sách bảo mật</a></li>
                        <li><a href="#" class="hover:text-blue-400 hover:translate-x-1 transition-all inline-block">Kiểm tra đơn hàng</a></li>
                    </ul>
                </div>

                <div>
                    <h3 class="text-white font-bold uppercase tracking-wider mb-6 relative inline-block">
                        Đăng ký nhận tin
                        <span class="absolute -bottom-2 left-0 w-8 h-0.5 bg-blue-500"></span>
                    </h3>
                    <p class="text-slate-400 mb-4 text-xs">Nhận thông tin về sản phẩm mới và khuyến mãi sớm nhất.</p>
                    
                    <form class="flex mb-8">
                        <input type="email" placeholder="Email của bạn..." class="bg-slate-800 text-white px-4 py-2 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500 w-full border border-slate-700 placeholder-slate-500">
                        <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-md transition-colors font-bold">
                            Gửi
                        </button>
                    </form>

                    <h4 class="text-white font-bold mb-4">Kết nối với chúng tôi</h4>
                    <div class="flex gap-4">
                        <a href="#" class="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all group">
                            <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        </a>
                        <a href="#" class="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-pink-600 hover:text-white transition-all group">
                            <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                        </a>
                        <a href="#" class="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all group">
                            <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                        </a>
                    </div>
                </div>

            </div>

            <div class="border-t border-slate-800 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
                <div class="text-center md:text-left">
                    <p class="mb-2">© 2025 RudoWatch. All rights reserved.</p>
                    <p>Giấy chứng nhận đăng ký kinh doanh số: 0101234567 do Sở Kế hoạch và Đầu tư TP. Hà Nội cấp.</p>
                </div>
                
                <div class="flex gap-2 opacity-50">
                  <div class="h-6 w-10 bg-white rounded flex items-center justify-center"><span class="font-bold text-blue-800 text-[8px]">VISA</span></div>
                  <div class="h-6 w-10 bg-white rounded flex items-center justify-center"><span class="font-bold text-red-600 text-[8px]">MC</span></div>
                <div class="h-6 w-10 bg-white rounded flex items-center justify-center"><span class="font-bold text-blue-500 text-[8px]">MOMO</span></div>
                </div>
            </div>
        </div>
    </footer>
    `;
}

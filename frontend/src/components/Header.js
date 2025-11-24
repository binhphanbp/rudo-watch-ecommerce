import logoImg from '../assets/images/logo-rudo-watch.svg';

const isLoggedIn = false;
const userAvatar =
  'https://ui-avatars.com/api/?name=Phan+Duc+Binh&background=0D8ABC&color=fff';

const menuItems = [
  { name: 'Trang chủ', link: '/', hasDropdown: false },
  { name: 'Đồng hồ Nam', link: '/products.html', hasDropdown: true },
  { name: 'Đồng hồ Nữ', link: '/products.html', hasDropdown: true },
  { name: 'Bài viết', link: '/news.html', hasDropdown: false },
  { name: 'Giới thiệu', link: '/introduce.html', hasDropdown: false },
];

export function Header() {
  // Render Menu
  const navLinks = menuItems
    .map(
      (item) => `
        <a href="${
          item.link
        }" class="group flex items-center gap-1 hover:text-blue-400 transition-colors duration-200 font-medium uppercase text-sm tracking-wide">
            ${item.name}
            ${
              item.hasDropdown
                ? `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 group-hover:rotate-180 transition-transform duration-200">
                  <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
                </svg>
            `
                : ''
            }
        </a>
    `
    )
    .join('');

  return `
    <header class="w-full bg-[#0A2A45] text-white sticky top-0 z-50 border-b border-white/10 shadow-lg relative group/header">
        
        <div id="search-overlay" class="absolute inset-0 bg-white text-slate-900 z-[60] transform -translate-y-full transition-transform duration-300 flex items-center px-4 lg:px-8 shadow-xl">
            <div class="container mx-auto flex items-center gap-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6 text-gray-400">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input type="text" placeholder="Tìm kiếm đồng hồ, thương hiệu..." class="w-full h-12 bg-transparent text-lg outline-none border-none placeholder-gray-400 font-medium">
                <button onclick="toggleSearch()" class="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6 text-gray-500">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>

        <div class="absolute top-0 left-0 w-full h-[3px] bg-transparent z-10">
            <div id="scroll-progress" class="h-full bg-gradient-to-r from-blue-400 to-cyan-300 w-0 transition-all duration-150 ease-out shadow-[0_0_10px_rgba(56,189,248,0.7)]"></div>
        </div>

        <div class="container mx-auto px-4 h-[70px] flex items-center justify-between relative z-20 bg-[#0A2A45]">
            
            <a href="/" class="w-[120px] shrink-0">
                <img src="${logoImg}" alt="Rudo Watch Logo">
            </a>

            <nav class="hidden lg:flex items-center gap-8">
                ${navLinks}
            </nav>

            <div class="flex items-center gap-6">
                
                <div class="flex items-center gap-4">
                    <div class="hidden sm:flex items-center gap-1 cursor-pointer hover:text-blue-400 text-sm font-bold transition-colors">
                        <span>EN</span>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" /></svg>
                    </div>

                    <div class="relative group py-4"> 
                        <button class="hover:text-blue-400 transition-colors flex items-center" title="Change Theme">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                            </svg>
                        </button>
                        <div class="absolute right-0 top-full w-36 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden hidden group-hover:block animate-in fade-in slide-in-from-top-2 duration-200">
                            <button onclick="window.themeController.setTheme('light')" class="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"><svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>Light</button>
                            <button onclick="window.themeController.setTheme('dark')" class="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"><svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>Dark</button>
                            <button onclick="window.themeController.setTheme('system')" class="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 border-t border-gray-100 dark:border-slate-700"><svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
</svg>
System</button>
                        </div>
                    </div>
                </div>

                <div class="w-px h-5 bg-white/20 hidden sm:block"></div>

                <div class="flex items-center gap-5">
                    
                    <button onclick="toggleSearch()" class="hover:text-blue-400 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                    </button>

                    <a href="/cart.html" class="relative hover:text-blue-400 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                        </svg>
                        <span id="cart-count" class="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[#0f172a]">0</span>
                    </a>

                    <div class="relative group py-4">
                        ${
                          isLoggedIn
                            ? `
                            <a href="/profile.html" class="block w-8 h-8 rounded-full overflow-hidden border border-white/30 hover:border-blue-400 transition-all">
                                <img src="${userAvatar}" alt="User Avatar" class="w-full h-full object-cover">
                            </a>
                            
                            <div class="absolute right-0 top-full w-48 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden hidden group-hover:block animate-in fade-in slide-in-from-top-2 duration-200">
                                <div class="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                                    <p class="text-sm font-bold truncate">Phan Đức Bình</p>
                                    <p class="text-xs text-gray-500 truncate">Thành viên Vàng</p>
                                </div>
                                <a href="/profile.html" class="block px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-700">Tài khoản của tôi</a>
                                <a href="/profile.html" onclick="switchProfileTab('orders')" class="block px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-700">Đơn mua</a>
                                <button onclick="window.handleLogout()" class="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border-t border-gray-100 dark:border-slate-700">Đăng xuất</button>
                            </div>
                        `
                            : `
                            <a href="/login.html" class="hover:text-blue-400 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                </svg>
                            </a>
                            <div class="absolute right-0 top-full mt-2 w-32 bg-white text-slate-900 text-xs rounded py-1 shadow-lg text-center hidden group-hover:block animate-in fade-in">
                                Đăng nhập / Đăng ký
                            </div>
                        `
                        }
                    </div>

                    <button class="lg:hidden hover:text-blue-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-7 h-7">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </header>
    `;
}

// Logic bật tắt Search (Gán vào window để HTML gọi được)
window.toggleSearch = () => {
  const searchOverlay = document.getElementById('search-overlay');
  if (searchOverlay) {
    if (searchOverlay.classList.contains('-translate-y-full')) {
      searchOverlay.classList.remove('-translate-y-full'); // Hiện
      searchOverlay.querySelector('input').focus(); // Auto focus
    } else {
      searchOverlay.classList.add('-translate-y-full'); // Ẩn
    }
  }
};

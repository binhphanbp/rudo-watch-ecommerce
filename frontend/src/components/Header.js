import logoImg from '../assets/images/logo-rudo-watch.svg';

const user = JSON.parse(localStorage.getItem('user'));
const isLoggedIn = !!user;

const userAvatar = user?.avatar
  ? user.avatar.startsWith('http')
    ? user.avatar
    : `http://localhost/rudo-watch-ecommerce-api/backend/${user.avatar}`
  : `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user?.fullname || user?.name || 'User'
    )}&background=0D8ABC&color=fff`;

const menuItems = [
  { name: 'Trang chủ', link: '/', hasDropdown: false },
  { name: 'Đồng hồ Nam', link: '/products.html?category=9', hasDropdown: true }, // Ví dụ ID danh mục
  { name: 'Đồng hồ Nữ', link: '/products.html?category=10', hasDropdown: true },
  { name: 'Bài viết', link: '/news.html', hasDropdown: false },
  { name: 'Giới thiệu', link: '/introduce.html', hasDropdown: false },
];

window.handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
};

export function Header() {
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
        
        <div class="absolute top-0 left-0 w-full h-[3px] bg-transparent z-[60]">
            <div id="scroll-progress" class="h-full bg-gradient-to-r from-blue-400 to-cyan-300 w-0 transition-all duration-150 ease-out shadow-[0_0_10px_rgba(56,189,248,0.7)]"></div>
        </div>

        <div id="search-overlay" class="absolute inset-0 bg-white text-slate-900 z-[55] transform -translate-y-full transition-transform duration-300 flex items-center px-8 shadow-xl">
            <div class="container mx-auto flex items-center gap-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6 text-gray-400"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                <input type="text" placeholder="Tìm kiếm sản phẩm..." class="w-full h-12 bg-transparent text-lg outline-none border-none placeholder-gray-400 font-medium">
                <button onclick="toggleSearch()" class="p-2 hover:bg-gray-100 rounded-full transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6 text-gray-500"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
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
                        <span>EN</span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" /></svg>
                    </div>
                    <div class="relative group py-4"> 
                        <button class="hover:text-blue-400 transition-colors flex items-center"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg></button>
                        <div class="absolute right-0 top-full w-36 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden hidden group-hover:block animate-in fade-in slide-in-from-top-2 duration-200">
                            <button onclick="window.themeController.setTheme('light')" class="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-slate-700">Light</button>
                            <button onclick="window.themeController.setTheme('dark')" class="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-slate-700">Dark</button>
                            <button onclick="window.themeController.setTheme('system')" class="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-slate-700">System</button>
                        </div>
                    </div>
                </div>

                <div class="w-px h-5 bg-white/20 hidden sm:block"></div>

                <div class="flex items-center gap-5">
                    <button onclick="toggleSearch()" class="hover:text-blue-400 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                    </button>

                    <a href="/cart.html" class="relative hover:text-blue-400 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>
                        <span id="cart-count" class="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[#0f172a] hidden">0</span>
                    </a>

                    <div class="relative group py-4">
                        ${
                          isLoggedIn
                            ? `
                            <a href="/profile.html" class="block w-8 h-8 rounded-full overflow-hidden border border-white/30 hover:border-blue-400 transition-all">
                                <img src="${userAvatar}" alt="Avatar" class="w-full h-full object-cover">
                            </a>
                            <div class="absolute right-0 top-full w-48 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden hidden group-hover:block animate-in fade-in slide-in-from-top-2 duration-200">
                                <div class="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                                    <p class="text-sm font-bold truncate">${
                                      user.fullname || user.name
                                    }</p>
                                </div>
                                <a href="/profile.html" class="block px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-700">Tài khoản</a>
                                <button onclick="window.handleLogout()" class="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border-t border-gray-100 dark:border-slate-700">Đăng xuất</button>
                            </div>
                        `
                            : `
                            <a href="/login.html" class="hover:text-blue-400 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                            </a>
                        `
                        }
                    </div>
                </div>
            </div>
        </div>
    </header>
    `;
}

window.toggleSearch = () => {
  const searchOverlay = document.getElementById('search-overlay');
  if (searchOverlay) {
    searchOverlay.classList.toggle('-translate-y-full');
    if (!searchOverlay.classList.contains('-translate-y-full')) {
      searchOverlay.querySelector('input').focus();
    }
  }
};

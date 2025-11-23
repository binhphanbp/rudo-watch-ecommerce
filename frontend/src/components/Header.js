import logoImg from '../assets/images/logo-rudo-watch.svg';

const menuItems = [
  { name: 'Collections', link: '/collections', hasDropdown: true },
  { name: "Men's watch", link: '/mens-watch', hasDropdown: true },
  { name: "Women's watch", link: '/womens-watch', hasDropdown: true },
  { name: 'News', link: '/news', hasDropdown: false },
  { name: 'Introduce', link: '/introduce', hasDropdown: false },
];

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
    <header class="w-full bg-[#0A2A45] text-white sticky top-0 z-50 border-b border-white/10 shadow-lg">
        <div class="container mx-auto px-4 h-[70px] flex items-center justify-between">
            <a href="/" class="w-[120px]">
                <img src="${logoImg}" alt="Rudo Watch Logo" >
            </a>

            <nav class="hidden lg:flex items-center gap-8">
                ${navLinks}
            </nav>

            <div class="flex items-center gap-5">
                
                <div class="hidden sm:flex items-center gap-1 cursor-pointer hover:text-blue-400 text-sm font-bold">
                    <span>EN</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                      <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
                    </svg>
                </div>

                <div class="w-px h-4 bg-white/20 hidden sm:block"></div>

                <button class="hover:text-blue-400 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                </button>

                <a href="/login.html" class="hover:text-blue-400 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                </a>

                <a href="/cart.html" class="relative hover:text-blue-400 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
</svg>
<span class="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[#0f172a]">0</span>
                </a>

                <button class="lg:hidden hover:text-blue-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-7 h-7">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                </button>
            </div>
        </div>
    </header>
    `;
}

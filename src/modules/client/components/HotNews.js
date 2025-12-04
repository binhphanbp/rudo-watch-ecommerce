// Dữ liệu tin tức mẫu
const newsData = {
  hero: {
    id: 1,
    title:
      'The latest Rolex watches 2025 introduced at the Watch & Wonder event',
    desc: 'Rolex is a brand that any watch enthusiast must know. Every year, all eyes in the watch world turn to the "holy land" of Watches & Wonders to wait for the latest Rolex models.',
    image: '/images/news/news-1.jpg',
    date: '31.03.2025',
    author: 'Bình Phan',
  },
  sideList: [
    {
      id: 2,
      title: "Explained: Rolex's proprietary metal alloys",
      desc: 'Over the past decade, metal alloy hairsprings have seemingly fallen out of favor...',
      image: '/images/news/news-2.jpg',
      date: '30.07.2025',
      author: 'Thanh Sáng',
    },
    {
      id: 3,
      title: 'The powerful Nivada Grenchen Depthmaster Bronze',
      desc: 'Recently released is a striking bronze version of the Depthmaster...',
      image: '/images/news/news-3.jpg',
      date: '14.07.2025',
      author: 'Lê Duy',
    },
    {
      id: 4,
      title: 'How to take care of your mechanical watch',
      desc: 'Owning a mechanical watch is a truly wonderful experience...',
      image: '/images/news/news-4.jpg',
      date: '25.06.2025',
      author: 'Bình Phan',
    },
  ],
};

export function HotNews() {
  // Helper render bài viết nhỏ bên phải
  const renderSideItem = (item) => `
        <article class="flex gap-5 group cursor-pointer h-full border-b border-gray-100 dark:border-slate-700 last:border-0 pb-4 last:pb-0">
            <div class="w-[45%] h-full shrink-0 overflow-hidden">
                <img src="${item.image}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 bg-gray-200">
            </div>
            
            <div class="flex-1 flex flex-col justify-between py-1">
                <div>
                    <h3 class="text-lg font-bold text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 transition-colors mb-2">
                        ${item.title}
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                        ${item.desc}
                    </p>
                </div>
                
                <div class="flex items-center justify-between text-xs text-gray-400 mt-2">
                    <span class="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
                      </svg> ${item.date}</span>
                    <span class="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg> ${item.author}</span>
                </div>
            </div>
        </article>
    `;

  return `
    <section class="py-16 bg-white dark:bg-[#0f172a] transition-colors duration-300">
        <div class="container mx-auto px-4  max-w-7xl">
            <h2 class="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-10">Hot News</h2>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch h-auto lg:h-[500px]">
                
                <article class="flex flex-col h-full group cursor-pointer">
                    <div class="w-full h-[60%] overflow-hidden mb-5">
                        <img src="${newsData.hero.image
              }" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 bg-gray-200">
                    </div>
                    
                    <div class="flex flex-col flex-1 justify-between">
                        <div>
                            <h3 class="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3 leading-tight group-hover:text-blue-600 transition-colors">
                                ${newsData.hero.title}
                            </h3>
                            <p class="text-base text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">
                                ${newsData.hero.desc}
                            </p>
                        </div>
                        
                        <div class="flex items-center justify-between border-t border-gray-200 dark:border-slate-700 pt-5 mt-4">
                            <button class="px-6 py-2 border border-slate-900 dark:border-white text-slate-900 dark:text-white font-bold text-sm uppercase hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-colors">
                                See more
                            </button>
                            <div class="flex gap-6 text-sm text-gray-500">
                                <span class="flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
                                </svg>

                                ${newsData.hero.date}
                                </span>
                                <span class="flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                </svg>

                                ${newsData.hero.author}</span>
                            </div>
                        </div>
                    </div>
                </article>

                <div class="grid grid-rows-3 gap-4 h-full">
                    ${newsData.sideList
      .map((item) => renderSideItem(item))
      .join('')}
                </div>

            </div>
        </div>
    </section>
    `;
}

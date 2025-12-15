import api, { getImageUrl } from '../../../shared/services/api.js';

// Helper function to format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

// Helper function to strip HTML tags
const stripHtml = (html) => {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

export async function HotNews() {
  // Fetch posts from API /home
  let posts = [];
  try {
    const res = await api.get('/home');
    // API response structure: { status: 'success', statusCode: 200, data: { latest_products, featured_products, top_products, posts } }
    const homeData = res.data?.data || {};
    posts = homeData.posts || [];
    // Limit to 4 posts for home page
    posts = posts.slice(0, 4);
  } catch (error) {
    console.error('Error fetching posts for HotNews:', error);
  }

  // If no posts, return empty or placeholder
  if (posts.length === 0) {
    return `
      <section class="py-16 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-[#0f172a] transition-colors duration-300">
        <div class="max-w-screen-xl mx-auto px-4">
          <div class="flex flex-col items-center mb-12">
            <h2 class="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3">
              Tin Tức Nổi Bật
            </h2>
            <div class="w-24 h-1 bg-gradient-to-r from-[#0A2A45] to-blue-500 rounded-full"></div>
            <p class="text-gray-500 dark:text-gray-400 mt-4 text-center max-w-2xl">
              Cập nhật những tin tức mới nhất về thế giới đồng hồ cao cấp
            </p>
          </div>
          <p class="text-center text-gray-500 dark:text-gray-400 py-10">
            Chưa có bài viết nào
          </p>
        </div>
      </section>
    `;
  }

  // Get hero post (first post)
  const hero = posts[0];
  const sideList = posts.slice(1, 4);
  
  // Helper render bài viết nhỏ bên phải
  const renderSideItem = (item) => `
        <a href="/news-detail.html?id=${item.id}" class="flex gap-4 group cursor-pointer bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-gray-300 dark:border-white/20 hover:border-[#0A2A45]/50 dark:hover:border-blue-400/50 transition-all duration-300 h-full">
            <div class="w-[180px] shrink-0 overflow-hidden">
                <img src="${getImageUrl(item.image)}" alt="${item.name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
            </div>
            
            <div class="flex-1 flex flex-col justify-between py-4 pr-4">
                <div class="flex-1">
                    <h3 class="text-base font-bold text-slate-900 dark:text-white leading-snug group-hover:text-[#0A2A45] dark:group-hover:text-blue-400 transition-colors mb-2.5 line-clamp-3">
                        ${item.name}
                    </h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
                        ${stripHtml(item.content)}
                    </p>
                </div>
                
                <div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                    <span class="flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
                      </svg>
                      ${formatDate(item.created_at)}
                    </span>
                    <span class="flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                      ${item.author_name || 'Admin'}
                    </span>
                </div>
            </div>
        </a>
    `;

  return `
    <section class="py-16 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-[#0f172a] transition-colors duration-300">
        <div class="max-w-screen-xl mx-auto px-4">
            <!-- Section Header -->
            <div class="flex flex-col items-center mb-12">
                <h2 class="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3">
                    Tin Tức Nổi Bật
                </h2>
                <div class="w-24 h-1 bg-gradient-to-r from-[#0A2A45] to-blue-500 rounded-full"></div>
                <p class="text-gray-500 dark:text-gray-400 mt-4 text-center max-w-2xl">
                    Cập nhật những tin tức mới nhất về thế giới đồng hồ cao cấp
                </p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
                
                <!-- Featured Article -->
                <a href="/news-detail.html?id=${hero.id}" class="flex flex-col h-full group cursor-pointer bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-gray-300 dark:border-white/20 hover:border-[#0A2A45]/50 dark:hover:border-blue-400/50 transition-all duration-300">
                    <div class="w-full h-[300px] lg:h-[350px] overflow-hidden relative">
                        <img src="${getImageUrl(hero.image)}" alt="${hero.name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                        <div class="absolute top-4 right-4 bg-[#0A2A45] text-white px-4 py-1.5 rounded-full text-sm font-bold">
                            Nổi bật
                        </div>
                    </div>
                    
                    <div class="flex flex-col flex-1 justify-between p-6">
                        <div>
                            <h3 class="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-3 leading-tight group-hover:text-[#0A2A45] dark:group-hover:text-blue-400 transition-colors">
                                ${hero.name}
                            </h3>
                            <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
                                ${stripHtml(hero.content)}
                            </p>
                        </div>
                        
                        <div class="flex items-center justify-between border-t border-gray-200 dark:border-slate-700 pt-4 mt-4">
                            <span class="px-5 py-2.5 bg-[#0A2A45] dark:bg-blue-600 text-white font-semibold text-sm rounded-lg">
                                Xem thêm
                            </span>
                            <div class="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                                <span class="flex items-center gap-1.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
                                    </svg>
                                    ${formatDate(hero.created_at)}
                                </span>
                                <span class="flex items-center gap-1.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                    </svg>
                                    ${hero.author_name || 'Admin'}
                                </span>
                            </div>
                        </div>
                    </div>
                </a>

                <div class="grid grid-rows-3 gap-5 h-full">
                    ${sideList
                      .map((item) => renderSideItem(item))
                      .join('')}
                </div>

            </div>
        </div>
    </section>
    `;
}

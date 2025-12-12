// Dữ liệu tin tức mẫu
const newsData = {
  hero: {
    id: 1,
    title:
      'Trải nghiệm sớm bộ sưu tập: Đêm ngược ngày "siêu phẩm" Frederique Constant 2025 độ bộ Việt Nam',
    desc: 'Đón đầu những xu hướng đồng hồ 2026 với bộ sưu tập Frederique Constant mới nhất sắp đổ bộ Đồng hồ Galle. Khám phá Top đồng hồ Orient đình đám phong cách quý ông Việt 2025. Bạn chọn bản sắc dấn tóc, sự tôi giản hay chất thể thao?',
    image: '/images/news/news-1.jpg',
    date: '11 Tháng 12, 2025',
    author: 'Bình Phan',
  },
  sideList: [
    {
      id: 2,
      title:
        'Điểm mặt các siêu phẩm Orient được lòng quý ông Việt Nhật năm 2025',
      desc: 'Khám phá Top 4 xu hướng đồng hồ Orient đình đình phong cách quý ông Việt 2025. Bạn chọn bản sắc dấn tóc, sự tối giản hay chất thể thao? Tìm câu trả lời cùng Đồng hồ Galle.',
      image: '/images/news/news-2.jpg',
      date: '11 Tháng 12, 2025',
      author: 'Khôi Nguyễn',
    },
    {
      id: 3,
      title: 'Tinh hoa hội tụ: Top Orient Star được săn đón nhất năm 2025',
      desc: 'Khám phá Top đồng hồ Orient Star đang sở hữu nhất 2025. Cùng Đồng hồ Galle giải mã sức hút từ độ bền hàng chục năm và thiết kế không tuổi của thương hiệu Nhật Bản này.',
      image: '/images/news/news-3.jpg',
      date: '11 Tháng 12, 2025',
      author: 'Phan Đức Toàn',
    },
    {
      id: 4,
      title:
        'Cùng tìm hiểu tất tần tật về thuật ngữ "Flying Seconds" trong thế giới đồng hồ cơ',
      desc: 'Trong thế giới đồng hồ cơ học đầy tinh vi, mỗi chuyển động của kim giây đều là một câu chuyện về nghệ thuật và kỹ thuật. Nếu bạn từng thấy kim giây trên mặt số mẫu đồng hồ cao cấp "nhảy" từng nhịp rõ ràng thay vì trượt dần ...',
      image: '/images/news/news-4.jpg',
      date: '25 Tháng 11, 2025',
      author: 'Bình Phan',
    },
  ],
};

export function HotNews() {
  // Helper render bài viết nhỏ bên phải
  const renderSideItem = (item) => `
        <article class="flex gap-4 group cursor-pointer bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-gray-300 dark:border-white/20 hover:border-[#0A2A45]/50 dark:hover:border-blue-400/50 transition-all duration-300 h-full">
            <div class="w-[180px] shrink-0 overflow-hidden">
                <img src="${item.image}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
            </div>
            
            <div class="flex-1 flex flex-col justify-between py-4 pr-4">
                <div class="flex-1">
                    <h3 class="text-base font-bold text-slate-900 dark:text-white leading-snug group-hover:text-[#0A2A45] dark:group-hover:text-blue-400 transition-colors mb-2.5 line-clamp-3">
                        ${item.title}
                    </h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
                        ${item.desc}
                    </p>
                </div>
                
                <div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                    <span class="flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
                      </svg>
                      ${item.date}
                    </span>
                    <span class="flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                      ${item.author}
                    </span>
                </div>
            </div>
        </article>
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
                <article class="flex flex-col h-full group cursor-pointer bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-gray-300 dark:border-white/20 hover:border-[#0A2A45]/50 dark:hover:border-blue-400/50 transition-all duration-300">
                    <div class="w-full h-[300px] lg:h-[350px] overflow-hidden relative">
                        <img src="${
                          newsData.hero.image
                        }" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                        <div class="absolute top-4 right-4 bg-[#0A2A45] text-white px-4 py-1.5 rounded-full text-sm font-bold">
                            Nổi bật
                        </div>
                    </div>
                    
                    <div class="flex flex-col flex-1 justify-between p-6">
                        <div>
                            <h3 class="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-3 leading-tight group-hover:text-[#0A2A45] dark:group-hover:text-blue-400 transition-colors">
                                ${newsData.hero.title}
                            </h3>
                            <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
                                ${newsData.hero.desc}
                            </p>
                        </div>
                        
                        <div class="flex items-center justify-between border-t border-gray-200 dark:border-slate-700 pt-4 mt-4">
                            <button class="px-5 py-2.5 bg-[#0A2A45] dark:bg-blue-600 text-white font-semibold text-sm rounded-lg hover:opacity-90 transition-all">
                                Xem thêm
                            </button>
                            <div class="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                                <span class="flex items-center gap-1.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
                                    </svg>
                                    ${newsData.hero.date}
                                </span>
                                <span class="flex items-center gap-1.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                    </svg>
                                    ${newsData.hero.author}
                                </span>
                            </div>
                        </div>
                    </div>
                </article>

                <div class="grid grid-rows-3 gap-5 h-full">
                    ${newsData.sideList
                      .map((item) => renderSideItem(item))
                      .join('')}
                </div>

            </div>
        </div>
    </section>
    `;
}

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Eye } from 'lucide-react';
import { getImageUrl } from '@/lib/api';
import { formatDate, truncateText } from '@/lib/utils';
import { usePosts } from '@/lib/swr';

export default function NewsPage() {
  const { data: posts = [], isLoading: loading } = usePosts({ limit: 12 });

  return (
    <div className="py-12 bg-white dark:bg-[#0f172a] min-h-screen">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-2">Bài viết & Tin tức</h1>
          <p className="text-gray-500">Cập nhật xu hướng đồng hồ mới nhất</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse"><div className="aspect-video bg-gray-200 dark:bg-slate-700 rounded-2xl mb-4" /><div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-2" /><div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full" /></div>
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link key={post._id} href={`/news/${post.slug}`} className="group">
                <div className="aspect-video rounded-2xl overflow-hidden mb-4 bg-gray-100 dark:bg-slate-800 relative">
                  <Image src={getImageUrl(post.image)} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(post.created_at)}</span>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.views} lượt xem</span>
                </div>
                <h3 className="font-bold text-lg group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">{post.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2">{truncateText(post.excerpt || '', 120)}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-20">Chưa có bài viết nào.</p>
        )}
      </div>
    </div>
  );
}

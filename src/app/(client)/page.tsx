'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import ProductCard from '@/components/client/ProductCard';
import { ProductGridSkeleton } from '@/components/client/ProductSkeleton';
import { useHomeProducts } from '@/lib/swr';
import type { IProduct, IPaginatedData } from '@/types';

/** Helper: normalize API response (could be array or paginated object) */
function extractProducts(data: IProduct[] | IPaginatedData<IProduct> | undefined): IProduct[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if ('items' in data) return data.items;
  return [];
}

export default function HomePage() {
  const { data: newData, isLoading: loadingNew } = useHomeProducts('new', 8);
  const { data: bestData, isLoading: loadingBest } = useHomeProducts('best', 8);
  const { data: featuredData, isLoading: loadingFeatured } = useHomeProducts('featured', 8);

  const newArrivals = extractProducts(newData);
  const bestSellers = extractProducts(bestData);
  const featured = extractProducts(featuredData);
  const loading = loadingNew || loadingBest || loadingFeatured;

  return (
    <>
      {/* Banner */}
      <section className="w-full">
        <div className="mx-auto max-w-screen-xl mb-10">
          <Image
            src="/images/banners/banner-home-1.jpg"
            alt="Rudo Watch Banner"
            width={1280}
            height={400}
            className="w-full h-auto"
            priority
          />
        </div>
      </section>

      {/* New Arrivals - Swiper */}
      <section className="py-16 bg-white dark:bg-[#0f172a] transition-colors duration-300">
        <div className="mx-auto max-w-screen-xl px-4 overflow-hidden">
          <div className="flex flex-col items-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
              Sản phẩm mới
            </h2>
            <div className="w-16 h-1 bg-blue-500 rounded" />
          </div>

          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : newArrivals.length > 0 ? (
            <Swiper
              modules={[Autoplay, Pagination]}
              spaceBetween={24}
              slidesPerView={1}
              pagination={{ clickable: true }}
              autoplay={{ delay: 4000, disableOnInteraction: false }}
              breakpoints={{
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 4 },
              }}
              className="pb-12"
            >
              {newArrivals.map((product) => (
                <SwiperSlide key={product._id}>
                  <ProductCard product={product} />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <p className="text-center text-gray-500">Chưa có sản phẩm mới.</p>
          )}
        </div>
      </section>

      {/* Best Sellers */}
      <section className="py-16 bg-gray-50 dark:bg-slate-800/50 transition-colors duration-300">
        <div className="mx-auto max-w-screen-xl px-4">
          <div className="flex items-end justify-between mb-8 border-b border-gray-200 dark:border-slate-700 pb-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                Sản phẩm bán chạy
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                Những sản phẩm được yêu thích nhất
              </p>
            </div>
            <Link
              href="/products"
              className="group flex items-center gap-1 text-sm font-bold uppercase text-primary dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
            >
              Xem tất cả
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>

          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {bestSellers.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured */}
      <section className="py-16 bg-white dark:bg-[#0f172a] transition-colors duration-300">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex items-end justify-between mb-8 border-b border-gray-100 dark:border-slate-700 pb-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                Sản phẩm nổi bật
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                Những sản phẩm đặc biệt được chọn lọc
              </p>
            </div>
            <Link
              href="/products"
              className="group flex items-center gap-1 text-sm font-bold uppercase text-primary dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
            >
              Xem tất cả
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>

          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

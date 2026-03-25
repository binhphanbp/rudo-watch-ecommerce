'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SlidersHorizontal, ChevronDown, Search } from 'lucide-react';
import ProductCard from '@/components/client/ProductCard';
import { ProductGridSkeleton } from '@/components/client/ProductSkeleton';
import { productApi, type ProductsParams } from '@/lib/api/products';
import { categoryApi, brandApi } from '@/lib/api/services';
import type { IProduct, ICategory, IBrand } from '@/types';

const SORT_OPTIONS = [
  { label: 'Mới nhất', value: 'created_at', order: 'desc' as const },
  { label: 'Giá thấp → cao', value: 'price', order: 'asc' as const },
  { label: 'Giá cao → thấp', value: 'price', order: 'desc' as const },
  { label: 'Tên A → Z', value: 'name', order: 'asc' as const },
];

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [brands, setBrands] = useState<IBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentPage = Number(searchParams.get('page') || '1');
  const currentCategory = searchParams.get('category') || '';
  const currentBrand = searchParams.get('brand') || '';
  const currentSort = searchParams.get('sort') || 'created_at';
  const currentOrder = (searchParams.get('order') || 'desc') as 'asc' | 'desc';
  const currentSearch = searchParams.get('search') || '';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: ProductsParams = {
        page: currentPage,
        limit: 12,
        sort: currentSort,
        order: currentOrder,
        status: 'active',
      };
      if (currentCategory) params.category = currentCategory;
      if (currentBrand) params.brand = currentBrand;
      if (currentSearch) params.search = currentSearch;

      const { data: res } = await productApi.getProducts(params);
      const responseData = res.data;

      if (Array.isArray(responseData)) {
        setProducts(responseData);
      } else if (responseData && 'items' in responseData) {
        setProducts(responseData.items);
        if (responseData.pagination) {
          setTotalPages(responseData.pagination.totalPages);
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, currentCategory, currentBrand, currentSort, currentOrder, currentSearch]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [catRes, brandRes] = await Promise.allSettled([
          categoryApi.getCategories(),
          brandApi.getBrands(),
        ]);
        if (catRes.status === 'fulfilled') {
          const data = catRes.value.data.data;
          setCategories(Array.isArray(data) ? data : []);
        }
        if (brandRes.status === 'fulfilled') {
          const data = brandRes.value.data.data;
          setBrands(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error fetching filters:', error);
      }
    };
    fetchFilters();
  }, []);

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    if (!updates.page) params.set('page', '1');
    router.push(`/products?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ search: searchQuery, page: '1' });
  };

  return (
    <div className="py-8 bg-white dark:bg-[#0f172a] min-h-screen">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Sản phẩm</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Khám phá bộ sưu tập đồng hồ chính hãng</p>
          </div>
          <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="relative">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm kiếm..." className="pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56" />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </form>
            <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-slate-800 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
              <SlidersHorizontal className="w-4 h-4" /> Bộ lọc
            </button>
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-slate-800 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                Sắp xếp <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden hidden group-hover:block z-10 animate-fade-in">
                {SORT_OPTIONS.map((opt) => (
                  <button key={`${opt.value}-${opt.order}`} onClick={() => updateParams({ sort: opt.value, order: opt.order })} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 ${currentSort === opt.value && currentOrder === opt.order ? 'text-blue-600 font-semibold bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {showFilters && (
            <aside className="w-64 shrink-0 animate-fade-in">
              <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-6 sticky top-24">
                <div className="mb-6">
                  <h3 className="font-bold text-sm uppercase tracking-wider mb-3 text-slate-900 dark:text-white">Danh mục</h3>
                  <div className="space-y-2">
                    <button onClick={() => updateParams({ category: '' })} className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${!currentCategory ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-slate-700'}`}>Tất cả</button>
                    {categories.map((cat) => (
                      <button key={cat._id} onClick={() => updateParams({ category: cat._id })} className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${currentCategory === cat._id ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-slate-700'}`}>{cat.name}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wider mb-3 text-slate-900 dark:text-white">Thương hiệu</h3>
                  <div className="space-y-2">
                    <button onClick={() => updateParams({ brand: '' })} className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${!currentBrand ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-slate-700'}`}>Tất cả</button>
                    {brands.map((brand) => (
                      <button key={brand._id} onClick={() => updateParams({ brand: brand._id })} className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${currentBrand === brand._id ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-slate-700'}`}>{brand.name}</button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          )}

          <div className="flex-1">
            {loading ? (
              <ProductGridSkeleton count={12} />
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-12">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button key={i} onClick={() => updateParams({ page: String(i + 1) })} className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${currentPage === i + 1 ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700'}`}>{i + 1}</button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">Không tìm thấy sản phẩm nào.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="py-8 max-w-screen-xl mx-auto px-4"><ProductGridSkeleton count={12} /></div>}>
      <ProductsContent />
    </Suspense>
  );
}

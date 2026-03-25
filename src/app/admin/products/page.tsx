'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Plus, Edit, Trash2, Search, Package, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { productApi } from '@/lib/api/services';
import { getImageUrl } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useProducts, useCategories, useBrands } from '@/lib/swr';
import type { IProduct, ICategory, IBrand, IPaginatedData } from '@/types';
import Swal from 'sweetalert2';

interface VariantForm {
  price: number;
  sale_price: number;
  quantity: number;
  color: string;
  sku: string;
  image: string;
}

const emptyVariant: VariantForm = { price: 0, sale_price: 0, quantity: 0, color: '', sku: '', image: '' };

export default function AdminProductsPage() {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [page, setPage] = useState(1);

  // SWR hooks
  const { data: productsData, isLoading: loading, mutate } = useProducts({
    page,
    limit: 10,
    status: 'active',
    search: search || undefined,
    category: filterCategory || undefined,
    brand: filterBrand || undefined,
  });
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();

  // Extract products
  let products: IProduct[] = [];
  let totalPages = 1;
  if (productsData) {
    if (Array.isArray(productsData)) {
      products = productsData as unknown as IProduct[];
    } else if ('items' in (productsData as IPaginatedData<IProduct>)) {
      const paginated = productsData as IPaginatedData<IProduct>;
      products = paginated.items;
      if (paginated.pagination) totalPages = paginated.pagination.totalPages;
    }
  }

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<IProduct | null>(null);
  const [form, setForm] = useState({
    name: '', description: '', image: '', category_id: '', brand_id: '', model_code: '',
  });
  const [variants, setVariants] = useState<VariantForm[]>([{ ...emptyVariant }]);
  const [submitting, setSubmitting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', image: '', category_id: '', brand_id: '', model_code: '' });
    setVariants([{ ...emptyVariant }]);
    setShowModal(true);
  };

  const openEdit = (product: IProduct) => {
    setEditing(product);
    const catId = typeof product.category_id === 'object' ? (product.category_id as ICategory)._id : product.category_id;
    const brandId = typeof product.brand_id === 'object' ? (product.brand_id as IBrand)._id : product.brand_id;
    setForm({
      name: product.name,
      description: product.description || '',
      image: product.image || '',
      category_id: catId,
      brand_id: brandId,
      model_code: product.model_code || '',
    });
    if (product.variants && product.variants.length > 0) {
      setVariants(product.variants.map((v) => ({
        price: v.price,
        sale_price: v.sale_price || 0,
        quantity: v.stock || 0,
        color: v.color || '',
        sku: v.sku || '',
        image: v.image || '',
      })));
    } else {
      setVariants([{ ...emptyVariant }]);
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.category_id || !form.brand_id) {
      Swal.fire({ icon: 'warning', title: 'Vui lòng điền tên, danh mục, thương hiệu' });
      return;
    }
    const validVariants = variants.filter((v) => v.price > 0);
    if (validVariants.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Cần ít nhất 1 biến thể với giá > 0' });
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...form, variants: validVariants };
      if (editing) {
        await productApi.updateProduct(editing._id, payload);
        Swal.fire({ icon: 'success', title: 'Cập nhật thành công!', timer: 1500, showConfirmButton: false });
      } else {
        await productApi.createProduct(payload);
        Swal.fire({ icon: 'success', title: 'Thêm thành công!', timer: 1500, showConfirmButton: false });
      }
      setShowModal(false);
      mutate();
    } catch {
      Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không thể lưu sản phẩm' });
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: `Xoá "${name}"?`,
      text: 'Sản phẩm và các biến thể sẽ bị xoá vĩnh viễn!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Xoá',
      cancelButtonText: 'Huỷ',
    });
    if (result.isConfirmed) {
      try {
        await productApi.deleteProduct(id);
        mutate();
        Swal.fire({ icon: 'success', title: 'Đã xoá!', timer: 1500, showConfirmButton: false });
      } catch {
        Swal.fire({ icon: 'error', title: 'Không thể xoá sản phẩm' });
      }
    }
  };

  const addVariant = () => setVariants([...variants, { ...emptyVariant }]);
  const removeVariant = (idx: number) => {
    if (variants.length <= 1) return;
    setVariants(variants.filter((_, i) => i !== idx));
  };
  const updateVariant = (idx: number, field: keyof VariantForm, value: string | number) => {
    const updated = [...variants];
    updated[idx] = { ...updated[idx], [field]: value };
    setVariants(updated);
  };

  const getCategoryName = (product: IProduct) => {
    if (typeof product.category_id === 'object') return (product.category_id as ICategory).name;
    return product.category_name || '';
  };
  const getBrandName = (product: IProduct) => {
    if (typeof product.brand_id === 'object') return (product.brand_id as IBrand).name;
    return product.brand_name || '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sản phẩm</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý sản phẩm và biến thể</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Thêm sản phẩm
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm sản phẩm..." className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }} className="px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select value={filterBrand} onChange={(e) => { setFilterBrand(e.target.value); setPage(1); }} className="px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tất cả thương hiệu</option>
          {brands.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Danh mục</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Thương hiệu</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Giá</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Biến thể</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-5 py-4"><div className="h-10 bg-gray-100 dark:bg-slate-700 rounded-lg animate-pulse" /></td></tr>
                ))
              ) : products.length > 0 ? (
                products.map((p) => {
                  const price = p.price || (p.variants?.[0]?.price ?? 0);
                  const salePrice = p.price_sale || 0;
                  return (
                    <tr key={p._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {p.image ? (
                            <Image src={getImageUrl(p.image)} alt={p.name} width={48} height={48} className="w-12 h-12 rounded-lg object-cover bg-gray-100 dark:bg-slate-700" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center"><Package className="w-6 h-6 text-blue-500" /></div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 dark:text-white text-sm truncate max-w-[200px]">{p.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{p.model_code || p.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 hidden md:table-cell">{getCategoryName(p)}</td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 hidden lg:table-cell">{getBrandName(p)}</td>
                      <td className="px-5 py-4 text-right">
                        <p className="text-sm font-semibold text-blue-600">{formatPrice(salePrice > 0 ? salePrice : price)}</p>
                        {salePrice > 0 && <p className="text-xs text-gray-400 line-through">{formatPrice(price)}</p>}
                      </td>
                      <td className="px-5 py-4 text-center hidden sm:table-cell">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400">{p.variants?.length || 0}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(p._id, p.name)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={6} className="px-5 py-12 text-center">
                  <Package className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-600 mb-3" />
                  <p className="text-gray-500 text-sm">Không tìm thấy sản phẩm</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-slate-700">
            <p className="text-sm text-gray-500">Trang {page}/{totalPages}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl my-8 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{editing ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            {/* Basic info */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Tên sản phẩm <span className="text-red-500">*</span></label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ví dụ: Đồng hồ Casio G-Shock GA-2100..." className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Danh mục <span className="text-red-500">*</span></label>
                  <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- Chọn --</option>
                    {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Thương hiệu <span className="text-red-500">*</span></label>
                  <select value={form.brand_id} onChange={(e) => setForm({ ...form, brand_id: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- Chọn --</option>
                    {brands.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Hình ảnh (URL)</label>
                  <input type="text" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="/images/products/..." className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Mã model</label>
                  <input type="text" value={form.model_code} onChange={(e) => setForm({ ...form, model_code: e.target.value })} placeholder="GA-2100-1A1" className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Mô tả</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Mô tả chi tiết..." className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>

            {/* Variants */}
            <div className="border-t border-gray-100 dark:border-slate-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Biến thể ({variants.length})</h4>
                <button onClick={addVariant} className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600 font-medium">
                  <Plus className="w-3.5 h-3.5" /> Thêm
                </button>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {variants.map((v, idx) => (
                  <div key={idx} className="grid grid-cols-6 gap-2 items-end p-3 bg-gray-50 dark:bg-slate-700/30 rounded-xl">
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">Giá *</label>
                      <input type="number" value={v.price || ''} onChange={(e) => updateVariant(idx, 'price', Number(e.target.value))} className="w-full px-2 py-1.5 border border-gray-200 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-800" />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">Giá sale</label>
                      <input type="number" value={v.sale_price || ''} onChange={(e) => updateVariant(idx, 'sale_price', Number(e.target.value))} className="w-full px-2 py-1.5 border border-gray-200 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-800" />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">SL kho</label>
                      <input type="number" value={v.quantity || ''} onChange={(e) => updateVariant(idx, 'quantity', Number(e.target.value))} className="w-full px-2 py-1.5 border border-gray-200 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-800" />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">Màu</label>
                      <input type="text" value={v.color} onChange={(e) => updateVariant(idx, 'color', e.target.value)} placeholder="Đen" className="w-full px-2 py-1.5 border border-gray-200 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-800" />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">SKU</label>
                      <input type="text" value={v.sku} onChange={(e) => updateVariant(idx, 'sku', e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-800" />
                    </div>
                    <div className="flex justify-end">
                      {variants.length > 1 && (
                        <button onClick={() => removeVariant(idx)} className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-slate-700">
              <button onClick={() => setShowModal(false)} className="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl font-medium">Huỷ</button>
              <button onClick={handleSubmit} disabled={submitting} className="px-6 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors">
                {submitting ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Plus, Edit, Trash2, Search, Tag, X } from 'lucide-react';
import { brandApi } from '@/lib/api/services';
import { getImageUrl } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { useBrands } from '@/lib/swr';
import type { IBrand } from '@/types';
import Swal from 'sweetalert2';

export default function AdminBrandsPage() {
  const { data: brands = [], isLoading: loading, mutate } = useBrands();
  const [search, setSearch] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<IBrand | null>(null);
  const [form, setForm] = useState({ name: '', logo: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', logo: '', description: '' });
    setShowModal(true);
  };

  const openEdit = (brand: IBrand) => {
    setEditing(brand);
    setForm({ name: brand.name, logo: brand.logo || '', description: brand.description || '' });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      Swal.fire({ icon: 'warning', title: 'Tên thương hiệu không được trống' });
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        await brandApi.updateBrand(editing._id, form);
        Swal.fire({ icon: 'success', title: 'Cập nhật thành công!', timer: 1500, showConfirmButton: false });
      } else {
        await brandApi.createBrand(form);
        Swal.fire({ icon: 'success', title: 'Thêm thành công!', timer: 1500, showConfirmButton: false });
      }
      setShowModal(false);
      mutate();
    } catch {
      Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không thể lưu thương hiệu' });
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: `Xoá "${name}"?`,
      text: 'Hành động này không thể hoàn tác!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Xoá',
      cancelButtonText: 'Huỷ',
    });
    if (result.isConfirmed) {
      try {
        await brandApi.deleteBrand(id);
        mutate();
        Swal.fire({ icon: 'success', title: 'Đã xoá!', timer: 1500, showConfirmButton: false });
      } catch {
        Swal.fire({ icon: 'error', title: 'Không thể xoá', text: 'Thương hiệu có thể đang được sử dụng' });
      }
    }
  };

  const filtered = brands.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Thương hiệu</h1>
          <p className="text-sm text-gray-500 mt-1">{brands.length} thương hiệu</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Thêm thương hiệu
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm thương hiệu..." className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Thương hiệu</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Slug</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Ngày tạo</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4} className="px-5 py-4"><div className="h-8 bg-gray-100 dark:bg-slate-700 rounded-lg animate-pulse" /></td>
                  </tr>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((brand) => (
                  <tr key={brand._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {brand.logo ? (
                          <Image src={getImageUrl(brand.logo)} alt={brand.name} width={40} height={40} className="w-10 h-10 rounded-lg object-contain bg-white dark:bg-slate-700 p-1 border border-gray-100 dark:border-slate-600" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                            <Tag className="w-5 h-5 text-purple-500" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white text-sm">{brand.name}</p>
                          {brand.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{brand.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 hidden md:table-cell">
                      <code className="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-xs">{brand.slug}</code>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 hidden lg:table-cell">{formatDateTime(brand.created_at)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(brand)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Sửa">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(brand._id, brand.name)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Xoá">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center">
                    <Tag className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-600 mb-3" />
                    <p className="text-gray-500 text-sm">{search ? 'Không tìm thấy thương hiệu' : 'Chưa có thương hiệu nào'}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{editing ? 'Sửa thương hiệu' : 'Thêm thương hiệu'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Tên thương hiệu <span className="text-red-500">*</span></label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ví dụ: Casio, Seiko..." className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Logo (URL)</label>
                <input type="text" value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} placeholder="https://... hoặc /images/..." className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Mô tả</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Mô tả ngắn..." className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
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

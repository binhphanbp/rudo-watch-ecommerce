export default function ProductSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-white/5 h-full animate-pulse">
      <div className="aspect-square bg-gray-200 dark:bg-slate-700 rounded-xl mb-4" />
      <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/3 mb-2" />
      <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2 mb-2" />
      <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-2/5 mt-auto" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
}

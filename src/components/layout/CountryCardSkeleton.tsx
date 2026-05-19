export default function CountryCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-40 bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-6 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
        <div className="space-y-2 pt-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 bg-gray-100 rounded w-16" />
              <div className="h-4 bg-gray-100 rounded w-20" />
            </div>
          ))}
        </div>
        <div className="pt-4 border-t border-gray-100 flex gap-2">
          <div className="flex-1 h-8 bg-gray-100 rounded" />
          <div className="h-8 w-12 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
}
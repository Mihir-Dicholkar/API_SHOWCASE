import Link from "next/link";
import { apiConfig } from "@/lib/api-config";

export default function ApiLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col md:flex-row">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-72 bg-white border-r border-gray-200 md:h-screen md:sticky md:top-0 overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <Link href="/" className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">API</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">API Showcase</h1>
                <p className="text-xs text-gray-500">Explore {apiConfig.length} APIs</p>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="space-y-1">
              {apiConfig.map((api) => (
                <Link
                  key={api.slug}
                  href={`/${api.slug}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  <span className="text-xl">{api.icon || "🔌"}</span>
                  {api.name}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
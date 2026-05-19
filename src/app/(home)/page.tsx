import Header from '@/components/layout/Header';
import { apiConfig } from '@/lib/api-config';
import Link from 'next/link';

// Emoji icons & tag type per API slug
const apiMeta: Record<string, { icon: string; tag: 'live' | 'free' }> = {
  countries:  { icon: '🌍', tag: 'free' },
  weather:    { icon: '⛅', tag: 'live' },
  books:      { icon: '📚', tag: 'free' },
  meals:      { icon: '🍽️', tag: 'free' },
  users:      { icon: '👤', tag: 'free' },
  'nasa-apod':{ icon: '🔭', tag: 'live' },
  news:       { icon: '📰', tag: 'live' },
  flights:    { icon: '✈️', tag: 'live' },
};

const features = [
  {
    icon: '🗄️',
    title: 'Response caching',
    desc: 'MongoDB TTL cache reduces redundant API calls and keeps the UI snappy.',
  },
  {
    icon: '🔷',
    title: 'Fully typed',
    desc: 'End-to-end TypeScript with inferred API response types and Zod validation.',
  },
  {
    icon: '⚡',
    title: 'App Router',
    desc: 'Next.js 14 App Router with server components, streaming, and route handlers.',
  },
  {
    icon: '🔓',
    title: 'No keys needed',
    desc: 'All 8 APIs are completely free — no signup, keys, or rate-limit headaches.',
  },
];

const techStack = [
  'Next.js 14',
  'TypeScript',
  'MongoDB cache',
  'Tailwind CSS',
  'App Router',
  'Zod',
];

const stats = [
  { value: '8',  label: 'APIs integrated' },
  { value: '0',  label: 'API keys needed' },
  { value: '∞',  label: 'Free forever' },
  { value: 'TS', label: 'Type-safe' },
];

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#f8fafc]">

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#f8faff] via-[#eef2ff] to-[#f5f0ff] border-b border-gray-200/60 py-24 px-6 text-center">

          {/* Decorative blurred orbs */}
          <div className="orb pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-200/30 blur-3xl" />
          <div className="orb-delay pointer-events-none absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-violet-200/30 blur-3xl" />

          <div className="relative z-10 max-w-3xl mx-auto">

            {/* Live badge */}
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-1.5 text-xs font-medium text-gray-500 mb-8 shadow-sm fade-up">
              <span className="live-dot w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              8 live integrations · No API keys required
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight tracking-tight mb-6 fade-up animation-delay-100">
              Explore free public{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                APIs
              </span>
              <br />with live data
            </h1>

            <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed fade-up animation-delay-200">
              An interactive Next.js explorer built with TypeScript, MongoDB caching,
              and real-time data across 8 free public APIs — no keys, no signups.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3 fade-up animation-delay-300">
              <Link
                href="/news"
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3 rounded-xl font-medium text-sm transition-all duration-150 shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                📰 Browse live news
              </Link>
              <a
                href="#apis"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-7 py-3 rounded-xl font-medium text-sm transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                View all APIs ↓
              </a>
            </div>

            {/* Stats row */}
            <div className="mt-14 flex justify-center flex-wrap gap-x-10 gap-y-4 fade-up animation-delay-400">
              {stats.map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── API Grid ──────────────────────────────────────────── */}
        <section id="apis" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 scroll-mt-20">
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900">Featured integrations</h2>
            <p className="text-gray-500 mt-1 text-sm">Click any card to explore the live implementation</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {apiConfig.map((api, i) => {
              const meta = apiMeta[api.slug] ?? { icon: '🔌', tag: 'free' };
              return (
                <Link
                  key={api.slug}
                  href={`/${api.slug}`}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className="fade-up group flex flex-col bg-white border border-gray-200/80 rounded-2xl p-5 hover:border-indigo-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-50 transition-all duration-200 active:scale-[0.98]"
                >
                  {/* Card top */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl">
                      {meta.icon}
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                      meta.tag === 'live'
                        ? 'bg-blue-50 text-blue-700 border border-blue-100'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    }`}>
                      {meta.tag === 'live' ? '● Live' : '✓ Free'}
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-900 text-[15px] mb-1.5 group-hover:text-indigo-700 transition-colors">
                    {api.name}
                  </h3>

                  {/* Provider + arrow */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <span className="text-[11px] text-gray-400 font-mono truncate">
                      {meta.icon} {api.slug}
                    </span>
                    <span className="text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all text-sm">
                      →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>tre
        </section>

        {/* ── How it's built ────────────────────────────────────── */}
        <section className="bg-white border-t border-gray-200/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900">How it&apos;s built</h2>
              <p className="text-gray-500 mt-1 text-sm">Modern tooling for a production-grade developer experience</p>
            </div>

            {/* Tech pills */}
            <div className="flex flex-wrap gap-2 mb-10">
              {techStack.map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-600"
                >
                  {tech}
                </span>
              ))}
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="bg-gray-50 border border-gray-100 rounded-2xl p-5"
                >
                  <div className="text-2xl mb-3">{f.icon}</div>
                  <div className="font-semibold text-gray-900 text-sm mb-1.5">{f.title}</div>
                  <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────────── */}
        <footer className="border-t border-gray-200/60 py-8 text-center text-xs text-gray-400">
          Built with Next.js · API Showcase · All data sourced from free public APIs
        </footer>

      </main>
    </>
  );
}
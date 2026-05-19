export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { CoinMarket, formatCurrency, formatCompactNumber, CRYPTO_CURRENCIES, SORT_OPTIONS, type CryptoCurrency, type SortOption } from '@/lib/validators';
import CryptoFilters from '@/components/crypto/CryptoFilters';
import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Crypto Tracker | API Showcase',
  description: 'Real-time cryptocurrency prices and market data',
};

export default async function CryptoPage({ 
  searchParams 
}: { 
  searchParams?: { q?: string; currency?: CryptoCurrency; sort?: SortOption; page?: string } 
}) {
  const params = searchParams;
  const query = params?.q?.trim() || '';
  const currency = params?.currency || 'usd';
  const sort = params?.sort || 'market_cap_desc';
  const page = Math.max(1, parseInt(params?.page || '1', 10) || 1);
  const perPage = 50; // CoinGecko max per page

  // Build API query
  const apiParams = new URLSearchParams({
    vs_currency: currency,
    order: sort,
    per_page: perPage.toString(),
    page: page.toString(),
    sparkline: 'false', // Set to true for chart data (increases payload)
  });

  if (query) {
    apiParams.set('q', query); // CoinGecko search is via /search endpoint, but markets supports basic filtering
  }

 // ✅ CORRECT: no /coins/markets — proxy adds it via endpoint param
const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/proxy/coingecko?endpoint=coins/markets&${apiParams.toString()}`;
  
  console.log('🪙 Fetching crypto from:', apiUrl);
  
  const res = await fetch(apiUrl, {
    next: { revalidate: 60 } // Cache for 1 minute (prices change frequently)
  });

  let coins: CoinMarket[] = [];

  if (res.ok) {
    try {
      const data = await res.json();
      coins = Array.isArray(data) ? data : [];
    } catch (parseError) {
      console.error('❌ Failed to parse CoinGecko response:', parseError);
    }
  } else {
    const errorText = await res.text().catch(() => 'No error body');
    console.error('❌ CoinGecko API error:', res.status, errorText.slice(0, 200));
  }

  const buildCryptoLink = (pageNum: number) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    params.set('currency', currency);
    params.set('sort', sort);
    params.set('page', String(pageNum));
    return `/crypto?${params.toString()}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">🪙 Crypto Tracker</h1>
        <p className="text-gray-600 mt-2">
          Real-time prices for {coins.length} cryptocurrencies
          {query && <span> • matching "<strong>{query}</strong>"</span>}
          {currency && <span> • in <strong>{currency.toUpperCase()}</strong></span>}
        </p>
      </div>

      {/* Filters (Client Component) */}
      <CryptoFilters />

      {/* Results Table */}
      {coins.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <div className="text-6xl mb-4">📉</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No cryptocurrencies found</h3>
          <p className="text-gray-600 mb-6">Try a different search term or filters.</p>
          <Link 
            href="/crypto" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            ← View all cryptos
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto bg-white rounded-xl border border-gray-200">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">#</th>
                  <th className="px-6 py-3">Coin</th>
                  <th className="px-6 py-3 text-right">Price</th>
                  <th className="px-6 py-3 text-right">24h Change</th>
                  <th className="px-6 py-3 text-right">Market Cap</th>
                  <th className="px-6 py-3 text-right">Volume (24h)</th>
                  <th className="px-6 py-3 text-right">Circulating Supply</th>
                </tr>
              </thead>
              <tbody>
                {coins.map((coin, index) => {
                  const priceChange = coin.price_change_percentage_24h || 0;
                  const changeColor = priceChange >= 0 ? 'text-green-600' : 'text-red-600';
                  const changeSign = priceChange >= 0 ? '+' : '';
                  
                  return (
                    <tr key={coin.id} className="bg-white border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {coin.market_cap_rank || index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <Link 
                          href={`/crypto/${coin.id}`}
                          className="flex items-center gap-3 hover:text-blue-600 transition"
                        >
                          <Image
                            src={coin.image}
                            alt={coin.name}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                          <div>
                            <div className="font-medium text-gray-900">{coin.name}</div>
                            <div className="text-gray-500 uppercase text-xs">{coin.symbol}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {formatCurrency(coin.current_price, currency)}
                      </td>
                      <td className={`px-6 py-4 text-right font-medium ${changeColor}`}>
                        {changeSign}{priceChange.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 text-right">
                        {formatCompactNumber(coin.market_cap)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {formatCompactNumber(coin.total_volume)}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-500">
                        {coin.circulating_supply?.toLocaleString() || 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {coins.map((coin) => {
              const priceChange = coin.price_change_percentage_24h || 0;
              const changeColor = priceChange >= 0 ? 'text-green-600' : 'text-red-600';
              const changeSign = priceChange >= 0 ? '+' : '';
              
              return (
                <Link
                  key={coin.id}
                  href={`/crypto/${coin.id}`}
                  className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Image
                        src={coin.image}
                        alt={coin.name}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      <div>
                        <div className="font-bold text-gray-900">{coin.name}</div>
                        <div className="text-gray-500 uppercase text-xs">{coin.symbol}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{formatCurrency(coin.current_price, currency)}</div>
                      <div className={`text-sm font-medium ${changeColor}`}>
                        {changeSign}{priceChange.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                    <div>
                      <div className="text-gray-400">Market Cap</div>
                      <div className="font-medium">{formatCompactNumber(coin.market_cap)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Volume (24h)</div>
                      <div className="font-medium">{formatCompactNumber(coin.total_volume)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Rank</div>
                      <div className="font-medium">#{coin.market_cap_rank || 'N/A'}</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="mt-8 flex items-center justify-center gap-2">
            {page > 1 && (
              <Link
                href={buildCryptoLink(page - 1)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
              >
                ← Previous
              </Link>
            )}
            
            <span className="px-4 py-2 text-gray-600">
              Page {page}
            </span>
            
            {coins.length === perPage && (
              <Link
                href={buildCryptoLink(page + 1)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
              >
                Next →
              </Link>
            )}
          </div>
        </>
      )}

      {/* Footer info */}
      <div className="mt-12 text-center text-sm text-gray-500">
        <p>
          Data from{' '}
          <a href="https://www.coingecko.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            CoinGecko
          </a>{' '}
          • 10,000+ cryptocurrencies • Free API
        </p>
        <p className="mt-1 text-xs text-gray-400">
          ⚠️ Prices update every minute • Not financial advice
        </p>
      </div>
    </div>
  );
}
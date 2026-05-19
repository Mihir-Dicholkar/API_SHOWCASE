import { CoinDetail, formatCurrency, formatCompactNumber } from '@/lib/validators';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return {
    title: `${id.toUpperCase()} Details | API Showcase`,
    description: `View detailed information about ${id}`,
  };
}

export default async function CoinDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch coin detail by ID
  const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/proxy/coingecko/coins/${id}`;
  
  console.log('🪙 Fetching coin detail from:', apiUrl);
  
  const res = await fetch(apiUrl, {
    next: { revalidate: 300 } // Cache for 5 minutes
  });

  if (!res.ok) {
    console.error('❌ Failed to fetch coin detail:', res.status);
    notFound();
  }

  const coin: CoinDetail = await res.json();

  // Handle case where coin not found
  if (!coin.id || !coin.name) {
    console.warn('⚠️ Coin data missing required fields');
    notFound();
  }

  const currency = 'usd'; // Default for detail view
  const currentPrice = coin.market_data?.current_price?.[currency];
  const marketCap = coin.market_data?.market_cap?.[currency];
  const volume = coin.market_data?.total_volume?.[currency];
  const priceChange24h = coin.market_data?.price_change_percentage_24h;
  const changeColor = (priceChange24h || 0) >= 0 ? 'text-green-600' : 'text-red-600';
  const changeSign = (priceChange24h || 0) >= 0 ? '+' : '';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link href="/crypto" className="inline-flex items-center gap-2 text-blue-600 hover:underline mb-6">
        ← Back to crypto
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <Image
            src={coin.image.large}
            alt={coin.name}
            width={80}
            height={80}
            className="rounded-full"
          />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{coin.name}</h1>
            <p className="text-gray-600 uppercase">{coin.symbol}</p>
            {coin.market_data?.market_cap_rank && (
              <span className="inline-block mt-2 px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                Rank #{coin.market_data.market_cap_rank}
              </span>
            )}
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">
            {formatCurrency(currentPrice, currency)}
          </div>
          {priceChange24h !== null && (
            <div className={`text-lg font-medium ${changeColor} mt-1`}>
              {changeSign}{priceChange24h.toFixed(2)}% (24h)
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Market Cap</div>
          <div className="text-lg font-bold text-gray-900">{formatCompactNumber(marketCap)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Volume (24h)</div>
          <div className="text-lg font-bold text-gray-900">{formatCompactNumber(volume)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Circulating Supply</div>
          <div className="text-lg font-bold text-gray-900">
            {coin.market_data?.circulating_supply?.toLocaleString() || 'N/A'}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Max Supply</div>
          <div className="text-lg font-bold text-gray-900">
            {coin.market_data?.max_supply?.toLocaleString() || '∞'}
          </div>
        </div>
      </div>

      {/* Description */}
      {coin.description?.en && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">About {coin.name}</h2>
          <div className="prose prose-sm max-w-none text-gray-700">
            <p>{coin.description.en}</p>
          </div>
        </div>
      )}

      {/* Links */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coin.links?.homepage?.[0] && (
            <a
              href={coin.links.homepage[0]}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
            >
              🌐 Official Website
            </a>
          )}
          {coin.links?.blockchain_site?.[0] && (
            <a
              href={coin.links.blockchain_site[0]}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
            >
              🔗 Blockchain Explorer
            </a>
          )}
          {coin.links?.twitter_screen_name && (
            <a
              href={`https://twitter.com/${coin.links.twitter_screen_name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
            >
              🐦 Twitter
            </a>
          )}
          {coin.links?.subreddit_url && (
            <a
              href={coin.links.subreddit_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
            >
              📱 Reddit
            </a>
          )}
        </div>
      </div>

      {/* Footer info */}
      <div className="mt-12 text-center text-sm text-gray-500">
        <p>
          Data from{' '}
          <a href="https://www.coingecko.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            CoinGecko
          </a>{' '}
          • Prices update every 5 minutes
        </p>
        <p className="mt-1 text-xs text-gray-400">
          ⚠️ Not financial advice • Do your own research
        </p>
      </div>
    </div>
  );
}
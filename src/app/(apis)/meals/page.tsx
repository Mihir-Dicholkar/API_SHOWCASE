import { MealsResponse, parseMealIngredients, CUISINES, type Cuisine, type Meal } from '@/lib/validators';
import MealFilters from '@/components/meals/MealFilters';
import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Recipe Explorer | API Showcase',
  description: 'Discover delicious recipes from around the world',
};

const truncateInstructions = (text: string | null | undefined, maxLength: number = 150) => {
  if (!text) return 'No instructions available.'; // ✅ Fallback for missing data
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
};

export default async function MealsPage({ 
  searchParams 
}: { 
  searchParams?: Promise<{ s?: string; a?: Cuisine; random?: string }> 
}) {
  const params = await searchParams;
  const searchTerm = params?.s?.trim() || '';
  const cuisine = params?.a && params.a !== 'All' ? params.a : undefined;
  const isRandom = params?.random === 'true';

  // ✅ Determine correct endpoint AND params for TheMealDB
  let endpoint = 'search.php';
  const apiParams = new URLSearchParams();
  
  if (isRandom) {
    endpoint = 'random.php'; // ✅ Random uses its own endpoint, no params needed
  } else if (cuisine) {
    endpoint = 'filter.php'; // ✅ Cuisine filter uses filter.php
    apiParams.set('a', cuisine);
  } else if (searchTerm) {
    endpoint = 'search.php'; // ✅ Name search uses search.php
    apiParams.set('s', searchTerm);
  } else {
    // Default: popular search
    endpoint = 'search.php';
    apiParams.set('s', 'chicken');
  }

  // ✅ Pass endpoint as query param for proxy to handle
  const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/proxy/themealdb?endpoint=${endpoint}&${apiParams.toString()}`;
  
  console.log('🍽️ Fetching meals from:', apiUrl);
  
  const res = await fetch(apiUrl, {
    next: { revalidate: 3600 }
  });

  let meals: Meal[] = [];
  
if (res.ok) {
  try {
    const data = await res.json() as MealsResponse;
    
    // ✅ Log full response structure for debugging
    console.log('🍽️ TheMealDB raw response:', {
      endpoint,
      status: res.status,
      hasMealsKey: 'meals' in data,
      mealsType: typeof data.meals,
      mealsValue: data.meals,
      mealsLength: Array.isArray(data.meals) ? data.meals.length : 'N/A',
      firstMeal: Array.isArray(data.meals) && data.meals[0] 
        ? { id: data.meals[0].idMeal, name: data.meals[0].strMeal, area: data.meals[0].strArea }
        : null
    });
    
    // ✅ Safe array handling
    meals = Array.isArray(data.meals) ? data.meals : [];
    
    // ✅ Validate meal structure
    if (meals.length > 0) {
      const sample = meals[0];
      if (!sample.idMeal || !sample.strMeal || !sample.strMealThumb) {
        console.warn('⚠️ Meal missing required fields:', sample);
      }
    }
    
  } catch (parseError: any) {
    console.error('❌ Failed to parse TheMealDB response:', {
      message: parseError.message,
      stack: parseError.stack?.split('\n')[0]
    });
    meals = [];
  }
} else {
  const errorText = await res.text().catch(() => 'No error body');
  console.error('❌ TheMealDB API error:', {
    status: res.status,
    statusText: res.statusText,
    url: apiUrl,
    error: errorText.slice(0, 500)
  });
  meals = [];
}

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">🍽️ Recipe Explorer</h1>
        <p className="text-gray-600 mt-2">
          Discover {meals.length} recipe{meals.length !== 1 ? 's' : ''} from around the world
          {cuisine && <span> • <strong>{cuisine}</strong> cuisine</span>}
          {searchTerm && <span> • matching "<strong>{searchTerm}</strong>"</span>}
        </p>
      </div>

      <MealFilters />

      {meals.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <div className="text-6xl mb-4">🍳</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No recipes found</h3>
          <p className="text-gray-600 mb-6">
            {cuisine 
              ? `No ${cuisine} recipes found. Try a different cuisine.` 
              : searchTerm 
                ? `No recipes matching "${searchTerm}". Try a different search.`
                : 'Try searching for a recipe or browsing by cuisine.'
            }
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/meals" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              ← View all recipes
            </Link>
            <Link href="/meals?random=true" className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition">
              🎲 Try Random
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {meals.map((meal) => (
            <article key={meal.idMeal} className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 overflow-hidden flex flex-col">
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={meal.strMealThumb}
                  alt={meal.strMeal}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-1 bg-white/90 backdrop-blur text-xs font-medium text-gray-700 rounded-full">
                    {meal.strArea}
                  </span>
                </div>
              </div>
              
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-700 transition">
                  {meal.strMeal}
                </h3>
                
                <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-1">
                  {truncateInstructions(meal.strInstructions)}
                </p>
                
                {meal.strTags && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {meal.strTags.split(',').slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="mt-auto pt-3 border-t border-gray-100 flex gap-2">
                  <a
                    href={meal.strYoutube || `https://www.themealdb.com/meal/${meal.idMeal}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-center text-xs font-medium transition flex items-center justify-center gap-1"
                  >
                    {meal.strYoutube ? '🎬 Watch' : '📖 View'}
                  </a>
                  <Link
                    href={`/meals/${meal.idMeal}`}
                    className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition"
                  >
                    Details
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-12 text-center text-sm text-gray-500">
        <p>
          Data from{' '}
          <a href="https://www.themealdb.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            TheMealDB
          </a>{' '}
          • 30,000+ recipes • Free for personal use
        </p>
      </div>
    </div>
  );
}
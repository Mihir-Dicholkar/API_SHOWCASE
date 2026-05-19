import { Meal, parseMealIngredients } from '@/lib/validators';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return {
    title: `Recipe Details | API Showcase`,
    description: `View full recipe details`,
  };
}

export default async function MealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch meal by ID
 const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/proxy/themealdb?endpoint=lookup.php&i=${id}`;
  
  const res = await fetch(apiUrl, {
    next: { revalidate: 86400 } // Cache for 24 hours
  });

  if (!res.ok) {
    notFound();
  }

  const data = await res.json();
  const meal: Meal = data.meals?.[0];
  
  if (!meal) {
    notFound();
  }

  const ingredients = parseMealIngredients(meal);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link href="/meals" className="inline-flex items-center gap-2 text-blue-600 hover:underline mb-6">
        ← Back to recipes
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{meal.strMeal}</h1>
        <div className="flex flex-wrap gap-3 mt-3">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
            {meal.strArea}
          </span>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
            {meal.strCategory}
          </span>
          {meal.strTags && (
            <>
              {meal.strTags.split(',').map((tag) => (
                <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                  {tag.trim()}
                </span>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Image + Video */}
      <div className="relative aspect-video mb-8 rounded-2xl overflow-hidden bg-gray-100">
        <Image
          src={meal.strMealThumb}
          alt={meal.strMeal}
          fill
          className="object-cover"
          priority
        />
        {meal.strYoutube && (
          <a
            href={meal.strYoutube}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition group"
          >
            <span className="px-4 py-2 bg-white rounded-full text-red-600 font-medium flex items-center gap-2 group-hover:scale-105 transition">
              ▶️ Watch Video
            </span>
          </a>
        )}
      </div>

      {/* Ingredients + Instructions */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Ingredients */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Ingredients</h2>
          <ul className="space-y-2">
            {ingredients.map((ing, idx) => (
              <li key={idx} className="flex justify-between text-sm">
                <span className="text-gray-700">{ing.name}</span>
                <span className="text-gray-500 font-medium">{ing.measure}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Instructions</h2>
          <div className="prose prose-sm max-w-none text-gray-700">
            {meal.strInstructions.split('\n').map((step, idx) => (
              <p key={idx} className="mb-3">{step.trim()}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Source */}
      {meal.strSource && (
        <div className="mt-8 text-center">
          <a
            href={meal.strSource}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition"
          >
            🔗 View Original Source
          </a>
        </div>
      )}
    </div>
  );
}
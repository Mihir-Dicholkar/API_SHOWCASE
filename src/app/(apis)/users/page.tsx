import { RandomUserResponse, formatFullName, formatAddress, formatAge, formatPhone, GENDER_OPTIONS, NATIONALITY_OPTIONS, type GenderOption, type NationalityOption } from '@/lib/validators';
import UserFilters from '@/components/users/UserFilters';
import CopyEmailButton from '@/components/users/CopyEmailButton'; // ✅ Import client component
import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Random User Generator | API Showcase',
  description: 'Generate realistic fake user profiles for testing and demos',
};

export default async function UsersPage({ 
  searchParams 
}: { 
  searchParams?: Promise<{ gender?: GenderOption; nat?: NationalityOption; results?: string }> 
}) {
  const params = await searchParams;
  const gender = params?.gender && params.gender !== 'all' ? params.gender : undefined;
  const nat = params?.nat && params.nat !== 'all' ? params.nat : undefined;
  const results = Math.min(parseInt(params?.results || '10', 10) || 10, 50); // Max 50 per API

  // Build API query
  const apiParams = new URLSearchParams({
    results: results.toString(),
  });

  if (gender) apiParams.set('gender', gender);
  if (nat) apiParams.set('nat', nat);

  const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/proxy/randomuser?${apiParams.toString()}`;
  
  console.log('👤 Fetching random users from:', apiUrl);
  
  const res = await fetch(apiUrl, {
    next: { revalidate: 300 } // Cache for 5 minutes (fake data doesn't change)
  });

  let users: RandomUserResponse['results'] = [];
  
  if (res.ok) {
    try {
      const data = await res.json() as RandomUserResponse;
      users = data.results || [];
    } catch (parseError) {
      console.error('❌ Failed to parse Random User response:', parseError);
    }
  } else {
    const errorText = await res.text().catch(() => 'No error body');
    console.error('❌ Random User API error:', res.status, errorText.slice(0, 200));
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">👤 Random User Generator</h1>
        <p className="text-gray-600 mt-2">
          Generated {users.length} realistic fake user profile{users.length !== 1 ? 's' : ''}
          {gender && <span> • <strong>{gender}</strong> gender</span>}
          {nat && <span> • <strong>{nat.toUpperCase()}</strong> nationality</span>}
        </p>
      </div>

      {/* Filters (Client Component) */}
      <UserFilters />

      {/* Results Grid */}
      {users.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <div className="text-6xl mb-4">🎭</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No users generated</h3>
          <p className="text-gray-600 mb-6">Try adjusting your filters and click Generate.</p>
          <Link 
            href="/users" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            ← Generate new users
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {users.map((user) => (
            <article key={user.login.uuid} className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 overflow-hidden flex flex-col">
              {/* Profile Image */}
              <div className="relative h-48 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
                <Image
                  src={user.picture.large}
                  alt={`${user.name.first} ${user.name.last}`}
                  width={128}
                  height={128}
                  className="rounded-full object-cover border-4 border-white shadow-lg group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 right-3 px-2 py-1 bg-white/90 backdrop-blur text-xs font-medium text-gray-700 rounded-full">
                  {user.nat.toUpperCase()}
                </span>
              </div>
              
              {/* Content */}
              <div className="p-4 flex-1 flex flex-col">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition">
                    {formatFullName(user.name)}
                  </h3>
                  <p className="text-sm text-gray-600">@{user.login.username}</p>
                </div>
                
                {/* Details */}
                <dl className="space-y-2 text-sm mb-4 flex-1">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Age</dt>
                    <dd className="font-medium text-gray-900">{formatAge(user.dob.age)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Email</dt>
                    <dd className="font-medium text-gray-900 text-right truncate max-w-[120px]" title={user.email}>
                      {user.email}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Phone</dt>
                    <dd className="font-medium text-gray-900 text-right">{formatPhone(user.phone)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Location</dt>
                    <dd className="font-medium text-gray-900 text-right truncate max-w-[120px]" title={user.location.city}>
                      {user.location.city}
                    </dd>
                  </div>
                </dl>
                
                {/* Actions */}
                <div className="mt-auto pt-3 border-t border-gray-100 flex gap-2">
                  <Link
                    href={`/users/${user.login.uuid}`}
                    className="flex-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-center text-xs font-medium transition"
                  >
                    View Profile
                  </Link>
                  {/* ✅ Client Component for interactive button */}
                  <CopyEmailButton email={user.email} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Footer info */}
      <div className="mt-12 text-center text-sm text-gray-500">
        <p>
          Data from{' '}
          <a href="https://randomuser.me" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Random User Generator
          </a>{' '}
          • Realistic fake data for testing • Free API
        </p>
        <p className="mt-1 text-xs text-gray-400">
          ⚠️ All data is randomly generated • Not real people
        </p>
      </div>
    </div>
  );
}
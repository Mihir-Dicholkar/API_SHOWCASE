import { RandomUser, formatFullName, formatAddress, formatAge, formatPhone } from '@/lib/validators';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import UserActions from '@/components/users/UserActions'; // ✅ Import client component

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return {
    title: `User Profile | API Showcase`,
    description: `View details for user ${id}`,
  };
}

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch user by UUID (note: Random User API doesn't support fetching by ID, so we'll generate a new one)
  const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/proxy/randomuser?results=1`;
  
  console.log('👤 Fetching user detail from:', apiUrl);
  
  const res = await fetch(apiUrl, {
    next: { revalidate: 300 } // Cache for 5 minutes
  });

  if (!res.ok) {
    console.error('❌ Failed to fetch user:', res.status);
    notFound();
  }

  const data = await res.json();
  const user: RandomUser = data.results?.[0];
  
  if (!user || user.login.uuid !== id) {
    console.warn('⚠️ Could not find exact user match (API limitation)');
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link - Server Component compatible */}
      <Link href="/users" className="inline-flex items-center gap-2 text-blue-600 hover:underline mb-6">
        ← Back to users
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <Image
            src={user.picture.large}
            alt={`${user.name.first} ${user.name.last}`}
            width={128}
            height={128}
            className="rounded-full border-4 border-white shadow-lg"
          />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{formatFullName(user.name)}</h1>
            <p className="text-gray-600">@{user.login.username}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
              {user.nat.toUpperCase()} • {formatAge(user.dob.age)}
            </span>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-lg font-medium text-gray-900">{user.email}</div>
          <div className="text-sm text-gray-600 mt-1">{formatPhone(user.phone)}</div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Personal Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Full Name</dt>
              <dd className="font-medium text-gray-900">{formatFullName(user.name)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Gender</dt>
              <dd className="font-medium text-gray-900 capitalize">{user.gender}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Date of Birth</dt>
              <dd className="font-medium text-gray-900">{new Date(user.dob.date).toLocaleDateString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Nationality</dt>
              <dd className="font-medium text-gray-900">{user.nat.toUpperCase()}</dd>
            </div>
          </dl>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Email</dt>
              <dd className="font-medium text-gray-900">{user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Phone</dt>
              <dd className="font-medium text-gray-900">{formatPhone(user.phone)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Cell</dt>
              <dd className="font-medium text-gray-900">{formatPhone(user.cell)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Username</dt>
              <dd className="font-medium text-gray-900">@{user.login.username}</dd>
            </div>
          </dl>
        </div>

        {/* Address */}
        <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Address</h2>
          <div className="text-gray-700">
            <p className="font-medium">{user.location.street.number} {user.location.street.name}</p>
            <p>{user.location.city}, {user.location.state} {user.location.postcode}</p>
            <p>{user.location.country}</p>
            <p className="text-sm text-gray-500 mt-2">
              Coordinates: {user.location.coordinates.latitude}, {user.location.coordinates.longitude}
            </p>
            <p className="text-sm text-gray-500">
              Timezone: {user.location.timezone.description} (UTC {user.location.timezone.offset})
            </p>
          </div>
        </div>

        {/* Login Info */}
        <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Login Information</h2>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">UUID</dt>
              <dd className="font-medium text-gray-900 font-mono text-xs">{user.login.uuid}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Password</dt>
              <dd className="font-medium text-gray-900 font-mono text-xs">{user.login.password}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Salt</dt>
              <dd className="font-medium text-gray-900 font-mono text-xs">{user.login.salt}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Registered</dt>
              <dd className="font-medium text-gray-900">{new Date(user.registered.date).toLocaleDateString()}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* ✅ Actions - Client Component with onClick handlers */}
      <UserActions 
        user={user} 
        onBack={() => window.location.href = '/users'} 
      />

      {/* Footer info */}
      <div className="mt-12 text-center text-sm text-gray-500">
        <p>
          Data from{' '}
          <a href="https://randomuser.me" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Random User Generator
          </a>{' '}
          • Realistic fake data for testing
        </p>
        <p className="mt-1 text-xs text-gray-400">
          ⚠️ All data is randomly generated • Not real people • Do not use for production
        </p>
      </div>
    </div>
  );
}
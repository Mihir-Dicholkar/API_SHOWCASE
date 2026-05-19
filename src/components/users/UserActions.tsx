'use client';

import { RandomUser } from '@/lib/validators';

interface UserActionsProps {
  user: RandomUser;
  onBack?: () => void;
}

export default function UserActions({ user, onBack }: UserActionsProps) {
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <button
        onClick={() => navigator.clipboard.writeText(user.email)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
      >
        📋 Copy Email
      </button>
      <button
        onClick={() => navigator.clipboard.writeText(JSON.stringify(user, null, 2))}
        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium flex items-center gap-2"
      >
        📄 Copy JSON
      </button>
      <button
        onClick={onBack}
        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
      >
        ← Generate More Users
      </button>
    </div>
  );
}
'use client';

interface CopyEmailButtonProps {
  email: string;
}

export default function CopyEmailButton({ email }: CopyEmailButtonProps) {
  return (
    <button
      onClick={() => navigator.clipboard.writeText(email)}
      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition"
      title="Copy email"
    >
      📋
    </button>
  );
}
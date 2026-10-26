'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertOctagon, RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
      <div className="bg-rose-50 text-rose-600 p-5 rounded-full mb-6">
        <AlertOctagon className="w-10 h-10" />
      </div>
      <div className="text-2xl font-black text-blue-600 tracking-tighter mb-2">
        MegaMart<span className="text-gray-900">.ai</span>
      </div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-3">Something went wrong</h1>
      <p className="text-gray-500 max-w-sm mb-8">
        An unexpected error occurred while loading this page. You can try again, or head back home.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition shadow-md"
        >
          <RotateCcw className="w-4 h-4" /> Try Again
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-bold transition"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}

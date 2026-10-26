'use client';

import Link from 'next/link';
import { Compass, ShoppingBag } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
      <div className="bg-blue-50 text-blue-600 p-5 rounded-full mb-6">
        <Compass className="w-10 h-10" />
      </div>
      <div className="text-2xl font-black text-blue-600 tracking-tighter mb-2">
        MegaMart<span className="text-gray-900">.ai</span>
      </div>
      <h1 className="text-5xl font-extrabold text-gray-900 mb-3">404</h1>
      <p className="text-gray-500 max-w-sm mb-8">
        We couldn&apos;t find that page. It may have moved, or the link might be out of date.
      </p>
      <div className="flex gap-3">
        <Link
          href="/products"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition shadow-md"
        >
          <ShoppingBag className="w-4 h-4" /> Browse Products
        </Link>
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

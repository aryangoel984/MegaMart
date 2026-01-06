// frontend/src/app/search/page.tsx
'use client';

import { useState } from 'react';
import api from '@/utils/api';
import { useRouter } from 'next/navigation';

interface Product {
  id: number;
  name: string;
  price: string;
  category: string;
  imageUrl: string;
  description: string;
  similarity: number; // This is the AI Score
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      // Call your new AI Search Endpoint
      const res = await api.get(`/search?q=${query}`);
      setResults(res.data);
    } catch (err) {
      console.error(err);
      alert('Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-black">
      {/* Search Header */}
      <div className="max-w-4xl mx-auto mb-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">AI Semantic Search</h1>
          <button 
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 hover:underline"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-4">
          <input
            type="text"
            className="flex-1 p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            placeholder="Describe what you are looking for... (e.g., 'device for coding')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-8 py-4 rounded-lg font-bold hover:bg-gray-800 transition disabled:bg-gray-400"
          >
            {loading ? 'Thinking...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Results Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((product) => (
          <div key={product.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
            {/* Image */}
            <div className="h-48 bg-gray-100 mb-4 flex items-center justify-center rounded overflow-hidden">
               <img 
                src={product.imageUrl || 'https://placehold.co/600x400'} 
                alt={product.name} 
                className="object-cover h-full w-full"
                onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400?text=No+Image')}
              />
            </div>

            {/* Content */}
            <h2 className="text-xl font-bold mb-2">{product.name}</h2>
            <p className="text-gray-500 text-sm mb-4 line-clamp-2">
              {product.description || 'No description available'}
            </p>
            
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
              <span className="text-2xl font-bold text-green-600">${product.price}</span>
              
              {/* AI Match Score Badge */}
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">
                Match: {(product.similarity * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {!loading && results.length === 0 && query && (
        <div className="text-center text-gray-500 mt-20">
          No results found. Try describing the item differently.
        </div>
      )}
    </div>
  );
}
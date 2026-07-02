// frontend/src/app/search/page.tsx
'use client';

import { useState } from 'react';
import api from '@/utils/api';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Loader2, Sparkles, ChevronRight, ShoppingBag } from 'lucide-react';

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
    <div className="h-screen bg-gray-50 text-gray-900 flex flex-col relative overflow-hidden font-sans">
      
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header bar */}
      <header className="bg-white border-b border-gray-200/80 py-4 px-6 flex-shrink-0 flex items-center justify-between shadow-sm z-30 w-full">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/dashboard')}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 tracking-tight">
              AI Semantic Search
            </h1>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">Find products using natural language descriptions</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/chat')}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-purple-200 animate-pulse" /> Shop with AI
          </button>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-grow overflow-y-auto px-8 py-8 bg-gray-50/50">
        <div className="max-w-5xl mx-auto">
          
          {/* Search Input Box */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm mb-10">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                  <Search className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-gray-900 text-lg outline-none placeholder:text-gray-400"
                  placeholder="Describe what you are looking for... (e.g., 'device for coding')"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-md active:scale-[0.98] disabled:from-gray-300 disabled:to-gray-300 shrink-0"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Thinking...
                  </span>
                ) : (
                  'Search'
                )}
              </button>
            </form>
          </div>

          {/* Results Grid */}
          {results.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((product) => (
                <div 
                  key={product.id} 
                  className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="relative h-48 bg-gray-100 flex items-center justify-center overflow-hidden border-b border-gray-100/50">
                    <img 
                      src={product.imageUrl || 'https://placehold.co/600x400'} 
                      alt={product.name} 
                      className="object-cover h-full w-full hover:scale-105 transition-transform duration-500"
                      onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400?text=No+Image')}
                    />
                  </div>

                  <div className="p-5 flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                          {product.category}
                        </span>
                        {/* AI Match Score Badge */}
                        <span className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full font-bold border border-purple-100 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-purple-600" /> Match: {(product.similarity * 100).toFixed(0)}%
                        </span>
                      </div>
                      <h3 className="font-extrabold text-gray-900 text-lg leading-tight mb-2 line-clamp-1">{product.name}</h3>
                      <p className="text-sm text-gray-500 font-medium line-clamp-2">
                        {product.description || 'No description available'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                      <span className="text-xl font-black text-green-600">${product.price}</span>
                      <button
                        onClick={() => router.push(`/products/${product.id}`)}
                        className="bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        View Product <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && results.length === 0 && query && (
            <div className="text-center py-20 bg-white border border-gray-200/80 rounded-2xl shadow-sm mt-6">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-bold text-gray-700 mb-1">No products found</h3>
              <p className="text-gray-500 max-w-sm mx-auto text-sm">
                We couldn't find matches. Try describing what you are looking for differently!
              </p>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
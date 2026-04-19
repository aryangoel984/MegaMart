'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import { Search, ShoppingBag, LogOut, Package, TrendingUp, User, Clock, ChevronRight } from 'lucide-react';

interface DashboardData {
  message: string;
  pastOrdersCount: number;
  aiRecommendations: {
    id: number;
    name: string;
    reason: string;
    imageUrl?: string;
  }[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const res = await api.get('/dashboard');
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch dashboard', err);
        localStorage.removeItem('token');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-800">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg font-medium text-gray-500">Loading your customized experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12">
      
      {/* Clean Light-Themed Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <User className="text-blue-700 w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                MegaMart Dashboard
              </h1>
              <p className="text-gray-500 text-sm">{data?.message}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/search')}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors"
            >
              <Search className="w-4 h-4" /> AI Search
            </button>
            <button
              onClick={() => router.push('/products')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" /> Browse Store
            </button>
            <button
              onClick={() => router.push('/orders')}
              className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors"
            >
              <Package className="w-4 h-4" /> My Orders
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-md font-medium transition-colors ml-2"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-10">
        
        {/* Professional Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-green-100 p-3 rounded-lg text-green-700">
                <Package className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold px-2 py-1 bg-green-50 text-green-700 rounded-full">Lifetime</span>
            </div>
            <div>
              <h2 className="text-4xl font-bold text-gray-900">{data?.pastOrdersCount || 0}</h2>
              <p className="text-gray-500 font-medium mt-1">Total Purchases</p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-blue-100 p-3 rounded-lg text-blue-700">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-700 rounded-full">Status</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mt-2">Active Member</h2>
              <p className="text-gray-500 font-medium mt-1">In excellent standing</p>
            </div>
          </div>

          {/* Card 3 (Action Card) */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl shadow-md border border-gray-700 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-10 transform group-hover:scale-110 transition-transform duration-500">
              <ShoppingBag className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <h2 className="text-xl font-bold text-white mb-2">Ready to shop?</h2>
              <p className="text-gray-400 text-sm mb-6">Discover the latest arrivals in your personalized feed today.</p>
              <button 
                onClick={() => router.push('/products')}
                className="w-full bg-white text-gray-900 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Go to Catalog <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* AI Recommendations Section */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-center bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-full text-purple-700">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                AI Recommendations
                <span className="text-xs font-bold bg-purple-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">Beta</span>
              </h2>
              <p className="text-gray-500 text-sm">Products explicitly curated for you based on search algorithms.</p>
            </div>
          </div>
        </div>

        {data?.aiRecommendations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 mt-6">
            <Clock className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-bold text-gray-700 mb-1">We're still learning</h3>
            <p className="text-gray-500 text-center max-w-sm">
              Make some purchases or interact with products to establish your taste profile. Our AI will curate items here shortly.
            </p>
            <button
              onClick={() => router.push('/products')}
              className="mt-6 bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-lg text-white font-medium transition-colors"
            >
              Start Exploring
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.aiRecommendations.map((item) => (
              <div 
                key={item.id} 
                className="group flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                {/* Image Handle */}
                <div className="relative h-56 w-full bg-gray-100 overflow-hidden">
                  {item.imageUrl ? (
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <ShoppingBag className="w-10 h-10 mb-2 opacity-50" />
                      <span className="text-xs font-medium uppercase tracking-wider">No Image</span>
                    </div>
                  )}
                  {/* Subtle overlay gradient at the bottom so top images stay mostly clean */}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                {/* Content Section */}
                <div className="p-5 flex flex-col flex-grow bg-white">
                  <h3 className="font-bold text-lg text-gray-900 mb-1 leading-tight">{item.name}</h3>
                  <p className="text-sm text-purple-700 font-medium bg-purple-50 self-start px-2 py-1 rounded inline-block mb-5 border border-purple-100">
                    {item.reason}
                  </p>
                  
                  <div className="mt-auto">
                    <button 
                      onClick={() => router.push(`/products/${item.id}`)}
                      className="w-full bg-gray-900 text-white font-medium py-2.5 rounded-lg hover:bg-gray-800 transition-colors focus:ring-4 focus:ring-gray-200 active:scale-[0.98]"
                    >
                      View Product
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
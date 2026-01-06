// frontend/src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';

interface DashboardData {
  message: string;
  pastOrdersCount: number;
  aiRecommendations: {
    id: number;
    name: string;
    reason: string;
  }[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Check if token exists
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        // 2. Fetch Data (Node.js will talk to Python for us)
        const res = await api.get('/dashboard');
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch dashboard', err);
        // If error (e.g., token expired), kick user out
        localStorage.removeItem('token');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Logout Function
  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading) return <div className="p-10 text-xl text-black">Loading your personalized dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-black">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">MegaMart Dashboard</h1>
        <div className="space-x-4">
          
          {/* NEW: AI Search Button */}
          <button 
            onClick={() => router.push('/search')}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition font-medium"
          >
            🔍 AI Search
          </button>

          {/* Browse Store Button */}
          <button 
            onClick={() => router.push('/products')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Browse Store
          </button>
          
          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <h2 className="text-xl font-semibold text-gray-700">Welcome Back!</h2>
          <p className="text-gray-500 mt-2">{data?.message}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <h2 className="text-xl font-semibold text-gray-700">Your Activity</h2>
          <p className="text-gray-500 mt-2">
            You have placed <span className="font-bold text-2xl text-green-600">{data?.pastOrdersCount}</span> orders with us.
          </p>
        </div>
      </div>

      {/* AI Recommendations Section */}
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        🤖 AI Recommendations 
        <span className="text-sm font-normal text-gray-500 bg-gray-200 px-2 py-1 rounded-full">Powered by Python</span>
      </h2>
      
      {data?.aiRecommendations.length === 0 ? (
        <p className="text-gray-500">No recommendations yet. Buy something!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data?.aiRecommendations.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition duration-300">
              <div className="h-32 bg-gray-200 rounded mb-4 flex items-center justify-center text-gray-400 overflow-hidden">
                 {/* Simple Placeholder Image Logic */}
                 <span className="text-4xl">🛍️</span>
              </div>

              <h3 className="font-bold text-lg">{item.name}</h3>
              <p className="text-sm text-blue-600 mt-2 font-medium">Why? {item.reason}</p>
              <button className="mt-4 w-full bg-black text-white py-2 rounded hover:bg-gray-800">
                Buy Now
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import api from '@/utils/api';
import { useRouter } from 'next/navigation';

interface Product {
  id: number;
  name: string;
  price: string;
  category: string;
  imageUrl: string;
  stock: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products');
        setProducts(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleBuy = async (productId: number) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Please login to buy items!");
      router.push('/login');
      return;
    }

    try {
      // Call the Order API (Day 2 Logic)
      await api.post('/orders', {
        items: [{ productId, quantity: 1 }]
      });
      
      alert("Order Placed Successfully! Check your Dashboard.");
      router.push('/dashboard');
    } catch (err: any) {
      alert(err.response?.data?.message || "Purchase Failed");
    }
  };

  if (loading) return <div className="p-10 text-center">Loading Store...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-8 text-black">Latest Products</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition">
            {/* Image Placeholder */}
            
              <div className="flex justify-center">
                <img
                    className="h-48 bg-gray-200 text-gray-500"
                    src={product.imageUrl}
                    alt="product"
                />
            </div>

            
            <div className="p-4">
              <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
              <p className="text-gray-500 text-sm mb-2">{product.category}</p>
              
              <div className="flex justify-between items-center mt-4">
                <span className="text-2xl font-bold text-green-600">${product.price}</span>
                {product.stock > 0 ? (
                  <button 
                    onClick={() => handleBuy(product.id)}
                    className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
                  >
                    Buy Now
                  </button>
                ) : (
                  <span className="text-red-500 font-bold">Out of Stock</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
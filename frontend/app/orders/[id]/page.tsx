'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/utils/api';
import { ArrowLeft, Package, ShoppingBag, Loader2, CheckCircle2 } from 'lucide-react';

interface OrderItem {
  id: number;
  quantity: number;
  price: string;
  product: {
    id: number;
    name: string;
    imageUrl?: string;
  };
}

interface OrderDetail {
  id: number;
  createdAt: string;
  status: string;
  totalAmount: string;
  items: OrderItem[];
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      try {
        const res = await api.get(`/orders/${orderId}`);
        setOrder(res.data);
      } catch (err) {
        if ((err as { response?: { status?: number } })?.response?.status === 404) {
          setNotFound(true);
        } else {
          console.error('Failed to fetch order', err);
        }
      } finally {
        setLoading(false);
      }
    };
    if (orderId) fetchOrder();
  }, [orderId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-800">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-lg font-medium text-gray-500">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800 gap-4">
        <p className="text-xl font-bold text-gray-500">Order not found.</p>
        <button
          onClick={() => router.push('/orders')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold"
        >
          Back to My Orders
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200/80 py-4 px-6 flex items-center gap-4 shadow-sm">
        <button
          onClick={() => router.push('/orders')}
          aria-label="Back to orders"
          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Order #{order.id}</h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Placed on {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Status timeline (single real stage today: the order is placed and
            paid; later lifecycle stages land with real fulfillment tracking) */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 text-green-700 p-2.5 rounded-full">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Order Placed &amp; Confirmed</p>
              <p className="text-xs text-gray-500">Status: {order.status}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-200/60 flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-700">
              <Package className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-gray-900">Items</h2>
          </div>
          <div className="p-6 divide-y divide-gray-100">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex items-center justify-center border border-gray-200 shrink-0 shadow-sm">
                  {item.product.imageUrl ? (
                    <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <button
                    onClick={() => router.push(`/products/${item.product.id}`)}
                    className="font-extrabold text-gray-900 text-sm leading-tight truncate mb-1 hover:text-blue-600 text-left"
                  >
                    {item.product.name}
                  </button>
                  <p className="text-xs text-gray-500 font-medium">Quantity: {item.quantity}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-gray-900 text-sm">${item.price}</p>
                  <p className="text-xs text-gray-400 font-medium">Subtotal: ${(Number(item.price) * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-gray-50/50 px-6 py-5 border-t border-gray-200/60 flex justify-between items-center">
            <span className="text-sm font-bold text-gray-500">Order Total</span>
            <span className="text-xl font-black text-green-600">${Number(order.totalAmount).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

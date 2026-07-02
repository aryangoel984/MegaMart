// frontend/src/app/orders/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import { ArrowLeft, Package, ShoppingBag, Loader2, Sparkles } from 'lucide-react';

interface OrderItem {
    id: number;
    quantity: number;
    price: string;
    product: {
        name: string;
        imageUrl: string;
    };
}

interface Order {
    id: number;
    createdAt: string;
    status: string;
    totalAmount: string;
    items: OrderItem[];
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    router.push('/login');
                    return;
                }

                const res = await api.get('/orders');
                setOrders(res.data);
            } catch (err) {
                console.error('Failed to fetch orders', err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-800">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 border-4 text-blue-600 animate-spin" />
                    <p className="text-lg font-medium text-gray-500">Loading your order history...</p>
                </div>
            </div>
        );
    }

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
                            My Orders
                        </h1>
                        <p className="text-xs text-gray-500 font-semibold mt-0.5">Track your shopping history and status</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/chat')}
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-lg font-semibold transition shadow-sm"
                    >
                        <Sparkles className="w-4 h-4 text-purple-200 animate-pulse" /> Chat with AI
                    </button>
                </div>
            </header>

            {/* Main content area */}
            <div className="flex-grow overflow-y-auto px-8 py-8 bg-gray-50/50">
                <div className="max-w-5xl mx-auto space-y-6">
                    {orders.length === 0 ? (
                        <div className="text-center py-20 bg-white border border-gray-200/80 rounded-2xl shadow-sm">
                            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-bold text-gray-700 mb-1">No orders yet</h3>
                            <p className="text-gray-500 max-w-sm mx-auto text-sm mb-6">
                                You haven't placed any orders yet. Start exploring our catalog to make your first purchase!
                            </p>
                            <button
                                onClick={() => router.push('/products')}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-all active:scale-[0.98]"
                            >
                                Start Shopping
                            </button>
                        </div>
                    ) : (
                        orders.map((order) => (
                            <div 
                                key={order.id} 
                                className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm hover:shadow-md transition duration-300"
                            >
                                {/* Order Header Details */}
                                <div className="bg-gray-50/50 px-6 py-5 flex flex-wrap justify-between items-center border-b border-gray-200/60 gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 p-2.5 rounded-lg text-blue-700">
                                            <Package className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Order Number</p>
                                            <p className="font-extrabold text-gray-900 text-sm"># {order.id}</p>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Date Placed</p>
                                        <p className="font-bold text-gray-900 text-sm">{new Date(order.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Amount</p>
                                        <p className="font-black text-green-600 text-base">${Number(order.totalAmount).toFixed(2)}</p>
                                    </div>
                                    
                                    <div>
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                            order.status === 'COMPLETED' 
                                                ? 'bg-green-50 text-green-700 border border-green-100' 
                                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                                        }`}>
                                            {order.status === 'COMPLETED' ? (
                                                <>
                                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Completed
                                                </>
                                            ) : (
                                                <>
                                                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span> Pending
                                                </>
                                            )}
                                        </span>
                                    </div>
                                </div>

                                {/* Order Items list */}
                                <div className="p-6 divide-y divide-gray-100">
                                    {order.items.map((item) => (
                                        <div key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                                            <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex items-center justify-center border border-gray-200 shrink-0 shadow-sm">
                                                {item.product.imageUrl ? (
                                                    <img
                                                        src={item.product.imageUrl}
                                                        alt={item.product.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <ShoppingBag className="w-6 h-6 text-gray-400" />
                                                )}
                                            </div>
                                            
                                            <div className="flex-grow min-w-0">
                                                <h4 className="font-extrabold text-gray-900 text-sm leading-tight truncate mb-1">{item.product.name}</h4>
                                                <p className="text-xs text-gray-500 font-medium">Quantity: {item.quantity}</p>
                                            </div>
                                            
                                            <div className="text-right shrink-0">
                                                <p className="font-bold text-gray-900 text-sm">${item.price}</p>
                                                <p className="text-xs text-gray-400 font-medium">Subtotal: ${(Number(item.price) * item.quantity).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';

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

    if (loading) return <div className="p-10 text-center text-xl">Loading your orders...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="flex justify-between items-center mb-8 max-w-5xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800">My Orders</h1>
                <button
                    onClick={() => router.push('/dashboard')}
                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition"
                >
                    Back to Dashboard
                </button>
            </div>

            <div className="max-w-5xl mx-auto space-y-6">
                {orders.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-lg shadow">
                        <p className="text-gray-500 text-lg mb-4">You haven't placed any orders yet.</p>
                        <button
                            onClick={() => router.push('/products')}
                            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                        >
                            Start Shopping
                        </button>
                    </div>
                ) : (
                    orders.map((order) => (
                        <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
                            <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b border-gray-100">
                                <div>
                                    <p className="text-sm text-gray-500">Order Placed</p>
                                    <p className="font-medium text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Amount</p>
                                    <p className="font-medium text-gray-900">${order.totalAmount}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Order #</p>
                                    <p className="font-medium text-gray-900">{order.id}</p>
                                </div>
                                <div>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>

                            <div className="p-6">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-4 mb-4 last:mb-0">
                                        <img
                                            src={item.product.imageUrl || '/placeholder.png'}
                                            alt={item.product.name}
                                            className="w-20 h-20 object-cover rounded bg-gray-100"
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                        </div>
                                        <p className="font-medium text-gray-900">${item.price}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

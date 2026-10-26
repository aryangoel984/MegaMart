'use client';

import { useEffect, useState } from 'react';
import api from '@/utils/api';
import * as cartApi from '@/utils/cart';
import { cartErrorMessage, type Cart } from '@/utils/cart';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ShoppingCart, ArrowLeft, Loader2, ShoppingBag, Zap,
  RefreshCw, Sparkles, ChevronRight, CheckCircle2, Plus, Minus, Trash2, AlertTriangle
} from 'lucide-react';

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
  const [cart, setCart] = useState<Cart>({ items: [], subtotal: 0 });
  const [cartOpen, setCartOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [mutatingProductId, setMutatingProductId] = useState<number | null>(null);
  const [cartError, setCartError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
    fetchCart();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setSyncing(true);
      setCart(await cartApi.getCart());
    } catch (err) {
      console.error('Failed to sync cart:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleCheckout = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login?next=/products');
      return;
    }

    setCartError(null);
    setCheckoutLoading(true);
    try {
      const order = await cartApi.checkout();
      toast.success(`Order placed! Order #${order.orderId} for $${order.total}.`);
      await fetchCart();
      setCartOpen(false);
      router.push('/orders');
    } catch (err) {
      console.error('Checkout failed:', err);
      setCartError(cartErrorMessage(err, 'Checkout failed'));
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleUpdateQuantity = async (productId: number, quantity: number) => {
    setCartError(null);
    setMutatingProductId(productId);
    try {
      setCart(await cartApi.updateItem(productId, quantity));
    } catch (err) {
      console.error('Failed to update quantity:', err);
      setCartError(cartErrorMessage(err, 'Could not update quantity.'));
    } finally {
      setMutatingProductId(null);
    }
  };

  const handleRemoveItem = async (productId: number) => {
    setCartError(null);
    setMutatingProductId(productId);
    try {
      setCart(await cartApi.removeItem(productId));
    } catch (err) {
      console.error('Failed to remove item:', err);
      setCartError(cartErrorMessage(err, 'Could not remove item.'));
    } finally {
      setMutatingProductId(null);
    }
  };

  const handleClearCart = async () => {
    setCartError(null);
    try {
      setCart(await cartApi.clearCart());
    } catch (err) {
      console.error('Failed to clear cart:', err);
      setCartError(cartErrorMessage(err, 'Could not clear cart.'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-800">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 border-4 text-blue-600 animate-spin" />
          <p className="text-lg font-medium text-gray-500">Loading catalog items...</p>
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
      <header className="bg-white border-b border-gray-200/80 py-4 px-6 flex-shrink-0 flex items-center justify-between shadow-sm z-30">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/dashboard')}
            aria-label="Back to dashboard"
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 tracking-tight">
              MegaMart Store Catalog
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Explore the latest AI-ready arrivals</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/chat')}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-lg font-semibold transition shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-purple-200 animate-pulse" /> Shop with AI
          </button>
          <button
            onClick={() => setCartOpen(!cartOpen)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all border shadow-sm relative ${
              cartOpen 
                ? 'bg-blue-600 border-blue-500 text-white shadow-blue-500/10' 
                : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-700'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">My Cart</span>
            {cart.items.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
                {cart.items.reduce((sum, i) => sum + i.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main content grid */}
      <div className="flex-grow flex relative overflow-hidden">
        
        {/* Product Grid Area */}
        <div className="flex-grow overflow-y-auto px-8 py-8 bg-gray-50/50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-8">Latest Products</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <div 
                  key={product.id} 
                  className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="relative h-48 bg-gray-100 flex items-center justify-center overflow-hidden border-b border-gray-100/50">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <ShoppingBag className="w-12 h-12 text-gray-400 opacity-50" />
                    )}
                  </div>
                  
                  <div className="p-5 flex-grow flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                        {product.category}
                      </span>
                      <h3 className="font-extrabold text-gray-900 text-lg leading-tight mt-3 mb-1 truncate">{product.name}</h3>
                      <p className="text-sm text-gray-500 font-medium">In stock: {product.stock}</p>
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
          </div>
        </div>

        {/* Sliding Cart Drawer Panel */}
        {cartOpen && (
          <aside className="w-96 border-l border-gray-200 bg-white flex flex-col h-full justify-between relative shadow-lg z-20 transition-all duration-300">
            
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" /> Active Cart
              </h2>
              <div className="flex items-center gap-2">
                {syncing && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />}
                <span className="bg-gray-200 text-gray-700 text-xs px-2.5 py-1 rounded-full font-bold">
                  {cart.items.reduce((sum, i) => sum + i.quantity, 0)} {cart.items.reduce((sum, i) => sum + i.quantity, 0) === 1 ? 'Item' : 'Items'}
                </span>
                {cart.items.length > 0 && (
                  <button onClick={handleClearCart} className="text-xs font-semibold text-rose-500 hover:text-rose-600 px-2 py-1">
                    Clear
                  </button>
                )}
              </div>
            </div>

            {cartError && (
              <div className="px-5 pt-4">
                <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg p-3">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{cartError}</span>
                </div>
              </div>
            )}

            <div className="flex-grow overflow-y-auto p-5 space-y-4">
              {cart.items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <ShoppingBag className="w-16 h-16 opacity-20 text-gray-400" />
                  <div>
                    <h3 className="font-bold text-gray-400 text-base mb-1">Your cart is empty</h3>
                    <p className="text-xs text-gray-500 max-w-[200px]">Browse our products and view detail pages to add items!</p>
                  </div>
                </div>
              ) : (
                cart.items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-4 bg-gray-50/60 border border-gray-200/60 p-3.5 rounded-xl transition"
                  >
                    <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex items-center justify-center border border-gray-200 shrink-0 shadow-sm">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ShoppingBag className="w-6 h-6 text-gray-400" />
                      )}
                    </div>

                    <div className="flex-grow min-w-0">
                      <h4 className="font-bold text-gray-800 text-sm leading-tight truncate mb-1">{item.name}</h4>
                      <div className="flex justify-between items-center gap-2">
                        <div className="flex items-center border border-gray-200 bg-white rounded-lg">
                          <button
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                            disabled={mutatingProductId === item.productId}
                            className="p-1 hover:bg-gray-100 rounded text-gray-600 transition disabled:opacity-40"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center text-xs font-bold text-gray-800">
                            {mutatingProductId === item.productId ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                            disabled={mutatingProductId === item.productId || item.quantity >= item.stock}
                            className="p-1 hover:bg-gray-100 rounded text-gray-600 transition disabled:opacity-40"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="font-semibold text-gray-700 text-sm">${item.lineTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.productId)}
                      disabled={mutatingProductId === item.productId}
                      className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition shrink-0"
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.items.length > 0 && (
              <div className="p-5 border-t border-gray-100 bg-gray-50/50 space-y-4">
                <div className="flex justify-between items-center text-gray-600 text-sm">
                  <span>Cart Total:</span>
                  <span className="text-2xl font-black text-green-600">${cart.subtotal.toFixed(2)}</span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-gray-300 disabled:to-gray-300 text-white font-bold py-4 rounded-xl shadow-md active:scale-[0.98] transition flex items-center justify-center gap-2 border border-blue-500/20"
                >
                  {checkoutLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-400 animate-pulse" /> Complete Checkout
                    </>
                  )}
                </button>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
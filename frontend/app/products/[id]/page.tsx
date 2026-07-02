'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/utils/api';
import { 
  ShoppingCart, ArrowLeft, Loader2, ShoppingBag, Zap, 
  RefreshCw, Sparkles, Plus, Minus, Check, Star, ShieldCheck, Truck, Store
} from 'lucide-react';

interface ProductDetail {
  id: number;
  name: string;
  price: string;
  category: string;
  imageUrl?: string;
  description?: string;
  stock: number;
  specifications: Record<string, string>;
  supplier: {
    name: string;
    origin: string;
    dispatchSpeed: string;
    rating: number;
  };
  reviews: {
    reviewer: string;
    rating: number;
    comment: string;
    date: string;
  }[];
  rating: number;
}

interface CartItem {
  id: number;
  name: string;
  price: string;
  imageUrl?: string;
  quantity: number;
  subtotal: number;
}

interface Cart {
  items: CartItem[];
  total: number;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'specs' | 'supplier'>('specs');
  const [addingToCart, setAddingToCart] = useState(false);

  // Cart Sidebar state
  const [cart, setCart] = useState<Cart>({ items: [], total: 0 });
  const [cartOpen, setCartOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    if (productId) {
      fetchProductDetail();
      fetchCart();
    }
  }, [productId]);

  const fetchProductDetail = async () => {
    try {
      const res = await api.get(`/products/${productId}`);
      setProduct(res.data);
    } catch (err) {
      console.error('Failed to fetch product details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setSyncing(true);
      const res = await api.get('/orders');
      const pending = res.data.find((o: any) => o.status === 'PENDING');
      if (pending) {
        setCart({
          items: pending.items.map((i: any) => ({
            id: i.product.id,
            name: i.product.name,
            price: i.product.price,
            imageUrl: i.product.imageUrl,
            quantity: i.quantity,
            subtotal: Number(i.product.price) * i.quantity
          })),
          total: Number(pending.totalAmount)
        });
      } else {
        setCart({ items: [], total: 0 });
      }
    } catch (err) {
      console.error('Failed to sync cart:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleAddToCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to purchase items!');
      router.push('/login');
      return;
    }

    if (!product) return;
    if (product.stock < quantity) {
      alert('Sorry, not enough items in stock.');
      return;
    }

    setAddingToCart(true);
    try {
      // Direct API cart mutation endpoint via AI Concierge fallback / orders controller
      // Let's call /api/orders directly since it handles cart creation!
      // In the cart system, the orders API POST cart items:
      // But wait! In orderController.ts, order POST handles IMMEDIATE completed order checkout.
      // So to add to the PENDING cart, we should call the chat concierge mock service
      // using: "Add product ID X to my cart" with custom quantity!
      // This is perfectly synced and triggers the correct database transaction.
      // Let's also send it as custom message.
      await api.post('/chat', {
        message: `Add ${quantity}x of product ID ${product.id} to my cart`
      });

      // Fetch the updated cart state
      await fetchCart();
      // Slide open the cart drawer!
      setCartOpen(true);
    } catch (err) {
      console.error('Failed to add to cart:', err);
      alert('Could not add item to cart.');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleCheckout = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setCheckoutLoading(true);
    try {
      // If items aren't in the cart, add them first!
      await handleAddToCart();
      // Execute checkout
      await api.post('/chat', { message: 'checkout my cart' });
      alert('Order Placed Successfully! Thank you.');
      fetchCart();
      setCartOpen(false);
      router.push('/dashboard');
    } catch (err) {
      console.error('Checkout failed:', err);
      alert('Checkout transaction failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-800">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 border-4 text-blue-600 animate-spin" />
          <p className="text-lg font-medium text-gray-500">Retrieving catalog details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800">
        <p className="text-xl font-bold text-gray-500">Product not found.</p>
        <button 
          onClick={() => router.push('/products')}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg font-bold"
        >
          Back to Store
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 text-gray-900 flex flex-col relative overflow-hidden font-sans">
      
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header aligned to navbar */}
      <header className="bg-white border-b border-gray-200/80 py-4 px-6 flex-shrink-0 flex items-center justify-between shadow-sm z-30">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/products')}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 tracking-tight">
              Product Overview
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Explore detailed specifications and supplier records</p>
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

      {/* Main product columns */}
      <div className="flex-grow flex relative overflow-hidden">
        
        {/* Detail Panel Area */}
        <div className="flex-grow overflow-y-auto px-8 py-8 bg-gray-50/50">
          <div className="max-w-5xl mx-auto space-y-8">
            
            {/* Split Top Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              
              {/* Product Image Area */}
              <div className="bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center border border-gray-100 min-h-[300px] md:min-h-[400px]">
                {product.imageUrl ? (
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ShoppingBag className="w-20 h-20 text-gray-400 opacity-50" />
                )}
              </div>

              {/* Purchase Details Area */}
              <div className="flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full uppercase tracking-wider border border-blue-200">
                    {product.category}
                  </span>
                  
                  <h2 className="text-3xl font-black text-gray-900 mt-4 leading-tight">{product.name}</h2>
                  
                  {/* Rating Stars */}
                  <div className="flex items-center gap-1.5 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} 
                      />
                    ))}
                    <span className="text-sm font-bold text-gray-700 ml-1.5">{product.rating.toFixed(1)} / 5.0</span>
                    <span className="text-xs text-gray-400 font-semibold border-l border-gray-200 pl-2.5 ml-2.5">
                      {product.reviews.length} Customer Reviews
                    </span>
                  </div>

                  <p className="text-gray-600 font-medium text-[15px] mt-6 leading-relaxed">
                    {product.description || 'No detailed description available.'}
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="flex justify-between items-baseline mb-6">
                    <div>
                      <span className="text-xs text-gray-500 font-bold block mb-1">UNIT PRICE</span>
                      <span className="text-3xl font-black text-green-600">${product.price}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-gray-500 font-bold block mb-1">AVAILABILITY</span>
                      {product.stock > 0 ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <Check className="w-4 h-4" /> {product.stock} Units In Stock
                        </span>
                      ) : (
                        <span className="text-rose-500 font-bold uppercase tracking-wider">Out of Stock</span>
                      )}
                    </div>
                  </div>

                  {product.stock > 0 && (
                    <div className="space-y-4">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-gray-700">Quantity:</span>
                        <div className="flex items-center border border-gray-200 bg-gray-50 rounded-lg p-1">
                          <button
                            onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                            className="p-1.5 hover:bg-white rounded text-gray-600 transition"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-10 text-center font-bold text-gray-800">{quantity}</span>
                          <button
                            onClick={() => setQuantity(prev => Math.min(product.stock, prev + 1))}
                            className="p-1.5 hover:bg-white rounded text-gray-600 transition"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Buy CTAs */}
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <button
                          onClick={handleAddToCart}
                          disabled={addingToCart}
                          className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2"
                        >
                          {addingToCart ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingCart className="w-5 h-5" />} Add to Cart
                        </button>
                        <button
                          onClick={handleCheckout}
                          disabled={checkoutLoading}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-blue-500/10 active:scale-[0.98]"
                        >
                          {checkoutLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-4 h-4 text-amber-300 animate-pulse" />} Buy Now
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Structured Specifications & Logistics (Tabs) */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex border-b border-gray-100 bg-gray-50">
                <button
                  onClick={() => setActiveTab('specs')}
                  className={`flex-1 py-4 font-bold text-sm border-b-2 transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'specs' 
                      ? 'border-blue-600 text-blue-600 bg-white' 
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" /> Specifications
                </button>
                <button
                  onClick={() => setActiveTab('supplier')}
                  className={`flex-1 py-4 font-bold text-sm border-b-2 transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'supplier' 
                      ? 'border-blue-600 text-blue-600 bg-white' 
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Truck className="w-4 h-4" /> Supplier & Shipping
                </button>
              </div>

              <div className="p-6">
                {activeTab === 'specs' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(product.specifications).map(([key, val]) => (
                      <div key={key} className="flex justify-between border-b border-gray-100 pb-2.5">
                        <span className="text-gray-500 font-bold text-sm">{key}</span>
                        <span className="text-gray-900 font-semibold text-sm">{val}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4 max-w-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                        <Store className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{product.supplier.name}</h4>
                        <p className="text-xs text-gray-500 font-medium">Verified MegaMart Retail Partner</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-100">
                      <div>
                        <span className="text-xs text-gray-400 font-bold block mb-1">ORIGIN</span>
                        <span className="text-sm font-semibold text-gray-700">{product.supplier.origin}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 font-bold block mb-1">LOGISTICS SPEED</span>
                        <span className="text-sm font-semibold text-gray-700">{product.supplier.dispatchSpeed}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 font-bold block mb-1">PARTNER RATING</span>
                        <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> {product.supplier.rating.toFixed(1)} / 5.0
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Reviews Feed */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              <h3 className="text-xl font-extrabold text-gray-900 border-b border-gray-100 pb-4">
                Customer Feedback
              </h3>

              <div className="space-y-6">
                {product.reviews.map((rev, index) => (
                  <div key={index} className="flex gap-4 border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center justify-center shadow-sm shrink-0 uppercase">
                      {rev.reviewer.charAt(0)}
                    </div>

                    <div className="flex-grow space-y-1">
                      <div className="flex justify-between items-center">
                        <h4 className="font-extrabold text-gray-900 text-sm">{rev.reviewer}</h4>
                        <span className="text-xs text-gray-400 font-medium">{rev.date}</span>
                      </div>

                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3.5 h-3.5 ${i < rev.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} 
                          />
                        ))}
                      </div>

                      <p className="text-sm text-gray-600 leading-relaxed font-medium mt-2">{rev.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
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
                  {cart.items.reduce((sum, i) => sum + i.quantity, 0)} Items
                </span>
              </div>
            </div>

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
                    key={item.id}
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
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Qty: {item.quantity}</span>
                        <span className="font-semibold text-gray-700">${item.price}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.items.length > 0 && (
              <div className="p-5 border-t border-gray-100 bg-gray-50/50 space-y-4">
                <div className="flex justify-between items-center text-gray-600 text-sm">
                  <span>Cart Total:</span>
                  <span className="text-2xl font-black text-green-600">${cart.total.toFixed(2)}</span>
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

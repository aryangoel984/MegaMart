'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import { 
  Send, Sparkles, ShoppingCart, User, ArrowLeft, Loader2, 
  ShoppingBag, Trash2, CheckCircle2, ChevronRight, Zap, RefreshCw 
} from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: string;
  category: string;
  imageUrl?: string;
  description?: string;
  similarity?: number;
  stock: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  products?: Product[];
  toolCalled?: string;
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

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your AI Shopping Concierge. I can help you discover products, add them to your cart, and complete your purchase. Try saying something like "Show me some tech gear" or "Add a laptop to my cart".'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<Cart>({ items: [], total: 0 });
  const [cartOpen, setCartOpen] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const router = useRouter();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Authentication & Initial Cart Fetch
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchCart();
  }, []);

  // 2. Scroll Anchoring
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const fetchCart = async () => {
    try {
      setSyncing(true);
      const res = await api.get('/orders');
      // Look for a PENDING order to represent the cart
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

  // 3. Send Message Routine
  const handleSend = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const historyPayload = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await api.post('/chat', {
        message: textToSend,
        history: historyPayload
      });

      const assistantMsg: Message = {
        role: 'assistant',
        content: response.data.content,
        products: response.data.products,
        toolCalled: response.data.toolCalled
      };

      setMessages(prev => [...prev, assistantMsg]);

      // If a tool mutation occurred, sync our frontend cart view automatically!
      if (response.data.toolCalled) {
        fetchCart();
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ I encountered an error communicating with my intelligence core. Please check your network and try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  // 4. Quick Action Button Mutator
  const handleQuickCommand = (cmd: string) => {
    handleSend(undefined, cmd);
  };

  // 5. Direct Product Actions inside AI Cards
  const handleAddProduct = async (productId: number) => {
    setLoading(true);
    try {
      const response = await api.post('/chat', {
        message: `Add product ID ${productId} to my cart`,
        history: messages.map(m => ({ role: m.role, content: m.content }))
      });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.content,
        products: response.data.products,
        toolCalled: response.data.toolCalled
      }]);

      fetchCart();
    } catch (err) {
      console.error('Failed to add product:', err);
      alert('Failed to add item to cart');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await api.post('/chat', {
        message: `checkout my cart`,
        history: messages.map(m => ({ role: m.role, content: m.content }))
      });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.content,
        products: response.data.products,
        toolCalled: response.data.toolCalled
      }]);

      fetchCart();
    } catch (err) {
      console.error('Checkout failed:', err);
      alert('Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gray-50 text-gray-900 flex flex-col relative overflow-hidden font-sans">
      
      {/* Subtle background dynamic meshes for premium depth */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header aligned to Dashboard navbar */}
      <header className="bg-white border-b border-gray-200/80 py-4 px-6 flex-shrink-0 flex items-center justify-between shadow-sm z-30">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/dashboard')}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 tracking-tight">
              MegaMart Concierge 
              <span className="text-xs bg-purple-100 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-600 animate-pulse" /> AI Agent
              </span>
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Powered by Groq High-Speed Qwen 3.6</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
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

      {/* Main Container */}
      <div className="flex-grow flex relative overflow-hidden">
        
        {/* Left Side: Conversational Hub */}
        <div className="flex-grow flex flex-col h-full justify-between relative bg-gray-50/50 overflow-hidden">
          
          {/* Scrollable Thread */}
          <div className="flex-grow overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            {messages.map((msg, index) => (
              <div 
                key={index}
                className={`flex gap-4 max-w-3xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border ${
                  msg.role === 'user' 
                    ? 'bg-blue-100 border-blue-200 text-blue-700' 
                    : 'bg-purple-100 border-purple-200 text-purple-700'
                }`}>
                  {msg.role === 'user' ? <User className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                </div>

                {/* Bubble Wrapper */}
                <div className="space-y-3 flex-grow max-w-[85%]">
                  <div className={`p-4 rounded-2xl border shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 border-blue-500 text-white rounded-tr-none'
                      : 'bg-white border-gray-200/80 text-gray-800 rounded-tl-none'
                  }`}>
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>

                  {/* Render dynamic Product recommendations from AI tool payload */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 w-full">
                      {msg.products.map((prod) => (
                        <div 
                          key={prod.id}
                          className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-blue-400 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                        >
                          <div className="relative h-40 bg-gray-100 flex items-center justify-center overflow-hidden border-b border-gray-100">
                            {prod.imageUrl ? (
                              <img 
                                src={prod.imageUrl} 
                                alt={prod.name} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ShoppingBag className="w-12 h-12 text-gray-400 opacity-50" />
                            )}
                            {prod.similarity !== undefined && prod.similarity > 0 && (
                              <span className="absolute top-2.5 right-2.5 bg-purple-100 text-purple-700 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Match: {(prod.similarity * 100).toFixed(0)}%
                              </span>
                            )}
                          </div>
                          
                          <div className="p-4 flex-grow flex flex-col justify-between">
                            <div>
                              <h4 className="font-bold text-gray-900 text-base leading-tight mb-1">{prod.name}</h4>
                              <p className="text-xs text-gray-500 font-medium mb-3">{prod.category}</p>
                            </div>
                            
                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                              <span className="text-lg font-bold text-green-600">${prod.price}</span>
                              {prod.stock > 0 ? (
                                <button
                                  onClick={() => handleAddProduct(prod.id)}
                                  disabled={loading}
                                  className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1 active:scale-[0.98]"
                                >
                                  <ShoppingCart className="w-3.5 h-3.5" /> Buy / Add
                                </button>
                              ) : (
                                <span className="text-rose-500 text-xs font-bold uppercase tracking-wider">Out of Stock</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Bouncing Typing Animation */}
            {loading && (
              <div className="flex gap-4 max-w-3xl">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-100 border border-purple-200 text-purple-700 shadow-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="bg-white border border-gray-200/80 px-5 py-4 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-sm">
                  <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce"></div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Interface Area */}
          <div className="p-4 bg-white border-t border-gray-200 backdrop-blur-md space-y-4 flex-shrink-0">
            
            {/* Quick Command Suggestions */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button 
                onClick={() => handleQuickCommand('Show me fashion items')}
                className="bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 text-xs font-semibold px-4 py-2 rounded-full whitespace-nowrap transition active:scale-[0.98]"
              >
                👕 Explore Fashion
              </button>
              <button 
                onClick={() => handleQuickCommand('Suggest standard coder setup products')}
                className="bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 text-xs font-semibold px-4 py-2 rounded-full whitespace-nowrap transition active:scale-[0.98]"
              >
                💻 Coding Gadgets
              </button>
              <button 
                onClick={() => handleQuickCommand('Show my current cart items')}
                className="bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 text-xs font-semibold px-4 py-2 rounded-full whitespace-nowrap transition active:scale-[0.98]"
              >
                🛒 Inspect Cart
              </button>
              <button 
                onClick={() => handleQuickCommand('checkout my order')}
                className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold px-4 py-2 rounded-full whitespace-nowrap transition active:scale-[0.98]"
              >
                💳 Checkout
              </button>
            </div>

            {/* Message input */}
            <form onSubmit={handleSend} className="flex gap-3">
              <input
                type="text"
                placeholder="Message your AI shopping assistant... (e.g., 'Do you have sneakers?')"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="flex-grow bg-gray-50 border border-gray-200 focus:border-blue-500/80 rounded-xl px-5 py-4 text-[15px] outline-none text-gray-900 placeholder-gray-400 transition shadow-inner"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-200 text-white font-bold p-4 rounded-xl transition flex items-center justify-center shrink-0 shadow-md shadow-blue-500/10 active:scale-[0.96]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Collapsible Glassmorphic Live Cart Panel */}
        {cartOpen && (
          <aside className="w-96 border-l border-gray-200 bg-white flex flex-col h-full justify-between relative shadow-lg z-20 transition-all duration-300">
            
            {/* Cart Header */}
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

            {/* Cart Items Area */}
            <div className="flex-grow overflow-y-auto p-5 space-y-4">
              {cart.items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <ShoppingBag className="w-16 h-16 opacity-20 text-gray-400" />
                  <div>
                    <h3 className="font-bold text-gray-400 text-base mb-1">Your cart is empty</h3>
                    <p className="text-xs text-gray-500 max-w-[200px]">Tell the AI Shopping Concierge to add products for you!</p>
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

            {/* Cart Summary & Action Area */}
            {cart.items.length > 0 && (
              <div className="p-5 border-t border-gray-100 bg-gray-50/50 space-y-4">
                <div className="flex justify-between items-center text-gray-600 text-sm">
                  <span>Cart Total:</span>
                  <span className="text-2xl font-black text-green-600">${cart.total.toFixed(2)}</span>
                </div>
                
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-gray-300 disabled:to-gray-300 text-white font-bold py-4 rounded-xl shadow-md active:scale-[0.98] transition flex items-center justify-center gap-2 border border-blue-500/20"
                >
                  {loading ? (
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

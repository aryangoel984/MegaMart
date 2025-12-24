// frontend/src/app/login/page.tsx
'use client'; // Required for buttons/forms in Next.js
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Call the Backend
      const res = await api.post('/auth/login', { email, password });
      
      // Save Token to LocalStorage (The Browser's Pocket)
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify({ name: res.data.name, id: res.data.userId }));
      
      // Redirect to Dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-black">Login to MegaMart</h2>
        
        {error && <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input 
              type="email" 
              className="mt-1 block w-full p-2 border border-gray-300 rounded text-black"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input 
              type="password" 
              className="mt-1 block w-full p-2 border border-gray-300 rounded text-black"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
          >
            Sign In
          </button>
        </form>
            <p className="mt-4 text-center text-sm text-gray-600">
    Don't have an account?{' '}
    <Link href="/register" className="text-blue-600 hover:underline">
        Sign up
    </Link>
    </p>
      </div>
    </div>
  );
}
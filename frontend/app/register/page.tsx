// frontend/src/app/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import Link from 'next/link'; // For navigation links

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // 1. Call the Backend Registration Endpoint
      await api.post('/auth/register', {
        name,
        email,
        password
      });

      // 2. On Success, redirect to Login
      // (Optional: You could auto-login here, but redirect is safer for now)
      router.push('/login');
      
    } catch (err: any) {
      // Show backend error (e.g., "User already exists")
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-black">Create Account</h2>
        
        {error && <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">{error}</div>}

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input 
              type="text" 
              className="mt-1 block w-full p-2 border border-gray-300 rounded text-black"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Email Field */}
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

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input 
              type="password" 
              className="mt-1 block w-full p-2 border border-gray-300 rounded text-black"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6} // Basic client-side validation
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 transition"
          >
            Register
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
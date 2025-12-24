import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 1. Navbar */}
      <nav className="flex justify-between items-center p-6 border-b border-gray-100">
        <div className="text-2xl font-bold text-blue-600 tracking-tighter">
          MegaMart<span className="text-black">.ai</span>
        </div>
        <div className="space-x-4">
          <Link 
            href="/login" 
            className="text-gray-600 hover:text-black font-medium transition"
          >
            Login
          </Link>
          <Link 
            href="/register" 
            className="bg-black text-white px-5 py-2.5 rounded-full font-medium hover:bg-gray-800 transition"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 mt-10 md:mt-20">
        <div className="inline-block bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
          🚀 Powered by Node.js & Python Microservices
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-6">
          Shopping meets <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            Artificial Intelligence
          </span>
        </h1>
        
        <p className="text-xl text-gray-500 max-w-2xl mb-10">
          Experience the next generation of e-commerce. Real-time inventory management powered by Node.js, with personalized recommendations driven by Python AI.
        </p>

        <div className="flex gap-4">
          <Link 
            href="/register" 
            className="bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition shadow-lg shadow-blue-500/30"
          >
            Create Account
          </Link>
          <Link 
            href="/login" 
            className="bg-gray-100 text-gray-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-200 transition"
          >
            Sign In
          </Link>
        </div>

        {/* 3. Tech Stack Grid (Great for Portfolio) */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-5xl w-full mb-20">
          <div className="p-6 border border-gray-100 rounded-2xl bg-gray-50 hover:border-blue-200 transition">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4 text-2xl">
              ⚡
            </div>
            <h3 className="text-lg font-bold text-gray-900">High Performance</h3>
            <p className="text-gray-500 mt-2">Built on Node.js and Express for non-blocking I/O and rapid API response times.</p>
          </div>

          <div className="p-6 border border-gray-100 rounded-2xl bg-gray-50 hover:border-purple-200 transition">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4 text-2xl">
              🧠
            </div>
            <h3 className="text-lg font-bold text-gray-900">AI Powered</h3>
            <p className="text-gray-500 mt-2">Integrated Python microservice using FastAPI to provide smart product recommendations.</p>
          </div>

          <div className="p-6 border border-gray-100 rounded-2xl bg-gray-50 hover:border-blue-200 transition">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-2xl">
              🛡️
            </div>
            <h3 className="text-lg font-bold text-gray-900">Secure Architecture</h3>
            <p className="text-gray-500 mt-2">Enterprise-grade security with JWT authentication and Bcrypt password hashing.</p>
          </div>
        </div>
      </main>

      {/* 4. Footer */}
      <footer className="bg-gray-50 border-t border-gray-100 py-8 text-center text-gray-400 text-sm">
        <p>&copy; 2025 MegaMart Inc. Built for technical interview demonstration.</p>
      </footer>
    </div>
  );
}
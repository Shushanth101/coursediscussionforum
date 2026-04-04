import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (!email || !password) {
        throw new Error("Please enter both email and password.");
      }
      
      const response = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-md w-full bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 p-8 rounded-2xl shadow-2xl shadow-black/50 animate-[slideUp_0.5s_ease-out]">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">Welcome Back</h2>
          <p className="text-slate-400">Sign in to continue to Course Forum</p>
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleLogin}>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-400">Email Address</label>
            <input
              type="email"
              id="email"
              className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="text-sm font-medium text-slate-400">Password</label>
              <Link to="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Forgot Password?</Link>
            </div>
            <input
              type="password"
              id="password"
              className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-600/30 hover:-translate-y-0.5 transition-all active:translate-y-0"
          >
            Sign In
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-slate-400">
          Don't have an account? 
          <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium ml-1 hover:underline transition-colors">
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;

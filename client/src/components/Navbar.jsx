import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, PlusCircle, Home, Sparkles } from 'lucide-react';

function Navbar() {
  const navigate = useNavigate();
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800 shadow-sm shadow-indigo-500/5">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-300">
              S
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Scholarly
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
              title="Home"
            >
              <Home size={20} />
            </Link>
            
            <Link
              to="/chat"
              className="flex items-center gap-2 px-3 py-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-all border border-indigo-500/20"
              title="Ask AI"
            >
              <Sparkles size={18} />
              <span className="text-sm font-medium hidden md:block">Ask AI</span>
            </Link>

            <Link
              to="/create-post"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 rounded-lg transition-all"
            >
              <PlusCircle size={18} />
              <span className="text-sm font-medium hidden sm:block">New Post</span>
            </Link>
            <div className="w-px h-6 bg-slate-800 mx-1"></div>
            <Link
              to="/profile"
              className="flex items-center gap-2 p-1.5 hover:bg-slate-800 rounded-lg transition-all"
              title="Profile"
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 font-semibold text-sm border border-slate-700 shadow-inner">
                {user.full_name?.charAt(0).toUpperCase() || user.user_id?.charAt(0).toUpperCase() || <User size={16} />}
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

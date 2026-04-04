import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, XCircle, AlertTriangle } from 'lucide-react';

function AuthModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLoginRedirect = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    onClose();
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-700/50 rounded-3xl p-8 max-w-sm w-full shadow-2xl shadow-indigo-500/10 animate-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 mb-6 border border-rose-500/20 shadow-lg shadow-rose-500/5">
            <AlertTriangle size={32} />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">Session Expired</h2>
          <p className="text-slate-400 text-[15px] leading-relaxed mb-8">
            Your login session has expired for security reasons. Please log in again to continue.
          </p>

          <button
            onClick={handleLoginRedirect}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl shadow-xl shadow-indigo-500/20 transition-all active:scale-95"
          >
            <LogIn size={20} />
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;

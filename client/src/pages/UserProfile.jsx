import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft } from 'lucide-react';

function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      let token = null;
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('accessToken');
      }
      if (!token) {
        if (typeof window !== 'undefined') {
          navigate('/login');
        }
        return;
      }
      
      const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
          if (res.status === 404) {
              throw new Error('User not found');
          }
          throw new Error('Failed to fetch profile');
      }
      const data = await res.json();
      
      setUser(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="text-emerald-400 text-lg font-medium animate-pulse">Loading profile...</div>
        </div>
      </Layout>
    );
  }

  if (error || !user) {
    return (
      <Layout>
        <div className="bg-rose-500/10 text-rose-400 p-6 rounded-xl text-center max-w-2xl mx-auto border border-rose-500/20 mt-10">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error || 'User not found'}</p>
          <button 
            onClick={() => navigate(-1)}
            className="mt-6 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors border border-slate-700 shadow-sm inline-flex items-center gap-2 font-medium"
          >
            <ArrowLeft size={18} /> Go Back
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button 
            onClick={() => navigate(-1)}
            className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-all border border-slate-700/50 hover:border-slate-700 shadow-sm font-medium text-sm"
        >
            <ArrowLeft size={16} /> Back
        </button>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl shadow-black/40 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 group-hover:h-1.5 transition-all"></div>
          
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-8 border-b border-slate-800/80">
            <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white font-extrabold text-5xl shadow-xl shadow-emerald-500/20 shrink-0 transform group-hover:scale-105 transition-transform duration-500">
              {user?.full_name?.charAt(0).toUpperCase() || user?.user_id?.charAt(0).toUpperCase()}
            </div>
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-4xl font-extrabold text-slate-100 mb-2 truncate">{user?.full_name}</h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <p className="text-emerald-400 font-bold tracking-wide text-lg">@{user?.user_id}</p>
                <div className="hidden sm:block text-slate-600">•</div>
                <div className="inline-flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80 text-sm font-medium text-slate-400">
                   Joined: {new Date(user?.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric'})}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <h3 className="text-sm font-bold text-slate-400 ml-1 uppercase tracking-widest flex items-center gap-2">
                About {user.full_name?.split(' ')[0]}
            </h3>
            <div className="w-full min-h-[180px] bg-slate-950/40 border border-slate-800/60 rounded-2xl p-6 prose prose-invert prose-emerald max-w-none shadow-inner">
              {user.profile_content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{user.profile_content}</ReactMarkdown>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 py-8">
                  <p className="italic text-lg">No bio provided yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default UserProfile;

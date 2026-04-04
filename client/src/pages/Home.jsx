import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Search, MessageSquare, ArrowBigUp, Clock, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function Home() {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { triggerSessionExpired } = useAuth();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
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

    try {
      const response = await fetch('http://localhost:5000/api/posts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        if (response.status === 401) {
          triggerSessionExpired();
          return;
        }
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();
      setPosts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchPosts();
      return;
    }
    setLoading(true);
    try {
      let token = null;
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('accessToken');
      }

      const response = await fetch(`http://localhost:5000/api/posts/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setPosts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-slate-800 pb-8">
          <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              Discussions
            </h1>
            <p className="text-slate-400 font-medium">Join the conversation with fellow students</p>
          </div>

          <form onSubmit={handleSearch} className="relative w-full md:w-96 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl leading-5 text-slate-300 placeholder-slate-500 focus:outline-none focus:bg-slate-950 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all sm:text-sm"
              placeholder="Search Similar posts..."
            />
          </form>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl shadow-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block w-8 h-8 rounded-full border-4 border-slate-700 border-t-indigo-500 animate-spin"></div>
              <p className="text-slate-400 mt-4 font-medium animate-pulse">Loading amazing discussions...</p>
            </div>
          ) : posts.length === 0 && !error ? (
            <div className="p-12 text-center bg-slate-900/50 border border-slate-800 border-dashed rounded-3xl">
              <p className="text-slate-400 text-lg">No posts available right now.</p>
              <p className="text-slate-500 mt-2">Be the first to create a discussion!</p>
            </div>
          ) : (
            posts.map(post => {
              const date = new Date(post.created_at).toLocaleDateString(undefined, {
                year: 'numeric', month: 'short', day: 'numeric'
              });

              return (
                <Link
                  to={`/post/${post.post_id}`}
                  key={post.post_id}
                  className="block group"
                >
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:bg-slate-800/80 hover:border-indigo-500/30 transition-all duration-300 shadow-sm shadow-black/10 hover:shadow-indigo-500/10 hover:-translate-y-1 relative overflow-hidden">
                    {post.similarity && (
                      <div className="absolute top-0 right-0 bg-indigo-500/20 text-indigo-300 text-xs px-3 py-1 font-medium rounded-bl-xl border-b border-l border-indigo-500/20">
                        {Math.round(post.similarity * 100)}% Match
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-4">
                      <div 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/user/${post.author_id}`); }}
                        className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 font-bold text-sm border border-slate-700 shadow-inner hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-colors cursor-pointer z-10"
                      >
                        {post.author_id.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/user/${post.author_id}`); }}
                          className="text-sm font-semibold text-slate-300 hover:text-indigo-400 transition-colors cursor-pointer z-10 relative"
                        >
                          @{post.author_id}
                        </h4>
                        <div className="flex items-center text-xs text-slate-500 mt-0.5 gap-1">
                          <Clock size={12} />
                          <span>{date}</span>
                        </div>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-slate-100 mb-2 group-hover:text-indigo-400 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-slate-400 line-clamp-2 mb-4 text-sm leading-relaxed font-sans">
                      {post.body.replace(/[#*`~>-]/g, '').substring(0, 150)}...
                    </p>

                    {/* Tags */}
                    {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {post.tags.map((tag) => (
                          <span
                            key={tag.tag_id}
                            className="inline-flex items-center gap-1 bg-indigo-500/10 text-indigo-300/80 border border-indigo-500/15 px-2 py-0.5 rounded-md text-xs font-medium hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors"
                          >
                            <Tag size={10} />
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-6">
                      <div className="flex items-center gap-1.5 bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-800/80">
                        <ArrowBigUp size={16} className={post.vote_count > 0 ? "text-emerald-400 fill-emerald-400/20" : "text-slate-500"} />
                        <span className={post.vote_count > 0 ? "text-emerald-400 font-medium text-sm" : "text-slate-400 font-medium text-sm"}>{post.vote_count}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-800/80">
                        <MessageSquare size={14} className="text-slate-500" />
                        <span className="text-slate-400 font-medium text-sm">{post.comment_count}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Home;

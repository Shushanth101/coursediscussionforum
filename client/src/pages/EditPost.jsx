import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import MarkdownEditor from '../components/MarkdownEditor';
import { X, Tag } from 'lucide-react';

function EditPost() {
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const tagInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) &&
          tagInputRef.current && !tagInputRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch tag suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!tagInput.trim() || tagInput.trim().length < 1) {
        setTagSuggestions([]);
        return;
      }
      try {
        let token = null;
        if (typeof window !== 'undefined') {
          token = localStorage.getItem('accessToken');
        }
        const res = await fetch(`http://localhost:5000/api/tags/search?q=${encodeURIComponent(tagInput.trim())}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTagSuggestions(data.filter(t => !tags.includes(t.name)));
          setShowSuggestions(true);
        }
      } catch (err) {
        // silently fail
      }
    };
    const debounce = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(debounce);
  }, [tagInput, tags]);

  const addTag = (tagName) => {
    const normalized = tagName.trim().toLowerCase();
    if (normalized && !tags.includes(normalized) && tags.length < 5) {
      setTags([...tags, normalized]);
    }
    setTagInput('');
    setShowSuggestions(false);
    tagInputRef.current?.focus();
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (tagInput.trim()) {
        addTag(tagInput);
      }
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  useEffect(() => {
    const fetchPost = async () => {
      try {
        let token = null;
        if (typeof window !== 'undefined') {
          token = localStorage.getItem('accessToken');
        }
        
        const res = await fetch(`http://localhost:5000/api/posts/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) {
          throw new Error('Failed to fetch post');
        }
        
        const data = await res.json();
        setTitle(data.title);
        setBody(data.body);
        
        // Load existing tags
        if (data.tags && Array.isArray(data.tags)) {
          setTags(data.tags.map(t => t.name));
        }
        
        // Basic check: is the user the author?
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.user_id !== data.author_id) {
            setError('You are not authorized to edit this post');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPost();
  }, [id]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    
    if (!title.trim() || !body.trim()) {
      setError('Title and body are required.');
      return;
    }

    setSaving(true);
    try {
      let token = null;
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('accessToken');
      }
      
      const res = await fetch(`http://localhost:5000/api/posts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, body, tags })
      });

      if (!res.ok) {
        throw new Error('Failed to update post');
      }

      navigate(`/post/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const onImageUpload = async (file) => {
    const formData = new FormData();
    formData.append('images', file);
    
    try {
      let token = null;
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('accessToken');
      }
        
      const res = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!res.ok) {
        throw new Error('Image upload failed');
      }
      
      const data = await res.json();
      return data.urls[0];
      
    } catch (err) {
      setError(err.message);
      return '';
    }
  };

  if (loading) {
      return (
          <Layout>
              <div className="min-h-[50vh] flex items-center justify-center">
                  <div className="text-indigo-400 text-lg font-medium animate-pulse">Loading post...</div>
              </div>
          </Layout>
      );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-8">
          Edit Post
        </h1>

        <div className="space-y-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl shadow-black/20">
          {error && (
             <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">
               {error}
             </div>
          )}

          {!error && (
              <>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Title</label>
                    <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give your post a descriptive title"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-600"
                    />
                </div>

                {/* Tags Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1 flex items-center gap-1.5">
                    <Tag size={14} className="text-indigo-400" />
                    Tags
                    <span className="text-slate-500 font-normal">(up to 5)</span>
                  </label>
                  <div className="relative">
                    <div className="flex flex-wrap gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500 transition-all min-h-[46px] items-center">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 px-2.5 py-1 rounded-lg text-sm font-medium group hover:bg-indigo-500/25 transition-colors"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="text-indigo-400/60 hover:text-rose-400 transition-colors ml-0.5"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                      {tags.length < 5 && (
                        <input
                          ref={tagInputRef}
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleTagKeyDown}
                          onFocus={() => tagInput.trim() && setShowSuggestions(true)}
                          placeholder={tags.length === 0 ? "Type a tag and press Enter (e.g. javascript, react)" : "Add more..."}
                          className="flex-1 bg-transparent text-slate-200 outline-none text-sm placeholder:text-slate-600 min-w-[120px] py-0.5"
                        />
                      )}
                    </div>

                    {/* Autocomplete Suggestions Dropdown */}
                    {showSuggestions && tagSuggestions.length > 0 && (
                      <div
                        ref={suggestionsRef}
                        className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                      >
                        {tagSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.tag_id}
                            type="button"
                            onClick={() => addTag(suggestion.name)}
                            className="w-full px-4 py-2.5 text-left hover:bg-indigo-500/10 text-slate-300 hover:text-indigo-300 transition-colors flex justify-between items-center text-sm group"
                          >
                            <span className="font-medium">#{suggestion.name}</span>
                            <span className="text-xs text-slate-500 group-hover:text-indigo-400/70">
                              {suggestion.post_count} {suggestion.post_count === '1' ? 'post' : 'posts'}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1 mb-2 block">Content</label>
                    <MarkdownEditor
                        value={body}
                        onChange={setBody}
                        onImageUpload={onImageUpload}
                        style={{ height: '500px' }}
                        config={{
                            view: { menu: true, md: true, html: false }
                        }}
                    />
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
              </>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default EditPost;


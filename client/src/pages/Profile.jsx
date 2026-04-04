import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Edit2, Save, X } from 'lucide-react';
import MarkdownEditor from '../components/MarkdownEditor';
import MDEditor from '@uiw/react-md-editor';

function Profile() {
  const [user, setUser] = useState(null);
  const [profileContent, setProfileContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      let token = null;
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('accessToken');
      }
      if (!token) return;

      const res = await fetch('http://localhost:5000/api/users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch user');
      const data = await res.json();

      const fullProfileRes = await fetch(`http://localhost:5000/api/users/${data.user.user_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!fullProfileRes.ok) throw new Error('Failed to fetch full profile');
      const fullProfileData = await fullProfileRes.json();

      setUser(fullProfileData.user);
      setProfileContent(fullProfileData.user.profile_content || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      let token = null;
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('accessToken');
      }

      const res = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ profile_content: profileContent })
      });
      if (!res.ok) throw new Error('Failed to update profile');
      const data = await res.json();
      setUser(data.user);

      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      setMessage('Profile updated successfully!');
      setIsEditing(false);

      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
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

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
            Your Profile
          </h1>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700 shadow-sm"
            >
              <Edit2 size={16} />
              <span className="text-sm font-medium">Edit Bio</span>
            </button>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl shadow-black/20">
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-8 border-b border-slate-800">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-4xl shadow-lg shadow-emerald-500/20 shrink-0">
              {user?.full_name?.charAt(0).toUpperCase() || user?.user_id?.charAt(0).toUpperCase()}
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold text-slate-100 mb-1">{user?.full_name}</h2>
              <p className="text-slate-400 font-medium">@{user?.user_id}</p>
              <p className="text-sm text-slate-500 mt-2 bg-slate-800/50 inline-block px-3 py-1 rounded-full border border-slate-700/50">
                {user?.email}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {error && <div className="text-rose-400 bg-rose-500/10 p-4 rounded-xl text-sm border border-rose-500/20">{error}</div>}
            {message && <div className="text-emerald-400 bg-emerald-500/10 p-4 rounded-xl text-sm border border-emerald-500/20 animate-in fade-in">{message}</div>}

            {isEditing ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1 mb-2 block">About Me (Bio Markdown)</label>
                  <MarkdownEditor
                    value={profileContent}
                    onChange={setProfileContent}
                    style={{ height: '400px' }}
                    placeholder="Write something about yourself using markdown..."
                    config={{
                      view: { menu: true, md: true, html: false },
                    }}
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-all"
                  >
                    <X size={18} />
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-slate-400 ml-1 uppercase tracking-wider">About Me</h3>
                <div className="w-full min-h-[160px] bg-slate-950/50 border border-slate-800/80 rounded-xl p-5 prose prose-invert prose-emerald max-w-none">
                  {profileContent ? (
                    <div className="w-full pt-6 border-t border-slate-800/50">
                      <div
                        data-color-mode="dark"
                        className="[&_.wmde-markdown]:bg-transparent 
               [&_.wmde-markdown]:border-0 
               [&_.wmde-markdown]:p-0"
                      >
                        <MDEditor.Markdown source={profileContent} />
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">No bio provided yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Profile;

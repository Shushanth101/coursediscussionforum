import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import MDEditor from '@uiw/react-md-editor';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Clock, Trash2, User, Reply, CornerDownRight, Edit2, Tag, ChevronDown, ChevronRight } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const CommentNode = ({ comment, handleAddReply, currentUser, navigate }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const submitReply = (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    handleAddReply(comment.comment_id, replyContent);
    setReplyContent('');
    setShowReplyForm(false);
  };

  return (
    <div id={`comment-${comment.comment_id}`} className="group/comment mb-3">
      <div className="flex gap-2 relative">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-8 h-8 rounded-full bg-slate-800 shrink-0 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-indigo-400 hover:bg-slate-700 transition-colors z-10"
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </button>

        <div className="flex-1">
            <div className={`bg-slate-950 p-3 rounded-2xl border border-slate-800/50 ${isCollapsed ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-2 mb-1.5">
                    <div
                        onClick={() => navigate(`/user/${comment.author_id}`)}
                        className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-purple-400 font-bold text-[10px] cursor-pointer hover:bg-slate-700 transition"
                    >
                        {comment.author_id.charAt(0).toUpperCase()}
                    </div>
                    <span
                        onClick={() => navigate(`/user/${comment.author_id}`)}
                        className="font-bold text-slate-300 text-xs cursor-pointer hover:text-indigo-400 transition"
                    >
                        @{comment.author_id}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                        {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                </div>

                {!isCollapsed && (
                    <>
                        <div className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed mb-2">
                            {comment.content}
                        </div>

                        <div className="flex items-center gap-4 text-[10px] font-medium">
                            <button
                                onClick={() => setShowReplyForm(!showReplyForm)}
                                className="text-slate-500 hover:text-indigo-400 flex items-center gap-1 transition-colors"
                            >
                                <Reply size={12} />
                                Reply
                            </button>
                        </div>

                        {showReplyForm && (
                            <form onSubmit={submitReply} className="mt-3 animate-in fade-in slide-in-from-top-2">
                                <textarea
                                    autoFocus
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder="Write your reply..."
                                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-xs resize-y min-h-[60px]"
                                />
                                <div className="mt-2 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowReplyForm(false)}
                                        className="px-2 py-1 text-[10px] font-medium text-slate-400 hover:text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-2 py-1 text-[10px] font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors shadow-sm"
                                    >
                                        Submit Reply
                                    </button>
                                </div>
                            </form>
                        )}
                    </>
                )}
            </div>
            
            {!isCollapsed && comment.replies && comment.replies.length > 0 && (
                <div className="ml-2 mt-3 border-l-2 border-slate-800/60 pl-4 space-y-3">
                    {comment.replies.map(reply => (
                        <div key={reply.comment_id} className="relative">
                            <CornerDownRight className="absolute -left-6 top-2.5 text-slate-700 w-4 h-4" />
                            <CommentNode
                                comment={reply}
                                handleAddReply={handleAddReply}
                                currentUser={currentUser}
                                navigate={navigate}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const { triggerSessionExpired } = useAuth();

  const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};

  useEffect(() => {
    fetchPostAndComments();
    fetchAnswers();
  }, [id]);

  const fetchPostAndComments = async () => {
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

      const postRes = await apiFetch(`http://localhost:5000/api/posts/${id}`, {}, triggerSessionExpired);
      if (!postRes.ok) throw new Error('Failed to fetch post');
      const postData = await postRes.json();
      setPost(postData);

      const commentsRes = await apiFetch(`http://localhost:5000/api/comments/${id}`, {}, triggerSessionExpired);
      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setComments(commentsData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnswers = async () => {
    try {
      let token = null;
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('accessToken');
      }
      const res = await apiFetch(`http://localhost:5000/api/answers/${id}`, {}, triggerSessionExpired);
      if (res.ok) {
        const data = await res.json();
        setAnswers(data);
      }
    } catch (err) {
      console.error("Error fetching answers:", err);
    }
  };

  const handleCreateAnswer = async () => {
    if (!newAnswer.trim()) return;
    setIsSubmittingAnswer(true);
    try {
      let token = null;
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('accessToken');
      }
      const res = await apiFetch(`http://localhost:5000/api/answers/${id}`, {
        method: 'POST',
        body: JSON.stringify({ content: newAnswer })
      }, triggerSessionExpired);
      if (!res.ok) throw new Error('Failed to post answer');
      setNewAnswer('');
      fetchAnswers();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const handleVote = async (voteType) => {
    try {
      let token = null;
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('accessToken');
      }
      const res = await apiFetch(`http://localhost:5000/api/posts/${id}/vote`, {
        method: 'POST',
        body: JSON.stringify({ vote_type: voteType })
      }, triggerSessionExpired);
      if (!res.ok) throw new Error('Failed to vote');

      fetchPostAndComments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async () => {
    if (typeof window !== 'undefined' && !window.confirm('Are you sure you want to delete this post?')) return;
    try {
      let token = null;
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('accessToken');
      }
      const res = await apiFetch(`http://localhost:5000/api/posts/${id}`, {
        method: 'DELETE'
      }, triggerSessionExpired);
      if (!res.ok) throw new Error('Failed to delete post');
      if (typeof window !== 'undefined') {
        navigate('/');
      }
    } catch (err) {
      if (typeof window !== 'undefined') {
        alert(err.message);
      }
    }
  };

  const handleCreateComment = async (parent_id, content) => {
    try {
      let token = null;
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('accessToken');
      }
      const res = await apiFetch('http://localhost:5000/api/comments', {
        method: 'POST',
        body: JSON.stringify({
          post_id: id,
          content: content,
          parent_id: parent_id
        })
      }, triggerSessionExpired);
      if (!res.ok) throw new Error('Failed to add comment');

      fetchPostAndComments(); // Refresh
    } catch (err) {
      console.error(err);
      if (typeof window !== 'undefined') {
        alert(err.message);
      }
    }
  };

  const submitTopLevelComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    handleCreateComment(null, newComment);
    setNewComment('');
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-20 flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  if (error || !post) {
    return (
      <Layout>
        <div className="bg-rose-500/10 text-rose-400 p-6 rounded-xl text-center max-w-2xl mx-auto border border-rose-500/20">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error || 'Post not found'}</p>
        </div>
      </Layout>
    );
  }

  const isAuthor = currentUser.user_id === post.author_id;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Main Post Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl shadow-black/40 mb-8 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

          <div className="p-6 sm:p-8 md:p-10 flex gap-4 md:gap-6">

            {/* Voting Sidebar */}
            <div className="flex flex-col items-center gap-2 pt-2 shrink-0">
              <button
                onClick={() => handleVote(1)}
                className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors group"
                title="Upvote"
              >
                <ArrowBigUp className="w-6 h-6 md:w-8 md:h-8 group-hover:fill-indigo-500/20" />
              </button>
              <span className="font-bold text-lg text-slate-200">{post.vote_count}</span>
              <button
                onClick={() => handleVote(-1)}
                className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors group"
                title="Downvote"
              >
                <ArrowBigDown className="w-6 h-6 md:w-8 md:h-8 group-hover:fill-rose-500/20" />
              </button>
            </div>

            {/* Post Content */}
            <div className="flex-1 w-full min-w-0">
              <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div
                    onClick={() => navigate(`/user/${post.author_id}`)}
                    className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 font-bold text-sm border border-slate-700 cursor-pointer hover:bg-slate-700 transition"
                  >
                    {post.author_id.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4
                      onClick={() => navigate(`/user/${post.author_id}`)}
                      className="text-sm font-bold text-slate-200 cursor-pointer hover:text-indigo-400 transition"
                    >
                      @{post.author_id}
                    </h4>
                    <div className="flex items-center text-xs text-slate-500 mt-0.5 gap-1 font-medium">
                      <Clock size={12} />
                      {new Date(post.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                {isAuthor && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/edit-post/${id}`)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg transition-all text-sm font-medium border border-indigo-500/20"
                    >
                      <Edit2 size={16} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={handleDeletePost}
                      className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg transition-all text-sm font-medium border border-rose-500/20"
                    >
                      <Trash2 size={16} />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>

              <h1 className="text-3xl font-extrabold text-slate-100 mb-4 tracking-tight">
                {post.title}
              </h1>

              {/* Tags */}
              {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {post.tags.map((tag) => (
                    <span
                      key={tag.tag_id}
                      className="inline-flex items-center gap-1.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-3 py-1 rounded-lg text-sm font-medium hover:bg-indigo-500/20 transition-colors"
                    >
                      <Tag size={12} />
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="w-full pt-6 border-t border-slate-800/50">
                <div
                  data-color-mode="dark"
                  className="[&_.wmde-markdown]:!bg-transparent 
               [&_.wmde-markdown]:border-0 
               [&_.wmde-markdown]:p-0"
                >
                  <MDEditor.Markdown source={post.body} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Discussions Section */}
        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl shadow-black/20 mb-6">
          <h3 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <MessageSquare size={18} className="text-indigo-400" />
            </div>
            Discussions ({post.comment_count})
          </h3>

          <form onSubmit={submitTopLevelComment} className="mb-8 relative">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 shrink-0 border border-slate-700 flex items-center justify-center text-slate-400 text-xs shadow-inner">
                {currentUser.full_name?.charAt(0).toUpperCase() || <User size={14} />}
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="What are your thoughts?"
                  className="w-full min-h-[80px] bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-xs placeholder:text-slate-600 resize-y"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg shadow-lg shadow-indigo-500/20 transition-all"
                  >
                    Post Comment
                  </button>
                </div>
              </div>
            </div>
          </form>

          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-center text-slate-500 py-6 italic text-sm">No comments yet. Start the conversation!</p>
            ) : (
              comments.map(comment => (
                <CommentNode
                  key={comment.comment_id}
                  comment={comment}
                  handleAddReply={handleCreateComment}
                  currentUser={currentUser}
                  navigate={navigate}
                />
              ))
            )}
          </div>
        </div>

        {/* Answers Section */}
        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl shadow-black/20 mb-20">
            <h3 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Edit2 size={18} className="text-emerald-400" />
                </div>
                Answers ({answers.length})
            </h3>

            {/* Post Answer Form */}
            <div className="mb-8 space-y-3">
                <div data-color-mode="dark" className="rounded-xl overflow-hidden border border-slate-800 text-sm">
                    <MDEditor
                        value={newAnswer}
                        onChange={setNewAnswer}
                        preview="edit"
                        height={200}
                        placeholder="Write your detailed answer here..."
                        className="!bg-slate-950"
                    />
                </div>
                <div className="flex justify-end">
                    <button
                        onClick={handleCreateAnswer}
                        disabled={isSubmittingAnswer || !newAnswer.trim()}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                    >
                        {isSubmittingAnswer ? 'Posting...' : 'Post Answer'}
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {(!answers || answers.length === 0) ? (
                    <div className="py-8 text-center bg-slate-950/50 rounded-2xl border border-dashed border-slate-800">
                        <p className="text-slate-500 italic text-sm">No answers yet. Share your knowledge!</p>
                    </div>
                ) : (
                    answers.map(answer => (
                        <div key={answer.answer_id} className="group relative bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 hover:border-emerald-500/20 transition-all">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <div 
                                        onClick={() => navigate(`/user/${answer.author_id}`)}
                                        className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-emerald-400 font-bold text-xs border border-slate-700 cursor-pointer"
                                    >
                                        {answer.author_id ? answer.author_id.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <div>
                                        <h4 
                                            onClick={() => navigate(`/user/${answer.author_id}`)}
                                            className="text-xs font-bold text-slate-200 cursor-pointer hover:text-emerald-400"
                                        >
                                            @{answer.author_id}
                                        </h4>
                                        <p className="text-[10px] text-slate-500">{new Date(answer.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                {answer.is_edited && (
                                    <span className="text-[9px] text-slate-500 italic bg-slate-800/50 px-1.5 py-0.5 rounded-full border border-slate-700/50">Edited</span>
                                )}
                            </div>
                            <div className="prose prose-sm prose-invert prose-emerald max-w-none">
                                <div data-color-mode="dark" className="[&_.wmde-markdown]:!bg-transparent [&_.wmde-markdown]:p-0">
                                    <MDEditor.Markdown source={answer.content} />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

      </div>
    </Layout>
  );
}

export default PostDetail;

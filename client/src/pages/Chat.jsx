import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Sparkles, Loader2, X, PlusCircle, MessageSquare, Clock, ChevronLeft } from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
});

const Mermaid = ({ chart }) => {
  const [svg, setSvg] = useState('');
  
  useEffect(() => {
    const id = `mermaid-${Math.random().toString(36).substring(7)}`;
    mermaid.render(id, chart)
      .then((result) => setSvg(result.svg))
      .catch((e) => console.error(e));
  }, [chart]);
  
  if (!svg) return <div className="text-slate-400 text-sm py-4 italic text-center animate-pulse">Rendering diagram...</div>;
  return <div className="flex justify-center my-6 mermaid-diagram bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-x-auto" dangerouslySetInnerHTML={{ __html: svg }} />;
};

function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { triggerSessionExpired } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [pastChats, setPastChats] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const isNavigatingToNewChat = useRef(false);
  const currentChatIdRef = useRef(id);

  useEffect(() => {
    currentChatIdRef.current = id;
  }, [id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, status]);

  // Markdown processing libraries are statically imported now

  // Fetch past chats
  const fetchPastChats = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/chat/past-chats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (res.status === 401) return triggerSessionExpired();
      const data = await res.json();
      setPastChats(data);
    } catch (err) {
      console.error('Failed to fetch past chats:', err);
    }
  };

  useEffect(() => {
    fetchPastChats();
  }, [id]);

  // Fetch history when ID changes
  useEffect(() => {
    const fetchHistory = async () => {
      if (!id) {
        setMessages([]);
        return;
      }
      
      if (isNavigatingToNewChat.current) {
        isNavigatingToNewChat.current = false;
        return;
      }
      
      setIsLoading(true);
      setStatus('Loading history...');
      try {
        const res = await fetch(`http://localhost:5000/api/chat/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        if (res.status === 401) return triggerSessionExpired();
        if (res.ok) {
          const history = await res.json();
          setMessages(history);
        }
      } catch (err) {
        console.error('Failed to fetch history:', err);
      } finally {
        setIsLoading(false);
        setStatus('');
      }
    };

    fetchHistory();
  }, [id]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, { data: reader.result.split(',')[1], mimeType: file.type, preview: reader.result }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleNewChat = () => {
    navigate('/chat');
    setMessages([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!input.trim() && images.length === 0) || isLoading) return;

    const userMessage = { role: 'user', content: input, images: [...images] };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setImages([]);
    setIsLoading(true);
    setStatus('Initializing...');

    try {
      let currentId = id;
      
      // If we are starting a fresh chat, initialize it first
      if (!currentId) {
        const initRes = await fetch('http://localhost:5000/api/chat/init', {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });

        if (initRes.status === 401) return triggerSessionExpired();
        const initData = await initRes.json();
        currentId = initData.conversation_id;
        // Redirect to the new URL but continue the execution
        isNavigatingToNewChat.current = true;
        navigate(`/chats/c/${currentId}`, { replace: true });
      }

      const response = await fetch('http://localhost:5000/api/chat/generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          conversation_id: currentId,
          query: userMessage.content,
          images: userMessage.images.map(img => ({ data: img.data, mimeType: img.mimeType }))
        })
      });

      if (response.status === 401) return triggerSessionExpired();
      if (!response.ok) throw new Error('Failed to generate content');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiMessage = { role: 'model', content: '' };
      setMessages(prev => [...prev, aiMessage]);

      while (true) {
        if (currentChatIdRef.current && currentChatIdRef.current !== currentId) break;
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.type === 'status') {
                setStatus(data.message);
              } else if (data.type === 'chunk') {
                aiMessage.content += data.text;
                setMessages(prev => {
                  if (prev.length === 0) return [{ ...aiMessage }];
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1] = { ...aiMessage };
                  return newMsgs;
                });
              } else if (data.type === 'done') {
                setStatus('');
                fetchPastChats(); // Refresh sidebar to show new chat or updated title
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (e) {
              console.error('Error parsing SSE chunk:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'error', content: error.message }]);
    } finally {
      setIsLoading(false);
      setStatus('');
    }
  };

  return (
    <Layout noScroll>
      <div className="flex bg-slate-950 h-full w-full overflow-hidden">
        {/* Sidebar */}
        <aside className={`${isSidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 border-r border-slate-800 bg-slate-900/30 flex flex-col h-full overflow-hidden shrink-0 relative`}>
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <button 
              onClick={handleNewChat}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2.5 px-4 text-sm font-medium transition-all shadow-lg shadow-indigo-500/10"
            >
              <PlusCircle size={18} />
              New Chat
            </button>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="ml-2 p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors md:hidden"
            >
              <ChevronLeft size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-hide">
            <style>{` .scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; } `}</style>
            <div className="px-2 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Recent Chats</div>
            {pastChats.length === 0 ? (
              <div className="px-3 py-6 text-center text-slate-600 text-sm italic">
                No recent conversations
              </div>
            ) : (
              pastChats.map((chat) => (
                <Link
                  key={chat.conversation_id}
                  to={`/chats/c/${chat.conversation_id}`}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    id === chat.conversation_id 
                      ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20' 
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <MessageSquare size={16} className={id === chat.conversation_id ? 'text-indigo-400' : 'text-slate-500'} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{chat.title || 'Untitled Chat'}</div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                      <Clock size={10} />
                      {new Date(chat.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
          
        </aside>

        {/* Floating Sidebar Toggle Button */}
        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="fixed left-4 top-20 z-20 p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl shadow-2xl transition-all animate-in slide-in-from-left-4"
          >
            <MessageSquare size={20} />
          </button>
        )}

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col relative h-full">
          <div className="flex-1 overflow-y-auto pt-4 pb-32 px-4 md:px-8 space-y-6 chat-messages-container scroll-smooth">
            <style>{`
              .chat-messages-container::-webkit-scrollbar {
                display: none;
              }
              .chat-messages-container {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
            `}</style>

            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 animate-in fade-in zoom-in duration-700">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 border border-indigo-500/20">
                  <Sparkles size={32} />
                </div>
                <h2 className="text-xl font-semibold text-slate-300">How can I help you today?</h2>
                <p className="text-sm max-w-xs text-center mt-2">Ask me anything about the forum posts, code, or upload an image for technical analysis.</p>
                <div className="grid grid-cols-2 gap-3 mt-8 w-full max-w-lg">
                  {[
                    "How do I fix memory leaks?",
                    "Analyze this React error",
                    "Best practices for SQL",
                    "Explain Redux Saga"
                  ].map((suggestion, i) => (
                    <button 
                      key={i}
                      onClick={() => setInput(suggestion)}
                      className="p-3 text-xs text-left bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition-all"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[85%] rounded-2xl shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none px-4 py-3' 
                    : msg.role === 'error'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 px-4 py-3'
                    : 'bg-slate-800/80 text-slate-200 rounded-tl-none border border-slate-700 shadow-lg'
                }`}>
                  {msg.images?.length > 0 && (
                    <div className="flex gap-2 mb-2 p-4 pb-0">
                      {msg.images.map((img, idx) => {
                        const imgSrc = img.preview || (img.inlineData ? `data:${img.inlineData.mimeType};base64,${img.inlineData.data}` : null);
                        return imgSrc ? (
                          <img key={idx} src={imgSrc} alt="upload" className="w-20 h-20 object-cover rounded-lg border border-white/10" />
                        ) : null;
                      })}
                    </div>
                  )}
                  {msg.role === 'model' ? (
                    <div className="markdown-chat-container overflow-hidden rounded-2xl text-[15px] leading-relaxed text-slate-200">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            if (!inline && match && match[1] === 'mermaid') {
                              return <Mermaid chart={String(children).replace(/\n$/, '')} />;
                            }
                            return !inline && match ? (
                              <SyntaxHighlighter
                                {...props}
                                children={String(children).replace(/\n$/, '')}
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                className="rounded-xl border border-slate-700 !bg-slate-950 !my-4 text-sm"
                              />
                            ) : (
                              <code {...props} className={`${className || ''} bg-slate-800 text-pink-400 px-1.5 py-0.5 rounded-md text-sm`}>
                                {children}
                              </code>
                            );
                          },
                          p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
                          h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 text-white mt-6">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-xl font-bold mb-3 text-white mt-5">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-lg font-bold mb-3 text-white mt-4">{children}</h3>,
                          a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">{children}</a>,
                          blockquote: ({ children }) => <blockquote className="border-l-4 border-indigo-500/50 pl-4 py-1 mb-4 italic text-slate-400 bg-slate-800/30 rounded-r-lg">{children}</blockquote>,
                          table: ({ children }) => <div className="overflow-x-auto mb-4 border border-slate-700 text-sm rounded-xl"><table className="w-full text-left">{children}</table></div>,
                          thead: ({ children }) => <thead className="bg-slate-800/80">{children}</thead>,
                          th: ({ children }) => <th className="p-3 border-b border-slate-700 font-semibold text-slate-200">{children}</th>,
                          td: ({ children }) => <td className="p-3 border-b border-slate-700/50">{children}</td>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}

            {status && (
              <div className="flex justify-start animate-in fade-in duration-300">
                <div className="bg-slate-800/50 text-slate-400 text-xs px-3 py-1.5 rounded-full border border-slate-700 flex items-center gap-2">
                  <Loader2 size={12} className="animate-spin text-indigo-400" />
                  {status}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-10">
            <div className="bg-slate-900/90 backdrop-blur-2xl border-none rounded-[2rem] p-1.5 shadow-2xl shadow-black/80 transition-all overflow-hidden border border-slate-800/50">
              {images.length > 0 && (
                <div className="flex gap-2 p-2 mb-2 overflow-x-auto pb-3">
                  {images.map((img, i) => (
                    <div key={i} className="relative group flex-shrink-0">
                      <img src={img.preview} alt="preview" className="w-16 h-16 object-cover rounded-xl border border-slate-700" />
                      <button 
                        onClick={() => removeImage(i)}
                        className="absolute -top-1.5 -right-1.5 bg-slate-800 text-white rounded-full p-1 shadow-lg hover:bg-rose-500 transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="flex items-end gap-2">
                <div className="flex-1 min-w-0">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    placeholder="Ask Scholarly AI..."
                    className="w-full bg-transparent text-slate-100 placeholder-slate-500 py-2.5 px-3 max-h-32 resize-none text-[15px] !border-none !outline-none !ring-0 !shadow-none"
                    rows={Math.min(input.split('\n').length || 1, 5)}
                    style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                  />
                </div>
                
                <div className="flex items-center gap-1.5 pb-1 pr-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    multiple
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-full transition-all"
                    title="Upload Image"
                  >
                    <ImageIcon size={20} />
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || (!input.trim() && images.length === 0)}
                    className={`p-3 rounded-full transition-all ${
                      isLoading || (!input.trim() && images.length === 0)
                        ? 'text-slate-600 bg-slate-800'
                        : 'text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20'
                    }`}
                  >
                    <Send size={20} />
                  </button>
                </div>
              </form>
            </div>
            <p className="text-[10px] text-center text-slate-500 mt-3 hidden md:block">
              AI can make mistakes. Verify important information.
            </p>
          </div>
        </main>
      </div>
    </Layout>
  );
}

export default Chat;

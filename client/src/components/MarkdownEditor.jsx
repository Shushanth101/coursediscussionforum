import React, { useState, useEffect } from 'react';

const MarkdownEditor = ({ value, onChange, placeholder, style, onImageUpload, config }) => {
  const [isClient, setIsClient] = useState(false);
  const [MDEditor, setMDEditor] = useState(null);

  useEffect(() => {
    setIsClient(true);
    // Dynamically import to avoid server-side execution issues
    import('@uiw/react-md-editor').then((mod) => {
      setMDEditor(() => mod.default);
    });
  }, []);

  // Custom paste handler to strip unwanted HTML
  const onPaste = (event) => {
    const text = event.clipboardData.getData('text/plain');

    if (text) {
      // Basic sanitization for common HTML snippets in the text
      const cleanPaste = text.replace(/<html>[\s\S]*?<\/html>/gi, '')
                             .replace(/<body>[\s\S]*?<\/body>/gi, '')
                             .replace(/<!--[\s\S]*?-->/gi, '');
                             
      if (cleanPaste !== text) {
          event.preventDefault();
          event.stopPropagation();
          
          const textarea = event.target;
          const start = textarea.selectionStart || 0;
          const end = textarea.selectionEnd || 0;
          
          const newValue = value.substring(0, start) + cleanPaste + value.substring(end);
          onChange(newValue);
      }
    }
  };

  if (!isClient || !MDEditor) {
    return (
      <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 min-h-[500px] flex items-center justify-center">
        <div className="text-slate-500 animate-pulse text-sm">Initializing editor...</div>
      </div>
    );
  }

  return (
    <div className="markdown-editor-wrapper" onPasteCapture={onPaste} data-color-mode="dark">
      <MDEditor
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        height={style?.height || 500}
        preview="live"
        className="custom-md-editor"
        textareaProps={{
          placeholder: placeholder
        }}
      />
      <style>{`
        .markdown-editor-wrapper {
          border-radius: 0.75rem;
          overflow: hidden;
          border: 1px solid #1e293b;
          background-color: #0f172a;
        }
        .custom-md-editor {
          background-color: #020617 !important;
          color: #e2e8f0 !important;
          box-shadow: none !important;
        }
        .w-md-editor {
           box-shadow: none !important;
        }
        .w-md-editor-text {
          background-color: #020617 !important;
          color: #e2e8f0 !important;
        }
        /* Fix for scrollbars and text areas */
        .w-md-editor-text-input {
            color: #e2e8f0 !important;
            -webkit-text-fill-color: #e2e8f0 !important;
        }
        .w-md-editor-preview {
          background-color: #0f172a !important; 
          color: #f1f5f9 !important;
          border-left: 1px solid #1e293b !important;
          box-shadow: inset 1px 0 0 0 #1e293b !important;
        }
        .w-md-editor-toolbar {
          background-color: #1e293b !important;
          border-bottom: 1px solid #334155 !important;
          color: #94a3b8 !important;
        }
        .w-md-editor-toolbar button {
          color: #94a3b8 !important;
        }
        .w-md-editor-toolbar button:hover {
          color: #6366f1 !important;
          background-color: #334155 !important;
        }
        .w-md-editor-content {
          background-color: #020617 !important;
        }
        /* Markdown Preview styles override */
        .wmde-markdown {
          background-color: transparent !important;
          color: #e2e8f0 !important;
          font-family: inherit !important;
          padding: 1.5rem !important;
          line-height: 1.6;
        }
        .wmde-markdown h1, .wmde-markdown h2, .wmde-markdown h3 {
          border-bottom: 1px solid #334155 !important;
          color: #818cf8 !important;
          padding-bottom: 0.5rem;
          margin-top: 1.5rem;
        }
        .wmde-markdown p {
            margin-bottom: 1rem;
        }
        .wmde-markdown code {
          background-color: #1e293b !important;
          color: #f472b6 !important;
          padding: 0.2rem 0.4rem !important;
          border-radius: 0.25rem !important;
        }
        .wmde-markdown pre {
            background-color: #020617 !important;
            border: 1px solid #334155 !important;
            border-radius: 0.5rem !important;
        }
        .wmde-markdown blockquote {
          border-left: 4px solid #6366f1 !important;
          color: #94a3b8 !important;
          background-color: #1e293b44 !important;
          padding: 0.5rem 1rem !important;
          margin: 1rem 0;
        }
      `}</style>
    </div>
  );
};

export default MarkdownEditor;

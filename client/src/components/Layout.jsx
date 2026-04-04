import React from 'react';
import Navbar from './Navbar';

function Layout({ children, noScroll }) {
  return (
    <div className={`min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 ${noScroll ? 'h-screen overflow-hidden flex flex-col' : ''}`}>
      <Navbar />
      <main className={noScroll ? "flex-1 overflow-hidden animate-in fade-in duration-500" : "max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500"}>
        {children}
      </main>
    </div>
  );
}

export default Layout;

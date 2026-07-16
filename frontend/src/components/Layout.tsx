import React from 'react';
import { Search, FileText, BarChart2, Activity, Database, Sparkles } from 'lucide-react';
import { useMetrics } from '../hooks/useMetrics';

interface LayoutProps {
  children: React.ReactNode;
  activePage: 'search' | 'admin' | 'metrics';
  setActivePage: (page: 'search' | 'admin' | 'metrics') => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  activePage,
  setActivePage,
}) => {
  const { health } = useMetrics();
  
  const isHealthy = health?.status === 'healthy';
  const dbConnected = health?.database === 'connected';

  const menuItems = [
    { id: 'search', label: 'Q&A Assistant', icon: Search, desc: 'Query company docs' },
    { id: 'admin', label: 'Knowledge Base', icon: FileText, desc: 'Manage uploaded files' },
    { id: 'metrics', label: 'System Analytics', icon: BarChart2, desc: 'Check performance & hits' },
  ] as const;

  return (
    <div className="w-screen h-screen flex flex-row overflow-hidden text-slate-100 font-sans">
      {/* Fixed Sidebar */}
      <aside className="w-64 h-full flex-shrink-0 flex flex-col justify-between p-6 border-r border-white/[0.04] bg-slate-950/20 backdrop-blur-3xl">
        <div>
          {/* Brand Logo */}
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-heading text-base font-extrabold tracking-wider text-white leading-none">
                Guidely
              </h1>
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest block mt-1">
                Internal Copilot
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`group flex flex-col gap-0.5 px-4 py-3 rounded-xl transition-all duration-200 text-left w-full relative ${
                    isActive
                      ? 'bg-violet-600/10 text-white border-l-2 border-violet-500'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon 
                      size={18} 
                      className={`transition-colors duration-200 ${
                        isActive ? 'text-violet-400' : 'text-slate-400 group-hover:text-slate-200'
                      }`} 
                    />
                    <span className="font-heading text-sm font-semibold tracking-wide">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 pl-7 font-medium">
                    {item.desc}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Live Backend indicators */}
        <div className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.03] flex flex-col gap-3">
          {/* API indicator */}
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
            <span className="flex items-center gap-2">
              <Activity size={12} className="text-slate-500" />
              API Server
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isHealthy ? 'bg-emerald-accent animate-pulse' : 'bg-rose-accent'
                }`}
              />
              <span className={`text-[9px] tracking-wide uppercase ${isHealthy ? 'text-emerald-accent' : 'text-rose-accent'}`}>
                {isHealthy ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Database indicator */}
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
            <span className="flex items-center gap-2">
              <Database size={12} className="text-slate-500" />
              SQLite DB
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  dbConnected ? 'bg-emerald-accent animate-pulse' : 'bg-rose-accent'
                }`}
              />
              <span className={`text-[9px] tracking-wide uppercase ${dbConnected ? 'text-emerald-accent' : 'text-rose-accent'}`}>
                {dbConnected ? 'Active' : 'Error'}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content slot */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent">
        {/* Dynamic Header */}
        <header className="h-16 flex-shrink-0 flex justify-between items-center px-8 border-b border-white/[0.03] bg-slate-950/10 backdrop-blur-md">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-slate-300">
            {menuItems.find((m) => m.id === activePage)?.label}
          </h2>
          <div className="text-[10px] font-mono font-bold text-slate-500 bg-slate-900/60 border border-slate-800/40 px-2 py-0.5 rounded">
            V1.0.0
          </div>
        </header>

        {/* Scroll Port */}
        <main className="flex-1 overflow-y-auto px-8 py-6 relative">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

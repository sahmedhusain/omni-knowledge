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
    <div className="w-full h-full flex flex-row overflow-hidden text-slate-100 font-sans">
      {/* Sidebar Panel */}
      <aside className="w-64 h-full flex-shrink-0 flex flex-col justify-between p-5 border-r border-white/[0.04] bg-slate-950/30 backdrop-blur-2xl">
        <div>
          {/* Logo Brand */}
          <div className="flex items-center gap-3 mb-8 px-2 mt-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-heading text-lg font-extrabold tracking-tight text-white leading-none">
                Guidely
              </h1>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
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
                      ? 'bg-violet-600/10 text-white border-l-2 border-violet-500 shadow-inner'
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
                  <span className="text-[10px] text-slate-500 group-hover:text-slate-400 pl-7 font-medium">
                    {item.desc}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Health Indicators */}
        <div className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.03] flex flex-col gap-3">
          {/* API Indicator */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span className="flex items-center gap-2">
              <Activity size={13} className="text-slate-500" />
              API Server
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span className={`text-[10px] tracking-wide uppercase ${isHealthy ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isHealthy ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Database Indicator */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span className="flex items-center gap-2">
              <Database size={13} className="text-slate-500" />
              SQLite DB
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  dbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span className={`text-[10px] tracking-wide uppercase ${dbConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
                {dbConnected ? 'Active' : 'Error'}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent">
        {/* Top Header Bar */}
        <header className="h-16 flex-shrink-0 flex justify-between items-center px-8 border-b border-white/[0.03] bg-slate-950/10 backdrop-blur-md">
          <h2 className="font-heading text-lg font-bold tracking-tight text-white uppercase tracking-wider">
            {menuItems.find((m) => m.id === activePage)?.label}
          </h2>
          <div className="flex items-center gap-3">
            <div className="text-[10px] font-mono font-bold text-slate-500 bg-slate-900/60 border border-slate-800/40 px-2 py-0.5 rounded">
              v1.0.0
            </div>
          </div>
        </header>

        {/* Dynamic Scroll View */}
        <main className="flex-1 overflow-y-auto px-8 py-6 relative">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

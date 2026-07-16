import React from 'react';
import { Search, FileText, BarChart2, Activity, Database } from 'lucide-react';
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
    { id: 'search', label: 'Q&A Assistant', icon: Search },
    { id: 'admin', label: 'Document Manager', icon: FileText },
    { id: 'metrics', label: 'Analytics Panel', icon: BarChart2 },
  ] as const;

  return (
    <div className="grid-cols-layout min-h-screen text-slate-100">
      {/* Sidebar Panel */}
      <aside className="glass-panel border-r border-slate-800 m-4 flex flex-col justify-between p-6">
        <div>
          {/* Logo / Header */}
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <span className="text-white font-bold text-lg font-heading">G</span>
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold tracking-tight text-white m-0 leading-none">
                Guidely
              </h1>
              <span className="text-xs text-slate-500 font-medium">Knowledge Hub</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl font-heading text-sm font-semibold transition-all duration-200 text-left w-full ${
                    isActive
                      ? 'bg-violet-600/25 text-white border-l-4 border-violet-500'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-violet-400' : ''} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* System Health Indicators */}
        <div className="pt-6 border-t border-slate-800/60 flex flex-col gap-3 px-2">
          {/* API Health */}
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-2">
              <Activity size={13} className="text-slate-500" />
              API Server
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                }`}
              />
              <span className={isHealthy ? 'text-emerald-400' : 'text-red-400'}>
                {isHealthy ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Database Health */}
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
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
              <span className={dbConnected ? 'text-emerald-400' : 'text-rose-400'}>
                {dbConnected ? 'Connected' : 'Error'}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex flex-col p-6 overflow-y-auto max-h-screen">
        <header className="flex justify-between items-center mb-6">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-white">
            {menuItems.find((m) => m.id === activePage)?.label}
          </h2>
          <div className="text-xs font-mono text-slate-500">
            v1.0.0
          </div>
        </header>
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;

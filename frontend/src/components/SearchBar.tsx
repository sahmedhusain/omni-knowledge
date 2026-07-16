import React, { useState } from 'react';
import { Search, Loader2, Sparkles, History } from 'lucide-react';
import GlassCard from './GlassCard';

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading: boolean;
  history: string[];
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  loading,
  history,
}) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !loading) {
      onSearch(query.trim());
    }
  };

  const selectShortcut = (q: string) => {
    setQuery(q);
    onSearch(q);
  };

  const suggestions = [
    'What are the core collaboration hours?',
    'What is the daily reimbursement limit for meals?',
    'Steps to configure the developer environment',
  ];

  return (
    <div className="flex flex-col gap-4 animate-fade-in text-left">
      <GlassCard className="p-4 border-white/[0.04] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-violet-accent/20 to-transparent" />
        
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question about Gem policies, onboarding, tools..."
              className="w-full bg-slate-950/50 border border-white/[0.05] text-white placeholder-slate-500 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-violet-accent/80 focus:ring-1 focus:ring-violet-accent/40 transition-all duration-200 text-sm font-semibold"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-gradient-to-r from-violet-accent to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-none rounded-xl h-11 px-5 flex items-center justify-center gap-2 text-xs uppercase tracking-wider font-extrabold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-200"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin text-white" />
            ) : (
              <>
                <Sparkles size={13} />
                Ask Copilot
              </>
            )}
          </button>
        </form>
      </GlassCard>

      {/* Suggested Questions */}
      {history.length === 0 && (
        <div className="px-1">
          <p className="text-[10px] font-bold text-slate-500 mb-2 tracking-wider uppercase flex items-center gap-1.5">
            <Sparkles size={11} className="text-violet-accent" />
            Suggested Questions
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => selectShortcut(s)}
                className="text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-white/[0.01] border border-white/[0.03] hover:border-violet-accent/30 hover:bg-violet-accent/[0.02] text-slate-400 hover:text-violet-200 transition-all duration-150 text-left"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Query History */}
      {history.length > 0 && (
        <div className="px-1">
          <p className="text-[10px] font-bold text-slate-500 mb-2 tracking-wider uppercase flex items-center gap-1.5">
            <History size={11} className="text-slate-500" />
            Recent Queries
          </p>
          <div className="flex flex-wrap gap-2">
            {history.slice(0, 4).map((h) => (
              <button
                key={h}
                onClick={() => selectShortcut(h)}
                className="text-xs font-semibold px-3 py-2 rounded-lg bg-white/[0.01] border border-white/[0.02] hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all duration-150 text-left truncate max-w-xs"
              >
                {h}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;

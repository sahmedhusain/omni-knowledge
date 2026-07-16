import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
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
    'What are the core hours?',
    'Meals reimbursement limits',
    'How do I setup developer environment?',
  ];

  return (
    <div className="flex flex-col gap-4">
      <GlassCard className="p-4">
        <form onSubmit={handleSubmit} className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about Guidely policies, guidelines, onboarding..."
              className="w-full bg-slate-950/40 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-violet-500 focus:shadow-md focus:shadow-violet-500/10 transition-all duration-200"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="btn-primary flex items-center justify-center gap-2 h-12 px-6 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              'Submit'
            )}
          </button>
        </form>
      </GlassCard>

      {/* Suggested / Common Questions */}
      {history.length === 0 && (
        <div className="px-2">
          <p className="text-xs font-semibold text-slate-500 mb-2 tracking-wider uppercase">
            Suggested Queries
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => selectShortcut(s)}
                className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all duration-150"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search History Shortcuts */}
      {history.length > 0 && (
        <div className="px-2">
          <p className="text-xs font-semibold text-slate-500 mb-2 tracking-wider uppercase">
            Recent Questions
          </p>
          <div className="flex flex-wrap gap-2">
            {history.slice(0, 5).map((h) => (
              <button
                key={h}
                onClick={() => selectShortcut(h)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900/40 border border-slate-800/60 text-slate-400 hover:text-white hover:border-slate-700 transition-all duration-150"
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

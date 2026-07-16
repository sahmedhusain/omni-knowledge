import React from 'react';
import useSearch from '../hooks/useSearch';
import SearchBar from '../components/SearchBar';
import AnswerDisplay from '../components/AnswerDisplay';
import { HelpCircle, AlertCircle, Loader2 } from 'lucide-react';
import GlassCard from '../components/GlassCard';

export const SearchPage: React.FC = () => {
  const { response, loading, error, history, askQuestion } = useSearch();

  return (
    <div className="flex flex-col gap-6">
      {/* Search Input Area */}
      <SearchBar onSearch={askQuestion} loading={loading} history={history} />

      {/* Main Q&A Display Area */}
      {loading && !response && (
        <GlassCard className="p-12 flex flex-col items-center justify-center border-slate-800/80">
          <Loader2 size={36} className="animate-spin text-violet-400 mb-4" />
          <p className="font-heading font-bold text-slate-300">Searching vector index...</p>
          <p className="text-xs text-slate-500 font-semibold mt-1">Consulting language model context</p>
        </GlassCard>
      )}

      {error && (
        <GlassCard className="p-5 flex items-center gap-3 bg-rose-500/10 border-rose-500/20 text-rose-300 text-sm font-semibold">
          <AlertCircle size={18} className="flex-shrink-0" />
          {error}
        </GlassCard>
      )}

      {!loading && !response && !error && (
        <GlassCard className="p-12 text-center text-slate-500 border-slate-800/80 flex flex-col items-center">
          <HelpCircle size={40} className="text-slate-700 mb-2" />
          <h3 className="font-heading font-bold text-slate-300 text-sm uppercase tracking-wider">
            Ready to help
          </h3>
          <p className="text-xs text-slate-500 font-semibold mt-1 leading-normal max-w-sm">
            Ask any question to retrieve semantic context from uploaded documents, policies, or developer guides.
          </p>
        </GlassCard>
      )}

      {response && (
        <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
          <AnswerDisplay response={response} />
        </div>
      )}
    </div>
  );
};

export default SearchPage;

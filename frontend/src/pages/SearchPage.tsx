import React from 'react';
import useSearch from '../hooks/useSearch';
import SearchBar from '../components/SearchBar';
import AnswerDisplay from '../components/AnswerDisplay';
import { HelpCircle, AlertCircle, Loader2 } from 'lucide-react';
import GlassCard from '../components/GlassCard';

export const SearchPage: React.FC = () => {
  const { response, loading, error, history, askQuestion } = useSearch();

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      {/* Search Bar Input */}
      <SearchBar onSearch={askQuestion} loading={loading} history={history} />

      {/* Loading Block View */}
      {loading && !response && (
        <GlassCard className="p-16 flex flex-col items-center justify-center border-white/[0.04] bg-white/[0.01]">
          <Loader2 size={36} className="animate-spin text-violet-accent mb-4" />
          <p className="font-heading font-extrabold text-sm text-slate-300 uppercase tracking-wider">
            Querying Indexed Vectors
          </p>
          <p className="text-xs text-slate-500 font-bold mt-1">
            Retrieving documents and waiting for LLM response...
          </p>
        </GlassCard>
      )}

      {/* Error alert view */}
      {error && (
        <GlassCard className="p-5 flex items-center gap-3 bg-rose-500/10 border-rose-500/20 text-rose-300 text-xs font-semibold">
          <AlertCircle size={18} className="flex-shrink-0" />
          {error}
        </GlassCard>
      )}

      {/* Default Ready State info view */}
      {!loading && !response && !error && (
        <GlassCard className="p-16 text-center text-slate-500 border-white/[0.04] bg-white/[0.01] flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-slate-900 border border-white/[0.04] flex items-center justify-center mb-4">
            <HelpCircle size={22} className="text-slate-500" />
          </div>
          <h3 className="font-heading font-extrabold text-slate-300 text-xs uppercase tracking-wider">
            Ready to Help
          </h3>
          <p className="text-xs text-slate-500 font-bold mt-1.5 leading-relaxed max-w-xs">
            Ask any question to retrieve semantic context from uploaded documents, policies, or developer guides.
          </p>
        </GlassCard>
      )}

      {/* Answer View */}
      {response && (
        <div className={loading ? 'opacity-40 pointer-events-none' : ''}>
          <AnswerDisplay response={response} />
        </div>
      )}
    </div>
  );
};

export default SearchPage;

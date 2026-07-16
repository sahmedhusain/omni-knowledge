import React from 'react';
import useSearch from '../hooks/useSearch';
import SearchBar from '../components/SearchBar';
import AnswerDisplay from '../components/AnswerDisplay';
import { HelpCircle, AlertCircle, Loader2, RotateCcw } from 'lucide-react';
import GlassCard from '../components/GlassCard';

export const SearchPage: React.FC = () => {
  const { response, loading, error, history, chatLog, askQuestion, clearChat } = useSearch();

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto text-left">
      {/* Search Input Box */}
      <SearchBar onSearch={askQuestion} loading={loading} history={history} />

      {/* Conversation Thread */}
      {chatLog.length > 0 && (
        <div className="flex flex-col gap-3.5 mt-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Conversation History
            </span>
            <button
              onClick={clearChat}
              className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-rose-accent bg-transparent border-none cursor-pointer"
            >
              <RotateCcw size={11} />
              Reset Thread
            </button>
          </div>
          
          <div className="flex flex-col gap-3">
            {chatLog.map((msg, i) => {
              if (msg.role === 'user') {
                return (
                  <div key={i} className="flex justify-end animate-fade-in">
                    <div className="bg-violet-accent/15 border border-violet-accent/30 text-slate-100 rounded-2xl px-4 py-2.5 max-w-md text-xs font-bold font-heading">
                      {msg.content}
                    </div>
                  </div>
                );
              } else {
                // Skip the latest assistant response bubble because it will be rendered as a full citation display below
                const isLatest = i === chatLog.length - 1;
                if (isLatest && response) return null;
                
                return (
                  <div key={i} className="flex justify-start animate-fade-in">
                    <GlassCard className="p-4 border-white/[0.03] bg-white/[0.005] max-w-xl text-xs font-semibold leading-relaxed text-slate-300">
                      {msg.content}
                    </GlassCard>
                  </div>
                );
              }
            })}
          </div>
        </div>
      )}

      {/* Loading State view */}
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
        <GlassCard className="p-4 flex items-center gap-3 bg-rose-500/10 border-rose-500/20 text-rose-300 text-xs font-semibold">
          <AlertCircle size={16} className="flex-shrink-0" />
          {error}
        </GlassCard>
      )}

      {/* Default Ready View */}
      {chatLog.length === 0 && !loading && !response && !error && (
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

      {/* Current/Latest Detailed response Display */}
      {response && (
        <div className={loading ? 'opacity-40 pointer-events-none' : ''}>
          <AnswerDisplay response={response} />
        </div>
      )}
    </div>
  );
};

export default SearchPage;

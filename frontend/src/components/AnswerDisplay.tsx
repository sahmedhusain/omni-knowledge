import { useState } from 'react';
import type { SearchResponse } from '../types/api';
import { Zap, Clock, FileText, CheckCircle2, ChevronRight } from 'lucide-react';
import GlassCard from './GlassCard';

interface AnswerDisplayProps {
  response: SearchResponse;
}

export const AnswerDisplay: React.FC<AnswerDisplayProps> = ({ response }) => {
  const [selectedSource, setSelectedSource] = useState<number | null>(null);

  const { answer, sources, latency_ms, cache_hit } = response;

  // Format citations inside answer string
  // Matches [1], [2], etc., and wraps them in inline highlights
  const renderFormattedAnswer = (text: string) => {
    const parts = text.split(/(\[\d+\])/g);
    return parts.map((part, i) => {
      const match = part.match(/^\[(\d+)\]$/);
      if (match) {
        const sourceIndex = parseInt(match[1], 10) - 1;
        const exists = sourceIndex >= 0 && sourceIndex < sources.length;
        return (
          <button
            key={i}
            onClick={() => exists && setSelectedSource(sourceIndex)}
            className={`mx-0.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded bg-violet-600/30 border border-violet-500/50 hover:bg-violet-600 hover:border-violet-400 hover:text-white text-violet-300 align-super transition-all duration-150 ${
              selectedSource === sourceIndex ? 'ring-2 ring-violet-400 bg-violet-600 text-white' : ''
            }`}
            title={exists ? `Source: ${sources[sourceIndex].filename}` : 'Source'}
          >
            {match[1]}
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Answer Panel */}
      <GlassCard className="p-6 relative overflow-hidden border border-slate-800/80">
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 blur-[100px] pointer-events-none" />

        {/* Title */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800/50">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-violet-400" />
            <span className="font-heading font-bold text-sm tracking-wide uppercase text-slate-300">
              Guidely Assistant Answer
            </span>
          </div>
          
          {/* Latency and Cache Badges */}
          <div className="flex items-center gap-3 text-xs font-semibold">
            {cache_hit && (
              <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/25">
                <Zap size={11} />
                Cached Vector
              </span>
            )}
            <span className="flex items-center gap-1 text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-full border border-slate-700/50">
              <Clock size={11} />
              {(latency_ms / 1000).toFixed(2)}s
            </span>
          </div>
        </div>

        {/* Text Answer */}
        <div className="text-slate-100 font-medium leading-relaxed text-left whitespace-pre-line text-sm md:text-base">
          {renderFormattedAnswer(answer)}
        </div>
      </GlassCard>

      {/* Citations and Sources Panel */}
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-3 tracking-wider uppercase px-1">
          Source Citations
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sources.map((src, idx) => {
            const isSelected = selectedSource === idx;
            return (
              <GlassCard
                key={idx}
                onClick={() => setSelectedSource(isSelected ? null : idx)}
                className={`p-4 transition-all duration-300 text-left border relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'border-violet-500/70 bg-violet-950/20 shadow-lg shadow-violet-500/5 ring-1 ring-violet-500/30'
                    : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 uppercase tracking-wide">
                      Source [{idx + 1}]
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Score: {src.score.toFixed(3)}
                    </span>
                  </div>
                  <h4 className="font-heading font-bold text-sm text-slate-200 mb-1 flex items-center gap-1.5 truncate">
                    <FileText size={14} className="text-violet-400 flex-shrink-0" />
                    {src.filename}
                  </h4>
                  {src.tag && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-600/10 text-violet-400 border border-violet-500/10 uppercase tracking-wider">
                      {src.tag}
                    </span>
                  )}
                </div>
                
                <div className="mt-4 flex items-center justify-between text-xs font-semibold text-violet-400 hover:text-violet-300">
                  <span>View text segment</span>
                  <ChevronRight size={14} className={`transform transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                </div>

                {/* Expanded Snippet */}
                {isSelected && (
                  <div className="col-span-full mt-4 pt-3 border-t border-violet-500/20 w-full animate-fadeIn">
                    <p className="text-xs font-mono text-slate-400 bg-slate-950/60 p-3 rounded-lg border border-slate-900 leading-normal max-h-40 overflow-y-auto">
                      {src.content}
                    </p>
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AnswerDisplay;

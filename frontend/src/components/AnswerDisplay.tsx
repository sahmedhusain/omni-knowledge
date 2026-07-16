import { useState } from 'react';
import type { SearchResponse } from '../types/api';
import { Zap, Clock, FileText, CheckCircle2, ChevronDown } from 'lucide-react';
import GlassCard from './GlassCard';

interface AnswerDisplayProps {
  response: SearchResponse;
}

export const AnswerDisplay: React.FC<AnswerDisplayProps> = ({ response }) => {
  const [selectedSource, setSelectedSource] = useState<number | null>(null);

  const { answer, sources, latency_ms, cache_hit } = response;

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
            className={`mx-0.5 inline-flex items-center justify-center w-5 h-5 text-[9px] font-bold rounded-md transition-all duration-150 align-baseline cursor-pointer ${
              selectedSource === sourceIndex 
                ? 'bg-violet-accent text-white shadow-lg shadow-violet-500/20' 
                : 'bg-white/[0.03] border border-white/[0.06] text-violet-accent hover:bg-violet-accent hover:text-white'
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
    <div className="flex flex-col gap-5 animate-fade-in text-left">
      {/* Answer Block */}
      <GlassCard className="p-6 relative border-white/[0.04] shadow-2xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-violet-accent/5 to-cyan-accent/5 blur-[80px] pointer-events-none" />
        
        {/* Metric metadata bar */}
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-white/[0.03]">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-violet-400" />
            <span className="font-heading font-extrabold text-xs uppercase tracking-wider text-slate-300">
              Guidely Copilot Response
            </span>
          </div>
          
          <div className="flex items-center gap-2.5 text-[10px] font-bold">
            {cache_hit && (
              <span className="flex items-center gap-1 text-emerald-accent bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/10 uppercase tracking-wide">
                <Zap size={10} />
                Cached Vector
              </span>
            )}
            <span className="flex items-center gap-1 text-slate-400 bg-slate-900 border border-slate-800/80 px-2 py-0.5 rounded">
              <Clock size={10} />
              {(latency_ms / 1000).toFixed(2)}s Latency
            </span>
          </div>
        </div>

        {/* Formatted Answer Body */}
        <div className="text-slate-100 font-medium leading-relaxed text-[15px] whitespace-pre-line tracking-wide">
          {renderFormattedAnswer(answer)}
        </div>
      </GlassCard>

      {/* Citations Grid */}
      <div>
        <p className="text-[10px] font-bold text-slate-500 mb-3.5 tracking-wider uppercase px-1">
          Source Documents Referenced
        </p>
        
        <div className="grid grid-cols-1 gap-3.5">
          {sources.map((src, idx) => {
            const isSelected = selectedSource === idx;
            return (
              <GlassCard
                key={idx}
                onClick={() => setSelectedSource(isSelected ? null : idx)}
                className={`p-4 transition-all duration-300 border flex flex-col gap-3 relative overflow-hidden ${
                  isSelected
                    ? 'border-violet-accent/50 bg-violet-accent/[0.02] shadow-lg shadow-violet-500/5'
                    : 'border-white/[0.04] hover:border-white/[0.08]'
                }`}
              >
                <div className="flex flex-row justify-between items-center w-full">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black font-heading border transition-colors ${
                      isSelected 
                        ? 'bg-violet-accent border-violet-400 text-white' 
                        : 'bg-white/[0.02] border-white/[0.06] text-slate-400'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="font-heading font-extrabold text-sm text-slate-200 flex items-center gap-2">
                        <FileText size={14} className="text-violet-400" />
                        {src.filename}
                      </h4>
                      {src.tag && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-accent/10 text-violet-400 border border-violet-500/10 uppercase tracking-wide inline-block mt-0.5">
                          {src.tag}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-mono text-slate-500 font-bold">
                      Relevance L2: {src.score.toFixed(3)}
                    </span>
                    <ChevronDown size={16} className={`text-slate-400 transform transition-transform duration-200 ${isSelected ? 'rotate-180 text-violet-400' : ''}`} />
                  </div>
                </div>

                {/* Snippet expand with slide down effect */}
                {isSelected && (
                  <div className="mt-2 pt-3.5 border-t border-white/[0.03] w-full animate-fade-in">
                    <p className="text-xs font-mono font-medium text-slate-300 bg-slate-950/80 p-4 rounded-xl border border-white/[0.02] leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-56 overflow-y-auto">
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

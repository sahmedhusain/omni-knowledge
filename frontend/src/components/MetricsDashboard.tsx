import React from 'react';
import type { SystemMetrics } from '../types/api';
import { Database, FileText, Activity, AlertOctagon, Award, Clock, CheckCircle } from 'lucide-react';
import GlassCard from './GlassCard';

interface MetricsDashboardProps {
  metrics: SystemMetrics;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ metrics }) => {
  const { counts, latency, query_cache, embedding_cache, failures, indexing } = metrics;

  const getDonutStyle = (rate: number) => {
    const circ = 226.2;
    const offset = circ - (rate * circ);
    return {
      strokeDasharray: `${circ}`,
      strokeDashoffset: `${offset}`,
      transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
    };
  };

  const getHealthGrade = (latencyMs: number, cacheRate: number) => {
    if (latencyMs < 1200 && cacheRate > 0.85) return { grade: 'A+', color: 'text-violet-accent' };
    if (latencyMs < 2000 && cacheRate > 0.70) return { grade: 'A', color: 'text-emerald-accent' };
    if (latencyMs < 3000 && cacheRate > 0.50) return { grade: 'B', color: 'text-amber-500' };
    return { grade: 'C', color: 'text-rose-accent' };
  };

  const status = getHealthGrade(latency.median_ms, embedding_cache.hit_rate);

  return (
    <div className="flex flex-col gap-6 text-left animate-fade-in w-full max-w-4xl mx-auto">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Core grade */}
        <GlassCard className="p-5 flex items-center justify-between border-white/[0.04] bg-white/[0.01]">
          <div>
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">
              Performance Grade
            </span>
            <h3 className={`font-heading text-4xl font-black mt-1 ${status.color}`}>
              {status.grade}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-violet-accent/5 border border-violet-accent/10 flex items-center justify-center">
            <Award size={20} className="text-violet-accent" />
          </div>
        </GlassCard>

        {/* Total Documents */}
        <GlassCard className="p-5 flex items-center justify-between border-white/[0.04] bg-white/[0.01]">
          <div>
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">
              Indexed Documents
            </span>
            <h3 className="font-heading text-4xl font-bold text-slate-200 mt-1">
              {counts.docs}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-900 border border-white/[0.04] flex items-center justify-center">
            <FileText size={20} className="text-slate-400" />
          </div>
        </GlassCard>

        {/* Vector segments */}
        <GlassCard className="p-5 flex items-center justify-between border-white/[0.04] bg-white/[0.01]">
          <div>
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">
              Vector Segments
            </span>
            <h3 className="font-heading text-4xl font-bold text-slate-200 mt-1">
              {counts.chunks}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-900 border border-white/[0.04] flex items-center justify-center">
            <Database size={20} className="text-slate-400" />
          </div>
        </GlassCard>

        {/* Total queries served */}
        <GlassCard className="p-5 flex items-center justify-between border-white/[0.04] bg-white/[0.01]">
          <div>
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">
              Queries Served
            </span>
            <h3 className="font-heading text-4xl font-bold text-slate-200 mt-1">
              {counts.queries}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-900 border border-white/[0.04] flex items-center justify-center">
            <Activity size={20} className="text-slate-400" />
          </div>
        </GlassCard>
      </div>

      {/* Latency and Caches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latency stats */}
        <GlassCard className="p-6 border-white/[0.04] bg-white/[0.01]">
          <h3 className="font-heading font-extrabold text-xs text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
            <Clock size={14} className="text-violet-accent" />
            Query Response Latency
          </h3>
          
          <div className="flex flex-col gap-5">
            {/* Median Latency */}
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-semibold text-slate-400">Median (50th percentile)</span>
                <span className="text-sm font-mono font-bold text-violet-accent">
                  {latency.median_ms.toFixed(0)} ms
                </span>
              </div>
              <div className="w-full bg-slate-950/80 h-2 rounded-full overflow-hidden border border-white/[0.03] p-[1px]">
                <div 
                  className="bg-gradient-to-r from-violet-accent to-indigo-500 h-full rounded-full"
                  style={{ width: `${Math.min((latency.median_ms / 3000) * 100, 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500 font-bold block mt-1">Target Limit: &lt; 3.0s</span>
            </div>

            {/* P95 Latency */}
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-semibold text-slate-400">P95 (95th percentile)</span>
                <span className="text-sm font-mono font-bold text-cyan-accent">
                  {latency.p95_ms.toFixed(0)} ms
                </span>
              </div>
              <div className="w-full bg-slate-950/80 h-2 rounded-full overflow-hidden border border-white/[0.03] p-[1px]">
                <div 
                  className="bg-gradient-to-r from-cyan-accent to-teal-500 h-full rounded-full"
                  style={{ width: `${Math.min((latency.p95_ms / 5000) * 100, 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500 font-bold block mt-1">Target Limit: &lt; 5.0s</span>
            </div>
            
            {/* Indexing average throughput */}
            <div className="pt-4 border-t border-white/[0.03] mt-2 flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-400">Average Indexing Run Duration</span>
              <span className="font-mono text-slate-200">{indexing.avg_duration_ms.toFixed(0)} ms</span>
            </div>
          </div>
        </GlassCard>

        {/* Circular Gauges */}
        <GlassCard className="p-6 border-white/[0.04] bg-white/[0.01] lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
          {/* Query Cache */}
          <div className="flex flex-col items-center text-center">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4">
              Query Cache Hit Rate
            </h4>
            
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="36" fill="transparent" stroke="rgba(255,255,255,0.02)" strokeWidth="6" />
                <circle 
                  cx="56" 
                  cy="56" 
                  r="36" 
                  fill="transparent" 
                  stroke="url(#purpleGlow)" 
                  strokeWidth="6"
                  strokeLinecap="round"
                  style={getDonutStyle(query_cache.hit_rate)}
                />
                <defs>
                  <linearGradient id="purpleGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="font-heading font-black text-2xl text-slate-200">
                  {(query_cache.hit_rate * 100).toFixed(0)}%
                </span>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                  Hit Rate
                </span>
              </div>
            </div>
            
            <span className="text-[10px] text-slate-400 mt-4 font-bold">
              {query_cache.hits} Hits / {query_cache.hits + query_cache.misses} Queries
            </span>
          </div>

          {/* Embedding Cache */}
          <div className="flex flex-col items-center text-center">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4">
              Embedding Cache Hit Rate
            </h4>
            
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="36" fill="transparent" stroke="rgba(255,255,255,0.02)" strokeWidth="6" />
                <circle 
                  cx="56" 
                  cy="56" 
                  r="36" 
                  fill="transparent" 
                  stroke="url(#cyanGlow)" 
                  strokeWidth="6"
                  strokeLinecap="round"
                  style={getDonutStyle(embedding_cache.hit_rate)}
                />
                <defs>
                  <linearGradient id="cyanGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="font-heading font-black text-2xl text-slate-200">
                  {(embedding_cache.hit_rate * 100).toFixed(0)}%
                </span>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                  Hit Rate
                </span>
              </div>
            </div>
            
            <span className="text-[10px] text-slate-400 mt-4 font-bold">
              {embedding_cache.hits} Hits / {embedding_cache.hits + embedding_cache.misses} API Calls
            </span>
          </div>
        </GlassCard>
      </div>

      {/* Pipeline Exceptions Logs */}
      <GlassCard className="p-6 border-white/[0.04] bg-white/[0.01]">
        <h3 className="font-heading font-bold text-xs text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <AlertOctagon size={14} className="text-slate-500" />
          Active Exceptions Logs ({failures.total})
        </h3>
        
        {failures.total === 0 ? (
          <div className="py-6 text-center text-slate-600 flex flex-col items-center">
            <CheckCircle size={32} className="text-emerald-accent/20 mb-2" />
            <p className="font-heading font-extrabold text-xs text-slate-400 uppercase tracking-wider">0 Errors Logged</p>
            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">System operations functioning normally.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {Object.entries(failures.by_type).map(([type, count]) => (
              <div 
                key={type}
                className="flex justify-between items-center bg-slate-950/40 border border-white/[0.03] p-3.5 rounded-xl text-xs font-semibold text-slate-300"
              >
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-rose-accent animate-pulse" />
                  <span className="font-mono text-slate-200">{type}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-accent border border-rose-500/10 text-[9px] font-bold uppercase tracking-wider">
                  {count} errors
                </span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default MetricsDashboard;

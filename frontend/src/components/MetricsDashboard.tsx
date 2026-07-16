import React from 'react';
import { SystemMetrics } from '../types/api';
import { Database, FileText, Activity, AlertOctagon, Award, CheckCircle } from 'lucide-react';
import GlassCard from './GlassCard';

interface MetricsDashboardProps {
  metrics: SystemMetrics;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ metrics }) => {
  const { counts, latency, query_cache, embedding_cache, failures, indexing } = metrics;

  // Donut chart path setup (r=36, circumference=226.2)
  const getDonutStyle = (rate: number) => {
    const circ = 226.2;
    const offset = circ - (rate * circ);
    return {
      strokeDasharray: `${circ}`,
      strokeDashoffset: `${offset}`,
      transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
    };
  };

  const getMetricGrade = (latencyMs: number, cacheRate: number) => {
    if (latencyMs < 1000 && cacheRate > 0.9) return { grade: 'A+', color: 'text-violet-400' };
    if (latencyMs < 2000 && cacheRate > 0.7) return { grade: 'A', color: 'text-emerald-400' };
    if (latencyMs < 3000 && cacheRate > 0.5) return { grade: 'B', color: 'text-amber-400' };
    return { grade: 'C', color: 'text-rose-400' };
  };

  const performance = getMetricGrade(latency.median_ms, embedding_cache.hit_rate);

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Grade Card */}
        <GlassCard className="p-5 flex items-center justify-between border-slate-800">
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              System Health Grade
            </span>
            <h3 className={`font-heading text-4xl font-black mt-1 ${performance.color}`}>
              {performance.grade}
            </h3>
          </div>
          <Award size={36} className="text-slate-600/40" />
        </GlassCard>

        {/* Total Documents */}
        <GlassCard className="p-5 flex items-center justify-between border-slate-800">
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              Indexed Documents
            </span>
            <h3 className="font-heading text-4xl font-bold text-slate-200 mt-1">
              {counts.docs}
            </h3>
          </div>
          <FileText size={36} className="text-slate-600/40" />
        </GlassCard>

        {/* Total Chunks */}
        <GlassCard className="p-5 flex items-center justify-between border-slate-800">
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              Vector Segments
            </span>
            <h3 className="font-heading text-4xl font-bold text-slate-200 mt-1">
              {counts.chunks}
            </h3>
          </div>
          <Database size={36} className="text-slate-600/40" />
        </GlassCard>

        {/* Queries Served */}
        <GlassCard className="p-5 flex items-center justify-between border-slate-800">
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              Queries Served
            </span>
            <h3 className="font-heading text-4xl font-bold text-slate-200 mt-1">
              {counts.queries}
            </h3>
          </div>
          <Activity size={36} className="text-slate-600/40" />
        </GlassCard>
      </div>

      {/* Latency and Cache Hit Rates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Latency Metrics Card */}
        <GlassCard className="p-6 border-slate-800">
          <h3 className="font-heading font-bold text-sm text-slate-300 uppercase tracking-wider mb-5">
            Query Latency Distribution
          </h3>
          
          <div className="flex flex-col gap-5">
            {/* Median Latency */}
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-semibold text-slate-400">Median (50th percentile)</span>
                <span className="text-sm font-mono font-bold text-violet-400">
                  {latency.median_ms.toFixed(0)} ms
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                {/* Target is 3000ms. If lower than target, render full width, else scaled */}
                <div 
                  className="bg-gradient-to-r from-violet-500 to-violet-600 h-full rounded-full"
                  style={{ width: `${Math.min((latency.median_ms / 3000) * 100, 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500 font-medium">Target: &lt; 3.0s warm cache</span>
            </div>

            {/* P95 Latency */}
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-semibold text-slate-400">P95 (95th percentile)</span>
                <span className="text-sm font-mono font-bold text-cyan-400">
                  {latency.p95_ms.toFixed(0)} ms
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-cyan-600 h-full rounded-full"
                  style={{ width: `${Math.min((latency.p95_ms / 5000) * 100, 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500 font-medium">Target: &lt; 5.0s tail limit</span>
            </div>
            
            {/* Indexing Throughput Average */}
            <div className="pt-4 border-t border-slate-800/60 mt-2 flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-400">Average Indexing Run Duration</span>
              <span className="font-mono text-slate-200">{indexing.avg_duration_ms.toFixed(0)} ms</span>
            </div>
          </div>
        </GlassCard>

        {/* Circular Gauges for Caches */}
        <GlassCard className="p-6 border-slate-800 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Query Cache Hit */}
          <div className="flex flex-col items-center text-center">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Query Cache Hits
            </h4>
            
            {/* SVG circle */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="36" fill="transparent" stroke="#1f2028" strokeWidth="8" />
                <circle 
                  cx="56" 
                  cy="56" 
                  r="36" 
                  fill="transparent" 
                  stroke="url(#purpleGlow)" 
                  strokeWidth="8"
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
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                  Hit Rate
                </span>
              </div>
            </div>
            
            <span className="text-[10px] text-slate-400 mt-3 font-semibold">
              {query_cache.hits} Hits / {query_cache.hits + query_cache.misses} Total Requests
            </span>
          </div>

          {/* Embedding Cache Hit */}
          <div className="flex flex-col items-center text-center">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Embedding Cache Hits
            </h4>
            
            {/* SVG circle */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="36" fill="transparent" stroke="#1f2028" strokeWidth="8" />
                <circle 
                  cx="56" 
                  cy="56" 
                  r="36" 
                  fill="transparent" 
                  stroke="url(#cyanGlow)" 
                  strokeWidth="8"
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
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                  Hit Rate
                </span>
              </div>
            </div>
            
            <span className="text-[10px] text-slate-400 mt-3 font-semibold">
              {embedding_cache.hits} Hits / {embedding_cache.hits + embedding_cache.misses} API Calls
            </span>
          </div>
        </GlassCard>
      </div>

      {/* Failures and Error log metrics */}
      <GlassCard className="p-6 border-slate-800">
        <h3 className="font-heading font-bold text-sm text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
          <AlertOctagon size={16} className="text-slate-500" />
          Pipeline Failures Log ({failures.total})
        </h3>
        
        {failures.total === 0 ? (
          <div className="py-6 text-center text-slate-500 flex flex-col items-center">
            <CheckCircle size={32} className="text-emerald-500/40 mb-2" />
            <p className="font-semibold text-sm">System functioning normally.</p>
            <p className="text-xs mt-0.5">No API errors, missing keys, or timeouts logged in the session.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {Object.entries(failures.by_type).map(([errType, count]) => (
              <div 
                key={errType}
                className="flex justify-between items-center bg-slate-900/35 border border-slate-800/80 p-3.5 rounded-xl text-xs font-semibold text-slate-300"
              >
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="font-mono text-slate-200">{errType}</span>
                </div>
                <span className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/10">
                  {count} occurrences
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

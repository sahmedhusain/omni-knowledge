import React from 'react';
import { useMetrics } from '../hooks/useMetrics';
import MetricsDashboard from '../components/MetricsDashboard';
import { RefreshCw, Activity, Loader2, Download } from 'lucide-react';
import GlassCard from '../components/GlassCard';

export const MetricsPage: React.FC = () => {
  const { metrics, loading, refreshMetrics } = useMetrics();

  const handleExport = () => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    window.open(`${apiBase}/metrics/export/csv`, '_blank');
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      {/* Metrics Header controls */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center bg-slate-900/10 p-4 rounded-2xl border border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <Activity size={18} className="text-violet-400" />
          <span className="font-heading font-bold text-sm text-slate-200 uppercase tracking-wider">
            Operational KPIs Dashboard
          </span>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="bg-slate-900 border border-white/[0.04] hover:bg-slate-800 text-slate-200 rounded-xl h-9 px-4 flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer transition-colors"
          >
            <Download size={13} />
            Export Logs (CSV)
          </button>
          
          <button
            onClick={refreshMetrics}
            disabled={loading}
            className="bg-slate-900 border border-white/[0.04] hover:bg-slate-800 text-slate-200 rounded-xl h-9 px-4 flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <RefreshCw size={13} />
            )}
            Refresh Logs
          </button>
        </div>
      </div>

      {loading && !metrics && (
        <GlassCard className="p-12 flex flex-col items-center justify-center border-slate-800/80">
          <Loader2 size={36} className="animate-spin text-violet-400 mb-4" />
          <p className="font-heading font-bold text-slate-300">Compiling database transactions...</p>
        </GlassCard>
      )}

      {metrics && <MetricsDashboard metrics={metrics} />}
    </div>
  );
};

export default MetricsPage;

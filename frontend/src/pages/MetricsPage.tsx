import React from 'react';
import { useMetrics } from '../hooks/useMetrics';
import MetricsDashboard from '../components/MetricsDashboard';
import { RefreshCw, Activity, Loader2 } from 'lucide-react';
import GlassCard from '../components/GlassCard';

export const MetricsPage: React.FC = () => {
  const { metrics, loading, refreshMetrics } = useMetrics();

  return (
    <div className="flex flex-col gap-6">
      {/* Metrics Header controls */}
      <div className="flex justify-between items-center bg-slate-900/10 p-4 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <Activity size={18} className="text-violet-400" />
          <span className="font-heading font-bold text-sm text-slate-200 uppercase tracking-wider">
            Operational KPIs Dashboard
          </span>
        </div>
        
        <button
          onClick={refreshMetrics}
          disabled={loading}
          className="btn-secondary flex items-center justify-center gap-2 h-9 px-4 rounded-xl text-xs font-semibold"
        >
          {loading ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <RefreshCw size={13} />
          )}
          Refresh Logs
        </button>
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

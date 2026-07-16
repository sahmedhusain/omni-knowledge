import { useState, useEffect, useCallback } from 'react';
import { SystemMetrics } from '../types/api';
import api from '../services/api';

export function useMetrics() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [health, setHealth] = useState<{ status: string; database: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve systems metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHealth = useCallback(async () => {
    try {
      const data = await api.getHealth();
      setHealth(data);
    } catch {
      setHealth({ status: 'unhealthy', database: 'disconnected' });
    }
  }, []);

  useEffect(() => {
    loadMetrics();
    loadHealth();
    // Poll health status every 15 seconds
    const interval = setInterval(() => {
      loadHealth();
    }, 15000);
    return () => clearInterval(interval);
  }, [loadMetrics, loadHealth]);

  return {
    metrics,
    health,
    loading,
    error,
    refreshMetrics: loadMetrics,
  };
}

export default useMetrics;

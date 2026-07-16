import { useState, useEffect, useCallback } from 'react';
import type { Document } from '../types/api';
import api from '../services/api';

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [indexing, setIndexing] = useState(false);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const docs = await api.listDocuments();
      setDocuments(docs);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve documents');
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadDocument = async (file: File, tag?: string) => {
    setLoading(true);
    setError(null);
    try {
      const doc = await api.uploadDocument(file, tag);
      setDocuments((prev) => [doc, ...prev.filter((d) => d.id !== doc.id)]);
      return doc;
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await api.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete document');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reindexAll = async () => {
    setIndexing(true);
    setError(null);
    try {
      const res = await api.triggerReindexing();
      await loadDocuments();
      return res;
    } catch (err: any) {
      setError(err.message || 'Indexing operation failed');
      throw err;
    } finally {
      setIndexing(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return {
    documents,
    loading,
    error,
    indexing,
    loadDocuments,
    uploadDocument,
    deleteDocument,
    reindexAll,
  };
}

export default useDocuments;

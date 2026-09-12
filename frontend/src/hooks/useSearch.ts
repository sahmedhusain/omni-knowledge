import { useState, useEffect } from 'react';
import type { SearchResponse } from '../types/api';
import api from '../services/api';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export function useSearch() {
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);

  useEffect(() => {
    // Load search history from local storage on mount
    const saved = localStorage.getItem('omniknowledge_search_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch {
        // Ignore JSON error
      }
    }
  }, []);

  const askQuestion = async (queryText: string, topK: number = 3) => {
    const trimmed = queryText.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.askQuestion(trimmed, topK, chatLog);
      setResponse(res);
      
      // Update chat message log history
      setChatLog((prev) => [
        ...prev,
        { role: 'user', content: trimmed },
        { role: 'assistant', content: res.answer }
      ]);

      // Update history in state and localStorage
      setHistory((prev) => {
        const filtered = prev.filter((h) => h !== trimmed);
        const updated = [trimmed, ...filtered].slice(0, 10);
        localStorage.setItem('omniknowledge_search_history', JSON.stringify(updated));
        return updated;
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching the answer');
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('omniknowledge_search_history');
  };

  const clearChat = () => {
    setChatLog([]);
    setResponse(null);
  };

  return {
    response,
    loading,
    error,
    history,
    chatLog,
    askQuestion,
    clearHistory,
    clearChat,
  };
}

export default useSearch;

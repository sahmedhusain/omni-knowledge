import type { Document, SearchResponse, SystemMetrics } from '../types/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiClient {
  async fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.detail || `HTTP error ${response.status}: ${response.statusText}`);
    }
    
    return response.json() as Promise<T>;
  }

  async uploadDocument(file: File, tag?: string): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    if (tag) {
      formData.append('tag', tag);
    }
    
    return this.fetchJson<Document>('/documents/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async listDocuments(): Promise<Document[]> {
    return this.fetchJson<Document[]>('/documents');
  }

  async deleteDocument(id: number): Promise<{ message: string }> {
    return this.fetchJson<{ message: string }>(`/documents/${id}`, {
      method: 'DELETE',
    });
  }

  async triggerReindexing(): Promise<{ status: string; indexed: number; errors?: string[] }> {
    return this.fetchJson<{ status: string; indexed: number; errors?: string[] }>('/documents/reindex', {
      method: 'POST',
    });
  }

  async askQuestion(query: string, topK: number = 3, history?: { role: string; content: string }[]): Promise<SearchResponse> {
    return this.fetchJson<SearchResponse>('/search/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, top_k: topK, history }),
    });
  }

  async getMetrics(): Promise<SystemMetrics> {
    return this.fetchJson<SystemMetrics>('/metrics');
  }

  async getHealth(): Promise<{ status: string; database: string }> {
    return this.fetchJson<{ status: string; database: string }>('/metrics/health');
  }
}

export const api = new ApiClient();
export default api;

import React, { useState, useRef } from 'react';
import { useDocuments } from '../hooks/useDocuments';
import { Upload, Trash2, RefreshCw, FileText, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import GlassCard from './GlassCard';

export const DocumentManager: React.FC = () => {
  const {
    documents,
    loading,
    indexing,
    error,
    uploadDocument,
    deleteDocument,
    reindexAll,
  } = useDocuments();

  const [tag, setTag] = useState('general');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      try {
        await uploadDocument(file, tag);
      } catch {
        // Error is set in hook
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        await uploadDocument(file, tag);
      } catch {
        // Error is set in hook
      }
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Upload and Control Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Box */}
        <GlassCard 
          className={`col-span-2 p-6 flex flex-col items-center justify-center border-2 border-dashed transition-all duration-200 min-h-60 ${
            dragActive ? 'border-violet-500 bg-violet-950/15' : 'border-slate-800 hover:border-slate-700'
          }`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
            accept=".txt,.md,.json"
          />
          <Upload className={`mb-3 text-slate-500 transition-colors ${dragActive ? 'text-violet-400' : ''}`} size={32} />
          <p className="font-heading font-bold text-slate-200 mb-1 text-sm md:text-base">
            Drag & drop document here, or{' '}
            <button type="button" onClick={onButtonClick} className="text-violet-400 hover:underline">
              browse files
            </button>
          </p>
          <p className="text-xs text-slate-500 font-semibold mb-4">
            Supports plain text (.txt), Markdown (.md), and JSON (.json) files
          </p>
          
          {/* Tag Configuration */}
          <div className="flex items-center gap-3 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider pl-2">
              Document Tag:
            </span>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg text-xs font-semibold px-2 py-1 outline-none focus:border-violet-500"
            >
              <option value="general">General</option>
              <option value="policy">Policy</option>
              <option value="faq">FAQ</option>
              <option value="onboarding">Onboarding</option>
              <option value="technical">Technical</option>
            </select>
          </div>
        </GlassCard>

        {/* Status / Reindex Controls */}
        <GlassCard className="p-6 flex flex-col justify-between border-slate-800">
          <div>
            <h3 className="font-heading font-bold text-base text-slate-200 mb-2">
              Index Sync Controller
            </h3>
            <p className="text-xs text-slate-500 font-semibold mb-4 leading-normal">
              Synchronizes local file contents with the FAISS vector database. When files are added or deleted, automatic incremental builds trigger. Use full re-indexing if source folders are manually updated.
            </p>
          </div>

          <button
            onClick={reindexAll}
            disabled={indexing || loading}
            className="btn-primary w-full flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw size={16} className={indexing ? 'animate-spin' : ''} />
            {indexing ? 'Reindexing...' : 'Full System Re-index'}
          </button>
        </GlassCard>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm font-medium">
          <AlertCircle size={18} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Document List Table */}
      <GlassCard className="overflow-hidden border-slate-800">
        <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/30 flex justify-between items-center">
          <h3 className="font-heading font-bold text-sm text-slate-300 uppercase tracking-wider">
            Indexed Resources ({documents.length})
          </h3>
        </div>

        {documents.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <FileText size={40} className="mb-2 text-slate-600" />
            <p className="font-semibold text-sm">No documents indexed yet.</p>
            <p className="text-xs mt-1">Upload files above to populate the knowledge assistant base.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Filename</th>
                  <th className="px-6 py-3">Tag</th>
                  <th className="px-6 py-3">Size</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Last Modified</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs font-semibold text-slate-300">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-900/15">
                    <td className="px-6 py-4 font-mono font-medium text-slate-200">
                      {doc.filename}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded bg-violet-950/20 text-violet-400 border border-violet-500/10 uppercase tracking-wider">
                        {doc.tag || 'general'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {formatSize(doc.size_bytes)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] uppercase font-bold ${
                        doc.status === 'indexed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        doc.status === 'indexing' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {doc.status === 'indexed' && <CheckCircle size={10} />}
                        {doc.status === 'indexing' && <RefreshCw size={10} className="animate-spin" />}
                        {doc.status === 'failed' && <AlertCircle size={10} />}
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {formatDate(doc.updated_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default DocumentManager;

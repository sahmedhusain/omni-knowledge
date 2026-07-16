import React, { useState, useRef } from 'react';
import { useDocuments } from '../hooks/useDocuments';
import { Upload, Trash2, RefreshCw, FileText, AlertCircle, CheckCircle, Database } from 'lucide-react';
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
        // Handled by hook
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        await uploadDocument(file, tag);
      } catch {
        // Handled by hook
      }
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
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
    <div className="flex flex-col gap-6 text-left animate-fade-in w-full max-w-4xl mx-auto">
      {/* Control grids */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Drop Zone */}
        <GlassCard 
          className={`md:col-span-2 p-6 flex flex-col items-center justify-center border-2 border-dashed transition-all duration-300 min-h-60 relative ${
            dragActive ? 'border-violet-accent bg-violet-accent/[0.04]' : 'border-white/[0.04] hover:border-violet-accent/40 bg-white/[0.01]'
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
          <Upload className={`mb-3.5 transition-colors duration-300 ${dragActive ? 'text-violet-accent' : 'text-slate-500'}`} size={32} />
          
          <p className="font-heading font-extrabold text-sm text-slate-200 mb-1 text-center">
            Drag and drop doc here, or{' '}
            <button type="button" onClick={onButtonClick} className="text-violet-accent hover:underline font-bold cursor-pointer bg-transparent border-none">
              browse files
            </button>
          </p>
          
          <p className="text-[11px] text-slate-500 font-bold mb-4">
            Supports plain text (.txt), Markdown (.md), and FAQ (.json)
          </p>
          
          {/* Metadata category */}
          <div className="flex items-center gap-3 bg-slate-950/60 p-2 px-3.5 rounded-xl border border-white/[0.03]">
            <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider">
              Category Tag
            </span>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="bg-slate-900 border border-slate-800/80 text-slate-200 rounded-lg text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1.5 outline-none focus:border-violet-accent transition-colors cursor-pointer"
            >
              <option value="general">General</option>
              <option value="policy">Policy</option>
              <option value="faq">FAQ</option>
              <option value="onboarding">Onboarding</option>
              <option value="technical">Technical</option>
            </select>
          </div>
        </GlassCard>

        {/* Index operations card */}
        <GlassCard className="p-6 flex flex-col justify-between border-white/[0.04] bg-white/[0.01]">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Database size={16} className="text-violet-400" />
              <h3 className="font-heading font-extrabold text-xs text-slate-200 uppercase tracking-wider">
                Index Operations
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 font-bold leading-relaxed mb-4">
              Vectors are automatically synchronized. Trigger a manual database re-indexing if files are updated outside this panel.
            </p>
          </div>

          <button
            onClick={reindexAll}
            disabled={indexing || loading}
            className="w-full bg-slate-900 border border-white/[0.04] hover:bg-slate-800 text-slate-200 rounded-xl h-11 flex items-center justify-center gap-2 text-xs uppercase tracking-wider font-extrabold cursor-pointer disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={14} className={indexing ? 'animate-spin' : ''} />
            {indexing ? 'Reindexing...' : 'Re-index Database'}
          </button>
        </GlassCard>
      </div>

      {/* Error display */}
      {error && (
        <GlassCard className="p-4 flex items-center gap-3 bg-rose-500/10 border-rose-500/20 text-rose-300 text-xs font-semibold">
          <AlertCircle size={16} className="flex-shrink-0" />
          {error}
        </GlassCard>
      )}

      {/* Document table records card */}
      <GlassCard className="overflow-hidden border-white/[0.04] bg-white/[0.01]">
        <div className="px-6 py-4 border-b border-white/[0.03] bg-white/[0.005] flex justify-between items-center">
          <h3 className="font-heading font-extrabold text-[10px] text-slate-400 uppercase tracking-wider">
            Active Documents Base ({documents.length})
          </h3>
        </div>

        {documents.length === 0 ? (
          <div className="p-16 text-center text-slate-600 flex flex-col items-center">
            <FileText size={48} className="mb-3 text-slate-700" />
            <p className="font-heading font-extrabold text-xs text-slate-400 uppercase tracking-wider">Empty Repository</p>
            <p className="text-[11px] text-slate-500 font-semibold mt-1">Upload knowledge assets to begin querying.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.03] text-[9px] font-bold text-slate-500 uppercase tracking-wider bg-slate-950/20">
                  <th className="px-6 py-3">Filename</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">File Size</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Indexed Date</th>
                  <th className="px-6 py-3 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02] text-xs font-semibold text-slate-300">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-white/[0.01]">
                    <td className="px-6 py-3.5 font-mono font-medium text-slate-200 truncate max-w-[200px]">
                      {doc.filename}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-[8px] font-bold px-2 py-0.5 rounded bg-violet-accent/10 text-violet-accent border border-violet-accent/10 uppercase tracking-wide">
                        {doc.tag || 'general'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-400">
                      {formatSize(doc.size_bytes)}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[8px] uppercase font-bold ${
                        doc.status === 'indexed' ? 'bg-emerald-accent/10 text-emerald-accent border-emerald-accent/15' :
                        doc.status === 'indexing' ? 'bg-amber-500/10 text-amber-400 border-amber-500/15' :
                        'bg-rose-accent/10 text-rose-500 border-rose-500/15'
                      }`}>
                        {doc.status === 'indexed' && <CheckCircle size={8} />}
                        {doc.status === 'indexing' && <RefreshCw size={8} className="animate-spin" />}
                        {doc.status === 'failed' && <AlertCircle size={8} />}
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-400">
                      {formatDate(doc.updated_at)}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="text-slate-500 hover:text-rose-accent p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer border-none bg-transparent"
                        title="Delete record"
                      >
                        <Trash2 size={14} />
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

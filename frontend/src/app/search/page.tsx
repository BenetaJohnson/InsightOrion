'use client';

import { useState, useEffect } from 'react';
import DashboardSidebar from '../../components/dashboard-sidebar';
import { api } from '../../services/api';
import { 
  Search, 
  Upload, 
  FileText, 
  Link as LinkIcon, 
  ExternalLink,
  ChevronRight,
  Trash2,
  CheckCircle,
  Loader2,
  Sparkles,
  BookOpen,
  ArrowRight
} from 'lucide-react';

export default function SearchPage() {
  // States
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [ragResult, setRagResult] = useState<any>(null);
  
  // Files registry state
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  
  // Selected snippet viewer
  const [selectedSnippet, setSelectedSnippet] = useState<any>(null);

  const fetchDocs = async () => {
    try {
      const data = await api.knowledge.list();
      setDocuments(data);
    } catch (err) {
      console.error('Failed to load documents list:', err);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setRagResult(null);
    setSelectedSnippet(null);
    try {
      const res = await api.knowledge.search(query);
      setRagResult(res);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle.trim()) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', uploadFile);
      fd.append('title', uploadTitle);
      await api.knowledge.upload(fd);
      setUploadFile(null);
      setUploadTitle('');
      await fetchDocs();
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.knowledge.syncGoogle();
      await fetchDocs();
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this document from the RAG index?')) return;
    try {
      await api.knowledge.deleteDoc(id);
      await fetchDocs();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <DashboardSidebar />

      <main className="flex-1 ml-64 p-10 lg:p-12 space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-900/80 pb-6">
          <div className="border-l-4 border-teal-500 pl-4">
            <h1 className="text-3xl font-extrabold text-white tracking-tight font-sans">Enterprise Knowledge Hub</h1>
            <p className="text-sm text-slate-400 mt-1.5 font-sans">Ask questions across meetings, Drive, and Gmail indexes</p>
          </div>
          <button 
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 border border-slate-800 bg-slate-900/40 hover:bg-slate-800 disabled:bg-slate-950 rounded-lg text-xs font-semibold text-teal-400 flex items-center space-x-1.5 shadow-sm transition"
          >
            {syncing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-teal-450" />
            )}
            <span>Sync Workspace</span>
          </button>
        </div>

        {/* Two-Column Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Search & Answers (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative shadow-sm">
              <input
                type="text"
                placeholder="Ask anything (e.g. What decisions were made about cloud VM migration?)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-slate-900/30 border border-slate-800 focus:border-teal-500/50 rounded-xl py-3.5 pl-12 pr-28 text-sm text-white placeholder-slate-550 outline-none transition"
              />
              <Search className="w-5 h-5 text-slate-500 absolute left-4 top-4" />
              <button
                type="submit"
                disabled={searching}
                className="absolute right-2.5 top-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-all flex items-center space-x-1 border border-slate-700"
              >
                {searching ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span>Ask Copilot</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Search Result Output */}
            {searching && (
              <div className="bg-slate-900/20 border border-slate-800 rounded-xl p-8 shadow-sm flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                <span className="text-xs text-slate-500 font-mono">consulting_faiss_indexes_and_gemini...</span>
              </div>
            )}

            {ragResult && (
              <div className="bg-slate-900/35 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6 transition-all duration-300">
                <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-3">
                  <Sparkles className="w-4 h-4 text-teal-500" />
                  <h3 className="text-xs uppercase font-mono tracking-wider text-slate-400 font-bold">Answer & References</h3>
                </div>
                
                <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                  {ragResult.answer}
                </div>

                {/* Citations Grid */}
                <div className="space-y-3 pt-4 border-t border-slate-800/80">
                  <h4 className="text-xs font-semibold text-white flex items-center space-x-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                    <span>Cited Source Snippets ({ragResult.citations.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ragResult.citations.map((c: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => setSelectedSnippet(c)}
                        className="text-left p-3 rounded-lg border border-slate-800 bg-slate-900/20 hover:bg-slate-900/40 hover:border-teal-500/30 transition group"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] bg-teal-950/60 text-teal-400 px-1.5 py-0.5 rounded font-mono font-bold border border-teal-900/30">
                            {c.reference_tag}
                          </span>
                          <span className="text-[9px] uppercase font-mono text-slate-500 font-semibold">
                            {c.source_type}
                          </span>
                        </div>
                        <span className="font-semibold text-white text-xs block truncate mb-1">
                          {c.source_title}
                        </span>
                        <p className="text-[10px] text-slate-400 leading-normal line-clamp-2">
                          {c.content_snippet}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Source Viewer, Upload, Docs List (1/3 width) */}
          <div className="space-y-6">
            {/* Source Snippet Details Viewer */}
            {selectedSnippet && (
              <div className="bg-slate-900 text-slate-200 border border-slate-800 rounded-xl p-5 shadow-lg relative animate-in fade-in duration-200">
                <button 
                  onClick={() => setSelectedSnippet(null)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-white text-xs"
                >
                  ✕
                </button>
                <div className="mb-3">
                  <span className="text-[10px] bg-teal-500 text-slate-955 px-1.5 py-0.5 rounded font-mono font-bold">
                    {selectedSnippet.reference_tag} Source Segment
                  </span>
                  <h4 className="font-bold text-sm text-white mt-2">{selectedSnippet.source_title}</h4>
                </div>
                <p className="text-xs text-slate-450 leading-relaxed max-h-48 overflow-y-auto bg-slate-950/40 p-3 rounded border border-slate-800 font-mono">
                  {selectedSnippet.content_snippet}
                </p>
              </div>
            )}

            {/* Upload Document Panel */}
            <div className="bg-slate-900/20 border border-slate-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-[10px] uppercase font-mono tracking-wider text-teal-405 font-bold mb-4">
                Upload New Knowledge File
              </h3>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Display Title</label>
                  <input
                    type="text"
                    required
                    placeholder="AWS Compute Migration Strategy"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="w-full bg-slate-950/40 border border-slate-800 focus:border-teal-500/50 rounded-lg py-2 px-3 text-xs text-white placeholder-slate-600 outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Document File (.txt, .pdf, .docx)</label>
                  <div className="border-2 border-dashed border-slate-800/80 hover:border-teal-500/50 rounded-lg p-6 text-center cursor-pointer transition relative">
                    <input
                      type="file"
                      required
                      onChange={(e) => {
                        if (e.target.files) setUploadFile(e.target.files[0]);
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                    <span className="text-xs text-slate-400 block font-sans">
                      {uploadFile ? uploadFile.name : 'Choose file to upload'}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uploading || !uploadFile || !uploadTitle}
                  className="w-full py-2.5 bg-teal-950/30 hover:bg-teal-900/40 disabled:bg-slate-900/20 text-teal-400 disabled:text-slate-600 font-semibold text-xs rounded-lg border border-teal-900/50 transition"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    <span>Index File</span>
                  )}
                </button>
              </form>
            </div>

            {/* Indexed Documents Registry */}
            <div className="bg-slate-900/20 border border-slate-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-[10px] uppercase font-mono tracking-wider text-teal-405 font-bold mb-4">
                Indexed Documents ({documents.length})
              </h3>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {documents.length === 0 ? (
                  <div className="text-center py-6">
                    <FileText className="w-10 h-10 text-slate-850 mx-auto mb-2" />
                    <p className="text-[11px] text-slate-500 italic font-sans animate-pulse">No indexed files. Upload one above or sync workspace.</p>
                  </div>
                ) : (
                  documents.map((d) => (
                    <div key={d.id} className="flex justify-between items-center p-2.5 border border-slate-800/80 rounded-lg bg-slate-950/20 hover:bg-slate-900/20 transition">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-white block truncate">{d.title}</span>
                          <span className="text-[9px] text-slate-500 uppercase font-mono">
                            {d.file_type} &middot; {d.source_type}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDelete(d.id)}
                        className="text-slate-500 hover:text-red-450 p-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}

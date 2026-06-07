'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardSidebar from '../../components/dashboard-sidebar';
import { api } from '../../services/api';
import { 
  Video, 
  Upload, 
  Loader2, 
  Calendar, 
  Clock, 
  ChevronRight, 
  FileSpreadsheet, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Upload states
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);

  const fetchMeetings = async () => {
    try {
      const data = await api.meetings.list();
      setMeetings(data);
    } catch (err) {
      console.error('Failed to load meetings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
    // Poll updates every 6 seconds to track background transcription status
    const interval = setInterval(fetchMeetings, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleUploadMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !title.trim()) return;
    setProcessing(true);
    try {
      const fd = new FormData();
      fd.append('file', uploadFile);
      fd.append('title', title);
      fd.append('date', date);
      await api.meetings.upload(fd);
      
      setTitle('');
      setUploadFile(null);
      await fetchMeetings();
    } catch (err: any) {
      alert(err.message || 'Failed to upload meeting.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <DashboardSidebar />

      <main className="flex-1 ml-64 p-10 lg:p-12 space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-900/80 pb-6">
          <div className="border-l-4 border-teal-500 pl-4">
            <h1 className="text-3xl font-extrabold text-white tracking-tight font-sans">Meeting Intelligence Center</h1>
            <p className="text-sm text-slate-400 mt-1.5 font-sans">Transcribe voice discussions, segment speakers, and compile MoMs</p>
          </div>
        </div>

        {/* Two-Column Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Upload and status tracker (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Upload Form */}
            <div className="bg-slate-900/20 border border-slate-800 rounded-xl p-6 shadow-sm text-white">
              <h3 className="text-[10px] uppercase font-mono tracking-wider text-teal-405 font-bold mb-4">
                Upload Audio / Video Discussion
              </h3>
              <form onSubmit={handleUploadMeeting} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Meeting Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Project Alpha VM migration strategy sync"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-955/40 border border-slate-800 focus:border-teal-500/50 rounded-lg py-2 px-3.5 text-xs text-white placeholder-slate-650 outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Meeting Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-955/40 border border-slate-800 focus:border-teal-500/50 rounded-lg py-2 px-3 text-xs text-white outline-none font-semibold transition"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Upload Audio (.mp3, .wav, .m4a)</label>
                  <div className="border border-slate-800 bg-slate-955/40 hover:bg-slate-900/40 rounded-lg p-2 flex items-center justify-between cursor-pointer transition relative">
                    <input
                      type="file"
                      required
                      accept="audio/*"
                      onChange={(e) => {
                        if (e.target.files) setUploadFile(e.target.files[0]);
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-400 truncate pr-4">
                      {uploadFile ? uploadFile.name : 'Choose file...'}
                    </span>
                    <Upload className="w-4 h-4 text-slate-500 shrink-0" />
                  </div>
                </div>

                <div className="sm:col-span-2 pt-2">
                  <button
                    type="submit"
                    disabled={processing || !uploadFile || !title}
                    className="w-full py-2.5 bg-teal-955/30 hover:bg-teal-900/40 disabled:bg-slate-900/20 text-teal-400 border border-teal-900/50 font-semibold text-xs rounded-lg transition"
                  >
                    {processing ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Transcribing & Summarizing (Whisper + Gemini)...</span>
                      </div>
                    ) : (
                      <span>Start Processing Audio</span>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Meetings List */}
            <div className="bg-slate-900/20 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4 text-white">
              <h3 className="text-[10px] uppercase font-mono tracking-wider text-teal-405 font-bold">
                Audio Transcription Queue
              </h3>
              
              {loading ? (
                <div className="py-8 text-center text-slate-500 text-xs">Loading logs...</div>
              ) : meetings.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center italic font-sans">No audio discussions uploaded yet.</p>
              ) : (
                <div className="space-y-3">
                  {meetings.map((m) => (
                    <div key={m.id} className="flex justify-between items-center p-4 border border-slate-850 rounded-xl bg-slate-950/20 hover:bg-slate-900/20 transition">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-white text-sm truncate">{m.title}</h4>
                        <span className="text-[10px] text-slate-500 font-medium block mt-0.5 font-mono">{m.date}</span>
                      </div>
                      <div className="flex items-center space-x-3 shrink-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${
                          m.status === 'COMPLETED' ? 'bg-green-955/40 text-green-450 border border-green-900/30' : 'bg-yellow-955/40 text-yellow-450 border border-yellow-900/30'
                        }`}>
                          {m.status}
                        </span>
                        {m.status === 'COMPLETED' ? (
                          <Link 
                            href={`/mom?id=${m.id}`}
                            className="px-3 py-1.5 bg-slate-900/40 border border-slate-800 text-teal-400 hover:bg-slate-800 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                          >
                            <span>Review MoM</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        ) : (
                          <div className="w-24 text-right text-[10px] text-slate-500 font-mono italic">
                            processing...
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Audio stats panel (1/3 width) */}
          <div className="space-y-6">
            <div className="bg-slate-900/20 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4 text-white">
              <h3 className="text-[10px] uppercase font-mono tracking-wider text-teal-405 font-bold border-b border-slate-850 pb-3">
                Decoders Info
              </h3>
              <div className="space-y-3 text-xs text-slate-350 font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Audio Decoder:</span>
                  <span className="text-white font-semibold font-mono">Whisper-Base Model</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Audio Formats:</span>
                  <span className="text-white font-semibold font-mono">MP3, WAV, M4A, MP4</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">LLM Summarizer:</span>
                  <span className="text-white font-semibold font-mono">Gemini 2.5 Flash</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

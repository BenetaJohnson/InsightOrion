'use client';

import { useState, useEffect } from 'react';
import DashboardSidebar from '../../components/dashboard-sidebar';
import { api } from '../../services/api';
import { 
  Sparkles, 
  RefreshCw, 
  Bug, 
  FileText, 
  User as UserIcon, 
  Clock, 
  HelpCircle,
  Loader2,
  AlertOctagon,
  CheckCircle,
  Terminal
} from 'lucide-react';

export default function JiraCopilotPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  // Recommendations states
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const fetchTickets = async () => {
    try {
      const data = await api.jira.list();
      setTickets(data);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSyncJira = async () => {
    setSyncing(true);
    try {
      await api.jira.sync();
      await fetchTickets();
    } catch (err) {
      alert('Jira sync failed.');
    } finally {
      setSyncing(false);
    }
  };

  const handleGetAnalysis = async (ticket: any) => {
    setSelectedTicket(ticket);
    setAnalysis(null);
    setLoadingAnalysis(true);
    try {
      const res = await api.jira.getRecommendations(ticket.key);
      setAnalysis(res.analysis);
    } catch (err) {
      console.error(err);
      setAnalysis('Failed to generate resolution analysis.');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <DashboardSidebar />

      <main className="flex-1 ml-64 p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Header */}
        <div className="lg:col-span-4 flex justify-between items-center border-b border-slate-900/80 pb-6 mb-4">
          <div className="border-l-4 border-teal-500 pl-4">
            <h1 className="text-3xl font-extrabold text-white tracking-tight font-sans">Jira Copilot Hub</h1>
            <p className="text-sm text-slate-400 mt-1.5 font-sans">Synchronize active sprint bugs and analyze ticket resolution recommendations</p>
          </div>
          
          <button
            onClick={handleSyncJira}
            disabled={syncing}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900/20 text-white disabled:text-slate-500 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition"
          >
            {syncing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>Sync Sprint Tickets</span>
          </button>
        </div>

        {/* Left: Jira Tickets Feed (3/4 width if selectedTicket else full) */}
        <div className={`${selectedTicket ? 'lg:col-span-2' : 'lg:col-span-4'} space-y-6`}>

          {/* Tickets List */}
          {loading ? (
            <div className="text-center py-12 text-xs text-slate-400 font-mono">loading_sprint_logs...</div>
          ) : tickets.length === 0 ? (
            <p className="text-xs text-slate-400 py-12 text-center bg-slate-900/20 border border-slate-800 rounded-xl">
              No tickets synced. Click 'Sync Sprint Tickets' above to pull active projects.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tickets.map((t) => (
                <div 
                  key={t.id}
                  onClick={() => handleGetAnalysis(t)}
                  className={`bg-slate-900/20 p-5 rounded-xl border hover:border-slate-700 transition cursor-pointer flex flex-col justify-between hover:shadow ${
                    selectedTicket?.key === t.key ? 'ring-2 ring-teal-500/50 border-teal-500 shadow-sm' : 'border-slate-805 border-slate-800/80'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-2.5">
                      <span className="text-[10px] font-bold font-mono bg-slate-950/60 text-slate-300 px-2 py-0.5 rounded border border-slate-850">
                        {t.key}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                        t.priority === 'BLOCKER' || t.priority === 'HIGH' 
                          ? 'bg-red-950/40 text-red-450 border-red-900/30' 
                          : 'bg-slate-900/40 text-slate-300 border-slate-800'
                      }`}>
                        {t.priority}
                      </span>
                    </div>

                    <h3 className="font-semibold text-white text-xs leading-snug hover:text-teal-400 mb-1.5">
                      {t.title}
                    </h3>
                    <p className="text-[10px] text-slate-405 line-clamp-2 leading-relaxed">
                      {t.description || 'No ticket description provided.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-900 flex justify-between items-center text-[10px] text-slate-400">
                    <span className="flex items-center space-x-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{t.created_at}</span>
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                      t.status === 'RESOLVED' || t.status === 'CLOSED'
                        ? 'bg-green-950/40 text-green-455 border-green-900/30'
                        : 'bg-yellow-950/40 text-yellow-455 border-yellow-900/30'
                    }`}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Recommendations & Resolution Analysis (1/2 width) */}
        {selectedTicket && (
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/20 text-slate-200 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col h-[550px]">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-900 pb-3 mb-4 shrink-0">
                <div>
                  <span className="text-[9px] uppercase font-mono bg-teal-950/40 text-teal-400 border border-teal-900/30 px-1.5 py-0.5 rounded font-bold">
                    Copilot Resolution Advisory
                  </span>
                  <h3 className="font-bold text-sm text-white mt-2 truncate max-w-[200px]">{selectedTicket.key} Analysis</h3>
                </div>
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Analysis Text viewport */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-slate-300 text-xs leading-relaxed">
                {loadingAnalysis ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-2 text-slate-450">
                    <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
                    <span className="font-mono text-[10px]">generating_root_cause_analysis...</span>
                  </div>
                ) : (
                  <div className="bg-slate-955/40 p-4 rounded border border-slate-850/80 font-mono whitespace-pre-wrap text-slate-300">
                    {analysis}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}

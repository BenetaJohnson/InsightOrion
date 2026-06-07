'use client';

import { useState } from 'react';
import DashboardSidebar from '../../components/dashboard-sidebar';
import { api } from '../../services/api';
import { 
  Cpu, 
  Search, 
  User as UserIcon, 
  BarChart3, 
  Clock, 
  CheckCircle,
  HelpCircle,
  Loader2,
  Terminal,
  Sparkles,
  Award
} from 'lucide-react';

export default function EngineeringIntelPage() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [experts, setExperts] = useState<any[]>([]);

  const handleSearchExperts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setExperts([]);
    try {
      const res = await api.jira.findExperts(query);
      setExperts(res);
    } catch (err) {
      console.error('Expert search failed:', err);
    } finally {
      setSearching(false);
    }
  };
  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <DashboardSidebar />

      <main className="flex-1 ml-64 p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Header */}
        <div className="lg:col-span-3 border-b border-slate-900/80 pb-6 mb-4">
          <div className="border-l-4 border-teal-500 pl-4">
            <h1 className="text-3xl font-extrabold text-white tracking-tight font-sans">Engineering Intelligence Hub</h1>
            <p className="text-sm text-slate-400 mt-1.5 font-sans">Search resolved incident memories to discover subject-matter experts and contributors</p>
          </div>
        </div>

        {/* Left Column: Expert Finder (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Expert Finder query bar */}
          <form onSubmit={handleSearchExperts} className="relative shadow-sm">
            <input
              type="text"
              placeholder="Ask who has matching expertise (e.g. Who worked on OAuth before?)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-950/40 border border-slate-800 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500 rounded-xl py-3.5 pl-12 pr-28 text-sm text-white outline-none transition"
            />
            <Search className="w-5 h-5 text-slate-500 absolute left-4 top-4" />
            <button
              type="submit"
              disabled={searching || !query.trim()}
              className="absolute right-2.5 top-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900/20 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-all"
            >
              {searching ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto text-teal-400" />
              ) : (
                <span>Find Expert</span>
              )}
            </button>
          </form>

          {/* Experts Listings Output */}
          {searching && (
            <div className="bg-slate-905 bg-slate-900/20 border border-slate-800 rounded-xl p-8 shadow-sm flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
              <span className="text-xs text-slate-400 font-mono">consulting_jira_resolved_memory_indexes...</span>
            </div>
          )}

          {experts.length > 0 && (
            <div className="bg-slate-900/20 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs uppercase font-mono tracking-wider text-teal-400 font-bold border-b border-slate-850 pb-2">
                Recommended Contributors & Experts
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {experts.map((exp, i) => (
                  <div key={i} className="p-4 border border-slate-850 bg-slate-950/20 rounded-xl flex items-start space-x-3.5 hover:border-slate-700 transition">
                    <div className="w-10 h-10 rounded-full bg-teal-950/40 border border-teal-900/30 text-teal-400 flex items-center justify-center shrink-0">
                      <Award className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-xs truncate">{exp.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono block truncate">{exp.email}</span>
                      
                      <div className="mt-3 space-y-1">
                        <span className="text-[9px] bg-teal-950/40 text-teal-450 border border-teal-900/30 px-1.5 py-0.5 rounded font-mono font-bold">
                          {exp.resolved_count} issues solved
                        </span>
                        <span className="text-[9px] text-slate-450 block truncate mt-1">
                          Recent Ticket: <strong className="text-slate-300 font-mono">{exp.recent_ticket}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Engineering Analytics Widgets (1/3 width) */}
        <div className="space-y-6">
          
          {/* Engineering Metrics widget */}
          <div className="bg-slate-900/20 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs uppercase font-mono tracking-wider text-teal-400 font-bold border-b border-slate-850 pb-2">
              Sprint 3 Metrics
            </h3>
            
            <div className="space-y-3 text-white">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Sprint Velocity</span>
                <span className="text-lg font-bold text-white">42 Story Points completed</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Average Resolution Time</span>
                <span className="text-lg font-bold text-white">1.8 days per Bug ticket</span>
              </div>
              
              <div className="pt-2">
                <span className="text-[9px] uppercase font-mono text-slate-400 font-semibold block mb-1">Team Load Index</span>
                <div className="h-2 w-full bg-slate-950/50 border border-slate-850 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500" style={{ width: '70%' }}></div>
                </div>
                <div className="flex justify-between text-[8px] text-slate-500 font-mono mt-1">
                  <span>Idle</span>
                  <span>Optimal Load</span>
                  <span>Overload</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sandbox Info */}
          <div className="bg-slate-900/20 text-slate-200 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center space-x-1.5 text-teal-400">
              <Terminal className="w-4 h-4" />
              <h4 className="font-bold text-xs uppercase font-mono tracking-wide">Developer Sandbox Active</h4>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Jira synchronization is running with simulated bug reports covering **redis connection pool leaks**, **oauth cookie validation dropouts**, and **kafka partitioning keys** so that matching algorithms return realistic expert profiles.
            </p>
          </div>

        </div>

      </main>
    </div>
  );
}

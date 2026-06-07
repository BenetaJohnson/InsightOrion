'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '../../store/use-store';
import { api } from '../../services/api';
import DashboardSidebar from '../../components/dashboard-sidebar';
import { 
  FileText, 
  Video, 
  CheckSquare, 
  Globe, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const token = useStore((state) => state.token);
  const user = useStore((state) => state.user);
  const tenant = useStore((state) => state.tenant);

  const [metrics, setMetrics] = useState<any>(null);
  const [recentMeetings, setRecentMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If not authenticated, redirect
    if (typeof window !== 'undefined' && !localStorage.getItem('em_token')) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const metData = await api.analytics.getDashboard();
        setMetrics(metData);
        
        const meetData = await api.meetings.list();
        setRecentMeetings(meetData.slice(0, 3));
      } catch (err) {
        console.error('Failed to load dashboard logs:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token, router]);

  if (loading || !metrics) {
    return (
      <div className="flex h-screen bg-[#0b0f19] items-center justify-center text-teal-400 font-mono text-sm">
        <span>booting_workspace_intelligence_metrics...</span>
      </div>
    );
  }

  const statCards = [
    { 
      name: 'Knowledge base files', 
      val: metrics.knowledge.total_documents, 
      desc: 'Indexed PDFs, emails, SOPs', 
      icon: FileText,
      color: 'text-blue-400 bg-blue-500/10'
    },
    { 
      name: 'Meetings indexed', 
      val: metrics.meetings.total_processed, 
      desc: 'Whisper transcripts parsed', 
      icon: Video,
      color: 'text-teal-400 bg-teal-500/10'
    },
    { 
      name: 'Action Items open', 
      val: metrics.productivity.open + metrics.productivity.in_progress, 
      desc: `${metrics.productivity.overdue} task items currently overdue`, 
      icon: CheckSquare,
      color: 'text-amber-400 bg-amber-500/10'
    },
    { 
      name: 'Active Integrations', 
      val: user?.google_refresh_token ? 'Google Connected' : 'Local Sandbox', 
      desc: user?.google_refresh_token ? 'Drive/Gmail auto-synced' : 'Connect accounts in Settings', 
      icon: Globe,
      color: user?.google_refresh_token ? 'text-green-400 bg-green-500/10' : 'text-slate-400 bg-slate-500/10'
    }
  ];

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <DashboardSidebar />
      
      <main className="flex-1 ml-64 p-10 lg:p-12 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-900/80 pb-6">
          <div className="border-l-4 border-teal-500 pl-4">
            <h1 className="text-3xl font-extrabold text-white tracking-tight font-sans">
              Welcome back, {user ? user.full_name : 'Employee'}
            </h1>
            <p className="text-sm text-slate-400 mt-1.5 font-sans">
              Active workspace domain: <strong className="text-slate-300">{tenant?.domain}</strong>
            </p>
          </div>
          
          <div className="flex items-center space-x-3 bg-slate-900/40 px-4 py-2 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 shadow-sm">
            <Sparkles className="w-4 h-4 text-teal-450 animate-pulse" />
            <span>Gemini 2.5 Flash Orchestrator Active</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, i) => (
            <div key={i} className="bg-slate-900/20 p-6 rounded-xl border border-slate-800 shadow-sm hover-card text-white">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-450 block font-semibold">
                  {stat.name}
                </span>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">{stat.val}</h2>
              <p className="text-[11px] text-slate-400 leading-normal font-medium">{stat.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main workspace section */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <div className="bg-slate-900/20 p-6 rounded-xl border border-slate-800 shadow-sm text-white">
              <h3 className="text-xs uppercase font-mono tracking-wider text-teal-400 font-bold mb-4">
                Quick Action Center
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link href="/search" className="p-4 rounded-lg border border-slate-800 bg-slate-950/30 hover:bg-teal-950/20 hover:border-teal-500/30 group transition">
                  <span className="font-semibold text-white text-sm block mb-1">RAG Search</span>
                  <span className="text-[11px] text-slate-400 block mb-3 leading-relaxed">Ask AI questions across company files.</span>
                  <span className="text-xs text-teal-400 font-semibold flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                    <span>Query Hub</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
                <Link href="/meetings" className="p-4 rounded-lg border border-slate-800 bg-slate-950/30 hover:bg-teal-950/20 hover:border-teal-500/30 group transition">
                  <span className="font-semibold text-white text-sm block mb-1">Upload Audio</span>
                  <span className="text-[11px] text-slate-400 block mb-3 leading-relaxed">Transcribe and auto-generate detailed MoMs.</span>
                  <span className="text-xs text-teal-400 font-semibold flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                    <span>Transcribe</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
                <Link href="/automation" className="p-4 rounded-lg border border-slate-800 bg-slate-950/30 hover:bg-teal-950/20 hover:border-teal-500/30 group transition">
                  <span className="font-semibold text-white text-sm block mb-1">Automation Workflow</span>
                  <span className="text-[11px] text-slate-400 block mb-3 leading-relaxed">Trigger onboarding form checks and audits.</span>
                  <span className="text-xs text-teal-400 font-semibold flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                    <span>RPA Control</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              </div>
            </div>

            {/* Recent Meetings parsed */}
            <div className="bg-slate-900/20 p-6 rounded-xl border border-slate-800 shadow-sm text-white">
              <div className="flex justify-between items-center mb-4 border-b border-slate-850 pb-3">
                <h3 className="text-xs uppercase font-mono tracking-wider text-teal-405 font-bold">
                  Recent Processed Meetings
                </h3>
                <Link href="/mom" className="text-xs text-teal-400 hover:text-teal-350 hover:underline font-semibold">
                  View All History
                </Link>
              </div>
              {recentMeetings.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center italic font-sans">
                  No meetings uploaded yet. Navigate to Meeting Intel to upload MP3 audio.
                </p>
              ) : (
                <div className="space-y-4">
                  {recentMeetings.map((m) => (
                    <div key={m.id} className="flex justify-between items-center p-3.5 rounded-lg border border-slate-850 bg-slate-950/20 hover:bg-slate-900/20 transition">
                      <div>
                        <h4 className="font-semibold text-white text-sm">{m.title}</h4>
                        <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">{m.date}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${
                          m.status === 'COMPLETED' ? 'bg-green-950/40 text-green-450 border border-green-900/30' : 'bg-yellow-950/40 text-yellow-450 border border-yellow-900/30'
                        }`}>
                          {m.status}
                        </span>
                        <Link href={`/mom?id=${m.id}`} className="text-xs font-semibold text-teal-400 hover:text-teal-300">
                          View MoM
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Side insights panel */}
          <div className="space-y-8">
            {/* System warning panel if Google is not connected */}
            {!user?.google_refresh_token && (
              <div className="bg-amber-950/10 border border-amber-900/40 p-5 rounded-xl flex items-start space-x-3 text-amber-200">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide">Workspace Connection Needed</h4>
                  <p className="text-[11px] text-amber-300 mt-1 leading-relaxed font-sans">
                    Connect Google OAuth client refresh tokens to allow indexing of Gmail discussions and Drive documents.
                  </p>
                  <Link href="/settings" className="text-xs font-bold text-amber-400 hover:text-amber-300 hover:underline mt-2 inline-block">
                    Open Settings &rarr;
                  </Link>
                </div>
              </div>
            )}

            {/* Search Analytics Trends */}
            <div className="bg-slate-900/20 p-6 rounded-xl border border-slate-800 shadow-sm text-white">
              <h3 className="text-xs uppercase font-mono tracking-wider text-teal-405 font-bold mb-4 border-b border-slate-850 pb-3">
                Popular Search Topics
              </h3>
              <div className="space-y-3">
                {metrics.knowledge.popular_topics.map((t: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-medium truncate max-w-[180px] font-sans">{t.topic}</span>
                    <span className="text-[10px] font-semibold bg-slate-950/50 text-slate-400 border border-slate-850 px-2 py-0.5 rounded font-mono">
                      {t.searches} queries
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

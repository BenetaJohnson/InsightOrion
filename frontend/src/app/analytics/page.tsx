'use client';

import { useState, useEffect } from 'react';
import DashboardSidebar from '../../components/dashboard-sidebar';
import { api } from '../../services/api';
import { 
  BarChart3, 
  Database, 
  Video, 
  TrendingUp, 
  HelpCircle,
  FileText,
  DollarSign,
  Sparkles,
  Loader2
} from 'lucide-react';

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await api.analytics.getDashboard();
        setMetrics(data);
      } catch (err) {
        console.error('Failed to load metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="flex h-screen bg-[#0b0f19] items-center justify-center text-teal-400 font-mono text-sm">
        <span>loading_analytics_engine_data...</span>
      </div>
    );
  }

  // Calculate percentages for visual progress bars
  const totalTasks = metrics.productivity.total_actions || 1;
  const completedPct = Math.round((metrics.productivity.completed / totalTasks) * 100);
  const openPct = Math.round((metrics.productivity.open / totalTasks) * 100);
  const progressPct = Math.round((metrics.productivity.in_progress / totalTasks) * 100);
  const overduePct = Math.round((metrics.productivity.overdue / totalTasks) * 100);

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <DashboardSidebar />

      <main className="flex-1 ml-64 p-10 lg:p-12 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-900/80 pb-6">
          <div className="border-l-4 border-teal-500 pl-4">
            <h1 className="text-3xl font-extrabold text-white tracking-tight font-sans">Analytics & Insights</h1>
            <p className="text-sm text-slate-400 mt-1.5 font-sans">Overview of Knowledge Hub query volume, productivity stats, and API billing estimates</p>
          </div>
        </div>

        {/* Top Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Knowledge Hub stats */}
          <div className="bg-slate-900/20 p-6 rounded-xl border border-slate-800 shadow-sm space-y-4 text-white">
            <div className="flex items-center space-x-2 border-b border-slate-850 pb-2">
              <Database className="w-4 h-4 text-teal-400" />
              <h3 className="font-bold text-teal-400 text-xs font-mono uppercase">Knowledge Vault Volume</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Indexed Files</span>
                <span className="text-xl font-bold text-white">{metrics.knowledge.total_documents}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Search Queries</span>
                <span className="text-xl font-bold text-white">{metrics.ai_usage.query_volume}</span>
              </div>
            </div>
            
            {/* File type distribution simulation */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[9px] uppercase font-mono text-slate-400 font-semibold block">Source Distribution</span>
              <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-950/50 border border-slate-850">
                <div className="bg-blue-500" style={{ width: '45%' }} title="Uploads"></div>
                <div className="bg-teal-500" style={{ width: '35%' }} title="Drive Sync"></div>
                <div className="bg-yellow-500" style={{ width: '20%' }} title="Gmail Emails"></div>
              </div>
              <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1"></span>Uploads</span>
                <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-teal-500 mr-1"></span>Drive</span>
                <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mr-1"></span>Gmail</span>
              </div>
            </div>
          </div>

          {/* Card 2: Meetings & Whisper minutes */}
          <div className="bg-slate-900/20 p-6 rounded-xl border border-slate-800 shadow-sm space-y-4 text-white">
            <div className="flex items-center space-x-2 border-b border-slate-850 pb-2">
              <Video className="w-4 h-4 text-teal-400" />
              <h3 className="font-bold text-teal-400 text-xs font-mono uppercase">Voice Processing</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Meetings Decoded</span>
                <span className="text-xl font-bold text-white">{metrics.meetings.total_processed}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Transcribed Minutes</span>
                <span className="text-xl font-bold text-white">{metrics.meetings.minutes_transcribed}</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 italic leading-relaxed font-sans">
              Whisper voice diagnostics running flat base structures. Output segments index matches directly into FAISS.
            </p>
          </div>

          {/* Card 3: AI billing and API usage */}
          <div className="bg-slate-900/20 p-6 rounded-xl border border-slate-800 shadow-sm space-y-4 text-white">
            <div className="flex items-center space-x-2 border-b border-slate-850 pb-2">
              <DollarSign className="w-4 h-4 text-teal-400" />
              <h3 className="font-bold text-teal-400 text-xs font-mono uppercase">API Billing estimates</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Gemini Tokens</span>
                <span className="text-xl font-bold text-white font-mono">{(metrics.ai_usage.total_tokens_consumed / 1000).toFixed(1)}k</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Billing USD</span>
                <span className="text-xl font-bold text-teal-400 font-mono">${metrics.ai_usage.estimated_billing_usd}</span>
              </div>
            </div>
            <span className="text-[9px] bg-slate-950/50 text-slate-400 border border-slate-850 px-2 py-0.5 rounded block text-center font-mono">
              Pricing model: Whisper $0.006/min &bull; Gemini $0.075/M tokens
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Productivity progress chart */}
          <div className="lg:col-span-2 bg-slate-900/20 p-6 rounded-xl border border-slate-800 shadow-sm space-y-5 text-white">
            <h3 className="text-xs uppercase font-mono tracking-wider text-teal-400 font-bold border-b border-slate-850 pb-2">
              Action Items Status Completion Tracker
            </h3>
            
            <div className="space-y-4">
              {/* Task Completed */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-300">
                  <span>Completed Tasks</span>
                  <span className="font-mono text-white">{metrics.productivity.completed} ({completedPct}%)</span>
                </div>
                <div className="h-2 w-full bg-slate-950/50 border border-slate-850 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${completedPct}%` }}></div>
                </div>
              </div>

              {/* Task In Progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-300">
                  <span>In Progress</span>
                  <span className="font-mono text-white">{metrics.productivity.in_progress} ({progressPct}%)</span>
                </div>
                <div className="h-2 w-full bg-slate-950/50 border border-slate-850 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 transition-all duration-300" style={{ width: `${progressPct}%` }}></div>
                </div>
              </div>

              {/* Task Todo */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-300">
                  <span>Open Tasks (Todo)</span>
                  <span className="font-mono text-white">{metrics.productivity.open} ({openPct}%)</span>
                </div>
                <div className="h-2 w-full bg-slate-950/50 border border-slate-850 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-500 transition-all duration-300" style={{ width: `${openPct}%` }}></div>
                </div>
              </div>

              {/* Task Overdue */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-300">
                  <span>Overdue Blockers</span>
                  <span className="font-mono text-red-400 font-bold">{metrics.productivity.overdue} ({overduePct}%)</span>
                </div>
                <div className="h-2 w-full bg-slate-950/50 border border-slate-850 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${overduePct}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Search topic trends */}
          <div className="bg-slate-900/20 p-6 rounded-xl border border-slate-800 shadow-sm space-y-4 text-white">
            <h3 className="text-xs uppercase font-mono tracking-wider text-teal-400 font-bold border-b border-slate-850 pb-2">
              Popular Search Topics
            </h3>
            <div className="space-y-3">
              {metrics.knowledge.popular_topics.map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-xs border-b border-slate-850 pb-2 last:border-0 last:pb-0">
                  <span className="text-slate-300 font-medium truncate max-w-[170px] font-sans">{item.topic}</span>
                  <span className="text-[10px] bg-slate-955/50 text-slate-400 border border-slate-850 px-2 py-0.5 rounded font-mono font-bold">
                    {item.searches} queries
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

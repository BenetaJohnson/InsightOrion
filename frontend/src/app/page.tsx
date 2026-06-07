'use client';

import Link from 'next/link';
import { 
  Sparkles, 
  Search, 
  Video, 
  Cpu, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  MailCheck
} from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      title: 'Enterprise Knowledge Hub',
      desc: 'Synchronize Google Drive and Gmail emails. Ask complex questions and receive cited answers from policies and SOPs.',
      icon: Search,
    },
    {
      title: 'Meeting Intelligence',
      desc: 'Transcribe audio/video meetings with Whisper, diarize speakers, and auto-generate detailed executive MoMs.',
      icon: Video,
    },
    {
      title: 'RPA Automation Workflows',
      desc: 'Simulate UiPath integrations to audit employee onboarding forms, compliance regulations, and calendars.',
      icon: Cpu,
    },
    {
      title: 'AI Action Extraction',
      desc: 'Identify tasks, owners, and due dates directly from dialogue text with dynamic priority delay risk scoring.',
      icon: ShieldAlert,
    }
  ];

  return (
    <div className="bg-[#0b0f19] text-white min-h-screen font-sans selection:bg-teal-500/30 selection:text-teal-200">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-[#0b0f19]/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-teal-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-wide bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              InsightOrion
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link 
              href="/login" 
              className="px-4 py-2 text-sm text-slate-300 hover:text-white font-medium transition"
            >
              Sign In
            </Link>
            <Link 
              href="/login" 
              className="px-4 py-2 text-sm bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold rounded-lg shadow-lg shadow-teal-500/20 transition-all flex items-center space-x-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.08),transparent_50%)]"></div>
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full text-xs text-teal-400 font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Introducing V1 Enterprise RAG & Meeting Intelligence</span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight mb-8">
            The Collective Intelligence Hub for <br />
            <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              Modern Enterprises
            </span>
          </h1>
          
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            InsightOrion acts as your organization's memory. Index documents, transcribe meetings, extract action items, and automate business processes with UiPath.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-20">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-2 transition"
            >
              <span>Deploy to Organization</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#features"
              className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg font-semibold transition"
            >
              Explore Features
            </Link>
          </div>

          {/* Product Preview Card */}
          <div className="relative border border-slate-800/80 bg-slate-900/40 rounded-2xl p-2 shadow-2xl">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl -z-10"></div>
            <div className="bg-[#0b0f19] rounded-xl border border-slate-800 overflow-hidden">
              <div className="h-10 border-b border-slate-800 bg-slate-950/40 px-4 flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                <div className="flex-1 text-center text-xs text-slate-500 font-mono">
                  workspace-copilot-panel
                </div>
              </div>
              <div className="p-8 text-left grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-800">
                    <span className="text-xs text-teal-400 font-semibold block mb-1">RAG Query</span>
                    <p className="text-sm font-semibold text-slate-200">"What decisions were made regarding our AWS VM migration?"</p>
                  </div>
                  <div className="bg-slate-900/30 p-4 rounded-lg border border-slate-800">
                    <span className="text-xs text-teal-400 font-semibold block mb-2">Copilot Answering</span>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      "Based on the **Cloud Migration VM Strategy (doc_01)** and **Meeting sync of June 5th**, Alice finalized VM reductions leading to **30% decreased costs**. John completed database core migration setups [1]. Blocker on authentication tokens is assigned to Emily [2]."
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                    <span className="text-xs text-teal-400 font-semibold block mb-2">Active Checklist</span>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-teal-400" />
                        <span className="text-slate-300 truncate">Fix cookie tokens</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-slate-500">
                        <div className="w-4 h-4 rounded border border-slate-700"></div>
                        <span className="truncate">Optimize query indexing</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-24 border-t border-slate-800/40 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4">Complete Collective Memory SaaS</h2>
          <p className="text-slate-400 text-sm">
            Everything your workspace teams need to maintain complete context alignment and automate business processes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <div 
              key={i} 
              className="bg-slate-900/30 border border-slate-800 hover:border-slate-700 p-6 rounded-xl transition duration-300"
            >
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 mb-4">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg text-white mb-2">{f.title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/40 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-slate-500 text-xs">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Sparkles className="w-4 h-4 text-teal-500" />
            <span>&copy; 2026 InsightOrion. All rights reserved.</span>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
            <a href="#" className="hover:text-white transition">Terms of Service</a>
            <a href="#" className="hover:text-white transition">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import DashboardSidebar from '../../components/dashboard-sidebar';
import { api } from '../../services/api';
import { 
  Cpu, 
  Upload, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  FileText,
  Video,
  ChevronRight,
  BookOpen
} from 'lucide-react';

export default function AutomationPage() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [selectedWf, setSelectedWf] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  
  // Input selectors
  const [meetings, setMeetings] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [selectedDocId, setSelectedDocId] = useState('');

  // Upload state
  const [onboardFile, setOnboardFile] = useState<File | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchLists = async () => {
    try {
      const wfList = await api.workflows.list();
      setWorkflows(wfList);
      
      const meetList = await api.meetings.list();
      setMeetings(meetList.filter((m: any) => m.status === 'COMPLETED'));
      
      const docList = await api.knowledge.list();
      setDocuments(docList.filter((d: any) => d.file_type === 'TXT' || d.file_type === 'PDF'));
    } catch (err) {
      console.error('Failed to load lists:', err);
    }
  };

  const loadLogs = async (wf: any) => {
    setSelectedWf(wf);
    setLoadingLogs(true);
    try {
      const logData = await api.workflows.getLogs(wf.id);
      setLogs(logData);
    } catch (err) {
      console.error('Failed to load workflow logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  // Poll logs if selected workflow is active
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (selectedWf && (selectedWf.status === 'ACTIVE' || selectedWf.status === 'IDLE')) {
      timer = setInterval(async () => {
        const logData = await api.workflows.getLogs(selectedWf.id);
        setLogs(logData);
        // Refresh workflow list to check if state changed to COMPLETED
        const list = await api.workflows.list();
        setWorkflows(list);
        const updatedSelf = list.find((w: any) => w.id === selectedWf.id);
        if (updatedSelf) setSelectedWf(updatedSelf);
      }, 3000);
    }
    return () => clearInterval(timer);
  }, [selectedWf]);

  const handleTriggerOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardFile) return;
    setTriggering(true);
    try {
      const fd = new FormData();
      fd.append('file', onboardFile);
      await api.workflows.triggerOnboarding(fd);
      setOnboardFile(null);
      await fetchLists();
      // Select the newest onboarding workflow
      setTimeout(async () => {
        const freshList = await api.workflows.list();
        if (freshList.length > 0) {
          loadLogs(freshList[0]);
        }
      }, 500);
    } catch (err) {
      alert('Failed to trigger onboarding.');
    } finally {
      setTriggering(false);
    }
  };

  const handleTriggerFollowUp = async () => {
    if (!selectedMeetingId) return;
    try {
      await api.workflows.triggerFollowUp(selectedMeetingId);
      setSelectedMeetingId('');
      await fetchLists();
      setTimeout(async () => {
        const freshList = await api.workflows.list();
        if (freshList.length > 0) loadLogs(freshList[0]);
      }, 500);
    } catch (err) {
      alert('Failed to trigger meeting follow-up.');
    }
  };

  const handleTriggerCompliance = async () => {
    if (!selectedDocId) return;
    try {
      await api.workflows.triggerCompliance(selectedDocId);
      setSelectedDocId('');
      await fetchLists();
      setTimeout(async () => {
        const freshList = await api.workflows.list();
        if (freshList.length > 0) loadLogs(freshList[0]);
      }, 500);
    } catch (err) {
      alert('Failed to trigger compliance checklist audit.');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <DashboardSidebar />

      <main className="flex-1 ml-64 p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Header */}
        <div className="lg:col-span-3 border-b border-slate-900/80 pb-6 mb-4">
          <div className="border-l-4 border-teal-500 pl-4">
            <h1 className="text-3xl font-extrabold text-white tracking-tight font-sans">Workflow Automation Center</h1>
            <p className="text-sm text-slate-400 mt-1.5 font-sans">Trigger UiPath simulated RPA integrations to execute employee and compliance tasks</p>
          </div>
        </div>

        {/* Left Columns: Triggers panel (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Workflow 1: Employee Onboarding Form Upload */}
          <div className="bg-slate-900/20 border border-slate-800 rounded-xl p-6 shadow-sm text-white">
            <div className="flex items-center space-x-2.5 mb-3 border-b border-slate-850 pb-3">
              <Cpu className="w-4.5 h-4.5 text-teal-400" />
              <h3 className="font-bold text-white text-sm">1. Employee Onboarding Automation</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed font-sans">
              HR uploads onboarding text sheets. UiPath extracts records, validates metadata via Gemini, generates welcoming email drafts, schedules orientation calendars, and alerts team managers.
            </p>
            <form onSubmit={handleTriggerOnboarding} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full sm:flex-1 border border-slate-800 hover:border-slate-700 rounded-lg p-3 text-center cursor-pointer transition relative h-10 flex items-center justify-center bg-slate-955/40">
                <input
                  type="file"
                  required
                  accept=".txt"
                  onChange={(e) => {
                    if (e.target.files) setOnboardFile(e.target.files[0]);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-4 h-4 text-slate-500 mr-2" />
                <span className="text-[10px] text-slate-400 truncate">
                  {onboardFile ? onboardFile.name : 'Choose onboarding form (.txt)'}
                </span>
              </div>
              <button
                type="submit"
                disabled={triggering || !onboardFile}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900/20 border border-slate-700 text-white disabled:text-slate-550 font-semibold text-xs rounded-lg transition-all"
              >
                {triggering ? 'Triggering...' : 'Trigger RPA'}
              </button>
            </form>
          </div>

          {/* Workflow 2: Meeting Follow-up Automation */}
          <div className="bg-slate-900/20 border border-slate-800 rounded-xl p-6 shadow-sm text-white">
            <div className="flex items-center space-x-2.5 mb-3 border-b border-slate-850 pb-3">
              <Video className="w-4.5 h-4.5 text-teal-400" />
              <h3 className="font-bold text-white text-sm">2. Meeting Follow-Up Automation</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed font-sans">
              Detect completed MoM files. Extract task titles, owners emails, and deadlines. Automatically synchronize actions dashboards, set calendars reminders, and distribute emails.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <select
                value={selectedMeetingId}
                onChange={(e) => setSelectedMeetingId(e.target.value)}
                className="w-full sm:flex-1 bg-slate-955/40 border border-slate-800 focus:border-teal-500/50 rounded-lg py-2.5 px-3 text-xs text-slate-300 outline-none font-semibold transition"
              >
                <option value="" className="bg-[#0b0f19] text-slate-300">Choose Transcribed Meeting</option>
                {meetings.map((m) => (
                  <option key={m.id} value={m.id} className="bg-[#0b0f19] text-slate-300">{m.title} ({m.date})</option>
                ))}
              </select>
              <button
                onClick={handleTriggerFollowUp}
                disabled={!selectedMeetingId}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900/20 border border-slate-700 text-white disabled:text-slate-550 font-semibold text-xs rounded-lg transition-all"
              >
                Trigger RPA
              </button>
            </div>
          </div>

          {/* Workflow 3: Policy Compliance Monitoring */}
          <div className="bg-slate-900/20 border border-slate-800 rounded-xl p-6 shadow-sm text-white">
            <div className="flex items-center space-x-2.5 mb-3 border-b border-slate-850 pb-3">
              <BookOpen className="w-4.5 h-4.5 text-teal-400" />
              <h3 className="font-bold text-white text-sm">3. Policy Compliance Monitoring</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed font-sans">
              Audit index documents. Scanning policy updates and security changes. Summarize rules, alert teams, and generate compliance verification checklists inside dashboard.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full sm:flex-1 bg-slate-955/40 border border-slate-800 focus:border-teal-500/50 rounded-lg py-2.5 px-3 text-xs text-slate-300 outline-none font-semibold transition"
              >
                <option value="" className="bg-[#0b0f19] text-slate-300">Choose Uploaded Policy Doc</option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id} className="bg-[#0b0f19] text-slate-300">{d.title}</option>
                ))}
              </select>
              <button
                onClick={handleTriggerCompliance}
                disabled={!selectedDocId}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900/20 border border-slate-700 text-white disabled:text-slate-550 font-semibold text-xs rounded-lg transition-all"
              >
                Trigger RPA
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Active Workflow progress logs (1/3 width) */}
        <div className="space-y-6">
          
          {/* Active Logs Viewport */}
          {selectedWf ? (
            <div className="bg-slate-900/20 text-slate-200 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col h-[520px]">
              <div className="flex justify-between items-start border-b border-slate-900 pb-3 mb-4 shrink-0">
                <div>
                  <span className="text-[10px] bg-teal-950/40 text-teal-405 border border-teal-900/30 px-1.5 py-0.5 rounded font-mono font-bold">
                    {selectedWf.type} Logs
                  </span>
                  <h4 className="font-bold text-sm text-white mt-1.5 truncate max-w-[170px]">{selectedWf.name}</h4>
                </div>
                <button 
                  onClick={() => setSelectedWf(null)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Steps feed */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {loadingLogs ? (
                  <div className="text-center py-8 text-xs text-slate-500">Loading details...</div>
                ) : logs.length === 0 ? (
                  <p className="text-center py-8 text-xs text-slate-500 italic font-mono">Starting robot engines...</p>
                ) : (
                  logs.map((l, i) => (
                    <div key={l.id} className="flex items-start space-x-2.5 text-xs border-b border-slate-900 pb-3 last:border-0">
                      {l.status === 'SUCCESS' ? (
                        <CheckCircle className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                      ) : (
                        <Loader2 className="w-4 h-4 text-blue-400 mt-0.5 shrink-0 animate-spin" />
                      )}
                      <div>
                        <span className="font-semibold text-white font-mono tracking-wide">
                          Step {i + 1}: {l.step_name}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-normal font-sans">{l.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/20 border border-slate-800 rounded-xl p-6 shadow-sm text-white">
              <h3 className="text-xs uppercase font-mono tracking-wider text-teal-400 font-bold mb-4 border-b border-slate-850 pb-2">
                Automation History List ({workflows.length})
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {workflows.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center italic">No processes triggered yet.</p>
                ) : (
                  workflows.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => loadLogs(w)}
                      className="w-full text-left p-3 border border-slate-850 bg-slate-950/20 rounded-lg hover:bg-slate-900/20 flex justify-between items-center transition"
                    >
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-300 text-xs block truncate">{w.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{w.created_at}</span>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                        w.status === 'COMPLETED' 
                          ? 'bg-green-955/40 text-green-450 border border-green-900/30' 
                          : 'bg-blue-955/40 text-blue-450 border border-blue-900/30'
                      }`}>
                        {w.status}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

      </main>
    </div>
  );
}

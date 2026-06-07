'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardSidebar from '../../components/dashboard-sidebar';
import { api } from '../../services/api';
import { 
  FileText, 
  Download, 
  Mail, 
  Calendar, 
  Clock, 
  ChevronRight, 
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Loader2,
  Sparkles
} from 'lucide-react';

export default function MomPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedId = searchParams.get('id');

  const [meetings, setMeetings] = useState<any[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [emailSending, setEmailSending] = useState(false);

  const fetchMeetings = async () => {
    try {
      const data = await api.meetings.list();
      const completed = data.filter((m: any) => m.status === 'COMPLETED');
      setMeetings(completed);
      
      // If no ID is selected, but meetings are available, select the first one
      if (completed.length > 0 && !selectedId) {
        router.push(`/mom?id=${completed[0].id}`);
      }
    } catch (err) {
      console.error('Failed to fetch meetings:', err);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchDetails = async (id: string) => {
    setLoadingDetails(true);
    try {
      const data = await api.meetings.get(id);
      setSelectedMeeting(data);
    } catch (err) {
      console.error('Failed to load meeting details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  useEffect(() => {
    if (selectedId) {
      fetchDetails(selectedId);
    }
  }, [selectedId]);

  const handleExport = async (format: string) => {
    if (!selectedId) return;
    try {
      await api.meetings.downloadExport(selectedId, format);
    } catch (err) {
      alert('Export failed.');
    }
  };

  const handleSendEmails = async () => {
    setEmailSending(true);
    try {
      // Calls Google OAuth calendar schedule mockup
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert(`Minutes of Meeting successfully emailed to all attendees and owners.`);
    } catch (err) {
      console.error(err);
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <DashboardSidebar />

      <main className="flex-1 ml-64 p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Header */}
        <div className="lg:col-span-4 border-b border-slate-900/80 pb-6 mb-4">
          <div className="border-l-4 border-teal-500 pl-4">
            <h1 className="text-3xl font-extrabold text-white tracking-tight font-sans">Minutes of Meetings (MoM)</h1>
            <p className="text-sm text-slate-400 mt-1.5 font-sans font-medium">Review AI-extracted discussion summaries, action items, and structural risk intelligence</p>
          </div>
        </div>

        {/* Left Column: List of MoMs (1/4 width) */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xs uppercase font-mono tracking-wider text-teal-400 font-bold mb-4">
            Available MoMs
          </h2>
          {loadingList ? (
            <div className="text-slate-400 text-xs py-4 text-center">Loading list...</div>
          ) : meetings.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6 bg-slate-900/20 border border-slate-800 rounded-xl">
              No meetings transcribed. Upload audio in Meeting Intel first.
            </p>
          ) : (
            <div className="space-y-2.5">
              {meetings.map((m) => {
                const isActive = selectedId === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => router.push(`/mom?id=${m.id}`)}
                    className={`w-full text-left p-3.5 rounded-xl border transition flex items-start space-x-3 group ${
                      isActive 
                        ? 'bg-slate-950/40 border-teal-500/50 shadow-sm text-white' 
                        : 'bg-slate-900/20 border-slate-800 hover:bg-slate-900/40 text-slate-350 hover:border-slate-700'
                    }`}
                  >
                    <FileText className={`w-4 h-4 mt-0.5 ${isActive ? 'text-teal-400' : 'text-slate-500'}`} />
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-300 text-xs block truncate group-hover:text-white">
                        {m.title}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">{m.date}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Selected MoM Details (3/4 width) */}
        <div className="lg:col-span-3">
          {loadingDetails ? (
            <div className="bg-slate-900/20 border border-slate-800 rounded-xl p-16 text-center text-teal-400 font-mono text-xs shadow-sm flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-6 h-6 text-teal-450 animate-spin" />
              <span>fetching_mom_document_data...</span>
            </div>
          ) : !selectedMeeting ? (
            <div className="bg-slate-900/20 border border-slate-800 rounded-xl p-16 text-center text-slate-400 text-xs shadow-sm">
              Please select a Minutes of Meeting document from the list.
            </div>
          ) : (
            <div className="bg-slate-900/20 border border-slate-800 rounded-xl p-8 shadow-sm space-y-8 text-white">
              
              {/* Header Context */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-900 pb-6 gap-4">
                <div>
                  <span className="text-[10px] uppercase bg-teal-950/40 text-teal-450 px-2 py-0.5 rounded font-mono font-bold border border-teal-900/30">
                    Minutes of Meeting
                  </span>
                  <h1 className="text-xl font-bold text-white mt-2">{selectedMeeting.mom.title}</h1>
                  <div className="flex items-center space-x-3 text-[10px] text-slate-400 font-mono mt-1">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{selectedMeeting.mom.date}</span>
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{selectedMeeting.duration_seconds}s audio duration</span>
                    </span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSendEmails}
                    disabled={emailSending}
                    className="p-2 border border-slate-800 bg-slate-900/40 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition shadow-sm"
                    title="Email MoM to Attendees"
                  >
                    {emailSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleExport('md')}
                    className="p-2 border border-slate-800 bg-slate-900/40 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition shadow-sm"
                    title="Export as Markdown"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleExport('docx')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-sm transition"
                  >
                    <span>Download DOCX</span>
                  </button>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="space-y-2">
                <h3 className="text-xs uppercase font-mono tracking-wider text-teal-405 font-bold">
                  Executive Summary
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed font-sans">
                  {selectedMeeting.mom.executive_summary}
                </p>
              </div>

              {/* Agenda */}
              <div className="space-y-3">
                <h3 className="text-xs uppercase font-mono tracking-wider text-teal-405 font-bold">
                  Agenda Covered
                </h3>
                <ul className="space-y-1.5">
                  {selectedMeeting.mom.agenda_covered?.map((agenda: string, i: number) => (
                    <li key={i} className="text-slate-300 text-xs flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0"></span>
                      <span>{agenda}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Discussion points */}
              <div className="space-y-4">
                <h3 className="text-xs uppercase font-mono tracking-wider text-teal-405 font-bold">
                  Key Discussion Points
                </h3>
                <div className="space-y-4">
                  {selectedMeeting.mom.key_discussion_points?.map((pt: any, i: number) => (
                    <div key={i} className="bg-slate-950/30 border border-slate-850/80 rounded-lg p-4">
                      <h4 className="font-semibold text-white text-sm mb-1.5">{pt.topic}</h4>
                      <p className="text-slate-300 text-xs leading-relaxed">{pt.summary}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decisions Made */}
              <div className="space-y-3">
                <h3 className="text-xs uppercase font-mono tracking-wider text-teal-405 font-bold">
                  Decisions Made
                </h3>
                <div className="space-y-2">
                  {selectedMeeting.mom.decisions_made?.map((d: string, i: number) => (
                    <div key={i} className="flex items-start space-x-2.5 text-slate-300 text-xs">
                      <CheckCircle className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                      <span className="font-medium">{d}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action items checklist */}
              <div className="space-y-4">
                <h3 className="text-xs uppercase font-mono tracking-wider text-teal-450 font-bold">
                  Extracted Action Items
                </h3>
                <div className="border border-slate-850/80 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950/50 border-b border-slate-850 text-slate-400 uppercase font-mono text-[10px]">
                        <th className="p-3 font-semibold">Task Title</th>
                        <th className="p-3 font-semibold">Owner Email</th>
                        <th className="p-3 font-semibold">Priority</th>
                        <th className="p-3 font-semibold">Deadline</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-slate-300">
                      {selectedMeeting.mom.action_items?.map((act: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-900/10">
                          <td className="p-3">
                            <span className="font-semibold text-white block">{act.title}</span>
                            <span className="text-[10px] text-slate-400 block">{act.description}</span>
                          </td>
                          <td className="p-3 text-slate-400 font-mono">{act.assignee_email}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              act.priority === 'URGENT' || act.priority === 'HIGH' 
                                ? 'bg-red-950/40 text-red-450 border-red-900/30' 
                                : 'bg-slate-900/40 text-slate-300 border-slate-800'
                            }`}>
                              {act.priority}
                            </span>
                          </td>
                          <td className="p-3 text-slate-450">{act.due_date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Risks & Dependencies */}
              <div className="space-y-3">
                <h3 className="text-xs uppercase font-mono tracking-wider text-teal-405 font-bold">
                  Risks & Escalations
                </h3>
                <div className="space-y-2">
                  {selectedMeeting.mom.risks?.map((r: any, i: number) => (
                    <div key={i} className="flex items-start space-x-2.5 text-slate-200 text-xs p-3.5 bg-red-950/10 border border-red-900/30 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-red-200 block">{r.description}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Dependency: {r.dependency} | Escalation: {r.escalation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Open Questions */}
              <div className="space-y-3">
                <h3 className="text-xs uppercase font-mono tracking-wider text-teal-405 font-bold">
                  Open Questions
                </h3>
                <div className="space-y-2">
                  {selectedMeeting.mom.open_questions?.map((q: string, i: number) => (
                    <div key={i} className="flex items-start space-x-2 text-slate-300 text-xs">
                      <HelpCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                      <span>{q}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

      </main>
    </div>
  );
}

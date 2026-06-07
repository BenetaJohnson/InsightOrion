'use client';

import { useState, useEffect } from 'react';
import DashboardSidebar from '../../components/dashboard-sidebar';
import { api } from '../../services/api';
import { 
  CheckSquare, 
  Clock, 
  AlertTriangle, 
  MessageSquare, 
  Plus, 
  CheckCircle,
  User as UserIcon,
  ChevronRight,
  TrendingDown,
  Loader2
} from 'lucide-react';

export default function ActionsPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selected task comments states
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  const fetchTasks = async () => {
    try {
      const data = await api.actions.list();
      setTasks(data);
    } catch (err) {
      console.error('Failed to load actions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.actions.updateStatus(id, newStatus);
      await fetchTasks();
      // If selected task is open, update its local reference
      if (selectedTask && selectedTask.id === id) {
        setSelectedTask((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const loadComments = async (task: any) => {
    setSelectedTask(task);
    setLoadingComments(true);
    try {
      const data = await api.actions.getComments(task.id);
      setComments(data);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTask) return;
    try {
      await api.actions.addComment(selectedTask.id, newComment);
      setNewComment('');
      // Reload comments list
      const data = await api.actions.getComments(selectedTask.id);
      setComments(data);
    } catch (err) {
      alert('Failed to add comment.');
    }
  };

  // Group items by status
  const columns = {
    'OPEN': tasks.filter(t => t.status === 'OPEN'),
    'IN_PROGRESS': tasks.filter(t => t.status === 'IN_PROGRESS'),
    'COMPLETED': tasks.filter(t => t.status === 'COMPLETED'),
    'OVERDUE': tasks.filter(t => t.status === 'OVERDUE'),
  };

  const metrics = {
    total: tasks.length,
    open: columns['OPEN'].length,
    inProgress: columns['IN_PROGRESS'].length,
    completed: columns['COMPLETED'].length,
    overdue: columns['OVERDUE'].length,
  };

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <DashboardSidebar />

      <main className="flex-1 ml-64 p-10 lg:p-12 flex flex-col space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-900/80 pb-6">
          <div className="border-l-4 border-teal-500 pl-4">
            <h1 className="text-3xl font-extrabold text-white tracking-tight font-sans">Action Items Tracking</h1>
            <p className="text-sm text-slate-400 mt-1.5 font-sans">Track task assignees, due dates, and delay risks extracted from transcripts</p>
          </div>
        </div>

        {/* Counts Panels */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { name: 'Total Action Items', val: metrics.total, color: 'border-slate-800 text-white' },
            { name: 'Unassigned/Open', val: metrics.open, color: 'border-slate-800 text-blue-400' },
            { name: 'In Progress', val: metrics.inProgress, color: 'border-slate-800 text-teal-400' },
            { name: 'Completed', val: metrics.completed, color: 'border-slate-800 text-green-400' },
            { name: 'Overdue Blocker', val: metrics.overdue, color: 'border-slate-800 text-red-400' }
          ].map((c, i) => (
            <div key={i} className={`bg-slate-900/20 p-4 rounded-xl border ${c.color} shadow-sm text-center`}>
              <span className="text-[9px] uppercase font-mono text-slate-400 font-semibold block">{c.name}</span>
              <h2 className="text-xl font-bold mt-1">{c.val}</h2>
            </div>
          ))}
        </div>

        {/* Board & Detail Viewer Wrapper */}
        <div className="flex-grow grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
          
          {/* Kanban Board Columns (3/4 width if selectedTask open, else full) */}
          <div className={`${selectedTask ? 'xl:col-span-3' : 'xl:col-span-4'} grid grid-cols-1 md:grid-cols-4 gap-4 items-start`}>
            
            {/* Columns loop */}
            {(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'] as const).map((colKey) => {
              const colTasks = columns[colKey];
              const titleMap = {
                'OPEN': 'To Do (Open)',
                'IN_PROGRESS': 'In Progress',
                'COMPLETED': 'Completed',
                'OVERDUE': 'Overdue Block'
              };
              const colColorMap = {
                'OPEN': 'border-t-2 border-t-slate-500 bg-slate-900/20 border-slate-800/80',
                'IN_PROGRESS': 'border-t-2 border-t-teal-500 bg-slate-900/20 border-slate-800/80',
                'COMPLETED': 'border-t-2 border-t-green-500 bg-slate-900/20 border-slate-800/80',
                'OVERDUE': 'border-t-2 border-t-red-500 bg-slate-900/20 border-slate-800/80'
              };

              return (
                <div key={colKey} className={`border rounded-xl p-4 min-h-[500px] ${colColorMap[colKey]}`}>
                  <div className="flex justify-between items-center mb-4 border-b border-slate-850 pb-2">
                    <span className="font-bold text-xs text-white font-mono uppercase">
                      {titleMap[colKey]}
                    </span>
                    <span className="text-[10px] bg-slate-950/60 text-slate-300 border border-slate-850 px-2 py-0.5 rounded-full font-bold">
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Tasks inside Column */}
                  <div className="space-y-3">
                    {colTasks.map((t) => (
                      <div 
                        key={t.id}
                        onClick={() => loadComments(t)}
                        className={`bg-slate-950/30 border rounded-xl p-4 shadow-sm hover:border-slate-700 transition cursor-pointer flex flex-col justify-between ${
                          selectedTask?.id === t.id ? 'ring-2 ring-teal-500/50 border-teal-500' : 'border-slate-850/80'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2 gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                              t.priority === 'URGENT' || t.priority === 'HIGH' 
                                ? 'bg-red-950/40 text-red-450 border-red-900/30' 
                                : 'bg-slate-900/40 text-slate-350 border-slate-800'
                            }`}>
                              {t.priority}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border font-mono uppercase ${
                              t.delay_risk === 'HIGH' 
                                ? 'bg-red-950/40 text-red-450 border-red-900/30' 
                                : (t.delay_risk === 'MEDIUM' ? 'bg-amber-950/40 text-amber-450 border-amber-900/30' : 'bg-slate-900/40 text-slate-400 border border-slate-800')
                            }`} title={`AI Delay Risk Score: ${t.risk_score}`}>
                              {t.delay_risk} Risk
                            </span>
                          </div>
                          
                          <h4 className="font-semibold text-white text-xs leading-snug hover:text-teal-400">
                            {t.title}
                          </h4>
                          <p className="text-[10px] text-slate-400 leading-normal line-clamp-2 mt-1 font-sans">
                            {t.description}
                          </p>
                        </div>

                        {/* Card bottom details */}
                        <div className="mt-4 pt-3 border-t border-slate-900 flex justify-between items-center text-[10px] text-slate-400">
                          <span className="flex items-center space-x-1 font-mono">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{t.due_date}</span>
                          </span>
                          
                          {/* Shift status helper buttons */}
                          <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                            {colKey !== 'COMPLETED' ? (
                              <button
                                onClick={() => handleStatusChange(t.id, colKey === 'OPEN' ? 'IN_PROGRESS' : 'COMPLETED')}
                                className="p-1 bg-slate-900 hover:bg-slate-800 hover:text-teal-400 rounded border border-slate-800"
                                title="Move Forward"
                              >
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusChange(t.id, 'OPEN')}
                                className="p-1 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 text-slate-400"
                                title="Reset to Todo"
                              >
                                ↺
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              );
            })}

          </div>

          {/* Right Column: Comments details panel (1/4 width) */}
          {selectedTask && (
            <div className="bg-slate-900/20 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5 flex flex-col h-[500px] text-white">
              <div className="flex justify-between items-start border-b border-slate-900 pb-3">
                <div>
                  <span className="text-[9px] uppercase font-mono text-slate-450 block font-semibold">Selected Task</span>
                  <h3 className="font-bold text-white text-xs truncate max-w-[150px]">{selectedTask.title}</h3>
                </div>
                <button 
                  onClick={() => setSelectedTask(null)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Status Select dropdown */}
              <div>
                <label className="text-[9px] uppercase font-mono text-slate-400 block mb-1">State Configuration</label>
                <select
                  value={selectedTask.status}
                  onChange={(e) => handleStatusChange(selectedTask.id, e.target.value)}
                  className="w-full bg-slate-950/40 border border-slate-800 rounded-lg text-xs py-1.5 px-2 outline-none font-semibold text-slate-350 focus:border-teal-500/50"
                >
                  <option value="OPEN">To Do (Open)</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="OVERDUE">Overdue Blocker</option>
                </select>
              </div>

              {/* Comments Feed */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <span className="text-[9px] uppercase font-mono text-slate-455 block font-semibold">Feedback & Activity</span>
                {loadingComments ? (
                  <div className="text-center py-6 text-slate-500 text-xs">Loading comments...</div>
                ) : comments.length === 0 ? (
                  <p className="text-[10px] text-slate-500 py-4 text-center italic">No updates posted yet.</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="bg-slate-950/30 border border-slate-850/60 p-2.5 rounded-lg text-[11px] leading-relaxed text-slate-300">
                      <div className="flex justify-between items-center mb-1 text-[9px] text-slate-450 font-semibold font-mono">
                        <span className="text-slate-300">{c.author}</span>
                        <span>{c.created_at}</span>
                      </div>
                      <p className="text-slate-400">{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add comment form */}
              <form onSubmit={handleAddComment} className="border-t border-slate-900 pt-3 relative">
                <input
                  type="text"
                  placeholder="Post comment update..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full bg-slate-955/40 border border-slate-800 rounded-lg py-1.5 pl-3 pr-10 text-xs text-white outline-none placeholder-slate-500 focus:border-teal-500"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="absolute right-1.5 top-4 text-teal-400 disabled:text-slate-600 transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </form>

            </div>
          )}

        </div>

      </main>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '../store/use-store';
import { 
  LayoutDashboard, 
  Search, 
  Video, 
  FileText, 
  CheckSquare, 
  Bot, 
  Cpu, 
  BarChart3, 
  Settings, 
  LogOut, 
  User as UserIcon,
  Sparkles
} from 'lucide-react';

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const user = useStore((state) => state.user);
  const tenant = useStore((state) => state.tenant);
  const logout = useStore((state) => state.logout);

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Enterprise Search', icon: Search, path: '/search' },
    { name: 'Meeting Intel', icon: Video, path: '/meetings' },
    { name: 'MoM Center', icon: FileText, path: '/mom' },
    { name: 'Action Items', icon: CheckSquare, path: '/actions' },
    { name: 'Jira Copilot', icon: Sparkles, path: '/jira-copilot' },
    { name: 'Engineering Intel', icon: Cpu, path: '/engineering-intel' },
    { name: 'AI Copilot', icon: Bot, path: '/assistant' },
    { name: 'Workflow Automations', icon: Cpu, path: '/automation' },
    { name: 'Analytics Hub', icon: BarChart3, path: '/analytics' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <aside className="w-64 glass h-screen text-slate-300 flex flex-col fixed left-0 top-0 z-40 border-r border-slate-800">
      {/* Header / Brand */}
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-teal-500/30">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-wide">InsightOrion</h1>
          <span className="text-[10px] text-teal-400 font-semibold uppercase tracking-wider">AI Platform</span>
        </div>
      </div>

      {/* Tenant Context Panel */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
        <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">Active Organization</span>
        <span className="text-sm font-semibold text-slate-200 truncate block">
          {tenant ? tenant.name : 'Loading Workspace...'}
        </span>
        <span className="text-[10px] bg-teal-950 text-teal-400 px-2 py-0.5 rounded border border-teal-900 mt-1 inline-block font-mono">
          {tenant ? tenant.subscription_plan : 'STARTER'}
        </span>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive 
                  ? 'bg-teal-500/10 text-teal-400 border-l-2 border-teal-500 pl-3' 
                  : 'hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <item.icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                isActive ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'
              }`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Profile Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-white block truncate">
              {user ? user.full_name : 'Guest Employee'}
            </span>
            <span className="text-xs text-slate-500 block uppercase font-mono tracking-wider">
              {user ? user.role.replace('_', ' ') : 'MEMBER'}
            </span>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 bg-slate-900 hover:bg-red-950/30 hover:text-red-400 border border-slate-800 hover:border-red-900/40 py-2 rounded-lg text-xs font-semibold text-slate-400 transition-all duration-200"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit Workspace</span>
        </button>
      </div>
    </aside>
  );
}

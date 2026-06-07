'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardSidebar from '../../components/dashboard-sidebar';
import { api } from '../../services/api';
import { useStore } from '../../store/use-store';
import { 
  Settings, 
  Globe, 
  User as UserIcon, 
  Loader2, 
  CheckCircle2, 
  Sparkles,
  Lock,
  Building,
  ShieldCheck,
  EyeOff,
  Search
} from 'lucide-react';

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const token = useStore((state) => state.token);
  const user = useStore((state) => state.user);
  const tenant = useStore((state) => state.tenant);
  const setTenantStore = useStore((state) => state.setTenant);

  // States
  const [orgName, setOrgName] = useState(tenant?.name || '');
  const [subPlan, setSubPlan] = useState(tenant?.subscription_plan || 'STARTER');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [privacyLogs, setPrivacyLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Layout and mock integration states
  const [activeTab, setActiveTab] = useState<'profile' | 'org' | 'integrations' | 'logs'>('profile');
  const [slackConnected, setSlackConnected] = useState(false);
  const [jiraConnected, setJiraConnected] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  const fetchPrivacyLogs = async () => {
    setLoadingLogs(true);
    try {
      const data = await api.privacy.getAuditLogs();
      setPrivacyLogs(data);
    } catch (err) {
      console.error('Failed to load privacy logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPrivacyLogs();
    }
  }, [token]);

  // Check Google OAuth callback code in URL
  const code = searchParams.get('code');
  useEffect(() => {
    const handleGoogleCallback = async (authCode: string) => {
      setConnectingGoogle(true);
      setError(null);
      setSuccess(null);
      try {
        await api.auth.googleCallback(authCode);
        setSuccess('Successfully authorized Google Workspace connection.');
        
        // Refresh contexts
        const freshUser = await api.auth.getMe();
        const freshTenant = await api.tenants.getMe();
        useStore.getState().login(token!, freshUser);
        setTenantStore(freshTenant);

        router.replace('/settings');
      } catch (err: any) {
        setError(err.message || 'OAuth exchange failed.');
      } finally {
        setConnectingGoogle(false);
      }
    };

    if (code && token) {
      handleGoogleCallback(code);
    }
  }, [code, token, router]);

  const handleUpdateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.tenants.updateMe({
        name: orgName,
        subscription_plan: subPlan
      });
      setSuccess('Tenant settings updated successfully.');
      
      const freshTenant = await api.tenants.getMe();
      setTenantStore(freshTenant);
    } catch (err: any) {
      setError(err.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleConnectGoogle = async () => {
    setConnectingGoogle(true);
    try {
      const res = await api.auth.getGoogleUrl();
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      alert('Failed to construct Google authorize redirect.');
      setConnectingGoogle(false);
    }
  };

  // Tab configuration
  const tabs = [
    { id: 'profile', name: 'Profile & Security', icon: UserIcon },
    ...(user?.role === 'ORG_ADMIN' ? [{ id: 'org', name: 'Corporate Settings', icon: Building }] : []),
    { id: 'integrations', name: 'Connected Integrations', icon: Globe },
    { id: 'logs', name: 'Compliance Audit Logs', icon: ShieldCheck },
  ];

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <DashboardSidebar />

      <main className="flex-1 ml-64 p-10 lg:p-12 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-900/80 pb-6">
          <div className="border-l-4 border-teal-500 pl-4">
            <h1 className="text-3xl font-extrabold text-white tracking-tight font-sans">Settings & Integrations</h1>
            <p className="text-sm text-slate-400 mt-1.5 font-sans">Configure corporate settings, integrations refresh keys, and employee roles</p>
          </div>
        </div>

        {/* Global envelopes */}
        {error && (
          <div className="bg-red-955/20 border border-red-900/30 p-4 rounded-xl text-xs text-red-200 flex items-center space-x-2">
            <span>Error:</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-955/20 border border-green-900/30 p-4 rounded-xl text-xs text-green-200 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-green-455 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {connectingGoogle && (
          <div className="bg-blue-955/20 border border-blue-900/30 p-4 rounded-xl text-xs text-blue-200 flex items-center space-x-3">
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
            <span>Exchanging authorized token credentials keys...</span>
          </div>
        )}

        {/* Vertical Tab Split Layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left Column: Tab Selector */}
          <div className="w-full lg:w-64 shrink-0 bg-slate-900/20 rounded-xl border border-slate-800 p-3 space-y-1 shadow-sm">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    isActive 
                      ? 'bg-slate-900 border border-slate-750 text-white shadow-md' 
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-teal-400' : 'text-slate-500'}`} />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>

          {/* Right Column: Tab Content */}
          <div className="flex-1 w-full bg-slate-900/20 rounded-xl border border-slate-800 p-6 md:p-8 shadow-sm min-h-[500px] text-white">
            
            {/* PROFILE & SECURITY TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-sm font-bold text-teal-400 uppercase font-mono tracking-wider">Profile & Security</h2>
                  <p className="text-xs text-slate-400 mt-1">Manage your workspace identity and security configurations.</p>
                </div>

                <div className="flex items-center space-x-4 border-b border-slate-900 pb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-bold text-xl shadow-lg shadow-teal-500/20">
                    {user?.full_name ? user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'UA'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{user?.full_name || 'Guest Employee'}</h3>
                    <span className="text-[10px] bg-teal-950/40 text-teal-450 px-2 py-0.5 rounded border border-teal-900/30 mt-1.5 inline-block font-mono font-bold">
                      {user?.role || 'MEMBER'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Full Name</span>
                    <div className="bg-slate-955/40 border border-slate-850 rounded-lg p-3 text-xs text-slate-300 font-medium font-sans">
                      {user?.full_name}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Email Address</span>
                    <div className="bg-slate-955/40 border border-slate-850 rounded-lg p-3 text-xs text-slate-300 font-medium font-sans">
                      {user?.email}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-900 pt-6 space-y-4">
                  <h3 className="text-xs font-bold text-teal-400 uppercase font-mono tracking-wider">Preferences & Protection</h3>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-950/20 rounded-xl border border-slate-850/80">
                    <div>
                      <h4 className="text-xs font-bold text-white">Email Notifications</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-sans">Receive automated weekly reports and action items reminders.</p>
                    </div>
                    <button
                      onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                      className={`w-10 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 outline-none ${
                        notificationsEnabled ? 'bg-teal-500' : 'bg-slate-800'
                      }`}
                    >
                      <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                        notificationsEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-955/20 rounded-xl border border-slate-850/80">
                    <div>
                      <h4 className="text-xs font-bold text-white">Multi-Factor Authentication (MFA)</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-sans">Enforce an extra layer of protection on logins using Authenticator app.</p>
                    </div>
                    <button
                      onClick={() => setMfaEnabled(!mfaEnabled)}
                      className={`w-10 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 outline-none ${
                        mfaEnabled ? 'bg-teal-500' : 'bg-slate-800'
                      }`}
                    >
                      <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                        mfaEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CORPORATE SETTINGS TAB */}
            {activeTab === 'org' && user?.role === 'ORG_ADMIN' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-sm font-bold text-teal-400 uppercase font-mono tracking-wider">Corporate Settings</h2>
                  <p className="text-xs text-slate-400 mt-1">Manage tenant configurations and organization service tiers.</p>
                </div>

                <form onSubmit={handleUpdateTenant} className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase font-mono text-slate-450 block mb-1">Organization Name</label>
                    <input
                      type="text"
                      required
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="w-full bg-slate-955/40 border border-slate-800 focus:border-teal-500/50 rounded-lg py-2.5 px-3.5 text-xs text-white outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-mono text-slate-450 block mb-1">Subscription Plan Level</label>
                    <select
                      value={subPlan}
                      onChange={(e) => setSubPlan(e.target.value)}
                      className="w-full bg-slate-955/40 border border-slate-800 focus:border-teal-500/50 rounded-lg py-2.5 px-3 text-xs text-slate-300 outline-none font-semibold transition"
                    >
                      <option value="STARTER" className="bg-[#0b0f19] text-slate-300">Starter Pack (Free)</option>
                      <option value="PROFESSIONAL" className="bg-[#0b0f19] text-slate-300">Professional Tier</option>
                      <option value="ENTERPRISE" className="bg-[#0b0f19] text-slate-300">Enterprise Tier (RPA/UiPath enabled)</option>
                    </select>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900/20 text-white border border-slate-700 font-semibold text-xs rounded-lg shadow-sm transition"
                    >
                      {saving ? 'Saving changes...' : 'Save Settings'}
                    </button>
                  </div>
                </form>

                {/* Quota Section */}
                <div className="border-t border-slate-900 pt-6 space-y-4">
                  <h3 className="text-xs font-bold text-teal-400 uppercase font-mono tracking-wider">Workspace Quota & Resource Usage</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-slate-950/20 border border-slate-850/80 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-medium font-sans">Vector Database Ingestion</span>
                        <span className="font-bold text-white font-mono text-[10px]">1.2 GB / 10 GB</span>
                      </div>
                      <div className="w-full bg-slate-955/50 border border-slate-850 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: '12%' }} />
                      </div>
                      <p className="text-[9px] text-slate-500 leading-normal">12% total vector indexes utilized for RAG data parsing.</p>
                    </div>

                    <div className="p-4 bg-slate-955/20 border border-slate-850/80 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-medium font-sans">Whisper Transcription Hours</span>
                        <span className="font-bold text-white font-mono text-[10px]">8.5 hrs / 100 hrs</span>
                      </div>
                      <div className="w-full bg-slate-955/50 border border-slate-850 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: '8.5%' }} />
                      </div>
                      <p className="text-[9px] text-slate-500 leading-normal font-sans">8.5% total monthly Whisper API limit consumed.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CONNECTED INTEGRATIONS TAB */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-sm font-bold text-teal-400 uppercase font-mono tracking-wider">Connected Integrations</h2>
                  <p className="text-xs text-slate-400 mt-1">Connect corporate communication channels and document directories.</p>
                </div>

                <div className="space-y-4">
                  {/* Google Workspace */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-slate-950/20 rounded-xl border border-slate-805/85 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4.5 h-4.5 text-blue-400" />
                        <h3 className="font-bold text-white text-xs font-mono uppercase">Google Workspace</h3>
                        {user?.google_refresh_token && (
                          <span className="text-[9px] bg-green-955/40 text-green-455 px-1.5 py-0.5 rounded border border-green-900/30 font-bold font-mono">Connected</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-xl font-sans">
                        Authorize Drive and Gmail indices. Connects document stores directly to RAG indices to run automated updates.
                      </p>
                    </div>
                    <div className="shrink-0">
                      {user?.google_refresh_token ? (
                        <div className="flex items-center space-x-2 bg-green-955/40 border border-green-900/30 text-green-400 text-xs font-semibold px-4 py-2.5 rounded-lg">
                          <CheckCircle2 className="w-4 h-4 text-green-450" />
                          <span>Connected</span>
                        </div>
                      ) : (
                        <button
                          onClick={handleConnectGoogle}
                          disabled={connectingGoogle}
                          className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900/20 text-white disabled:text-slate-500 border border-slate-750 rounded-lg shadow-sm transition"
                        >
                          Connect Google Account
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Slack integration */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-slate-950/20 rounded-xl border border-slate-805/85 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="w-4.5 h-4.5 rounded bg-purple-950/50 border border-purple-900/30 flex items-center justify-center text-purple-400 text-[10px] font-bold font-mono">S</span>
                        <h3 className="font-bold text-white text-xs font-mono uppercase">Slack Sync</h3>
                        {slackConnected && (
                          <span className="text-[9px] bg-green-955/40 text-green-455 px-1.5 py-0.5 rounded border border-green-900/30 font-bold font-mono">Connected</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-xl font-sans">
                        Sync public Slack channel logs periodically. Resolves natural language queries about past discussions.
                      </p>
                    </div>
                    <div className="shrink-0">
                      <button
                        onClick={() => setSlackConnected(!slackConnected)}
                        className={`py-2 px-4 font-semibold text-xs rounded-lg shadow-sm border transition ${
                          slackConnected 
                            ? 'border-red-900/30 bg-red-955/40 text-red-400 hover:bg-red-900/30' 
                            : 'border-slate-800 bg-slate-955/40 text-slate-350 hover:bg-slate-800/40'
                        }`}
                      >
                        {slackConnected ? 'Disconnect' : 'Connect Slack'}
                      </button>
                    </div>
                  </div>

                  {/* Jira Cloud */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-slate-955/20 rounded-xl border border-slate-805/85 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="w-4.5 h-4.5 rounded bg-blue-955/50 border border-blue-900/30 flex items-center justify-center text-blue-400 text-[10px] font-bold font-mono">J</span>
                        <h3 className="font-bold text-white text-xs font-mono uppercase">Jira Cloud</h3>
                        {jiraConnected && (
                          <span className="text-[9px] bg-green-955/40 text-green-455 px-1.5 py-0.5 rounded border border-green-900/30 font-bold font-mono">Connected</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-xl font-sans">
                        Import Jira issues and tickets to power automation engines and sprint tracking.
                      </p>
                    </div>
                    <div className="shrink-0">
                      <button
                        onClick={() => setJiraConnected(!jiraConnected)}
                        className={`py-2 px-4 font-semibold text-xs rounded-lg shadow-sm border transition ${
                          jiraConnected 
                            ? 'border-red-900/30 bg-red-955/40 text-red-400 hover:bg-red-900/30' 
                            : 'border-slate-800 bg-slate-955/40 text-slate-350 hover:bg-slate-800/40'
                        }`}
                      >
                        {jiraConnected ? 'Disconnect' : 'Connect Jira'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* COMPLIANCE AUDIT LOGS TAB */}
            {activeTab === 'logs' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-teal-400 uppercase font-mono tracking-wider">Privacy Compliance Audit Logs</h2>
                    <p className="text-xs text-slate-400 mt-1 font-sans">
                      Audited logs of masked PII elements (emails, credentials, payroll wages) redacted before database ingestion.
                    </p>
                  </div>
                  <button 
                    onClick={fetchPrivacyLogs} 
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs rounded-lg shadow-sm transition"
                  >
                    Refresh Logs
                  </button>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-4 items-center bg-slate-950/20 p-4 rounded-xl border border-slate-850/80">
                  <div className="relative flex-1 w-full">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Search className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      placeholder="Filter logs by ID or details..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-955/40 border border-slate-800 focus:border-teal-500/50 rounded-lg py-2 pl-9 pr-4 text-xs text-white outline-none font-sans transition"
                    />
                  </div>
                  
                  <div className="shrink-0 w-full sm:w-auto">
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="w-full bg-slate-955/40 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-300 outline-none font-semibold font-sans transition"
                    >
                      <option value="ALL" className="bg-[#0b0f19] text-slate-300">All Categories</option>
                      <option value="PHONE_NUMBER" className="bg-[#0b0f19] text-slate-300">Phone Numbers</option>
                      <option value="EMAIL_ADDRESS" className="bg-[#0b0f19] text-slate-300">Email Addresses</option>
                      <option value="CREDENTIALS" className="bg-[#0b0f19] text-slate-300">Credentials & Keys</option>
                      <option value="PAYROLL_WAGE" className="bg-[#0b0f19] text-slate-300">Payroll & Wages</option>
                    </select>
                  </div>
                </div>

                {loadingLogs ? (
                  <div className="flex items-center justify-center py-12 text-xs text-slate-450 font-mono">
                    <Loader2 className="w-5 h-5 text-teal-400 animate-spin mr-2" />
                    <span>Loading audit queue...</span>
                  </div>
                ) : (
                  (() => {
                    const filtered = privacyLogs.filter(log => {
                      const matchesSearch = log.source_id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                            log.log_details.toLowerCase().includes(searchQuery.toLowerCase());
                      const matchesCategory = filterCategory === 'ALL' || log.redacted_type === filterCategory;
                      return matchesSearch && matchesCategory;
                    });

                    if (filtered.length === 0) {
                      return (
                        <p className="text-center py-12 text-xs text-slate-500 italic bg-slate-955/20 rounded-xl border border-dashed border-slate-800">
                          No sensitive data redacted. All uploads comply with security rules.
                        </p>
                      );
                    }

                    return (
                      <div className="border border-slate-850/80 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-950/50 border-b border-slate-850 text-slate-400 uppercase font-mono text-[9px]">
                                <th className="p-3 font-semibold">Source Resource</th>
                                <th className="p-3 font-semibold">Redaction Category</th>
                                <th className="p-3 font-semibold">Redacted Occurrences</th>
                                <th className="p-3 font-semibold">Action Description</th>
                                <th className="p-3 font-semibold">Audit Timestamp</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850/60 text-slate-300 bg-slate-900/10">
                              {filtered.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-900/20">
                                  <td className="p-3 font-mono text-[10px] text-slate-400 max-w-[120px] truncate">{log.source_id}</td>
                                  <td className="p-3">
                                    <span className="px-2 py-0.5 bg-red-955/40 text-red-455 border border-red-900/30 rounded text-[9px] font-bold font-mono">
                                      {log.redacted_type}
                                    </span>
                                  </td>
                                  <td className="p-3 font-bold text-white">{log.count} items</td>
                                  <td className="p-3 text-slate-350 font-sans max-w-[200px] truncate" title={log.log_details}>{log.log_details}</td>
                                  <td className="p-3 text-slate-450 font-sans">{log.created_at}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            )}

          </div>

        </div>
      </main>
    </div>
  );
}

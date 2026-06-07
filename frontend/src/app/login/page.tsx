'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../../store/use-store';
import { api } from '../../services/api';
import { Sparkles, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const loginStore = useStore((state) => state.login);
  const setTenantStore = useStore((state) => state.setTenant);

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [domain, setDomain] = useState('');
  const [adminName, setAdminName] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isLogin) {
        // Authenticate
        const params = new URLSearchParams();
        params.append('username', email);
        params.append('password', password);
        
        const loginRes = await api.auth.login(params);
        
        // Save token first
        loginStore(loginRes.access_token, null as any);

        // Fetch User and Tenant contexts
        const user = await api.auth.getMe();
        const tenant = await api.tenants.getMe();
        
        // Commit both to store
        loginStore(loginRes.access_token, user);
        setTenantStore(tenant);

        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        // Register Tenant + Admin
        await api.auth.register({
          tenant_name: orgName,
          domain: domain,
          admin_email: email,
          admin_password: password,
          admin_name: adminName
        });
        
        setSuccess('Organization registered successfully! You can now sign in.');
        setIsLogin(true);
        // Clear passwords
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0b0f19] text-white min-h-screen flex items-center justify-center font-sans px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.04),transparent_50%)]"></div>
      
      <div className="w-full max-w-md bg-slate-900/40 border border-slate-800 p-8 rounded-2xl relative z-10 shadow-2xl backdrop-blur-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center text-slate-950 font-bold mx-auto mb-3 shadow-lg shadow-teal-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-wide">
            {isLogin ? 'Sign In to Workspace' : 'Register Organization'}
          </h1>
          <p className="text-xs text-slate-500 mt-1.5">
            {isLogin ? 'Enter credentials to load organizational memory.' : 'Deploy a new tenant instance of InsightOrion.'}
          </p>
        </div>

        {/* Error Envelope */}
        {error && (
          <div className="bg-red-950/40 border border-red-900/60 p-3 rounded-lg text-xs text-red-400 mb-6 flex items-center space-x-2">
            <span className="font-bold">Error:</span>
            <span>{error}</span>
          </div>
        )}

        {/* Success Envelope */}
        {success && (
          <div className="bg-emerald-950/40 border border-emerald-900/60 p-3 rounded-lg text-xs text-emerald-400 mb-6 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1.5">Organization Name</label>
                <input
                  type="text"
                  required
                  placeholder="Acme Corp"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-lg py-2 px-3.5 text-sm text-slate-200 outline-none transition"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1.5">Organization Domain</label>
                <input
                  type="text"
                  required
                  placeholder="acme.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-lg py-2 px-3.5 text-sm text-slate-200 outline-none transition"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1.5">Administrator Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Alex Carter"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-lg py-2 px-3.5 text-sm text-slate-200 outline-none transition"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1.5">Email Address</label>
            <input
              type="email"
              required
              placeholder="admin@acme.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-lg py-2 px-3.5 text-sm text-slate-200 outline-none transition"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1.5">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-lg py-2 px-3.5 text-sm text-slate-200 outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-teal-500 hover:bg-teal-400 disabled:bg-teal-800 disabled:text-slate-400 text-slate-950 font-bold rounded-lg shadow-lg shadow-teal-500/10 flex items-center justify-center space-x-2 transition mt-6"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>{isLogin ? 'Sign In' : 'Register Organization'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Option */}
        <div className="text-center mt-6">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setSuccess(null);
            }}
            className="text-xs text-teal-400 hover:text-teal-300 font-medium transition"
          >
            {isLogin 
              ? 'Deploy new organization instance? Register here' 
              : 'Already have an organization? Log in instead'}
          </button>
        </div>
      </div>
    </div>
  );
}

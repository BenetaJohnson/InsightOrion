import { create } from 'zustand';

interface User {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  role: string;
  google_refresh_token?: string | null;
}

interface Tenant {
  id: string;
  name: string;
  domain: string;
  subscription_plan: string;
  storage_used_bytes: number;
  storage_limit_bytes: number;
}

interface AppState {
  token: string | null;
  user: User | null;
  tenant: Tenant | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  setTenant: (tenant: Tenant) => void;
  initialize: () => void;
}

export const useStore = create<AppState>((set) => ({
  token: null,
  user: null,
  tenant: null,
  login: (token, user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('em_token', token);
      localStorage.setItem('em_user', JSON.stringify(user));
    }
    set({ token, user });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('em_token');
      localStorage.removeItem('em_user');
      localStorage.removeItem('em_tenant');
    }
    set({ token: null, user: null, tenant: null });
  },
  setTenant: (tenant) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('em_tenant', JSON.stringify(tenant));
    }
    set({ tenant });
  },
  initialize: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('em_token');
      const userStr = localStorage.getItem('em_user');
      const tenantStr = localStorage.getItem('em_tenant');
      
      set({
        token: token || null,
        user: userStr ? JSON.parse(userStr) : null,
        tenant: tenantStr ? JSON.parse(tenantStr) : null,
      });
    }
  }
}));

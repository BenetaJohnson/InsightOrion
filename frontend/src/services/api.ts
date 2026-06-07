import { useStore } from '../store/use-store';

const BASE_URL = 'http://localhost:8000/api/v1';

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = useStore.getState().token;
  
  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      useStore.getState().logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
        return new Promise(() => {}); // Halt execution of calling code during redirect
      }
    }
    let errMsg = 'Request failed';
    try {
      const errData = await response.json();
      errMsg = errData.message || errData.detail || errMsg;
    } catch {
      try {
        errMsg = await response.text() || errMsg;
      } catch {
        // Fallback if body read fails
      }
    }
    throw new Error(errMsg);
  }

  // Handle files stream downloads
  const disposition = response.headers.get('Content-Disposition');
  if (disposition && disposition.includes('attachment')) {
    return response.blob();
  }

  return response.json();
}

export const api = {
  auth: {
    async register(payload: any) {
      return apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    async login(payload: URLSearchParams) {
      return apiRequest('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: payload.toString(),
      });
    },
    async getMe() {
      return apiRequest('/auth/me');
    },
    async getGoogleUrl() {
      return apiRequest('/auth/google/authorize');
    },
    async googleCallback(code: string) {
      return apiRequest(`/auth/google/callback?code=${encodeURIComponent(code)}`);
    }
  },
  
  tenants: {
    async getMe() {
      return apiRequest('/tenants/me');
    },
    async updateMe(payload: any) {
      return apiRequest('/tenants/me', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    }
  },
  
  knowledge: {
    async search(query: string) {
      return apiRequest(`/knowledge/search?q=${encodeURIComponent(query)}`);
    },
    async upload(formData: FormData) {
      return apiRequest('/knowledge/upload', {
        method: 'POST',
        body: formData,
      });
    },
    async syncGoogle() {
      return apiRequest('/knowledge/sync/google', {
        method: 'POST',
      });
    },
    async list() {
      return apiRequest('/knowledge/documents');
    },
    async deleteDoc(id: string) {
      return apiRequest(`/knowledge/documents/${id}`, {
        method: 'DELETE',
      });
    }
  },
  
  meetings: {
    async upload(formData: FormData) {
      return apiRequest('/meetings/upload', {
        method: 'POST',
        body: formData,
      });
    },
    async list() {
      return apiRequest('/meetings/list');
    },
    async get(id: string) {
      return apiRequest(`/meetings/${id}`);
    },
    async regenerateMom(id: string) {
      return apiRequest(`/meetings/${id}/mom/regenerate`, {
        method: 'POST',
      });
    },
    async downloadExport(id: string, format: string) {
      const blob = await apiRequest(`/meetings/${id}/export?format=${format}`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mom_${id}.${format === 'docx' ? 'docx' : (format === 'html' ? 'html' : 'md')}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    }
  },
  
  actions: {
    async list() {
      return apiRequest('/actions');
    },
    async updateStatus(id: string, status: string) {
      return apiRequest(`/actions/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    },
    async getComments(id: string) {
      return apiRequest(`/actions/${id}/comments`);
    },
    async addComment(id: string, content: string) {
      return apiRequest(`/actions/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
    }
  },
  
  workflows: {
    async triggerOnboarding(formData: FormData) {
      return apiRequest('/workflows/onboarding/trigger', {
        method: 'POST',
        body: formData,
      });
    },
    async triggerFollowUp(meetingId: string) {
      return apiRequest(`/workflows/meeting-followup/trigger?meeting_id=${meetingId}`, {
        method: 'POST',
      });
    },
    async triggerCompliance(documentId: string) {
      return apiRequest(`/workflows/compliance/trigger?document_id=${documentId}`, {
        method: 'POST',
      });
    },
    async list() {
      return apiRequest('/workflows/list');
    },
    async getLogs(id: string) {
      return apiRequest(`/workflows/${id}/logs`);
    }
  },
  
  analytics: {
    async getDashboard() {
      return apiRequest('/analytics/dashboard');
    }
  },
  jira: {
    async sync() {
      return apiRequest('/jira/sync', { method: 'POST' });
    },
    async list() {
      return apiRequest('/jira/tickets');
    },
    async getRecommendations(key: string) {
      return apiRequest(`/jira/tickets/${key}/recommendations`);
    },
    async findExperts(query: string) {
      return apiRequest(`/jira/expert-finder?q=${encodeURIComponent(query)}`);
    }
  },
  privacy: {
    async getAuditLogs() {
      return apiRequest('/privacy/audit-logs');
    },
    async scanText(text: string) {
      return apiRequest('/privacy/scan-text', {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
    }
  }
};

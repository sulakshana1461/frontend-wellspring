import axios from 'axios';

// Centralized and resilient API configuration
// Ensures API_BASE always includes '/api' regardless of how VITE_API_URL was entered in Render
const rawUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').trim().replace(/\/+$/, '');
export const API_BASE = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;

// Automatically attach Bearer JWT token from active session to all outgoing API calls
axios.interceptors.request.use(
  (config) => {
    try {
      config.headers = config.headers || {};
      // If already explicitly provided in call, do not overwrite
      if (config.headers['Authorization']) {
        return config;
      }

      const adminSession = JSON.parse(sessionStorage.getItem('wellspring_admin_session') || '{}');
      const docSession = JSON.parse(sessionStorage.getItem('wellspring_doctor_session') || '{}');
      const counterSession = JSON.parse(sessionStorage.getItem('wellspring_counter_session') || '{}');
      const grnSession = JSON.parse(sessionStorage.getItem('wellspring_grn_session') || '{}');

      // Context-aware token resolution based on active URL
      const path = typeof window !== 'undefined' ? (window.location.pathname || '') : '';
      let token = null;

      if (path.includes('/counter')) {
        token = counterSession.token || adminSession.token || docSession.token || grnSession.token;
      } else if (path.includes('/doctor')) {
        token = docSession.token || adminSession.token || counterSession.token || grnSession.token;
      } else if (path.includes('/admin')) {
        token = adminSession.token || docSession.token || counterSession.token || grnSession.token;
      } else if (path.includes('/grn')) {
        token = grnSession.token || adminSession.token || counterSession.token || docSession.token;
      } else {
        token = counterSession.token || docSession.token || adminSession.token || grnSession.token;
      }

      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch {
      // Proceed without token if sessionStorage is unavailable
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default API_BASE;

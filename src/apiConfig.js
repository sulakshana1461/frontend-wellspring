// Centralized and resilient API configuration
// Ensures API_BASE always includes '/api' regardless of how VITE_API_URL was entered in Render
const rawUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').trim().replace(/\/+$/, '');
export const API_BASE = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;

export default API_BASE;

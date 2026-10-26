import axios from 'axios';
import { clearSession } from './auth';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // Pointing to your Node Backend
});

// INTERCEPTOR: Automatically add Token to requests
api.interceptors.request.use((config) => {
  // We will store the token in LocalStorage
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// INTERCEPTOR: A 401 means the token is missing/expired/invalid. Clear the
// stale session and send the user back to login (with a ?next= so they land
// back where they were) instead of leaving the app silently broken.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      typeof window !== 'undefined' &&
      error?.response?.status === 401 &&
      !window.location.pathname.startsWith('/login')
    ) {
      clearSession();
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?next=${next}&reason=expired`;
    }
    return Promise.reject(error);
  }
);

export default api;
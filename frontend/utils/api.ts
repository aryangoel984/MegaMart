import axios from 'axios';

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

export default api;
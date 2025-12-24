import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api', // Pointing to your Node Backend
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
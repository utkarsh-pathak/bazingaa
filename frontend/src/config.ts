// src/config.ts
const getApiUrl = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:8000';
};

const getWebSocketUrl = () => {
  const apiUrl = getApiUrl();
  if (apiUrl.startsWith('https')) {
    return apiUrl.replace('https://', 'wss://');
  }
  return apiUrl.replace('http://', 'ws://');
};

export const API_URL = getApiUrl();
export const WEBSOCKET_URL = getWebSocketUrl();

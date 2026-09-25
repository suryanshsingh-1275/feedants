import AsyncStorage from '@react-native-async-storage/async-storage';

// IMPORTANT: change this to your machine's LAN IP (not "localhost") so a
// phone/emulator can reach your backend, e.g. "http://192.168.1.5:5050/api".
// Find your IP with `ipconfig` (Windows) or `ifconfig` / `ip a` (Mac/Linux).
// Use "http://localhost:5050/api" only when testing in a browser (npx expo start, press w).
export const API_URL = 'http://localhost:5050/api';

const request = async (path, { method = 'GET', body, auth = false } = {}) => {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = await AsyncStorage.getItem('token');
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    cache: 'no-store',
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
};

export const signup = (payload) => request('/auth/signup', { method: 'POST', body: payload });
export const login = (payload) => request('/auth/login', { method: 'POST', body: payload });
export const getCompetitions = () => request('/competitions', { auth: true });
export const getCompetitionDetails = (id) => request(`/competitions/${id}`, { auth: true });
export const registerForCompetition = (id) =>
  request(`/competitions/${id}/register`, { method: 'POST', auth: true });
export const submitEntry = (id, submissionUrl) =>
  request(`/competitions/${id}/submit`, { method: 'POST', auth: true, body: { submissionUrl } });
export const createCompetition = (payload) =>
  request('/competitions', { method: 'POST', auth: true, body: payload });
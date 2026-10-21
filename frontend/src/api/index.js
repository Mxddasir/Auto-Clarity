import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('ac_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ac_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  getMe:    ()     => api.get('/auth/me')
};

export const obdAPI = {
  getCode:      (code)   => api.get(`/obd/code/${code}`),
  listCodes:    (limit)  => api.get(`/obd/codes${limit ? `?limit=${limit}` : ''}`),
  startSession: (data)   => api.post('/obd/session/start', data),
  answer:       (data)   => api.post('/obd/session/answer', data)
};

export const vehicleAPI = {
  lookupReg: (plate) => api.get(`/vehicle/reg/${plate}`),
  decodeVin: (vin)   => api.get(`/vehicle/vin/${vin}`)
};

export const mechanicAPI = {
  findNearby: (lat, lng, radius) =>
    api.get(`/mechanic/nearby?lat=${lat}&lng=${lng}&radius=${radius || 5000}`)
};

export const youtubeAPI = {
  search: (q) => api.get(`/youtube/search?q=${encodeURIComponent(q)}`)
};

export const historyAPI = {
  getAll: ()    => api.get('/history'),
  save:   (data)=> api.post('/history', data),
  delete: (id)  => api.delete(`/history/${id}`)
};

export default api;

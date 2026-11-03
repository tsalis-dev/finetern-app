import axios from 'axios';
import { Platform } from 'react-native';
import { getToken } from '../store/sessionStorage';

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android'
  ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api')).replace(/\/$/, '');
const axiosClient = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });
let onUnauthorized = () => {};
export const setUnauthorizedHandler = handler => { onUnauthorized = handler; };

axiosClient.interceptors.request.use(async config => {
  if (!config.url?.startsWith('/auth/')) {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = 'Bearer ' + token;
      config.sessionToken = token;
    }
  }
  return config;
});
axiosClient.interceptors.response.use(response => response.data, error => {
  const status = error.response?.status;
  if (status === 401 && error.config?.sessionToken) onUnauthorized(error.config.sessionToken);
  return Promise.reject({ status, message: error.response?.data?.message || 'Tidak dapat terhubung ke server. Periksa jaringan dan alamat API.', data: error.response?.data?.data || {} });
});
export default axiosClient;

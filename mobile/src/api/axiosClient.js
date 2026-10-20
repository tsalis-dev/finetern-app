import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Di Android Emulator: 10.0.2.2 merujuk ke localhost laptop
// Di iOS Simulator: localhost
// Di Physical Device Expo Go: ganti dengan IP laptop di jaringan Wi-Fi lokal
const getDefaultBaseURL = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getDefaultBaseURL();

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor Request: Sisipkan Bearer Token JWT otomatis
axiosClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('finetern_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('[Axios Request Interceptor] Gagal membaca token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor Response: Tangani pesan error terpusat
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorResponse = error.response?.data || {
      success: false,
      message: error.message || 'Terjadi gangguan jaringan atau server tidak merespons.',
      data: {},
    };
    return Promise.reject(errorResponse);
  }
);

export default axiosClient;

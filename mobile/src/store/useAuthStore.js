import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { setUnauthorizedHandler } from '../api/axiosClient';
import { getToken, saveToken, clearToken } from './sessionStorage';
import { clearProofCache } from '../utils/portfolioEvidence';

export const useAuthStore = create((set, get) => ({
  user: null, token: null, role: null, isLoading: true, isAuthenticated: false, sessionError: null, logoutPending: false,
  restoreSession: async () => {
    set({ isLoading: true, sessionError: null });
    try {
      if (get().logoutPending) { await get().logout(); return; }
      // Token simulator lama tidak boleh dipulihkan sebagai sesi nyata.
      await AsyncStorage.multiRemove(['finetern_token', 'finetern_user']);
      const token = await getToken();
      if (!token) { set({ user: null, token: null, role: null, isAuthenticated: false }); return; }
      set({ token });
      await get().refreshProfile();
    } catch (error) {
      if (error.status !== 401) set({ sessionError: error.message || 'Penyimpanan sesi tidak dapat diakses.' });
    } finally { set({ isLoading: false }); }
  },
  authenticate: async (mode, values) => {
    const response = await api.post('/auth/' + mode, values);
    try { await saveToken(response.data.token); }
    catch { throw { message: 'Akun dikenali, tetapi sesi tidak dapat disimpan. Coba masuk kembali.' }; }
    set({ user: response.data.user, token: response.data.token, role: response.data.user.role, isAuthenticated: true, sessionError: null });
  },
  refreshProfile: async () => {
    const token = get().token;
    if (!token) return;
    try {
      const response = await api.get('/profile/me');
      if (get().token !== token) return;
      set({ user: response.data, role: response.data.role, isAuthenticated: true, sessionError: null });
      return response.data;
    } catch (error) {
      if (get().token === token && error.status !== 401) set({ sessionError: error.message });
      throw error;
    }
  },
  logout: async () => {
    set({ user: null, token: null, role: null, isAuthenticated: false, sessionError: null, logoutPending: true });
    try { await clearToken(); await clearProofCache(); set({ logoutPending: false }); }
    catch {
      const message = 'Sesi atau berkas sementara di perangkat belum dapat dihapus. Coba keluar kembali.';
      set({ sessionError: message });
      throw { message };
    }
  },
}));

setUnauthorizedHandler(token => {
  if (useAuthStore.getState().token === token) useAuthStore.getState().logout().catch(() => {});
});

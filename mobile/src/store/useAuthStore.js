import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  role: null, // 'siswa' | 'sekolah' | 'industri'
  isLoading: true,
  isAuthenticated: false,

  // Pulihkan sesi login yang tersimpan di AsyncStorage
  restoreSession: async () => {
    try {
      set({ isLoading: true });
      const storedToken = await AsyncStorage.getItem('finetern_token');
      const storedUser = await AsyncStorage.getItem('finetern_user');

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        set({
          token: storedToken,
          user: parsedUser,
          role: parsedUser.role,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          token: null,
          role: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.warn('[useAuthStore] Gagal memulihkan sesi:', error);
      set({ isLoading: false, isAuthenticated: false });
    }
  },

  // Simpan login ke state dan penyimpanan lokal
  login: async (userData, token) => {
    try {
      await AsyncStorage.setItem('finetern_token', token);
      await AsyncStorage.setItem('finetern_user', JSON.stringify(userData));
      set({
        user: userData,
        token: token,
        role: userData.role,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error('[useAuthStore] Gagal menyimpan login:', error);
    }
  },

  // Hapus sesi
  logout: async () => {
    try {
      await AsyncStorage.removeItem('finetern_token');
      await AsyncStorage.removeItem('finetern_user');
      set({
        user: null,
        token: null,
        role: null,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('[useAuthStore] Gagal logout:', error);
    }
  },

  // Pengalih peran cepat untuk presentasi & pengujian UI
  switchRole: (newRole) => {
    const defaultProfiles = {
      siswa: {
        id: 1,
        nama: 'Ahmad Pratama',
        email: 'siswa1@finetern.id',
        role: 'siswa',
        sekolah: 'SMKN 1 Bandung',
        jurusan: 'Rekayasa Perangkat Lunak',
        kelas: 'XII RPL 1',
      },
      sekolah: {
        id: 1,
        nama: 'Drs. H. Mulyana (Guru Pembimbing)',
        email: 'guru@smkn1bandung.sch.id',
        role: 'sekolah',
        sekolah: 'SMKN 1 Bandung',
        akreditasi: 'A',
      },
      industri: {
        id: 1,
        nama: 'PT Digital Kreatif Nusantara',
        email: 'hrd@digitalkreatif.com',
        role: 'industri',
        sektor: 'Teknologi Informasi & Software',
        kota: 'Bandung',
      },
    };

    const normalizedRole =
      newRole === 'guru_smk' ? 'sekolah' : newRole === 'mitra_industri' ? 'industri' : newRole;
    const targetUser = defaultProfiles[normalizedRole] || defaultProfiles.siswa;
    set({
      user: targetUser,
      role: normalizedRole,
      isAuthenticated: true,
      token: 'dummy_token_' + normalizedRole,
    });
  },
}));

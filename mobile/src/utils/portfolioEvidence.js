import { Platform } from 'react-native';
import { File, Directory, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import api, { API_BASE_URL } from '../api/axiosClient';
import { getToken } from '../store/sessionStorage';

export async function clearProofCache() {
  if (Platform.OS === 'web') return;
  const directory = new Directory(Paths.cache, 'finetern-proofs');
  if (directory.exists) directory.delete();
}

async function openEvidence(detailPath, evidencePath, name, type) {
  if (Platform.OS === 'web') throw new Error('Buka bukti berkas melalui aplikasi Android atau iOS.');
  const token = await getToken();
  if (!token) throw new Error('Masuk kembali untuk membuka bukti.');
  await api.get(detailPath);
  if (!await Sharing.isAvailableAsync()) throw new Error('Perangkat belum mendukung pembukaan berkas melalui aplikasi lain.');
  const extension = ['pdf', 'png', 'jpg'].includes(type) ? type : 'pdf';
  const directory = new Directory(Paths.cache, 'finetern-proofs');
  directory.create({ idempotent: true });
  const file = new File(directory, `${name}-${Date.now()}.${extension}`);
  try {
    await File.downloadFileAsync(API_BASE_URL+evidencePath, file, { headers: { Authorization: 'Bearer ' + token } });
    if (await getToken() !== token) throw new Error('Sesi sudah berubah. Masuk kembali untuk membuka bukti.');
    await Sharing.shareAsync(file.uri, { mimeType: extension === 'pdf' ? 'application/pdf' : extension === 'png' ? 'image/png' : 'image/jpeg', dialogTitle: 'Buka bukti karya dengan aplikasi pilihanmu' });
  } catch (error) {
    if (file.exists) file.delete();
    throw new Error(error.message?.startsWith('Sesi') ? error.message : 'Bukti tidak dapat dibuka. Periksa sesi dan jaringan, lalu coba lagi.');
  }
  // Cache dibersihkan saat logout; jangan hapus sebelum aplikasi pembaca selesai mengakses berkas.
}

export async function openPortfolioEvidence(id, type, eventId) {
  return openEvidence('/portfolios/'+id,`/portfolios/${id}/evidence${eventId ? '?eventId='+eventId : ''}`,`karya-${id}-${eventId || 'terbaru'}`,type);
}
export async function openApplicationEvidence(id, proofId, type) {
  return openEvidence('/applications/'+id,`/applications/${id}/evidence/${proofId}`,`lamaran-${id}-${proofId}`,type);
}

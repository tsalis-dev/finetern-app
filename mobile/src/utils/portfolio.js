export const portfolioStatuses = { pending: 'Menunggu pemeriksaan', approved: 'Disetujui', revision: 'Perlu perbaikan', rejected: 'Ditolak' };

export function validatePortfolio(values, hasEvidence) {
  if (!values.title?.trim() || !values.deskripsi?.trim() || !values.skillId) throw new Error('Isi judul, penjelasan karya, dan keterampilan yang diajukan.');
  const url = values.projectUrl?.trim();
  if (url) {
    let parsed;
    try { parsed = new URL(url); } catch { throw new Error('Gunakan tautan proyek HTTP atau HTTPS yang lengkap.'); }
    if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error('Gunakan tautan HTTP atau HTTPS tanpa kata sandi di alamat.');
  }
  if (!url && !hasEvidence) throw new Error('Lampirkan foto/PDF bukti karya atau isi tautan proyek.');
  return { title: values.title.trim(), deskripsi: values.deskripsi.trim(), skillId: values.skillId, projectUrl: url || '' };
}

export function reviewPayload(status, note, proficiency, version) {
  if (!note.trim()) throw new Error('Isi catatan pemeriksaan untuk siswa.');
  const score = Number(proficiency);
  if (status === 'approved' && (!/^\d+$/.test(proficiency.trim()) || !Number.isInteger(score) || score<1 || score>100)) throw new Error('Isi nilai keterampilan 1–100 berdasarkan bukti karya.');
  return { status, note: note.trim(), version, ...(status === 'approved' ? { proficiency: score } : {}) };
}

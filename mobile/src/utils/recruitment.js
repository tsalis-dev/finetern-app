export const applicationStatuses = { pending:'Menunggu seleksi',reviewed:'Dalam proses',accepted:'Diterima',rejected:'Ditolak',withdrawn:'Ditarik' };
export const workModes = { onsite:'Di lokasi',hybrid:'Hybrid',remote:'Jarak jauh' };
export const formatAllowance = value => value == null ? 'Uang saku belum dicantumkan' : 'Rp '+new Intl.NumberFormat('id-ID').format(value)+' / bulan';
export const formatDeadline = value => value ? value.split('-').reverse().join('/') : 'Belum dicantumkan';

function number(value,label,min,max) {
  const raw=String(value ?? '').trim(),parsed=Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(parsed) || parsed<min || parsed>max) throw new Error(`${label} harus bilangan bulat ${min}–${max}.`);
  return parsed;
}
export function vacancyPayload(values,requirements,version) {
  if (!values.title?.trim() || !values.deskripsi?.trim() || !values.location?.trim()) throw new Error('Isi judul, deskripsi, dan lokasi magang.');
  if (!workModes[values.workMode]) throw new Error('Pilih sistem kerja magang.');
  const date=new Date(values.deadline+'T00:00:00Z');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.deadline || '') || !Number.isFinite(date.getTime()) || date.toISOString().slice(0,10)!==values.deadline) throw new Error('Isi batas lamaran dengan tanggal valid YYYY-MM-DD.');
  if (!requirements.length || requirements.length>20) throw new Error('Tambahkan 1–20 syarat keterampilan.');
  const checked=requirements.map(item=>{
    if (!['wajib','nilai_tambah'].includes(item.importance)) throw new Error('Pilih jenis syarat keterampilan.');
    return {skillId:number(item.skillId,'Keterampilan',1,2147483647),importance:item.importance,weight:number(item.weight,'Bobot',1,100),minProficiency:number(item.minProficiency,'Nilai minimum',1,100)};
  });
  if (new Set(checked.map(item=>item.skillId)).size!==checked.length) throw new Error('Keterampilan tidak boleh berulang dalam satu lowongan.');
  return {title:values.title.trim(),deskripsi:values.deskripsi.trim(),location:values.location.trim(),workMode:values.workMode,
    allowance:values.allowance === '' || values.allowance == null ? null : number(values.allowance,'Uang saku',0,100000000),quota:number(values.quota,'Kuota',1,1000),deadline:values.deadline,requirements:checked,
    ...(version == null ? {} : {version})};
}
export function applicationPayload(version,consent) {
  if (consent !== true) throw new Error('Setujui pembagian profil dasar dan bukti karya terkait sebelum melamar.');
  return {version:number(version,'Versi lowongan',1,2147483647),shareConsent:true};
}
export function selectionPayload(status,note,version) {
  if (!['reviewed','accepted','rejected'].includes(status) || !note.trim()) throw new Error('Pilih keputusan dan isi catatan untuk siswa.');
  return {status,note:note.trim(),version:number(version,'Versi lamaran',1,2147483647)};
}

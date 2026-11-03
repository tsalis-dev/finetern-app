const $ = id => document.getElementById(id);
let token = null;
let offset = 0;
let selected = null;
const message = value => { $('message').textContent = value; };
const element = (tag, value, parent) => { const node = document.createElement(tag); node.textContent = value; parent?.append(node); return node; };
const fieldLabels = { nama: 'Nama perwakilan', email: 'Email', schoolName: 'Nama sekolah', npsn: 'NPSN', alamat: 'Alamat', companyName: 'Nama industri', sektor: 'Sektor', kota: 'Kota', nomorRegistrasi: 'Nomor registrasi', contactPhone: 'Telepon perwakilan' };

async function downloadEvidence(id, eventId) {
  try {
    const response = await fetch(`/api/verification/${id}/evidence${eventId ? '?eventId=' + eventId : ''}`, { headers: { Authorization: 'Bearer ' + token } });
    if (!response.ok) throw new Error('Bukti tidak dapat diunduh.');
    const url = URL.createObjectURL(await response.blob()); const link = document.createElement('a'); link.href = url;
    link.download = response.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] || 'bukti-institusi'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (error) { message(error.message); }
}

async function api(url, options = {}) {
  const response = await fetch('/api' + url, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...options.headers } });
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401 && token) logout();
    throw new Error(result.message || 'Layanan tidak dapat diakses.');
  }
  return result.data;
}
function logout() { token = null; selected = null; $('workspace').hidden = true; $('login-form').hidden = false; $('logout').hidden = true; $('detail').replaceChildren(); $('queue').replaceChildren(); $('password').value = ''; }

async function loadQueue() {
  const rows = await api(`/verification/queue?status=${$('status').value}&offset=${offset}`);
  $('queue').replaceChildren();
  if (!rows.length) element('p', 'Tidak ada pengajuan pada halaman ini.', $('queue'));
  for (const row of rows) {
    const button = element('button', '', $('queue')); button.className = 'queue-item';
    element('strong', row.title, button); element('small', row.applicant_email, button); element('small', row.kind === 'school' ? 'Sekolah' : 'Industri', button);
    button.addEventListener('click', () => showDetail(row.id).catch(error => message(error.message)));
  }
  $('previous').disabled = offset === 0; $('next').disabled = rows.length < 30;
}

async function showDetail(id) {
  selected = id;
  const data = await api('/verification/' + id);
  if (selected !== id || !token) return;
  const target = $('detail'); target.replaceChildren();
  element('h2', data.title, target); element('span', data.status, target).className = 'badge';
  element('p', `Akun #${data.applicant_user_id} · ${data.applicant_email}`, target);
  element('p', 'Cocokkan identitas institusi dengan sumber resmi dan konfirmasi kewenangan perwakilan melalui kontak yang dapat dipercaya. Catat sumber dan hasil pemeriksaan.', target);
  const snapshots = data.history.filter(item => item.submission_snapshot?.nama);
  for (const item of snapshots) {
    const section = element('details', '', target); section.open = item === snapshots.at(-1);
    element('summary', 'Data pengajuan · ' + new Date(item.created_at).toLocaleString('id-ID'), section);
    for (const [key, title] of Object.entries(fieldLabels)) if (item.submission_snapshot[key]) element('p', title + ': ' + item.submission_snapshot[key], section);
  }
  const download = element('button', data.has_evidence ? 'Unduh bukti institusi' : 'Bukti belum diunggah', target);
  download.disabled = !data.has_evidence;
  download.onclick = () => downloadEvidence(id);
  element('h3', 'Riwayat pemeriksaan', target);
  const actions = { submitted: 'Pengajuan diperbarui', resubmitted: 'Diajukan ulang', approved: 'Disetujui', needs_revision: 'Perlu perbaikan', rejected: 'Ditolak', suspended: 'Akses dinonaktifkan', reactivated: 'Akses dipulihkan' };
  for (const item of data.history) {
    element('p', `${actions[item.action] || item.action} · ${new Date(item.created_at).toLocaleString('id-ID')} · ${item.actor_email}\n${item.note || ''}`, target);
    if (item.submission_snapshot?.evidence) element('button', 'Unduh bukti versi ini', target).onclick = () => downloadEvidence(id, item.id);
  }
  if (data.status === 'pending') {
    const label = element('label', 'Catatan keputusan (wajib)', target); const note = element('textarea', '', label); note.maxLength = 2000; note.rows = 3;
    for (const [value, title] of [['approved', 'Setujui'], ['needs_revision', 'Minta perbaikan'], ['rejected', 'Tolak']]) {
      const button = element('button', title, target); if (value === 'approved') button.className = 'primary';
      button.onclick = async () => {
        if (!note.value.trim()) return message('Isi hasil pemeriksaan terlebih dahulu.');
        if (value === 'approved' && !confirm('Identitas institusi dan kewenangan perwakilan sudah Anda periksa?')) return;
        button.disabled = true;
        try { await api(`/verification/${id}/review`, { method: 'POST', body: JSON.stringify({ status: value, note: note.value }) }); message('Keputusan tersimpan.'); await loadQueue(); await showDetail(id); } catch (error) { message(error.message); button.disabled = false; }
      };
    }
  }
  if (data.status === 'approved') {
    const label = element('label', 'Alasan perubahan akses', target); const note = element('input', '', label); note.maxLength = 2000;
    const active = Boolean(data.kind === 'school' ? data.institution_active : data.industry_active);
    const button = element('button', active ? 'Nonaktifkan institusi' : 'Aktifkan institusi', target);
    button.onclick = async () => { try { await api(`/verification/${id}/activity`, { method: 'PATCH', body: JSON.stringify({ active: !active, note: note.value }) }); message('Akses institusi diperbarui.'); await showDetail(id); } catch (error) { message(error.message); } };
  }
}

$('login-form').onsubmit = async event => {
  event.preventDefault(); const submit = event.submitter; submit.disabled = true;
  try {
    const result = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: $('email').value, password: $('password').value }) });
    if (result.user.role !== 'admin') throw new Error('Halaman ini khusus admin platform.');
    token = result.token; $('password').value = ''; $('workspace').hidden = false; $('login-form').hidden = true; $('logout').hidden = false; message(''); await loadQueue();
  } catch (error) { message(error.message); } finally { submit.disabled = false; }
};
$('logout').onclick = () => { logout(); message('Sesi di halaman ini sudah dihapus.'); };
$('refresh').onclick = () => loadQueue().catch(error => message(error.message));
$('status').onchange = () => { offset = 0; loadQueue().catch(error => message(error.message)); };
$('previous').onclick = () => { offset = Math.max(0, offset - 30); loadQueue().catch(error => message(error.message)); };
$('next').onclick = () => { offset += 30; loadQueue().catch(error => message(error.message)); };
$('account-form').onsubmit = async event => { event.preventDefault(); try { await api(`/admin/accounts/${$('account-id').value}/activity`, { method: 'PATCH', body: JSON.stringify({ active: event.submitter.value === 'true', note: $('account-note').value }) }); message('Akses akun diperbarui.'); if (selected) await showDetail(selected); } catch (error) { message(error.message); } };

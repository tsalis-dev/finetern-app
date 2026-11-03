const path = require('node:path');
const fs = require('node:fs/promises');
const { randomUUID } = require('node:crypto');
const { pool } = require('../config/db');
const service = require('../services/verificationService');
const v = require('../utils/validation');

const privateDir = path.resolve(process.env.VERIFICATION_UPLOAD_DIR || path.join(__dirname, '../../private-verifications'));
const fileNamePattern = /^[a-f0-9-]{36}\.(pdf|png|jpg)$/;

async function detail(req, res) {
  res.json({ success: true, message: 'Rincian pengajuan.', data: await service.detail(req.user, v.id(req.params.id)) });
}
async function queue(req, res) {
  const offset = Number(req.query.offset || 0);
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000) throw v.problem(400, 'Halaman antrean tidak valid.');
  res.json({ success: true, message: 'Antrean pemeriksaan.', data: await service.queue(req.user, req.query.status || 'pending', offset) });
}
async function review(req, res) {
  res.json({ success: true, message: 'Keputusan pemeriksaan tersimpan.', data: await service.review(req.user.id, v.id(req.params.id), req.body) });
}
async function resubmit(req, res) {
  res.json({ success: true, message: 'Pengajuan diperbarui dan menunggu pemeriksaan.', data: await service.resubmit(req.user.id, v.id(req.params.id), req.body) });
}
async function activity(req, res) {
  res.json({ success: true, message: 'Akses institusi diperbarui.', data: await service.setActivity(req.user.id, v.id(req.params.id), req.body) });
}

async function upload(req, res) {
  if (!req.file) throw v.problem(400, 'Pilih bukti institusi.');
  const buffer = req.file.buffer;
  const extension = buffer.subarray(0,5).toString() === '%PDF-' ? 'pdf'
    : buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'png'
      : buffer.length >= 3 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255 ? 'jpg' : null;
  if (!extension) throw v.problem(400, 'Bukti harus berupa berkas PDF, PNG, atau JPG yang valid.');
  const requestId = v.id(req.params.id);
  const name = `${randomUUID()}.${extension}`;
  let saved = false;
  try {
    await v.transaction(pool, async db => {
      await db.execute('SELECT id FROM verification_requests WHERE id=? FOR UPDATE', [requestId]);
      const request = await service.getCase(requestId, db);
      if (request.applicant_user_id !== req.user.id || !['school', 'industry'].includes(request.kind)) throw v.problem(403, 'Anda tidak dapat mengunggah bukti untuk pengajuan ini.');
      if (!['pending', 'needs_revision'].includes(request.status)) throw v.problem(409, 'Pengajuan sudah diproses.');
      await fs.mkdir(privateDir, { recursive: true });
      await fs.writeFile(path.join(privateDir, name), buffer, { flag: 'wx' });
      saved = true;
      await db.execute('UPDATE verification_requests SET evidence_path=? WHERE id=?', [name, requestId]);
      await db.execute(`INSERT INTO verification_events (request_id,actor_user_id,action,note,submission_snapshot)
        VALUES (?,?,'submitted','Bukti institusi diperbarui.',?)`, [requestId, req.user.id, JSON.stringify({ evidence: name })]);
    });
  } catch (error) {
    if (saved) await fs.unlink(path.join(privateDir, name)).catch(() => {});
    throw error;
  }
  // Berkas lama tetap disimpan untuk menjaga bukti yang tercatat dalam riwayat pemeriksaan.
  res.status(201).json({ success: true, message: 'Bukti tersimpan secara privat.', data: { id: requestId, has_evidence: true } });
}

async function evidence(req, res) {
  const requestId = v.id(req.params.id);
  await service.detail(req.user, requestId);
  const request = await service.getCase(requestId);
  let file = request.evidence_path;
  if (req.query.eventId) {
    const [[event]] = await pool.execute('SELECT submission_snapshot FROM verification_events WHERE request_id=? AND id=?', [requestId, v.id(req.query.eventId)]);
    file = event?.submission_snapshot?.evidence;
  }
  if (!file || !fileNamePattern.test(file)) throw v.problem(404, 'Bukti belum diunggah.');
  res.set('Cache-Control', 'no-store');
  res.set('X-Content-Type-Options', 'nosniff');
  res.download(path.join(privateDir, file), `bukti-pengajuan-${requestId}.${file.split('.').pop()}`);
}

async function accountActivity(req, res) {
  if (req.user.role !== 'admin') throw v.problem(403, 'Hanya admin dapat mengelola akun.');
  const target = v.id(req.params.id);
  if (typeof req.body.active !== 'boolean') throw v.problem(400, 'Status aktif harus boolean.');
  const note = v.text(req.body.note, 'Alasan perubahan akses', 2000);
  const [result] = await pool.execute(`UPDATE users SET is_active=?,disabled_at=?,disabled_by=?,disabled_reason=?
    WHERE id=? AND role<>'admin'`, [req.body.active, req.body.active ? null : new Date(), req.body.active ? null : req.user.id, req.body.active ? null : note, target]);
  if (!result.affectedRows) throw v.problem(404, 'Akun tidak ditemukan atau merupakan akun admin.');
  res.json({ success: true, message: 'Akses akun diperbarui.', data: { id: target, active: req.body.active } });
}

module.exports = { detail, queue, review, resubmit, activity, upload, evidence, accountActivity };

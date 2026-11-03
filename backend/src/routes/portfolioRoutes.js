const express = require('express');
const multer = require('multer');
const { verifyToken } = require('../middlewares/authMiddleware');
const { objectBody } = require('./authRoutes');
const service = require('../services/portfolioService');
const v = require('../utils/validation');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5*1024*1024, files: 1, fields: 6, fieldSize: 24000, parts: 7 } });
const respond = (res, data, message = 'Data portofolio.', status = 200) => res.status(status).json({ success: true, message, data });

router.use(verifyToken, (req, res, next) => { service.requireAccess(req.user); next(); });
router.get('/skills', async (req, res) => respond(res, await service.skills(req.user)));
router.get('/mine', async (req, res) => respond(res, await service.mine(req.user, req.query)));
router.get('/student-skills', async (req, res) => respond(res, await service.studentSkills(req.user)));
router.get('/queue', async (req, res) => respond(res, await service.queue(req.user, req.query)));
router.post('/', (req, res, next) => { service.requireAccess(req.user, 'siswa'); next(); }, upload.single('file'), async (req, res) => {
  respond(res, await service.submit(req.user.id, null, req.body || {}, req.file), 'Karya diajukan untuk pemeriksaan guru.', 201);
});
router.get('/:id', async (req, res) => respond(res, await service.detail(req.user, v.id(req.params.id))));
router.patch('/:id', (req, res, next) => { service.requireAccess(req.user, 'siswa'); next(); }, upload.single('file'), async (req, res) => {
  respond(res, await service.submit(req.user.id, v.id(req.params.id), req.body || {}, req.file), 'Perbaikan karya diajukan.');
});
router.post('/:id/review', objectBody, async (req, res) => respond(res, await service.review(req.user.id, v.id(req.params.id), req.body), 'Keputusan pemeriksaan karya tersimpan.'));
router.get('/:id/evidence', async (req, res) => {
  const file = await service.evidence(req.user, v.id(req.params.id), req.query.eventId);
  res.set('Cache-Control', 'no-store');
  res.download(file.path, `bukti-karya-${req.params.id}.${file.extension}`);
});
module.exports = router;

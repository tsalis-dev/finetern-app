const express = require('express');
const router = express.Router();
const healthRoutes = require('./healthRoutes');
const { pool } = require('../config/db');
const { verifyToken } = require('../middlewares/authMiddleware');
const { objectBody } = require('./authRoutes');
const authController = require('../controllers/authController');
const v = require('../utils/validation');

// Mount routes
router.use('/health', healthRoutes);
router.use('/auth', require('./authRoutes').router);
router.get('/profile/me', verifyToken, authController.profile);
router.get('/schools', async (req, res) => {
  const search = v.text(req.query.q || '', 'Pencarian sekolah', 100, false) || '';
  const [rows] = await pool.execute(`SELECT s.id,s.nama_sekolah FROM schools s JOIN verification_requests r ON r.sekolah_id=s.id
    WHERE s.is_active=1 AND r.status='approved' AND s.nama_sekolah LIKE ? ORDER BY s.nama_sekolah LIMIT 200`, [`%${search}%`]);
  res.json({ success: true, message: 'Sekolah terverifikasi.', data: rows });
});
router.use('/verification', require('./verificationRoutes'));
router.patch('/admin/accounts/:id/activity', verifyToken, objectBody, require('../controllers/verificationController').accountActivity);

module.exports = router;

const express = require('express');
const multer = require('multer');
const controller = require('../controllers/verificationController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { objectBody } = require('./authRoutes');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0 } });

router.use(verifyToken);
router.get('/queue', controller.queue);
router.get('/:id', controller.detail);
router.post('/:id/review', objectBody, controller.review);
router.patch('/:id/resubmit', objectBody, controller.resubmit);
router.patch('/:id/activity', objectBody, controller.activity);
router.post('/:id/evidence', upload.single('file'), controller.upload);
router.get('/:id/evidence', controller.evidence);

module.exports = router;

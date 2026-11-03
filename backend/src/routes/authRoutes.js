const express = require('express');
const { rateLimit } = require('express-rate-limit');
const controller = require('../controllers/authController');
const { problem } = require('../utils/validation');
const router = express.Router();

function objectBody(req, res, next) {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) throw problem(400, 'Isi permintaan harus berupa objek JSON.');
  next();
}

// shortcut: penyimpanan limiter per proses, pakai shared store sebelum backend dijalankan dalam beberapa instance.
const limiter = (limit, windowMs) => rateLimit({ limit, windowMs, standardHeaders: 'draft-8', legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak percobaan. Coba lagi setelah beberapa saat.', data: {} } });
router.post('/login', limiter(50, 15 * 60 * 1000), objectBody, controller.login);
router.post('/register', limiter(200, 60 * 60 * 1000), objectBody, controller.register);

module.exports = { router, objectBody };

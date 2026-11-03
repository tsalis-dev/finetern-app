const service = require('../services/authService');

async function login(req, res) {
  res.json({ success: true, message: 'Berhasil masuk.', data: await service.login(req.body) });
}

async function register(req, res) {
  res.status(201).json({ success: true, message: 'Akun dibuat. Ikuti proses verifikasi pada halaman status.', data: await service.register(req.body) });
}

function profile(req, res) {
  res.json({ success: true, message: 'Profil akun.', data: req.user });
}

module.exports = { login, register, profile };

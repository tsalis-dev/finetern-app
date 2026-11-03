const jwt = require('jsonwebtoken');
const { authConfig } = require('../config/auth');
const { getIdentity } = require('../services/identityService');

/**
 * Middleware untuk verifikasi JWT Bearer Token
 */
async function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. Token autentikasi tidak ditemukan.',
      data: {},
    });
  }

  const token = authHeader.slice(7);
  const config = authConfig();
  let decoded;
  try {
    decoded = jwt.verify(token, config.secret, { algorithms: ['HS256'], issuer: config.issuer, audience: config.audience });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Sesi kedaluwarsa atau token tidak valid. Silakan login kembali.',
      data: {},
    });
  }
  if (!/^[1-9]\d*$/.test(decoded.sub || '') || !Number.isSafeInteger(Number(decoded.sub))) return res.status(401).json({ success: false, message: 'Sesi tidak valid.', data: {} });
  const user = await getIdentity(Number(decoded.sub));
  if (!user?.is_active) return res.status(401).json({ success: false, message: 'Akun tidak aktif atau tidak ditemukan.', data: {} });
  // Hak akses selalu dibaca ulang dari database, termasuk perubahan setelah JWT diterbitkan.
  req.user = user;
  next();
}

/**
 * Middleware otorisasi berbasis peran (Role-Based Access Control)
 * Contoh pemakaian: authorizeRoles('siswa', 'sekolah')
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Akses terlarang. Peran akun Anda tidak memiliki izin untuk fitur ini.',
        data: {},
      });
    }
    next();
  };
}

module.exports = {
  verifyToken,
  authorizeRoles,
};

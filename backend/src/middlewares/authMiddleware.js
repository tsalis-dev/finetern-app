const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware untuk verifikasi JWT Bearer Token
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. Token autentikasi tidak ditemukan.',
      data: {},
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'finetern_development_secret_jwt_key_2026');
    req.user = decoded; // memuat { userId, role, profileId, email }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Sesi kedaluwarsa atau token tidak valid. Silakan login kembali.',
      data: {},
    });
  }
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

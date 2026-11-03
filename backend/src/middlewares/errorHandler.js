/**
 * Global Error Handler Middleware
 * Menjamin seluruh response error mengikuti format standar Finetern:
 * { "success": false, "message": "...", "data": {} }
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.code === 'ENOENT' ? 404 : err.code === 'ER_DUP_ENTRY' ? 409 : err.name === 'MulterError' ? 400 : (err.statusCode || err.status || 500);
  if (statusCode >= 500) console.error('[API Error]', err.code || err.name);
  const message = err.code === 'ENOENT' ? 'Berkas tidak ditemukan.' : err.code === 'ER_DUP_ENTRY' ? 'Data identitas sudah digunakan.' : err.name === 'MulterError'
    ? 'Unggah satu berkas JPG, PNG, atau PDF maksimal 5 MB.' : statusCode >= 500
      ? 'Terjadi gangguan layanan. Silakan coba lagi.' : err.type === 'entity.parse.failed' ? 'Format JSON tidak valid.' : err.message;

  res.status(statusCode).json({
    success: false,
    message,
    data: {},
  });
}

/**
 * 404 Not Found Middleware
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.`,
    data: {},
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};

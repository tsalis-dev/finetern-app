/**
 * Global Error Handler Middleware
 * Menjamin seluruh response error mengikuti format standar Finetern:
 * { "success": false, "message": "...", "data": {} }
 */
function errorHandler(err, req, res, next) {
  console.error('[Error Handler]', err);

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  const message = err.message || 'Terjadi kesalahan internal pada server.';

  res.status(statusCode).json({
    success: false,
    message,
    data: process.env.NODE_ENV === 'development' ? { stack: err.stack } : {},
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

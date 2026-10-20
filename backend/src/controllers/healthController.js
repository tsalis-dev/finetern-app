const { testConnection } = require('../config/db');

/**
 * Controller untuk pengujian kesehatan server dan koneksi database
 */
async function checkHealth(req, res, next) {
  try {
    const dbStatus = await testConnection();

    res.status(dbStatus.connected ? 200 : 503).json({
      success: dbStatus.connected,
      message: dbStatus.connected
        ? 'Layanan API Finetern beroperasi normal dan database terhubung.'
        : 'Server aktif namun terjadi kendala koneksi ke database.',
      data: {
        server: 'online',
        database: dbStatus.connected ? 'connected' : 'disconnected',
        databaseDetails: dbStatus.message,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  checkHealth,
};

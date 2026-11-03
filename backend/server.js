const app = require('./src/app');
const { testConnection, pool } = require('./src/config/db');
const { authConfig } = require('./src/config/auth');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  authConfig();
  console.log('----------------------------------------------------');
  console.log('🚀 Memulai Finetern REST API Server...');
  console.log('----------------------------------------------------');

  // Uji koneksi database awal
  const dbStatus = await testConnection();
  if (dbStatus.connected) {
    console.log(`✅ [Database] ${dbStatus.message}`);
  } else {
    console.error(`❌ [Database] Gagal terhubung: ${dbStatus.message}`);
    throw new Error('Pastikan Laragon/MySQL aktif dan konfigurasi database benar.');
  }
  const [[migration]] = await pool.query("SELECT status FROM schema_migrations WHERE version='001_identity_verification'");
  if (migration?.status !== 'applied') throw new Error('Jalankan npm run db:migrate sebelum memakai autentikasi.');

  const server = app.listen(PORT, () => {
    console.log(`🌐 Server aktif di: http://localhost:${PORT}`);
    console.log(`🩺 Health-Check:  http://localhost:${PORT}/api/health`);
    console.log(`📦 Lingkungan:    ${process.env.NODE_ENV || 'development'}`);
    console.log('----------------------------------------------------');
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n🛑 Menghentikan server...');
    server.close(async () => {
      await pool.end();
      console.log('💤 Server Finetern dinonaktifkan.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch(async error => {
  console.error('Server gagal dimulai:', error.code === 'ER_NO_SUCH_TABLE' ? 'Jalankan npm run db:migrate terlebih dahulu.' : error.message);
  await pool.end();
  process.exitCode = 1;
});

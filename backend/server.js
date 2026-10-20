const app = require('./src/app');
const { testConnection } = require('./src/config/db');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  console.log('----------------------------------------------------');
  console.log('🚀 Memulai Finetern REST API Server...');
  console.log('----------------------------------------------------');

  // Uji koneksi database awal
  const dbStatus = await testConnection();
  if (dbStatus.connected) {
    console.log(`✅ [Database] ${dbStatus.message}`);
  } else {
    console.error(`❌ [Database] Gagal terhubung: ${dbStatus.message}`);
    console.warn('⚠️  Pastikan Laragon/MySQL aktif di port 3306');
  }

  const server = app.listen(PORT, () => {
    console.log(`🌐 Server aktif di: http://localhost:${PORT}`);
    console.log(`🩺 Health-Check:  http://localhost:${PORT}/api/health`);
    console.log(`📦 Lingkungan:    ${process.env.NODE_ENV || 'development'}`);
    console.log('----------------------------------------------------');
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n🛑 Menghentikan server...');
    server.close(() => {
      console.log('💤 Server Finetern dinonaktifkan.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer();

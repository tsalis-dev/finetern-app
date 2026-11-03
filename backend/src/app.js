const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

const app = express();

// Middleware dasar
app.use(cors({
  origin: '*', // Memungkinkan permintaan dari emulator Expo / physical device
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: false, limit: '64kb', parameterLimit: 100 }));
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  if (req.path.startsWith('/api')) res.set('Cache-Control', 'no-store');
  next();
});
app.use('/admin', (req, res, next) => {
  res.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  next();
}, express.static(path.join(__dirname, '../public/admin')));

// Menyajikan berkas statis bukti portofolio
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Root info
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Selamat datang di API Finetern (Platform Rekrutmen Magang Vokasi Berbasis Micro-Skills & AI)',
    data: {
      healthCheck: '/api/health',
      docs: 'IK300 Mobile Programming 2026',
    },
  });
});

// Pendaftaran API routes terpusat
app.use('/api', apiRoutes);

// Penanganan 404 & Global Errors
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

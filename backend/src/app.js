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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

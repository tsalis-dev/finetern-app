const express = require('express');
const router = express.Router();
const healthRoutes = require('./healthRoutes');

// Mount routes
router.use('/health', healthRoutes);

// (Routes lainnya: authRoutes, vacancyRoutes, portfolioRoutes, aiRoutes akan dipasang di sini)

module.exports = router;

const { Router } = require('express');
const { health } = require('../controllers/health.controller');
const authRoutes = require('./auth.routes');
const templateRoutes = require('./template.routes');
const favoriteRoutes = require('./favorite.routes');

const router = Router();

router.get('/health', health);
router.use('/auth', authRoutes);
router.use('/templates', templateRoutes);
router.use('/favorites', favoriteRoutes);

module.exports = router;

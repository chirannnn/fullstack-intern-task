const { Router } = require('express');
const controller = require('../controllers/favorite.controller');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { favoriteParamsSchema, listFavoritesSchema } = require('../validators/favorite.validators');

const router = Router();

router.use(requireAuth);

router.get('/', validate({ query: listFavoritesSchema }), controller.list);
router.post('/:templateId', validate({ params: favoriteParamsSchema }), controller.add);
router.delete('/:templateId', validate({ params: favoriteParamsSchema }), controller.remove);

module.exports = router;

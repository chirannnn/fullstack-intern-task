const { Router } = require('express');
const controller = require('../controllers/template.controller');
const validate = require('../middleware/validate');
const { optionalAuth } = require('../middleware/auth');
const { listTemplatesSchema, templateIdParamsSchema } = require('../validators/template.validators');

const router = Router();

// Public endpoints; a valid token additionally populates `is_favorited`.
router.use(optionalAuth);

router.get('/', validate({ query: listTemplatesSchema }), controller.list);
router.get('/categories', controller.listCategories);
router.get('/:id', validate({ params: templateIdParamsSchema }), controller.getById);

module.exports = router;

const { z } = require('zod');
const { positiveId, paginationShape } = require('./common.validators');

const favoriteParamsSchema = z.object({
  templateId: positiveId('Template id'),
});

const listFavoritesSchema = z.object({
  ...paginationShape,
});

module.exports = { favoriteParamsSchema, listFavoritesSchema };

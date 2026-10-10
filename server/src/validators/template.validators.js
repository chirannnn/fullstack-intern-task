const { z } = require('zod');
const { positiveId, paginationShape } = require('./common.validators');

const optionalTrimmed = (max, label) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be at most ${max} characters`)
    .optional()
    .transform((value) => value || undefined);

const listTemplatesSchema = z.object({
  search: optionalTrimmed(100, 'search'),
  category: optionalTrimmed(50, 'category'),
  ...paginationShape,
});

const templateIdParamsSchema = z.object({
  id: positiveId('Template id'),
});

module.exports = { listTemplatesSchema, templateIdParamsSchema };

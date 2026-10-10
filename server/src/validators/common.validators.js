const { z } = require('zod');

const positiveId = (label) =>
  z.coerce
    .number({ error: `${label} must be a positive integer` })
    .int(`${label} must be a positive integer`)
    .positive(`${label} must be a positive integer`)
    .max(2_147_483_647, `${label} is out of range`);

const paginationShape = {
  page: z.coerce.number().int().min(1, 'page must be at least 1').max(10_000).default(1),
  limit: z.coerce.number().int().min(1, 'limit must be at least 1').max(50, 'limit must be at most 50').default(12),
};

module.exports = { positiveId, paginationShape };

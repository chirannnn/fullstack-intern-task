const ApiError = require('../utils/ApiError');

/**
 * Validates and coerces request parts with Zod schemas. Parsed values are stored on
 * `req.validated` so controllers only ever see clean input.
 * @param {{ body?: import('zod').ZodType, params?: import('zod').ZodType, query?: import('zod').ZodType }} schemas
 */
function validate(schemas) {
  return (req, _res, next) => {
    const validated = {};
    const details = [];

    for (const part of ['params', 'query', 'body']) {
      const schema = schemas[part];
      if (!schema) continue;

      const result = schema.safeParse(req[part] ?? {});
      if (result.success) {
        validated[part] = result.data;
      } else {
        for (const issue of result.error.issues) {
          details.push({
            field: issue.path.join('.') || part,
            message: issue.message,
          });
        }
      }
    }

    if (details.length > 0) {
      return next(ApiError.badRequest('Request validation failed', details));
    }

    req.validated = validated;
    return next();
  };
}

module.exports = validate;

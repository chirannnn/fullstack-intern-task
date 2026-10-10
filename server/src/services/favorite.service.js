const db = require('../db/knex');
const ApiError = require('../utils/ApiError');
const { isUniqueViolation, isForeignKeyViolation } = require('../db/errors');
const { buildPageMeta } = require('../utils/pagination');
const templateService = require('./template.service');

async function add(userId, templateId) {
  if (!(await templateService.exists(templateId))) {
    throw ApiError.notFound('Template not found');
  }

  try {
    const [favorite] = await db('favorites')
      .insert({ user_id: userId, template_id: templateId })
      .returning(['id', 'template_id', 'created_at']);
    return favorite;
  } catch (err) {
    // The unique constraint is the source of truth for duplicates, including races.
    if (isUniqueViolation(err)) throw ApiError.conflict('Template is already in your favorites');
    // The template was deleted between the existence check and the insert.
    if (isForeignKeyViolation(err)) throw ApiError.notFound('Template not found');
    throw err;
  }
}

async function list(userId, { page, limit }) {
  const base = db('favorites as f').where('f.user_id', userId);

  const [countRow, rows] = await Promise.all([
    base.clone().count({ total: '*' }).first(),
    base
      .clone()
      .join('templates as t', 't.id', 'f.template_id')
      .select(
        't.id',
        't.name',
        't.description',
        't.thumbnail_url',
        't.category',
        'f.created_at as favorited_at',
        db.raw('true as is_favorited'),
      )
      .orderBy([{ column: 'f.created_at', order: 'desc' }, { column: 'f.id', order: 'desc' }])
      .limit(limit)
      .offset((page - 1) * limit),
  ]);

  const total = Number(countRow.total);
  return { items: rows, meta: buildPageMeta({ page, limit, total }) };
}

async function remove(userId, templateId) {
  // Scoping the delete by user_id guarantees users can only remove their own favorites.
  const deleted = await db('favorites').where({ user_id: userId, template_id: templateId }).del();
  if (deleted === 0) throw ApiError.notFound('Template is not in your favorites');
}

module.exports = { add, list, remove };

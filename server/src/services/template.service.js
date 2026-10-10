const db = require('../db/knex');
const ApiError = require('../utils/ApiError');
const { buildPageMeta } = require('../utils/pagination');

const TEMPLATE_COLUMNS = ['t.id', 't.name', 't.description', 't.thumbnail_url', 't.category'];

/** Escapes LIKE wildcards so user input is matched literally. */
const escapeLike = (value) => value.replace(/[\\%_]/g, '\\$&');

/**
 * Adds an `is_favorited` column for the given user via a single LEFT JOIN, so the
 * catalog can show favorite state without an extra request per card.
 */
function withFavoriteFlag(query, userId) {
  if (!userId) return query.select(db.raw('false as is_favorited'));

  return query
    .leftJoin('favorites as f', function joinUserFavorite() {
      this.on('f.template_id', '=', 't.id').andOnVal('f.user_id', '=', userId);
    })
    .select(db.raw('(f.id is not null) as is_favorited'));
}

async function list({ search, category, page, limit, userId }) {
  const filtered = db('templates as t').modify((query) => {
    if (search) {
      const pattern = `%${escapeLike(search)}%`;
      query.where((q) => q.whereILike('t.name', pattern).orWhereILike('t.description', pattern));
    }
    // Exact match so the category index is used; clients take names from /categories.
    if (category) query.where('t.category', category);
  });

  const [countRow, rows] = await Promise.all([
    filtered.clone().count({ total: '*' }).first(),
    withFavoriteFlag(filtered.clone().select(TEMPLATE_COLUMNS), userId)
      .orderBy([{ column: 't.name' }, { column: 't.id' }])
      .limit(limit)
      .offset((page - 1) * limit),
  ]);

  const total = Number(countRow.total);
  return { items: rows, meta: buildPageMeta({ page, limit, total }) };
}

async function getById(id, userId) {
  const template = await withFavoriteFlag(
    db('templates as t').select(TEMPLATE_COLUMNS).where('t.id', id),
    userId,
  ).first();

  if (!template) throw ApiError.notFound('Template not found');
  return template;
}

async function exists(id) {
  const row = await db('templates').select('id').where({ id }).first();
  return Boolean(row);
}

async function listCategories() {
  const rows = await db('templates')
    .select('category as name')
    .count({ count: '*' })
    .groupBy('category')
    .orderBy('category');
  return rows.map((row) => ({ name: row.name, count: Number(row.count) }));
}

module.exports = { list, getById, exists, listCategories };

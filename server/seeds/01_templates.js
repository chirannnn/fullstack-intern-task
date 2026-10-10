const catalog = require('../src/db/templateCatalog');

/**
 * Upserts the sample catalog by slug. Safe to run repeatedly: it never deletes rows,
 * so existing users and their favorites are left untouched.
 * @param {import('knex').Knex} knex
 */
exports.seed = async function seed(knex) {
  await knex('templates')
    .insert(catalog)
    .onConflict('slug')
    .merge(['name', 'description', 'thumbnail_url', 'category', 'updated_at']);
};

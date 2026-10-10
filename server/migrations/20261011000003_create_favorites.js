/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.schema.createTable('favorites', (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table
      .integer('template_id')
      .notNullable()
      .references('id')
      .inTable('templates')
      .onDelete('CASCADE');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    // A user can favorite a template only once. The composite index also serves
    // "favorites for user X" lookups because user_id is the leading column.
    table.unique(['user_id', 'template_id'], { indexName: 'favorites_user_template_unique' });
    table.index(['template_id'], 'favorites_template_id_idx');
  });
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('favorites');
};

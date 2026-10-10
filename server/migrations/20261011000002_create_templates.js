/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.schema.createTable('templates', (table) => {
    table.increments('id').primary();
    table.string('slug', 120).notNullable().unique();
    table.string('name', 120).notNullable();
    table.text('description').notNullable();
    table.string('thumbnail_url', 500).notNullable();
    table.string('category', 50).notNullable().index();
    table.timestamps(true, true);
  });

  // Speeds up the default catalog ordering.
  await knex.schema.alterTable('templates', (table) => {
    table.index(['name'], 'templates_name_idx');
  });
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('templates');
};

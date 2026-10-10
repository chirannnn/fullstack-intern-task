const templateService = require('../services/template.service');

async function list(req, res) {
  const { items, meta } = await templateService.list({ ...req.validated.query, userId: req.user?.id });
  res.status(200).json({ data: items, meta });
}

async function getById(req, res) {
  const template = await templateService.getById(req.validated.params.id, req.user?.id);
  res.status(200).json({ data: template });
}

async function listCategories(_req, res) {
  const categories = await templateService.listCategories();
  res.status(200).json({ data: categories });
}

module.exports = { list, getById, listCategories };

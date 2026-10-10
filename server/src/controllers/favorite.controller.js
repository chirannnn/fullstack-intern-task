const favoriteService = require('../services/favorite.service');

async function add(req, res) {
  const favorite = await favoriteService.add(req.user.id, req.validated.params.templateId);
  res.status(201).json({ data: favorite });
}

async function list(req, res) {
  const { items, meta } = await favoriteService.list(req.user.id, req.validated.query);
  res.status(200).json({ data: items, meta });
}

async function remove(req, res) {
  await favoriteService.remove(req.user.id, req.validated.params.templateId);
  res.status(204).end();
}

module.exports = { add, list, remove };

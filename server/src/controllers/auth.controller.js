const authService = require('../services/auth.service');

async function register(req, res) {
  const session = await authService.register(req.validated.body);
  res.status(201).json({ data: session });
}

async function login(req, res) {
  const session = await authService.login(req.validated.body);
  res.status(200).json({ data: session });
}

function me(req, res) {
  res.status(200).json({ data: { user: req.user } });
}

module.exports = { register, login, me };

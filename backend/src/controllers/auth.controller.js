const jwt = require("jsonwebtoken");
const { User } = require("../models");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

// POST /api/auth/register  (réservé admin en production — voir routes)
async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ where: { email } });
    if (existing) throw ApiError.conflict("Un compte existe déjà avec cet email");

    const user = await User.create({ name, email, password, role: role || "staff" });
    const token = signToken(user);
    return ApiResponse.created(res, { user: user.toSafeJSON(), token }, "Compte créé");
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !user.isActive) throw ApiError.unauthorized("Identifiants invalides");

    const match = await user.comparePassword(password);
    if (!match) throw ApiError.unauthorized("Identifiants invalides");

    const token = signToken(user);
    return ApiResponse.ok(res, { user: user.toSafeJSON(), token }, "Connexion réussie");
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
async function me(req, res, next) {
  try {
    return ApiResponse.ok(res, req.user.toSafeJSON());
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me };

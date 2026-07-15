const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
const { User } = require("../models");

/**
 * Vérifie le token JWT envoyé dans l'en-tête Authorization: Bearer <token>
 * et attache l'utilisateur authentifié à req.user.
 */
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw ApiError.unauthorized("Token d'authentification manquant");
    }
    const token = header.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(payload.id);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized("Utilisateur introuvable ou inactif");
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return next(ApiError.unauthorized("Token invalide ou expiré"));
    }
    next(err);
  }
}

/**
 * Restreint l'accès à une liste de rôles.
 * Exemple: authorize("admin", "manager")
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden("Rôle insuffisant pour cette action"));
    }
    next();
  };
}

module.exports = { authenticate, authorize };

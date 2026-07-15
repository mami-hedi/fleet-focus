const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

/**
 * A placer après un tableau de règles express-validator.
 * Renvoie une 400 avec le détail des erreurs si la validation échoue.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(ApiError.badRequest("Données invalides", errors.array()));
  }
  next();
}

module.exports = validate;

const ApiError = require("../utils/ApiError");

function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route introuvable: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let { statusCode, message, errors } = err;

  // Erreurs Sequelize
  if (err.name === "SequelizeValidationError" || err.name === "SequelizeUniqueConstraintError") {
    statusCode = 400;
    errors = err.errors?.map((e) => ({ field: e.path, message: e.message }));
    message = "Erreur de validation des données";
  } else if (err.name === "SequelizeForeignKeyConstraintError") {
    statusCode = 409;
    message = "Référence invalide (clé étrangère) — vérifiez les IDs liés";
  }

  if (!statusCode) statusCode = 500;
  if (!message) message = "Erreur interne du serveur";

  if (process.env.NODE_ENV !== "production" && statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: errors || undefined,
  });
}

module.exports = { notFoundHandler, errorHandler };

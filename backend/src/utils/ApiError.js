class ApiError extends Error {
  constructor(statusCode, message, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errors = null) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = "Non authentifié") {
    return new ApiError(401, message);
  }

  static forbidden(message = "Accès refusé") {
    return new ApiError(403, message);
  }

  static notFound(message = "Ressource introuvable") {
    return new ApiError(404, message);
  }

  static conflict(message = "Conflit de données") {
    return new ApiError(409, message);
  }

  static internal(message = "Erreur interne du serveur") {
    return new ApiError(500, message);
  }
}

module.exports = ApiError;

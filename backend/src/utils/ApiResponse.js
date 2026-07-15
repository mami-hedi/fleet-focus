class ApiResponse {
  static ok(res, data, message = "OK", meta) {
    return res.status(200).json({ success: true, message, data, ...(meta ? { meta } : {}) });
  }
  static created(res, data, message = "Ressource créée") {
    return res.status(201).json({ success: true, message, data });
  }
  static noContent(res, message = "Supprimé avec succès") {
    return res.status(200).json({ success: true, message });
  }
}

module.exports = ApiResponse;

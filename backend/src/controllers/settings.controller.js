const { Settings } = require("../models");
const ApiResponse = require("../utils/ApiResponse");

// GET /api/settings  (singleton — crée la ligne par défaut si absente)
async function get(req, res, next) {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    return ApiResponse.ok(res, settings);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/settings
async function update(req, res, next) {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    await settings.update(req.body);
    return ApiResponse.ok(res, settings, "Paramètres mis à jour");
  } catch (err) {
    next(err);
  }
}

module.exports = { get, update };

const { Settings } = require("../models");
const ApiResponse = require("../utils/ApiResponse");

const UPDATABLE_FIELDS = [
  "companyName",
  "companyLogoUrl",
  "companyAddress",
  "companyPhone",
  "companyEmail",
  "companyTaxId",
  "notifyEmail",
  "notifyOnDocumentExpiry",
  "notifyOnMaintenanceDue",
  "notifyOnIncident",
  "documentAlertDaysBefore",
];

// GET /api/settings
async function get(req, res, next) {
  try {
    const [settings] = await Settings.findOrCreate({ where: { id: 1 } });
    return ApiResponse.ok(res, settings);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/settings
async function update(req, res, next) {
  try {
    const [settings] = await Settings.findOrCreate({ where: { id: 1 } });
    const patch = {};
    for (const key of UPDATABLE_FIELDS) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }
    await settings.update(patch);
    return ApiResponse.ok(res, settings, "Paramètres mis à jour");
  } catch (err) {
    next(err);
  }
}

module.exports = { get, update };
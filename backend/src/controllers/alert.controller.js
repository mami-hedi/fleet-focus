const { DismissedAlert, Settings } = require("../models");
const { computeAlerts } = require("../utils/alertService");
const ApiResponse = require("../utils/ApiResponse");

// GET /api/alerts
async function list(req, res, next) {
  try {
    const settings = await Settings.findOne();
    const daysBefore = req.query.daysBefore ? Number(req.query.daysBefore) : settings?.alertDaysBefore || 30;
    const alerts = await computeAlerts({ daysBefore });
    return ApiResponse.ok(res, alerts);
  } catch (err) {
    next(err);
  }
}

// POST /api/alerts/:alertKey/dismiss
async function dismiss(req, res, next) {
  try {
    const { alertKey } = req.params;
    await DismissedAlert.findOrCreate({ where: { alertKey } });
    return ApiResponse.ok(res, null, "Alerte masquée");
  } catch (err) {
    next(err);
  }
}

module.exports = { list, dismiss };

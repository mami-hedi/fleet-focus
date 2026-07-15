const { randomUUID } = require("crypto");
const { Maintenance, Vehicle } = require("../models");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { paginate, buildMeta } = require("../utils/pagination");
const { logActivity } = require("../utils/activityLogger");

const RECURRENCE_MONTHS = { none: 0, monthly: 1, quarterly: 3, biannual: 6, annual: 12 };
const RECURRENCE_LABELS = {
  none: "Aucune",
  monthly: "Mensuelle",
  quarterly: "Trimestrielle",
  biannual: "Semestrielle",
  annual: "Annuelle",
};

function addMonths(dateStr, months) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

const include = [{ model: Vehicle, attributes: ["id", "brand", "model", "plate"] }];

// GET /api/maintenances
async function list(req, res, next) {
  try {
    const { page, limit, offset } = paginate(req.query);
    const where = {};
    if (req.query.vehicleId) where.vehicleId = req.query.vehicleId;
    if (req.query.status) where.status = req.query.status;
    if (req.query.seriesId) where.seriesId = req.query.seriesId;

    const { rows, count } = await Maintenance.findAndCountAll({
      where,
      include,
      order: [["scheduledDate", "DESC"]],
      limit,
      offset,
    });
    return ApiResponse.ok(res, rows, "OK", buildMeta({ page, limit, count }));
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const m = await Maintenance.findByPk(req.params.id, { include });
    if (!m) throw ApiError.notFound("Maintenance introuvable");
    return ApiResponse.ok(res, m);
  } catch (err) {
    next(err);
  }
}

// POST /api/maintenances
// Si `recurrence` != "none", génère automatiquement 4 occurrences espacées
// (même logique que le store Zustand du frontend), reliées par un seriesId commun.
async function create(req, res, next) {
  try {
    const payload = req.body;
    const recurrence = payload.recurrence || "none";
    const months = RECURRENCE_MONTHS[recurrence] ?? 0;
    const seriesId = recurrence !== "none" ? randomUUID() : null;
    const count = recurrence === "none" ? 1 : 4;

    const rows = [];
    for (let i = 0; i < count; i++) {
      rows.push({
        ...payload,
        scheduledDate: i === 0 ? payload.scheduledDate : addMonths(payload.scheduledDate, months * i),
        seriesId,
        recurrence,
        status: i === 0 ? payload.status || "upcoming" : "upcoming",
        completedDate: i === 0 ? payload.completedDate : null,
      });
    }

    const created = await Maintenance.bulkCreate(rows, { returning: true, individualHooks: true });

    const label =
      recurrence === "none"
        ? "Maintenance planifiée"
        : `Maintenance récurrente planifiée (${RECURRENCE_LABELS[recurrence].toLowerCase()})`;

    await logActivity({
      vehicleId: payload.vehicleId,
      kind: "maintenance_scheduled",
      label,
      details: `${payload.type} — ${payload.garage} — ${payload.scheduledDate}`,
      userId: req.user?.id,
    });

    return ApiResponse.created(res, created);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const m = await Maintenance.findByPk(req.params.id);
    if (!m) throw ApiError.notFound("Maintenance introuvable");
    await m.update(req.body);
    return ApiResponse.ok(res, m, "Maintenance mise à jour");
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const m = await Maintenance.findByPk(req.params.id);
    if (!m) throw ApiError.notFound("Maintenance introuvable");
    await m.destroy();
    return ApiResponse.noContent(res);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, create, update, remove };

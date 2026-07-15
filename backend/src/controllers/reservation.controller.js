const { Op } = require("sequelize");
const crudFactory = require("../utils/crudFactory");
const { Reservation, Vehicle, Driver } = require("../models");
const { logActivity } = require("../utils/activityLogger");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

const include = [
  { model: Vehicle, attributes: ["id", "brand", "model", "plate", "status"] },
  { model: Driver, attributes: ["id", "firstName", "lastName"] },
];

const base = crudFactory(Reservation, {
  filterFields: ["vehicleId", "driverId", "status", "type"],
  searchFields: ["clientName", "clientPhone", "pickupLocation", "dropoffLocation"],
  include,
  order: [["startDate", "DESC"]],
  notFoundMessage: "Réservation introuvable",
  onCreate: (r, req) =>
    logActivity({
      vehicleId: r.vehicleId,
      kind: "reservation_created",
      label: "Réservation créée",
      details: `${r.clientName} — du ${r.startDate} au ${r.endDate}`,
      userId: req.user?.id,
    }),
  onUpdate: (r, req, changed) =>
    changed.length &&
    logActivity({
      vehicleId: r.vehicleId,
      kind: "reservation_updated",
      label: "Réservation modifiée",
      details: `Champs : ${changed.join(", ")}`,
      userId: req.user?.id,
    }),
});

// GET /api/reservations/check-availability?vehicleId=&startDate=&endDate=&excludeId=
// Vérifie les chevauchements de réservations actives pour un véhicule donné.
async function checkAvailability(req, res, next) {
  try {
    const { vehicleId, startDate, endDate, excludeId } = req.query;
    if (!vehicleId || !startDate || !endDate) {
      throw ApiError.badRequest("vehicleId, startDate et endDate sont requis");
    }

    const where = {
      vehicleId,
      status: { [Op.notIn]: ["cancelled"] },
      startDate: { [Op.lte]: endDate },
      endDate: { [Op.gte]: startDate },
    };
    if (excludeId) where.id = { [Op.ne]: excludeId };

    const conflicts = await Reservation.findAll({ where, include });
    return ApiResponse.ok(res, { available: conflicts.length === 0, conflicts });
  } catch (err) {
    next(err);
  }
}

module.exports = { ...base, checkAvailability };

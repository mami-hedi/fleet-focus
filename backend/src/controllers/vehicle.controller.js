const { Op } = require("sequelize");
const { Vehicle, Driver, Reservation, Maintenance, DocumentItem, Inspection, FuelEntry, HistoryEntry } = require("../models");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { paginate, buildMeta } = require("../utils/pagination");
const { logActivity } = require("../utils/activityLogger");

// GET /api/vehicles?status=&fuel=&search=&page=&limit=
async function list(req, res, next) {
  try {
    const { page, limit, offset } = paginate(req.query);
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.fuel) where.fuel = req.query.fuel;
    if (req.query.search) {
      where[Op.or] = [
        { brand: { [Op.like]: `%${req.query.search}%` } },
        { model: { [Op.like]: `%${req.query.search}%` } },
        { plate: { [Op.like]: `%${req.query.search}%` } },
        { vin: { [Op.like]: `%${req.query.search}%` } },
      ];
    }

    const { rows, count } = await Vehicle.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return ApiResponse.ok(res, rows, "OK", buildMeta({ page, limit, count }));
  } catch (err) {
    next(err);
  }
}

// GET /api/vehicles/:id
async function getOne(req, res, next) {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id, {
      include: [{ model: Driver, as: "Driver" }],
    });
    if (!vehicle) throw ApiError.notFound("Véhicule introuvable");
    return ApiResponse.ok(res, vehicle);
  } catch (err) {
    next(err);
  }
}

// POST /api/vehicles
async function create(req, res, next) {
  try {
    const vehicle = await Vehicle.create(req.body);
    await logActivity({
      vehicleId: vehicle.id,
      kind: "vehicle_created",
      label: "Véhicule ajouté au parc",
      details: `${vehicle.brand} ${vehicle.model} — ${vehicle.plate}`,
      userId: req.user?.id,
    });
    return ApiResponse.created(res, vehicle);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/vehicles/:id
async function update(req, res, next) {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) throw ApiError.notFound("Véhicule introuvable");

    const changed = Object.keys(req.body).filter(
      (k) => JSON.stringify(vehicle[k]) !== JSON.stringify(req.body[k])
    );

    await vehicle.update(req.body);

    if (changed.length) {
      await logActivity({
        vehicleId: vehicle.id,
        kind: "vehicle_updated",
        label: "Fiche véhicule modifiée",
        details: `Champs : ${changed.join(", ")}`,
        userId: req.user?.id,
      });
    }

    return ApiResponse.ok(res, vehicle, "Véhicule mis à jour");
  } catch (err) {
    next(err);
  }
}

// DELETE /api/vehicles/:id  (cascade sur réservations/maintenances/etc. via FK)
async function remove(req, res, next) {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) throw ApiError.notFound("Véhicule introuvable");
    await vehicle.destroy();
    return ApiResponse.noContent(res, "Véhicule supprimé");
  } catch (err) {
    next(err);
  }
}

// GET /api/vehicles/:id/history
async function getHistory(req, res, next) {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) throw ApiError.notFound("Véhicule introuvable");

    const history = await HistoryEntry.findAll({
      where: { vehicleId: vehicle.id },
      order: [["timestamp", "DESC"]],
    });
    return ApiResponse.ok(res, history);
  } catch (err) {
    next(err);
  }
}

// GET /api/vehicles/:id/full  (fiche complète : réservations, maintenances, docs, inspections, carburant)
async function getFull(req, res, next) {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id, {
      include: [
        { model: Driver, as: "Driver" },
        { model: Reservation, limit: 10, order: [["startDate", "DESC"]] },
        { model: Maintenance, limit: 10, order: [["scheduledDate", "DESC"]] },
        { model: DocumentItem },
        { model: Inspection, limit: 10, order: [["date", "DESC"]] },
        { model: FuelEntry, limit: 10, order: [["date", "DESC"]] },
      ],
    });
    if (!vehicle) throw ApiError.notFound("Véhicule introuvable");
    return ApiResponse.ok(res, vehicle);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, create, update, remove, getHistory, getFull };

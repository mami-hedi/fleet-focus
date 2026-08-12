const { Op } = require("sequelize");
const fs = require("fs");
const path = require("path");
const { Vehicle, Driver, Reservation, Maintenance, DocumentItem, Inspection, FuelEntry, HistoryEntry } = require("../models");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { paginate, buildMeta } = require("../utils/pagination");
const { logActivity } = require("../utils/activityLogger");

function isInternalPath(p) {
  return typeof p === "string" && p.startsWith("/uploads/vehicles/");
}

function unlinkInternal(p) {
  if (!isInternalPath(p)) return; // jamais supprimer une URL externe (ex: Unsplash)
  const fullPath = path.join(__dirname, "..", p.replace(/^\//, ""));
  fs.unlink(fullPath, () => {}); // best-effort
}

// multipart/form-data envoie tout en string : on force les bons types, on convertit les
// fichiers reçus par multer en chemins courts stockés en base, et on fusionne les photos
// conservées ("keepPhotos", envoyé en JSON par le frontend) avec les nouvelles uploadées.
// ⚠️ Ne JAMAIS accepter de base64 dans "image"/"photos" : ces colonnes sont prévues pour
// des chemins courts (STRING/JSON de strings), pas pour stocker le blob lui-même.
function normalizeBody(req, existingVehicle) {
  if (req.body.year !== undefined) req.body.year = parseInt(req.body.year, 10);
  if (req.body.mileage !== undefined) req.body.mileage = parseInt(req.body.mileage, 10);

  if (req.files?.image?.[0]) {
    req.body.image = `/uploads/vehicles/${req.files.image[0].filename}`;
  }
  // Sinon req.body.image reste tel quel : soit une URL externe collée manuellement,
  // soit le chemin existant renvoyé tel quel par le frontend, soit absent du tout.

  const newPhotoPaths = (req.files?.photos || []).map((f) => `/uploads/vehicles/${f.filename}`);

  let keepPhotos;
  if (req.body.keepPhotos !== undefined) {
    try {
      const parsed = JSON.parse(req.body.keepPhotos);
      keepPhotos = Array.isArray(parsed) ? parsed : [];
    } catch {
      keepPhotos = [];
    }
  }
  delete req.body.keepPhotos;

  if (!existingVehicle) {
    // Création : on initialise toujours "photos", même à un tableau vide.
    req.body.photos = [...(keepPhotos || []), ...newPhotoPaths];
  } else if (keepPhotos !== undefined || newPhotoPaths.length > 0) {
    // Édition : on ne touche au tableau que si le frontend a explicitement envoyé
    // une liste à conserver et/ou de nouvelles photos ; sinon on laisse les photos
    // existantes intactes (pas de req.body.photos = pas de changement pour Sequelize).
    req.body.photos = [...(keepPhotos ?? existingVehicle.photos ?? []), ...newPhotoPaths];
  }
}

// Supprime du disque les anciens fichiers désormais orphelins après une mise à jour
// (couverture remplacée, photos retirées de la liste conservée).
function cleanupOrphanFiles(existingVehicle, newBody) {
  if (newBody.image !== undefined && newBody.image !== existingVehicle.image) {
    unlinkInternal(existingVehicle.image);
  }
  if (newBody.photos !== undefined) {
    const kept = new Set(newBody.photos);
    for (const p of existingVehicle.photos || []) {
      if (!kept.has(p)) unlinkInternal(p);
    }
  }
}

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
    normalizeBody(req, null);
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

    normalizeBody(req, vehicle);

    const changed = Object.keys(req.body).filter(
      (k) => JSON.stringify(vehicle[k]) !== JSON.stringify(req.body[k])
    );

    cleanupOrphanFiles(vehicle, req.body);

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

    unlinkInternal(vehicle.image);
    for (const p of vehicle.photos || []) unlinkInternal(p);

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
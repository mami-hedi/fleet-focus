const crudFactory = require("../utils/crudFactory");
const { Driver, Vehicle } = require("../models");
const { logActivity } = require("../utils/activityLogger");
const fs = require("fs");
const path = require("path");

const base = crudFactory(Driver, {
  filterFields: ["status", "assignedVehicleId"],
  searchFields: ["firstName", "lastName", "email", "phone", "licenseNumber"],
  include: [{ model: Vehicle, as: "assignedVehicle" }],
  order: [["createdAt", "DESC"]],
  notFoundMessage: "Chauffeur introuvable",
  onCreate: (driver, req) =>
    logActivity({
      vehicleId: driver.assignedVehicleId || null,
      kind: "driver_created",
      label: "Chauffeur ajouté",
      details: `${driver.firstName} ${driver.lastName}`,
      userId: req.user?.id,
    }),
  onUpdate: (driver, req, changed) =>
    changed.length &&
    logActivity({
      vehicleId: driver.assignedVehicleId || null,
      kind: "driver_updated",
      label: "Fiche chauffeur modifiée",
      details: `Champs : ${changed.join(", ")}`,
      userId: req.user?.id,
    }),
});

// multipart/form-data envoie tout en string : on force les bons types avant que
// crudFactory ne transmette req.body à Sequelize, et on convertit le fichier reçu
// par multer en chemin public stocké en base (colonne "photo").
// ⚠️ Ne JAMAIS accepter une string base64 dans "photo" : la colonne est un STRING
// (VARCHAR) côté Sequelize, pas un TEXT/BLOB — un base64 la ferait déborder/tronquer.
function normalizeBody(req) {
  if (req.body.assignedVehicleId !== undefined && req.body.assignedVehicleId !== "") {
    req.body.assignedVehicleId = parseInt(req.body.assignedVehicleId, 10);
  } else {
    delete req.body.assignedVehicleId;
  }
  if (req.file) {
    req.body.photo = `/uploads/drivers/${req.file.filename}`;
  } else {
    // Pas de nouveau fichier : on ne touche pas au champ "photo" existant.
    delete req.body.photo;
  }
}

exports.list = base.list;
exports.getOne = base.getOne;
exports.remove = base.remove;

exports.create = (req, res, next) => {
  normalizeBody(req);
  return base.create(req, res, next);
};

exports.update = async (req, res, next) => {
  try {
    normalizeBody(req);

    // Si une nouvelle photo remplace l'ancienne, on supprime l'ancien fichier du disque.
    if (req.file) {
      const existing = await Driver.findByPk(req.params.id);
      if (existing?.photo) {
        const oldPath = path.join(__dirname, "..", existing.photo.replace(/^\//, ""));
        fs.unlink(oldPath, () => {}); // best-effort
      }
    }

    return base.update(req, res, next);
  } catch (err) {
    next(err);
  }
};
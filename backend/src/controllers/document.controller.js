const crudFactory = require("../utils/crudFactory");
const { DocumentItem, Vehicle } = require("../models");
const { logActivity } = require("../utils/activityLogger");
const fs = require("fs");
const path = require("path");

const base = crudFactory(DocumentItem, {
  filterFields: ["vehicleId", "type"],
  searchFields: ["number"],
  include: [{ model: Vehicle, attributes: ["id", "brand", "model", "plate"] }],
  order: [["expiryDate", "ASC"]],
  notFoundMessage: "Document introuvable",
  onCreate: (d, req) =>
    logActivity({
      vehicleId: d.vehicleId,
      kind: "document_created",
      label: "Document ajouté",
      details: `${d.type} — ${d.number}`,
      userId: req.user?.id,
    }),
});

// multipart/form-data envoie tous les champs texte en string : on force les bons
// types avant que crudFactory ne transmette req.body à Sequelize, et on convertit
// le fichier reçu par multer en chemin public stocké en base (fileUrl).
function normalizeBody(req) {
  if (req.body.vehicleId !== undefined) {
    req.body.vehicleId = parseInt(req.body.vehicleId, 10);
  }
  if (req.file) {
    req.body.fileUrl = `/uploads/documents/${req.file.filename}`;
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

    // Si une nouvelle photo remplace l'ancienne, on supprime l'ancien fichier du disque
    if (req.file) {
      const existing = await DocumentItem.findByPk(req.params.id);
      if (existing?.fileUrl) {
        const oldPath = path.join(__dirname, "..", existing.fileUrl.replace(/^\//, ""));
        fs.unlink(oldPath, () => {}); // best-effort, on n'échoue pas la requête si ça rate
      }
    }

    return base.update(req, res, next);
  } catch (err) {
    next(err);
  }
};
const crudFactory = require("../utils/crudFactory");
const { Inspection, Vehicle } = require("../models");
const { logActivity } = require("../utils/activityLogger");

// "mileage" ajouté pour que le frontend puisse resynchroniser le véhicule
// sans requête supplémentaire après la création d'un état des lieux.
const include = [{ model: Vehicle, attributes: ["id", "brand", "model", "plate", "mileage"] }];

const base = crudFactory(Inspection, {
  filterFields: ["vehicleId", "type"],
  searchFields: ["notes"],
  include,
  order: [["date", "DESC"]],
  notFoundMessage: "État des lieux introuvable",
});

// Chemins relatifs servis statiquement, ex: /uploads/inspections/inspections-172...-123.jpg
function filesToPaths(files) {
  if (!files || files.length === 0) return [];
  return files.map((f) => `/uploads/inspections/${f.filename}`);
}

// Le formulaire est envoyé en multipart/form-data : "checklist" arrive en string JSON.
function parseChecklist(raw) {
  if (!raw) return undefined;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

exports.list = base.list;
exports.getOne = base.getOne;
exports.remove = base.remove;

exports.create = async (req, res, next) => {
  try {
    const checklist = parseChecklist(req.body.checklist);
    const inspection = await Inspection.create({
      vehicleId: req.body.vehicleId,
      type: req.body.type,
      date: req.body.date,
      mileage: req.body.mileage,
      fuelLevel: req.body.fuelLevel,
      notes: req.body.notes || null,
      ...(checklist && { checklist }),
      photos: filesToPaths(req.files),
    });

    await logActivity({
      vehicleId: inspection.vehicleId,
      kind: "inspection_created",
      label: `État des lieux (${inspection.type})`,
      details: `${inspection.mileage} km — carburant ${inspection.fuelLevel}%`,
      userId: req.user?.id,
    });

    // Le kilométrage du véhicule ne recule jamais : on ne met à jour que si le
    // relevé de l'état des lieux dépasse le kilométrage actuellement enregistré.
    const vehicle = await Vehicle.findByPk(inspection.vehicleId);
    if (vehicle && inspection.mileage > vehicle.mileage) {
      await vehicle.update({ mileage: inspection.mileage });
    }

    const full = await Inspection.findByPk(inspection.id, { include });
    res.status(201).json({ data: full });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const inspection = await Inspection.findByPk(req.params.id);
    if (!inspection) return res.status(404).json({ message: "État des lieux introuvable" });

    const checklist = parseChecklist(req.body.checklist);
    const newPhotos = filesToPaths(req.files);

    await inspection.update({
      ...(req.body.vehicleId !== undefined && { vehicleId: req.body.vehicleId }),
      ...(req.body.type !== undefined && { type: req.body.type }),
      ...(req.body.date !== undefined && { date: req.body.date }),
      ...(req.body.mileage !== undefined && { mileage: req.body.mileage }),
      ...(req.body.fuelLevel !== undefined && { fuelLevel: req.body.fuelLevel }),
      ...(req.body.notes !== undefined && { notes: req.body.notes }),
      ...(checklist && { checklist }),
      // Nouvelles photos envoyées -> elles remplacent les anciennes. Sinon on garde l'existant.
      ...(newPhotos.length > 0 && { photos: newPhotos }),
    });

    const full = await Inspection.findByPk(inspection.id, { include });
    res.json({ data: full });
  } catch (err) {
    next(err);
  }
};
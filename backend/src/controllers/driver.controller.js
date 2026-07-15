const crudFactory = require("../utils/crudFactory");
const { Driver, Vehicle } = require("../models");
const { logActivity } = require("../utils/activityLogger");

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

module.exports = base;

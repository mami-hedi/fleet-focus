const crudFactory = require("../utils/crudFactory");
const { Inspection, Vehicle } = require("../models");
const { logActivity } = require("../utils/activityLogger");

const base = crudFactory(Inspection, {
  filterFields: ["vehicleId", "type"],
  searchFields: ["notes"],
  include: [{ model: Vehicle, attributes: ["id", "brand", "model", "plate"] }],
  order: [["date", "DESC"]],
  notFoundMessage: "État des lieux introuvable",
  onCreate: (i, req) =>
    logActivity({
      vehicleId: i.vehicleId,
      kind: "inspection_created",
      label: `État des lieux (${i.type})`,
      details: `${i.mileage} km — carburant ${i.fuelLevel}%`,
      userId: req.user?.id,
    }),
});

module.exports = base;

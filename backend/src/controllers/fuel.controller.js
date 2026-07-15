const crudFactory = require("../utils/crudFactory");
const { FuelEntry, Vehicle } = require("../models");
const { logActivity } = require("../utils/activityLogger");

const base = crudFactory(FuelEntry, {
  filterFields: ["vehicleId", "fullTank"],
  searchFields: ["station"],
  include: [{ model: Vehicle, attributes: ["id", "brand", "model", "plate"] }],
  order: [["date", "DESC"]],
  notFoundMessage: "Plein de carburant introuvable",
  onCreate: (entry, req) =>
    logActivity({
      vehicleId: entry.vehicleId,
      kind: "fuel_added",
      label: "Plein de carburant enregistré",
      details: `${entry.liters} L — ${entry.totalCost} TND — ${entry.station}`,
      userId: req.user?.id,
    }),
});

module.exports = base;

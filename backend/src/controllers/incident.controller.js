const crudFactory = require("../utils/crudFactory");
const { Incident, Vehicle, Driver } = require("../models");
const { logActivity } = require("../utils/activityLogger");

const base = crudFactory(Incident, {
  filterFields: ["vehicleId", "driverId", "severity", "status"],
  searchFields: ["location", "description"],
  include: [
    { model: Vehicle, attributes: ["id", "brand", "model", "plate"] },
    { model: Driver, attributes: ["id", "firstName", "lastName"] },
  ],
  order: [["date", "DESC"]],
  notFoundMessage: "Incident introuvable",
  onCreate: (inc, req) =>
    logActivity({
      vehicleId: inc.vehicleId,
      kind: "incident_created",
      label: `Incident déclaré (${inc.severity})`,
      details: inc.description?.slice(0, 120),
      userId: req.user?.id,
    }),
});

module.exports = base;

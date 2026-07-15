const crudFactory = require("../utils/crudFactory");
const { DocumentItem, Vehicle } = require("../models");
const { logActivity } = require("../utils/activityLogger");

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

module.exports = base;

const { Op } = require("sequelize");
const { DocumentItem, Maintenance, Vehicle, DismissedAlert } = require("../models");

function daysUntil(dateStr) {
  const target = new Date(dateStr).getTime();
  const now = new Date().setHours(0, 0, 0, 0);
  return Math.round((target - now) / (1000 * 60 * 60 * 24));
}

const DOC_LABELS = {
  carte_grise: "Carte grise",
  assurance: "Assurance",
  controle_technique: "Contrôle technique",
  "Contrat de location": "Contrat de location",
  "Constat assurance": "Constat assurance",
};

/**
 * Calcule dynamiquement la liste des alertes actives à partir des documents
 * qui expirent bientôt et des maintenances à venir, en excluant celles que
 * l'utilisateur a explicitement rejetées (DismissedAlert).
 */
async function computeAlerts({ daysBefore = 30 } = {}) {
  const [documents, maintenances, dismissed] = await Promise.all([
    DocumentItem.findAll({ include: [{ model: Vehicle, attributes: ["id", "brand", "model", "plate"] }] }),
    Maintenance.findAll({
      where: { status: { [Op.in]: ["upcoming", "in_progress"] } },
      include: [{ model: Vehicle, attributes: ["id", "brand", "model", "plate"] }],
    }),
    DismissedAlert.findAll({ attributes: ["alertKey"] }),
  ]);

  const dismissedKeys = new Set(dismissed.map((d) => d.alertKey));
  const alerts = [];

  for (const doc of documents) {
    const remaining = daysUntil(doc.expiryDate);
    if (remaining > daysBefore) continue;
    const key = `document-${doc.id}`;
    if (dismissedKeys.has(key)) continue;

    let severity = "low";
    if (remaining < 0) severity = "high";
    else if (remaining <= 7) severity = "high";
    else if (remaining <= 15) severity = "medium";

    const label = doc.expiryDate && remaining < 0
      ? `${DOC_LABELS[doc.type] || doc.type} expiré(e)`
      : `${DOC_LABELS[doc.type] || doc.type} expire dans ${remaining} jour(s)`;

    alerts.push({
      id: key,
      type: "document",
      vehicleId: doc.vehicleId,
      vehicle: doc.Vehicle,
      message: label,
      severity,
      date: doc.expiryDate,
      refId: doc.id,
    });
  }

  for (const m of maintenances) {
    const remaining = daysUntil(m.scheduledDate);
    if (remaining > 7) continue; // maintenances imminentes uniquement
    const key = `maintenance-${m.id}`;
    if (dismissedKeys.has(key)) continue;

    const severity = remaining < 0 ? "high" : remaining <= 2 ? "high" : "medium";
    const label =
      remaining < 0
        ? `Maintenance en retard: ${m.type}`
        : `Maintenance à planifier: ${m.type} (dans ${remaining} jour(s))`;

    alerts.push({
      id: key,
      type: "maintenance",
      vehicleId: m.vehicleId,
      vehicle: m.Vehicle,
      message: label,
      severity,
      date: m.scheduledDate,
      refId: m.id,
    });
  }

  alerts.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity] || new Date(a.date) - new Date(b.date);
  });

  return alerts;
}

module.exports = { computeAlerts, daysUntil };

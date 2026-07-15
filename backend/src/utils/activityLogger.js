const { HistoryEntry } = require("../models");

/**
 * Enregistre une entrée dans le journal d'activité (utilisé par le module
 * "Activité" du frontend). Ne bloque jamais la requête principale en cas
 * d'erreur d'écriture du log.
 */
async function logActivity({ vehicleId = null, kind, label, details, userId = null }) {
  try {
    await HistoryEntry.create({ vehicleId, kind, label, details, userId, timestamp: new Date() });
  } catch (err) {
    console.error("Impossible d'écrire le journal d'activité:", err.message);
  }
}

module.exports = { logActivity };

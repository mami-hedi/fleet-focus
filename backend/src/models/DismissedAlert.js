const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

/**
 * Les alertes (documents qui expirent, maintenances à venir, etc.) sont
 * calculées à la volée par alert.service.js. On garde uniquement une trace
 * des alertes "rejetées" par l'utilisateur pour les masquer côté API.
 */
const DismissedAlert = sequelize.define(
  "DismissedAlert",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    // alertKey identifie une alerte calculée de façon déterministe,
    // ex: "document-14", "maintenance-7"
    alertKey: { type: DataTypes.STRING, allowNull: false, unique: true },
  },
  { tableName: "dismissed_alerts", updatedAt: false }
);

module.exports = DismissedAlert;

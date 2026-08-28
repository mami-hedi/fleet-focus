const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// Table à une seule ligne (id fixé à 1) : l'app est admin-only, pas besoin de
// multi-tenant. On force l'unicité via un id constant plutôt qu'un vrai
// singleton pattern Sequelize, pour rester simple et lisible.
//
// IMPORTANT : ce modèle est déjà utilisé par alert.controller.js (lecture de
// documentAlertDaysBefore / notifyOnDocumentExpiry pour calculer les fenêtres
// d'alerte). On l'étend ici avec les champs entreprise, on ne le remplace pas.
const Settings = sequelize.define(
  "Settings",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, defaultValue: 1 },

    // ─ Infos entreprise ─
    companyName: { type: DataTypes.STRING, allowNull: true },
    companyLogoUrl: { type: DataTypes.STRING, allowNull: true },
    companyAddress: { type: DataTypes.STRING, allowNull: true },
    companyPhone: { type: DataTypes.STRING, allowNull: true },
    companyEmail: { type: DataTypes.STRING, allowNull: true },
    companyTaxId: { type: DataTypes.STRING, allowNull: true }, // matricule fiscal / SIRET

    // ─ Notifications (déjà lues par alert.controller.js) ─
    notifyEmail: { type: DataTypes.STRING, allowNull: true }, // adresse qui reçoit les alertes
    notifyOnDocumentExpiry: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    notifyOnMaintenanceDue: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    notifyOnIncident: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    documentAlertDaysBefore: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 30 },
  },
  { tableName: "settings" }
);

module.exports = Settings;
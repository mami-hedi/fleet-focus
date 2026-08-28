const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const DEFAULT_CHECKLIST = {
  tires: false,
  exteriorClean: false,
  interiorClean: false,
  spareWheel: false,
  triangle: false,
  vest: false,
};

// Parse en toute sécurité une valeur JSON stockée en longtext par MySQL :
// gère à la fois le cas où Sequelize renvoie déjà un objet/array (colonne
// réellement typée JSON) ET le cas où il renvoie la chaîne brute (colonne
// physique en longtext, comme c'est le cas ici en base).
function safeJsonParse(raw, fallback) {
  if (raw === null || raw === undefined) return fallback;
  if (typeof raw !== "string") return raw; // déjà parsé par Sequelize
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

const Inspection = sequelize.define(
  "Inspection",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    vehicleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "vehicles", key: "id" },
    },
    type: { type: DataTypes.ENUM("entree", "sortie"), allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    mileage: { type: DataTypes.INTEGER, allowNull: false },
    fuelLevel: { type: DataTypes.INTEGER, allowNull: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
    checklist: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: DEFAULT_CHECKLIST,
      get() {
        const parsed = safeJsonParse(this.getDataValue("checklist"), DEFAULT_CHECKLIST);
        return parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? parsed
          : DEFAULT_CHECKLIST;
      },
    },
    photos: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      get() {
        const parsed = safeJsonParse(this.getDataValue("photos"), []);
        return Array.isArray(parsed) ? parsed : [];
      },
    },
  },
  { tableName: "inspections" }
);

module.exports = Inspection;
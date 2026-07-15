const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

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
      defaultValue: {
        tires: false,
        exteriorClean: false,
        interiorClean: false,
        spareWheel: false,
        triangle: false,
        vest: false,
      },
    },
    photos: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  },
  { tableName: "inspections" }
);

module.exports = Inspection;

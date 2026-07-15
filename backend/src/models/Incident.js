const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Incident = sequelize.define(
  "Incident",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    vehicleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "vehicles", key: "id" },
    },
    driverId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "drivers", key: "id" },
    },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    location: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    severity: {
      type: DataTypes.ENUM("minor", "moderate", "severe"),
      allowNull: false,
      defaultValue: "minor",
    },
    status: {
      type: DataTypes.ENUM("open", "in_progress", "resolved"),
      allowNull: false,
      defaultValue: "open",
    },
    photos: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
    cost: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    insuranceClaim: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { tableName: "incidents" }
);

module.exports = Incident;

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Maintenance = sequelize.define(
  "Maintenance",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    vehicleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "vehicles", key: "id" },
    },
    type: { type: DataTypes.STRING, allowNull: false },
    scheduledDate: { type: DataTypes.DATEONLY, allowNull: false },
    completedDate: { type: DataTypes.DATEONLY, allowNull: true },
    status: {
      type: DataTypes.ENUM("upcoming", "in_progress", "completed"),
      allowNull: false,
      defaultValue: "upcoming",
    },
    cost: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    garage: { type: DataTypes.STRING, allowNull: false },
    recurrence: {
      type: DataTypes.ENUM("none", "monthly", "quarterly", "biannual", "annual"),
      allowNull: false,
      defaultValue: "none",
    },
    seriesId: { type: DataTypes.STRING, allowNull: true },
  },
  { tableName: "maintenances" }
);

module.exports = Maintenance;

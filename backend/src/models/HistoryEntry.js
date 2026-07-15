const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const HistoryEntry = sequelize.define(
  "HistoryEntry",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    vehicleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "vehicles", key: "id" },
    },
    timestamp: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    kind: {
      type: DataTypes.ENUM(
        "vehicle_created",
        "vehicle_updated",
        "vehicle_deleted",
        "maintenance_scheduled",
        "inspection_created",
        "document_created",
        "driver_created",
        "driver_updated",
        "incident_created",
        "fuel_added",
        "reservation_created",
        "reservation_updated"
      ),
      allowNull: false,
    },
    label: { type: DataTypes.STRING, allowNull: false },
    details: { type: DataTypes.STRING, allowNull: true },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
  },
  { tableName: "history_entries", updatedAt: false }
);

module.exports = HistoryEntry;

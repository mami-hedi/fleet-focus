const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Reservation = sequelize.define(
  "Reservation",
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
    type: {
      type: DataTypes.ENUM("transfer", "day_trip", "multi_day", "airport"),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "confirmed", "in_progress", "completed", "cancelled"),
      allowNull: false,
      defaultValue: "pending",
    },
    startDate: { type: DataTypes.DATEONLY, allowNull: false },
    startTime: { type: DataTypes.STRING, allowNull: false },
    endDate: { type: DataTypes.DATEONLY, allowNull: false },
    endTime: { type: DataTypes.STRING, allowNull: false },
    pickupLocation: { type: DataTypes.STRING, allowNull: false },
    dropoffLocation: { type: DataTypes.STRING, allowNull: false },
    clientName: { type: DataTypes.STRING, allowNull: false },
    clientPhone: { type: DataTypes.STRING, allowNull: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: "reservations" }
);

module.exports = Reservation;

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Driver = sequelize.define(
  "Driver",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    phone: { type: DataTypes.STRING, allowNull: false },
    licenseNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    licenseExpiry: { type: DataTypes.DATEONLY, allowNull: false },
    assignedVehicleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "vehicles", key: "id" },
    },
    photo: { type: DataTypes.STRING, allowNull: true },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
    },
  },
  { tableName: "drivers" }
);

module.exports = Driver;

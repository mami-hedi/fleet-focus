const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const FuelEntry = sequelize.define(
  "FuelEntry",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    vehicleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "vehicles", key: "id" },
    },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    station: { type: DataTypes.STRING, allowNull: false },
    liters: { type: DataTypes.DECIMAL(8, 2), allowNull: false },
    pricePerLiter: { type: DataTypes.DECIMAL(8, 3), allowNull: false },
    totalCost: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    mileage: { type: DataTypes.INTEGER, allowNull: false },
    fullTank: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: "fuel_entries",
    hooks: {
      beforeValidate: (entry) => {
        if (entry.liters != null && entry.pricePerLiter != null) {
          entry.totalCost = Number((entry.liters * entry.pricePerLiter).toFixed(2));
        }
      },
    },
  }
);

module.exports = FuelEntry;

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Vehicle = sequelize.define(
  "Vehicle",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    brand: { type: DataTypes.STRING, allowNull: false },
    model: { type: DataTypes.STRING, allowNull: false },
    year: { type: DataTypes.INTEGER, allowNull: false },
    plate: { type: DataTypes.STRING, allowNull: false, unique: true },
    vin: { type: DataTypes.STRING, allowNull: false, unique: true },
    color: { type: DataTypes.STRING, allowNull: true },
    transmission: {
      type: DataTypes.ENUM("manuelle", "automatique"),
      allowNull: false,
      defaultValue: "manuelle",
    },
    fuel: {
      type: DataTypes.ENUM("essence", "diesel", "hybride", "electrique"),
      allowNull: false,
    },
    mileage: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    status: {
      type: DataTypes.ENUM("available", "rented", "maintenance", "out_of_service"),
      allowNull: false,
      defaultValue: "available",
    },
    image: { type: DataTypes.STRING, allowNull: true },
    photos: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  },
  { tableName: "vehicles" }
);

module.exports = Vehicle;

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Settings = sequelize.define(
  "Settings",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    companyName: { type: DataTypes.STRING, allowNull: false, defaultValue: "MH Digital Solution" },
    companyEmail: { type: DataTypes.STRING, allowNull: true },
    companyPhone: { type: DataTypes.STRING, allowNull: true },
    companyAddress: { type: DataTypes.STRING, allowNull: true },
    siret: { type: DataTypes.STRING, allowNull: true },
    tva: { type: DataTypes.STRING, allowNull: true },
    logo: { type: DataTypes.STRING, allowNull: true },
    theme: {
      type: DataTypes.ENUM("light", "dark", "system"),
      allowNull: false,
      defaultValue: "light",
    },
    language: { type: DataTypes.ENUM("fr", "en"), allowNull: false, defaultValue: "fr" },
    emailAlerts: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    alertDaysBefore: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 30 },
  },
  { tableName: "settings" }
);

module.exports = Settings;

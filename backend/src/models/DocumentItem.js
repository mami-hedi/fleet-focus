const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const DocumentItem = sequelize.define(
  "DocumentItem",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    vehicleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "vehicles", key: "id" },
    },
    type: {
      type: DataTypes.ENUM(
        "carte_grise",
        "assurance",
        "controle_technique",
        "Contrat de location",
        "Constat assurance"
      ),
      allowNull: false,
    },
    number: { type: DataTypes.STRING, allowNull: false },
    expiryDate: { type: DataTypes.DATEONLY, allowNull: false },
    fileUrl: { type: DataTypes.STRING, allowNull: true },
  },
  { tableName: "documents" }
);

module.exports = DocumentItem;

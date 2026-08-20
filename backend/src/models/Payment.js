const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Payment = sequelize.define(
  "Payment",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    reservationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "reservations", key: "id" },
    },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    method: {
      type: DataTypes.ENUM("cash", "card", "transfer", "cheque"),
      allowNull: false,
      defaultValue: "cash",
    },
    status: {
      type: DataTypes.ENUM("pending", "paid", "partial", "refunded"),
      allowNull: false,
      defaultValue: "pending",
    },
    paidAt: { type: DataTypes.DATEONLY, allowNull: true },
    reference: { type: DataTypes.STRING(100), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: "payments" }
);

module.exports = Payment;

const sequelize = require("../config/database");

const User = require("./User");
const Vehicle = require("./Vehicle");
const Driver = require("./Driver");
const Reservation = require("./Reservation");
const Incident = require("./Incident");
const Maintenance = require("./Maintenance");
const FuelEntry = require("./FuelEntry");
const Inspection = require("./Inspection");
const DocumentItem = require("./DocumentItem");
const HistoryEntry = require("./HistoryEntry");
const DismissedAlert = require("./DismissedAlert");
const Settings = require("./Settings");

// ─── Vehicle 1-N relations ───
Vehicle.hasMany(Reservation, { foreignKey: "vehicleId", onDelete: "CASCADE" });
Reservation.belongsTo(Vehicle, { foreignKey: "vehicleId" });

Vehicle.hasMany(Incident, { foreignKey: "vehicleId", onDelete: "CASCADE" });
Incident.belongsTo(Vehicle, { foreignKey: "vehicleId" });

Vehicle.hasMany(Maintenance, { foreignKey: "vehicleId", onDelete: "CASCADE" });
Maintenance.belongsTo(Vehicle, { foreignKey: "vehicleId" });

Vehicle.hasMany(FuelEntry, { foreignKey: "vehicleId", onDelete: "CASCADE" });
FuelEntry.belongsTo(Vehicle, { foreignKey: "vehicleId" });

Vehicle.hasMany(Inspection, { foreignKey: "vehicleId", onDelete: "CASCADE" });
Inspection.belongsTo(Vehicle, { foreignKey: "vehicleId" });

Vehicle.hasMany(DocumentItem, { foreignKey: "vehicleId", onDelete: "CASCADE" });
DocumentItem.belongsTo(Vehicle, { foreignKey: "vehicleId" });

Vehicle.hasMany(HistoryEntry, { foreignKey: "vehicleId", onDelete: "SET NULL" });
HistoryEntry.belongsTo(Vehicle, { foreignKey: "vehicleId" });

Vehicle.hasOne(Driver, { foreignKey: "assignedVehicleId" });
Driver.belongsTo(Vehicle, { foreignKey: "assignedVehicleId", as: "assignedVehicle" });

// ─── Driver 1-N relations ───
Driver.hasMany(Reservation, { foreignKey: "driverId", onDelete: "SET NULL" });
Reservation.belongsTo(Driver, { foreignKey: "driverId" });

Driver.hasMany(Incident, { foreignKey: "driverId", onDelete: "SET NULL" });
Incident.belongsTo(Driver, { foreignKey: "driverId" });

// ─── User relations ───
User.hasMany(HistoryEntry, { foreignKey: "userId", onDelete: "SET NULL" });
HistoryEntry.belongsTo(User, { foreignKey: "userId" });

module.exports = {
  sequelize,
  User,
  Vehicle,
  Driver,
  Reservation,
  Incident,
  Maintenance,
  FuelEntry,
  Inspection,
  DocumentItem,
  HistoryEntry,
  DismissedAlert,
  Settings,
};

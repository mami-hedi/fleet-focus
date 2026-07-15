const { Op, fn, col, literal } = require("sequelize");
const { Vehicle, Reservation, Maintenance, Incident, FuelEntry, DocumentItem } = require("../models");
const ApiResponse = require("../utils/ApiResponse");
const { daysUntil } = require("../utils/alertService");

// GET /api/stats/dashboard
// Agrège les indicateurs affichés sur les pages Dashboard / Statistiques du frontend.
async function dashboard(req, res, next) {
  try {
    const [
      totalVehicles,
      byStatusRaw,
      activeReservations,
      upcomingMaintenances,
      openIncidents,
      documents,
      fuelAgg,
    ] = await Promise.all([
      Vehicle.count(),
      Vehicle.findAll({ attributes: ["status", [fn("COUNT", col("id")), "count"]], group: ["status"] }),
      Reservation.count({ where: { status: { [Op.in]: ["pending", "confirmed", "in_progress"] } } }),
      Maintenance.count({ where: { status: { [Op.in]: ["upcoming", "in_progress"] } } }),
      Incident.count({ where: { status: { [Op.ne]: "resolved" } } }),
      DocumentItem.findAll({ attributes: ["id", "type", "expiryDate"] }),
      FuelEntry.findOne({
        attributes: [
          [fn("SUM", col("totalCost")), "totalSpent"],
          [fn("SUM", col("liters")), "totalLiters"],
        ],
        raw: true,
      }),
    ]);

    const byStatus = byStatusRaw.reduce((acc, row) => {
      acc[row.get("status")] = Number(row.get("count"));
      return acc;
    }, {});

    const expiringDocuments = documents.filter((d) => daysUntil(d.expiryDate) <= 30).length;

    return ApiResponse.ok(res, {
      totalVehicles,
      byStatus,
      activeReservations,
      upcomingMaintenances,
      openIncidents,
      expiringDocuments,
      fuel: {
        totalSpent: Number(fuelAgg?.totalSpent || 0),
        totalLiters: Number(fuelAgg?.totalLiters || 0),
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/stats/utilization?days=30
// Taux d'utilisation quotidien (véhicules loués / total) sur une fenêtre glissante.
async function utilization(req, res, next) {
  try {
    const days = Math.min(Number(req.query.days) || 30, 365);
    const totalVehicles = await Vehicle.count();
    const since = new Date();
    since.setDate(since.getDate() - days);

    const reservations = await Reservation.findAll({
      where: {
        status: { [Op.notIn]: ["cancelled"] },
        startDate: { [Op.gte]: since.toISOString().slice(0, 10) },
      },
      attributes: ["vehicleId", "startDate", "endDate"],
    });

    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      const dayStr = day.toISOString().slice(0, 10);

      const activeVehicles = new Set(
        reservations
          .filter((r) => r.startDate <= dayStr && r.endDate >= dayStr)
          .map((r) => r.vehicleId)
      ).size;

      const rate = totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0;
      data.push({ day: dayStr, rate });
    }

    return ApiResponse.ok(res, data);
  } catch (err) {
    next(err);
  }
}

module.exports = { dashboard, utilization };

const { Op, fn, col, literal } = require("sequelize");
const crudFactory = require("../utils/crudFactory");
const { Payment, Reservation, Vehicle } = require("../models");
const { logActivity } = require("../utils/activityLogger");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

const include = [
  {
    model: Reservation,
    attributes: ["id", "clientName", "clientPhone", "startDate", "endDate", "type", "status"],
    include: [{ model: Vehicle, attributes: ["id", "brand", "model", "plate"] }],
  },
];

const base = crudFactory(Payment, {
  filterFields: ["reservationId", "status", "method"],
  include,
  order: [["createdAt", "DESC"]],
  notFoundMessage: "Paiement introuvable",
  onCreate: (p, req) =>
    logActivity({
      kind: "reservation_updated",
      label: "Paiement enregistré",
      details: `${p.amount} TND — méthode : ${p.method}`,
      userId: req.user?.id,
    }),
});

// GET /api/payments/stats
// KPIs : total encaissé, montant en attente, par méthode, taux recouvrement
async function getStats(req, res, next) {
  try {
    const rows = await Payment.findAll({
      attributes: [
        "status",
        "method",
        [fn("SUM", col("amount")), "total"],
        [fn("COUNT", col("id")), "count"],
      ],
      group: ["status", "method"],
      raw: true,
    });

    let totalPaid = 0;
    let totalPending = 0;
    let totalRefunded = 0;
    let totalPartial = 0;
    const byMethod = { cash: 0, card: 0, transfer: 0, cheque: 0 };

    for (const row of rows) {
      const amount = Number(row.total);
      if (row.status === "paid") { totalPaid += amount; byMethod[row.method] = (byMethod[row.method] || 0) + amount; }
      if (row.status === "pending") totalPending += amount;
      if (row.status === "refunded") totalRefunded += amount;
      if (row.status === "partial") { totalPartial += amount; byMethod[row.method] = (byMethod[row.method] || 0) + amount; }
    }

    const totalAll = totalPaid + totalPending + totalPartial;
    const recoveryRate = totalAll > 0 ? Math.round(((totalPaid + totalPartial) / totalAll) * 100) : 0;

    // Revenus du mois courant
    const now = new Date();
    const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const monthRows = await Payment.findAll({
      where: {
        status: { [Op.in]: ["paid", "partial"] },
        paidAt: { [Op.gte]: firstOfMonth },
      },
      attributes: [[fn("SUM", col("amount")), "monthTotal"]],
      raw: true,
    });
    const monthRevenue = Number(monthRows[0]?.monthTotal ?? 0);

    return ApiResponse.ok(res, {
      totalPaid,
      totalPending,
      totalRefunded,
      totalPartial,
      recoveryRate,
      monthRevenue,
      byMethod,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { ...base, getStats };

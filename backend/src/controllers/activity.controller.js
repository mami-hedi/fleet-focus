const { HistoryEntry, Vehicle, User } = require("../models");
const ApiResponse = require("../utils/ApiResponse");
const { paginate, buildMeta } = require("../utils/pagination");

// GET /api/activity?vehicleId=&kind=&page=&limit=
async function list(req, res, next) {
  try {
    const { page, limit, offset } = paginate(req.query, 20);
    const where = {};
    if (req.query.vehicleId) where.vehicleId = req.query.vehicleId;
    if (req.query.kind) where.kind = req.query.kind;

    const { rows, count } = await HistoryEntry.findAndCountAll({
      where,
      include: [
        { model: Vehicle, attributes: ["id", "brand", "model", "plate"] },
        { model: User, attributes: ["id", "name"] },
      ],
      order: [["timestamp", "DESC"]],
      limit,
      offset,
    });

    return ApiResponse.ok(res, rows, "OK", buildMeta({ page, limit, count }));
  } catch (err) {
    next(err);
  }
}

module.exports = { list };

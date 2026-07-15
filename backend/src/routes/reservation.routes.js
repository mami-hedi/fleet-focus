const { Router } = require("express");
const { body } = require("express-validator");
const controller = require("../controllers/reservation.controller");
const validate = require("../middlewares/validate.middleware");
const { authenticate } = require("../middlewares/auth.middleware");

const router = Router();
router.use(authenticate);

const rules = [
  body("vehicleId").isInt(),
  body("type").isIn(["transfer", "day_trip", "multi_day", "airport"]),
  body("startDate").isISO8601(),
  body("endDate").isISO8601(),
  body("startTime").notEmpty(),
  body("endTime").notEmpty(),
  body("pickupLocation").trim().notEmpty(),
  body("dropoffLocation").trim().notEmpty(),
  body("clientName").trim().notEmpty(),
  body("clientPhone").trim().notEmpty(),
];

router.get("/check-availability", controller.checkAvailability);
router.get("/", controller.list);
router.get("/:id", controller.getOne);
router.post("/", rules, validate, controller.create);
router.patch("/:id", controller.update);
router.delete("/:id", controller.remove);

module.exports = router;

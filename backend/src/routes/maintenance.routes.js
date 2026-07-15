const { Router } = require("express");
const { body } = require("express-validator");
const controller = require("../controllers/maintenance.controller");
const validate = require("../middlewares/validate.middleware");
const { authenticate } = require("../middlewares/auth.middleware");

const router = Router();
router.use(authenticate);

const rules = [
  body("vehicleId").isInt(),
  body("type").trim().notEmpty(),
  body("scheduledDate").isISO8601(),
  body("garage").trim().notEmpty(),
  body("recurrence").optional().isIn(["none", "monthly", "quarterly", "biannual", "annual"]),
];

router.get("/", controller.list);
router.get("/:id", controller.getOne);
router.post("/", rules, validate, controller.create);
router.patch("/:id", controller.update);
router.delete("/:id", controller.remove);

module.exports = router;

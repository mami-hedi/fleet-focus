const { Router } = require("express");
const { body } = require("express-validator");
const controller = require("../controllers/fuel.controller");
const validate = require("../middlewares/validate.middleware");
const { authenticate } = require("../middlewares/auth.middleware");

const router = Router();
router.use(authenticate);

const rules = [
  body("vehicleId").isInt(),
  body("date").isISO8601(),
  body("station").trim().notEmpty(),
  body("liters").isFloat({ gt: 0 }),
  body("pricePerLiter").isFloat({ gt: 0 }),
  body("mileage").isInt({ min: 0 }),
];

router.get("/", controller.list);
router.get("/:id", controller.getOne);
router.post("/", rules, validate, controller.create);
router.patch("/:id", controller.update);
router.delete("/:id", controller.remove);

module.exports = router;

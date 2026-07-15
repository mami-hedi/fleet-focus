const { Router } = require("express");
const { body } = require("express-validator");
const controller = require("../controllers/inspection.controller");
const validate = require("../middlewares/validate.middleware");
const { authenticate } = require("../middlewares/auth.middleware");

const router = Router();
router.use(authenticate);

const rules = [
  body("vehicleId").isInt(),
  body("type").isIn(["entree", "sortie"]),
  body("date").isISO8601(),
  body("mileage").isInt({ min: 0 }),
  body("fuelLevel").isInt({ min: 0, max: 100 }),
];

router.get("/", controller.list);
router.get("/:id", controller.getOne);
router.post("/", rules, validate, controller.create);
router.patch("/:id", controller.update);
router.delete("/:id", controller.remove);

module.exports = router;

const { Router } = require("express");
const { body } = require("express-validator");
const controller = require("../controllers/incident.controller");
const validate = require("../middlewares/validate.middleware");
const { authenticate } = require("../middlewares/auth.middleware");

const router = Router();
router.use(authenticate);

const rules = [
  body("vehicleId").isInt(),
  body("date").isISO8601(),
  body("location").trim().notEmpty(),
  body("description").trim().notEmpty(),
  body("severity").isIn(["minor", "moderate", "severe"]),
];

router.get("/", controller.list);
router.get("/:id", controller.getOne);
router.post("/", rules, validate, controller.create);
router.patch("/:id", controller.update);
router.delete("/:id", controller.remove);

module.exports = router;

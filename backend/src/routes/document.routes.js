const { Router } = require("express");
const { body } = require("express-validator");
const controller = require("../controllers/document.controller");
const validate = require("../middlewares/validate.middleware");
const { authenticate } = require("../middlewares/auth.middleware");

const router = Router();
router.use(authenticate);

const rules = [
  body("vehicleId").isInt(),
  body("type").isIn(["carte_grise", "assurance", "controle_technique", "Contrat de location", "Constat assurance"]),
  body("number").trim().notEmpty(),
  body("expiryDate").isISO8601(),
];

router.get("/", controller.list);
router.get("/:id", controller.getOne);
router.post("/", rules, validate, controller.create);
router.patch("/:id", controller.update);
router.delete("/:id", controller.remove);

module.exports = router;

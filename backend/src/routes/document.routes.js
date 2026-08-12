const { Router } = require("express");
const { body } = require("express-validator");
const controller = require("../controllers/document.controller");
const validate = require("../middlewares/validate.middleware");
const { authenticate } = require("../middlewares/auth.middleware");
const { documentUpload } = require("../middlewares/upload.middleware");

const router = Router();
//router.use(authenticate);

const DOC_TYPES = [
  "carte_grise",
  "assurance",
  "controle_technique",
  "Contrat de location",
  "Constat assurance",
];

const rules = [
  body("vehicleId").isInt().withMessage("vehicleId doit être un entier"),
  body("type").isIn(DOC_TYPES).withMessage("Type de document invalide"),
  body("number").trim().notEmpty().withMessage("Le numéro est requis"),
  body("expiryDate").isISO8601().withMessage("Date d'expiration invalide"),
];

router.get("/", controller.list);
router.get("/:id", controller.getOne);

router.post("/", documentUpload.single("photo"), rules, validate, controller.create);
router.patch("/:id", documentUpload.single("photo"), controller.update);

router.delete("/:id", controller.remove);

module.exports = router;
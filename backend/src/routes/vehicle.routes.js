const { Router } = require("express");
const { body } = require("express-validator");
const controller = require("../controllers/vehicle.controller");
const validate = require("../middlewares/validate.middleware");
const { authenticate } = require("../middlewares/auth.middleware");
const { vehicleUpload } = require("../middlewares/upload.middleware");

const router = Router();
// ⚠️ DEV ONLY — authentification désactivée temporairement le temps de brancher
// le login côté frontend. À réactiver avant toute mise en production :
// router.use(authenticate);

const vehicleRules = [
  body("brand").trim().notEmpty(),
  body("model").trim().notEmpty(),
  body("year").isInt({ min: 1990, max: 2100 }),
  body("plate").trim().notEmpty(),
  body("vin").trim().notEmpty(),
  body("fuel").isIn(["essence", "diesel", "hybride", "electrique"]),
  body("transmission").optional().isIn(["manuelle", "automatique"]),
  body("status").optional().isIn(["available", "rented", "maintenance", "out_of_service"]),
  body("mileage").optional().isInt({ min: 0 }),
];

// upload AVANT les validators : express-validator lit req.body, que multer remplit
// pour multipart/form-data. Le champ "image" accepte soit un fichier (upload réel),
// soit une simple string (URL externe collée manuellement, ou chemin existant conservé
// tel quel) — multer ne route vers req.files que les parts envoyées comme fichier.
const vehicleFiles = vehicleUpload.fields([
  { name: "image", maxCount: 1 },
  { name: "photos", maxCount: 8 },
]);

router.get("/", controller.list);
router.get("/:id", controller.getOne);
router.get("/:id/full", controller.getFull);
router.get("/:id/history", controller.getHistory);

router.post("/", vehicleFiles, vehicleRules, validate, controller.create);
router.patch("/:id", vehicleFiles, controller.update);

router.delete("/:id", controller.remove);

module.exports = router;
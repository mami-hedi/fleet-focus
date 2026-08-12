const { Router } = require("express");
const { body } = require("express-validator");
const controller = require("../controllers/driver.controller");
const validate = require("../middlewares/validate.middleware");
const { authenticate } = require("../middlewares/auth.middleware");
const { driverUpload } = require("../middlewares/upload.middleware");

const router = Router();
//router.use(authenticate);

const rules = [
  body("firstName").trim().notEmpty(),
  body("lastName").trim().notEmpty(),
  body("email").isEmail(),
  body("phone").trim().notEmpty(),
  body("licenseNumber").trim().notEmpty(),
  body("licenseExpiry").isISO8601(),
];

router.get("/", controller.list);
router.get("/:id", controller.getOne);

// upload.single("photo") AVANT les validators : express-validator lit req.body,
// que multer remplit pour multipart/form-data. Le champ du formulaire frontend
// doit s'appeler "photo" (fichier), pas une string base64.
router.post("/", driverUpload.single("photo"), rules, validate, controller.create);
router.patch("/:id", driverUpload.single("photo"), controller.update);

router.delete("/:id", controller.remove);

module.exports = router;
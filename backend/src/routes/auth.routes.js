const { Router } = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/auth.controller");
const validate = require("../middlewares/validate.middleware");
const { authenticate, authorize } = require("../middlewares/auth.middleware");

const router = Router();

router.post(
  "/register",
  authenticate,
  authorize("admin"),
  [
    body("name").trim().notEmpty().withMessage("Le nom est requis"),
    body("email").isEmail().withMessage("Email invalide"),
    body("password").isLength({ min: 6 }).withMessage("Mot de passe : 6 caractères minimum"),
    body("role").optional().isIn(["admin", "manager", "staff"]),
  ],
  validate,
  authController.register
);

router.post(
  "/login",
  [body("email").isEmail(), body("password").notEmpty()],
  validate,
  authController.login
);

router.get("/me", authenticate, authController.me);

module.exports = router;

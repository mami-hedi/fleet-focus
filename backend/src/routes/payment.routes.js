const { Router } = require("express");
const { body } = require("express-validator");
const controller = require("../controllers/payment.controller");
const validate = require("../middlewares/validate.middleware");
const { authenticate } = require("../middlewares/auth.middleware");

const router = Router();
router.use(authenticate);

const createRules = [
  body("reservationId").isInt({ min: 1 }),
  body("amount").isFloat({ gt: 0 }),
  body("method").isIn(["cash", "card", "transfer", "cheque"]),
  body("status").optional().isIn(["pending", "paid", "partial", "refunded"]),
  body("paidAt").optional({ nullable: true }).isISO8601(),
  body("reference").optional({ nullable: true }).trim(),
  body("notes").optional({ nullable: true }).trim(),
];

const updateRules = [
  body("amount").optional().isFloat({ gt: 0 }),
  body("method").optional().isIn(["cash", "card", "transfer", "cheque"]),
  body("status").optional().isIn(["pending", "paid", "partial", "refunded"]),
  body("paidAt").optional({ nullable: true }).isISO8601(),
  body("reference").optional({ nullable: true }).trim(),
  body("notes").optional({ nullable: true }).trim(),
];

// Stats avant les routes paramétrées pour éviter la collision avec /:id
router.get("/stats", controller.getStats);
router.get("/", controller.list);
router.get("/:id", controller.getOne);
router.post("/", createRules, validate, controller.create);
router.patch("/:id", updateRules, validate, controller.update);
router.delete("/:id", controller.remove);

module.exports = router;

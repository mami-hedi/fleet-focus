const { Router } = require("express");
const controller = require("../controllers/settings.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");

const router = Router();
router.use(authenticate);

router.get("/", controller.get);
router.patch("/", authorize("admin", "manager"), controller.update);

module.exports = router;

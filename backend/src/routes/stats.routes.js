const { Router } = require("express");
const controller = require("../controllers/stats.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = Router();
router.use(authenticate);

router.get("/dashboard", controller.dashboard);
router.get("/utilization", controller.utilization);

module.exports = router;

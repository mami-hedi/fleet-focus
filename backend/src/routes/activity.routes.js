const { Router } = require("express");
const controller = require("../controllers/activity.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = Router();
router.use(authenticate);

router.get("/", controller.list);

module.exports = router;

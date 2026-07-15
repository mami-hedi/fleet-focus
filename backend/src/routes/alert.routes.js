const { Router } = require("express");
const controller = require("../controllers/alert.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = Router();
router.use(authenticate);

router.get("/", controller.list);
router.post("/:alertKey/dismiss", controller.dismiss);

module.exports = router;

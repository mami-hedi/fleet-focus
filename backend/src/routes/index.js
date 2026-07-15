const { Router } = require("express");

const router = Router();

router.use("/auth", require("./auth.routes"));
router.use("/vehicles", require("./vehicle.routes"));
router.use("/drivers", require("./driver.routes"));
router.use("/reservations", require("./reservation.routes"));
router.use("/fuel-entries", require("./fuel.routes"));
router.use("/inspections", require("./inspection.routes"));
router.use("/documents", require("./document.routes"));
router.use("/incidents", require("./incident.routes"));
router.use("/maintenances", require("./maintenance.routes"));
router.use("/alerts", require("./alert.routes"));
router.use("/activity", require("./activity.routes"));
router.use("/settings", require("./settings.routes"));
router.use("/stats", require("./stats.routes"));

module.exports = router;

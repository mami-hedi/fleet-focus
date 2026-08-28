const { Router } = require("express");
const controller = require("../controllers/settings.controller");
// NOTE: l'authentification est actuellement désactivée côté backend en dev
// (voir api-client.ts), comme pour /api/vehicles. À réactiver avec
// `router.use(authenticate)` une fois le login branché.

const router = Router();

router.get("/", controller.get);
router.patch("/", controller.update);

module.exports = router;
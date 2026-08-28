const { Router } = require("express");
const controller = require("../controllers/activity.controller");
// NOTE: l'authentification est actuellement désactivée côté backend en dev
// (voir api-client.ts), comme pour /api/vehicles. À réactiver avec
// `router.use(authenticate)` une fois le login branché — c'était la cause
// des 401 sur /api/activity côté frontend.

const router = Router();

router.get("/", controller.list);
module.exports = router;
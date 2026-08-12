require("dotenv").config();
require("express-async-errors");
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const routes = require("./routes");
const { notFoundHandler, errorHandler } = require("./middlewares/error.middleware");

const app = express();

// crossOriginResourcePolicy: "cross-origin" est nécessaire ici car le frontend (ex: :8080)
// et le backend (ex: :4000) tournent sur des origines différentes. Avec la config par défaut
// de helmet ("same-origin"), les images servies par /uploads sont chargées avec un statut 200
// mais bloquées par le navigateur (ERR_BLOCKED_BY_RESPONSE.NotSameOrigin).
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  })
);

app.use(compression());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

// Fichiers uploadés (photos documents, photos drivers) : voir upload.middleware.js
// qui écrit dans uploads/documents et uploads/drivers. Sert ces fichiers en statique
// sous /uploads/... (ex: /uploads/drivers/drivers-xxx.jpg).
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Limite globale anti-abus sur l'API (200 requêtes / 15 min / IP)
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/health", (req, res) => {
  res.json({ success: true, message: "FleetOps API is up", timestamp: new Date().toISOString() });
});

app.use("/api", routes);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
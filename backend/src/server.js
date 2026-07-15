require("dotenv").config();
const app = require("./app");
const { sequelize } = require("./models");

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log("✅ Connexion MySQL établie");

    // En développement : synchronise le schéma automatiquement.
    // En production, préférer les migrations / database/schema.sql.
    if (process.env.NODE_ENV !== "production") {
      await sequelize.sync({ alter: true });
      console.log("✅ Modèles synchronisés avec la base de données");
    }

    app.listen(PORT, () => {
      console.log(`🚀 FleetOps API démarrée sur http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Impossible de démarrer le serveur :", err);
    process.exit(1);
  }
}

start();

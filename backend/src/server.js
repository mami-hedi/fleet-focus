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
      // { alter: true } réévalue et réapplique TOUTES les contraintes à chaque redémarrage,
      // y compris les unique:true, qui ne sont pas idempotents côté Sequelize/MySQL : chaque
      // relance ajoute un nouvel index au lieu de réutiliser l'existant, jusqu'à dépasser la
      // limite MySQL de 64 clés par table (voir ER_TOO_MANY_KEYS). On utilise sync() simple :
      // il crée les tables manquantes sans toucher aux colonnes/index déjà en place.
      await sequelize.sync();
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

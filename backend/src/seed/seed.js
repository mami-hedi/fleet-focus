require("dotenv").config();
const {
  sequelize,
  User,
  Vehicle,
  Driver,
  Reservation,
  FuelEntry,
  Incident,
  Inspection,
  Maintenance,
  DocumentItem,
  Settings,
} = require("../models");
const data = require("./data");

async function seed() {
  try {
    await sequelize.authenticate();
    console.log("✅ Connexion MySQL établie");

    await sequelize.sync({ force: true }); // ⚠️ recrée toutes les tables — usage dev/démo uniquement
    console.log("✅ Schéma recréé");

    // ─── Compte admin ───
    await User.create({
      name: "Hedi Mami",
      email: process.env.SEED_ADMIN_EMAIL || "admin@mhdigital.tn",
      password: process.env.SEED_ADMIN_PASSWORD || "Admin123!",
      role: "admin",
    });
    console.log("✅ Compte admin créé");

    // ─── Paramètres par défaut ───
    await Settings.create({
      companyName: "MH Digital Solution",
      companyEmail: "contact@mhdigital.tn",
      companyPhone: "+216 71 123 456",
      companyAddress: "Tunis, Tunisie",
      siret: "12345678901234",
      tva: "FR12345678901",
    });

    // ─── Véhicules ───
    const vehicleMap = {}; // refId (v1, v2, ...) -> id MySQL
    for (const v of data.vehicles) {
      const { refId, ...payload } = v;
      const created = await Vehicle.create(payload);
      vehicleMap[refId] = created.id;
    }
    console.log(`✅ ${data.vehicles.length} véhicules créés`);

    // ─── Chauffeurs ───
    const driverMap = {};
    for (const d of data.drivers) {
      const { refId, assignedVehicleRef, ...payload } = d;
      const created = await Driver.create({
        ...payload,
        assignedVehicleId: assignedVehicleRef ? vehicleMap[assignedVehicleRef] : null,
      });
      driverMap[refId] = created.id;
    }
    console.log(`✅ ${data.drivers.length} chauffeurs créés`);

    // ─── Réservations ───
    for (const r of data.reservations) {
      const { vehicleRef, driverRef, ...payload } = r;
      await Reservation.create({
        ...payload,
        vehicleId: vehicleMap[vehicleRef],
        driverId: driverRef ? driverMap[driverRef] : null,
      });
    }
    console.log(`✅ ${data.reservations.length} réservations créées`);

    // ─── Pleins de carburant ───
    for (const f of data.fuelEntries) {
      const { vehicleRef, ...payload } = f;
      await FuelEntry.create({ ...payload, vehicleId: vehicleMap[vehicleRef] });
    }
    console.log(`✅ ${data.fuelEntries.length} pleins de carburant créés`);

    // ─── Incidents ───
    for (const i of data.incidents) {
      const { vehicleRef, driverRef, ...payload } = i;
      await Incident.create({
        ...payload,
        vehicleId: vehicleMap[vehicleRef],
        driverId: driverRef ? driverMap[driverRef] : null,
      });
    }
    console.log(`✅ ${data.incidents.length} incidents créés`);

    // ─── États des lieux ───
    for (const insp of data.inspections) {
      const { vehicleRef, ...payload } = insp;
      await Inspection.create({ ...payload, vehicleId: vehicleMap[vehicleRef] });
    }
    console.log(`✅ ${data.inspections.length} états des lieux créés`);

    // ─── Maintenances ───
    for (const m of data.maintenances) {
      const { vehicleRef, ...payload } = m;
      await Maintenance.create({ ...payload, vehicleId: vehicleMap[vehicleRef] });
    }
    console.log(`✅ ${data.maintenances.length} maintenances créées`);

    // ─── Documents ───
    for (const doc of data.documents) {
      const { vehicleRef, ...payload } = doc;
      await DocumentItem.create({ ...payload, vehicleId: vehicleMap[vehicleRef] });
    }
    console.log(`✅ ${data.documents.length} documents créés`);

    console.log("\n🎉 Seed terminé avec succès.");
    console.log(`   Connexion admin -> email: ${process.env.SEED_ADMIN_EMAIL || "admin@mhdigital.tn"} / mot de passe: ${process.env.SEED_ADMIN_PASSWORD || "Admin123!"}`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Erreur pendant le seed :", err);
    process.exit(1);
  }
}

seed();

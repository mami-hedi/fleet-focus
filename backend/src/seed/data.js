// Données de démarrage — reprennent fidèlement les mock data du frontend
// (src/lib/mock-data.ts, routes/drivers.tsx, reservations.tsx, fuel.tsx,
// incidents.tsx) afin que l'app fonctionne immédiatement une fois branchée
// sur cette API, avec les mêmes IDs logiques (v1, d1, r1, ...).
// Les IDs numériques réels sont réassignés par MySQL (auto-increment) ; on
// garde une correspondance via `refId` le temps du seed.

const img = (seed) => `https://images.unsplash.com/photo-${seed}?auto=format&fit=crop&w=800&q=70`;

const vehicles = [
  { refId: "v1", brand: "Dacia", model: "Sandero", year: 2022, plate: "AB-123-CD", vin: "VF1XXX000001", color: "Blanc", transmission: "manuelle", fuel: "essence", mileage: 45230, status: "available", image: img("1552519507-da3b142c6e3d") },
  { refId: "v2", brand: "Renault", model: "Clio V", year: 2023, plate: "EF-456-GH", vin: "VF1XXX000002", color: "Gris", transmission: "manuelle", fuel: "diesel", mileage: 28100, status: "rented", image: img("1580273916550-e323be2ae537") },
  { refId: "v3", brand: "Peugeot", model: "208", year: 2023, plate: "IJ-789-KL", vin: "VF3XXX000003", color: "Bleu", transmission: "automatique", fuel: "essence", mileage: 18420, status: "available", image: img("1494976388531-d1058494cdd8") },
  { refId: "v4", brand: "Toyota", model: "Yaris Hybrid", year: 2024, plate: "MN-012-OP", vin: "JTDXXX000004", color: "Rouge", transmission: "automatique", fuel: "hybride", mileage: 8900, status: "rented", image: img("1621007947382-bb3c3994e3fb") },
  { refId: "v5", brand: "Hyundai", model: "i20", year: 2022, plate: "QR-345-ST", vin: "TMAXXX000005", color: "Noir", transmission: "manuelle", fuel: "essence", mileage: 52300, status: "maintenance", image: img("1606664515524-ed2f786a0bd6") },
  { refId: "v6", brand: "Renault", model: "Captur", year: 2023, plate: "UV-678-WX", vin: "VF1XXX000006", color: "Orange", transmission: "automatique", fuel: "diesel", mileage: 31200, status: "available", image: img("1503376780353-7e6692767b70") },
  { refId: "v7", brand: "Peugeot", model: "3008", year: 2022, plate: "YZ-901-AB", vin: "VF3XXX000007", color: "Gris", transmission: "automatique", fuel: "diesel", mileage: 67800, status: "rented", image: img("1552519507-da3b142c6e3d") },
  { refId: "v8", brand: "Dacia", model: "Duster", year: 2021, plate: "CD-234-EF", vin: "VF1XXX000008", color: "Beige", transmission: "manuelle", fuel: "diesel", mileage: 89400, status: "out_of_service", image: img("1552519507-da3b142c6e3d") },
  { refId: "v9", brand: "Toyota", model: "Corolla", year: 2023, plate: "GH-567-IJ", vin: "JTDXXX000009", color: "Blanc", transmission: "automatique", fuel: "hybride", mileage: 22150, status: "available", image: img("1621007947382-bb3c3994e3fb") },
  { refId: "v10", brand: "Hyundai", model: "Kona Electric", year: 2024, plate: "KL-890-MN", vin: "TMAXXX000010", color: "Bleu", transmission: "automatique", fuel: "electrique", mileage: 5400, status: "available", image: img("1606664515524-ed2f786a0bd6") },
  { refId: "v11", brand: "Renault", model: "Megane E-Tech", year: 2024, plate: "OP-123-QR", vin: "VF1XXX000011", color: "Gris", transmission: "automatique", fuel: "electrique", mileage: 3200, status: "rented", image: img("1580273916550-e323be2ae537") },
  { refId: "v12", brand: "Peugeot", model: "308", year: 2022, plate: "ST-456-UV", vin: "VF3XXX000012", color: "Noir", transmission: "automatique", fuel: "essence", mileage: 41800, status: "maintenance", image: img("1494976388531-d1058494cdd8") },
];

const drivers = [
  { refId: "d1", firstName: "Ahmed", lastName: "Ben Ali", email: "ahmed.benali@email.com", phone: "+216 20 123 456", licenseNumber: "TN-123456", licenseExpiry: "2026-12-15", assignedVehicleRef: "v1", status: "active" },
  { refId: "d2", firstName: "Sonia", lastName: "Trabelsi", email: "sonia.trabelsi@email.com", phone: "+216 21 789 012", licenseNumber: "TN-789012", licenseExpiry: "2027-03-20", assignedVehicleRef: "v2", status: "active" },
  { refId: "d3", firstName: "Karim", lastName: "Gharbi", email: "karim.gharbi@email.com", phone: "+216 22 345 678", licenseNumber: "TN-345678", licenseExpiry: "2025-08-10", assignedVehicleRef: null, status: "inactive" },
];

const reservations = [
  { vehicleRef: "v1", driverRef: "d1", type: "airport", status: "confirmed", startDate: "2026-07-15", startTime: "08:00", endDate: "2026-07-15", endTime: "10:00", pickupLocation: "Hôtel Carlton, Tunis", dropoffLocation: "Aéroport Tunis-Carthage", clientName: "Jean Dupont", clientPhone: "+33 6 12 34 56 78", notes: "Vol TU 215, terminal 2" },
  { vehicleRef: "v1", driverRef: "d2", type: "transfer", status: "pending", startDate: "2026-07-15", startTime: "14:00", endDate: "2026-07-15", endTime: "15:30", pickupLocation: "Aéroport Tunis-Carthage", dropoffLocation: "Sidi Bou Saïd", clientName: "Marie Martin", clientPhone: "+33 7 23 45 67 89" },
  { vehicleRef: "v2", driverRef: null, type: "day_trip", status: "in_progress", startDate: "2026-07-14", startTime: "09:00", endDate: "2026-07-14", endTime: "18:00", pickupLocation: "Hôtel Laico", dropoffLocation: "Hôtel Laico", clientName: "Groupe Voyages Evasion", clientPhone: "+216 71 234 567", notes: "Circuit Carthage + Sidi Bou Saïd" },
  { vehicleRef: "v3", driverRef: null, type: "multi_day", status: "confirmed", startDate: "2026-07-16", startTime: "08:00", endDate: "2026-07-18", endTime: "20:00", pickupLocation: "Tunis centre", dropoffLocation: "Djerba", clientName: "Famille Alves", clientPhone: "+351 912 345 678", notes: "3 jours, hébergement inclus" },
];

const fuelEntries = [
  { vehicleRef: "v1", date: "2026-07-10", station: "Total Energies", liters: 45.5, pricePerLiter: 2.15, totalCost: 97.83, mileage: 45230, fullTank: true },
  { vehicleRef: "v2", date: "2026-07-08", station: "Shell", liters: 38.2, pricePerLiter: 2.18, totalCost: 83.28, mileage: 32150, fullTank: true },
  { vehicleRef: "v1", date: "2026-06-28", station: "Agil", liters: 42.0, pricePerLiter: 2.12, totalCost: 89.04, mileage: 44850, fullTank: true },
];

const incidents = [
  { vehicleRef: "v1", driverRef: "d1", date: "2026-07-10", location: "Avenue Habib Bourguiba, Tunis", description: "Accrochage latéral avec un scooter. Rayure sur la portière conducteur.", severity: "minor", status: "resolved", photos: [], cost: 450, insuranceClaim: true },
  { vehicleRef: "v3", driverRef: "d2", date: "2026-07-12", location: "Autoroute A1, km 45", description: "Panne moteur sur autoroute. Véhicule remorqué.", severity: "severe", status: "in_progress", photos: [], cost: 2800, insuranceClaim: false },
  { vehicleRef: "v2", driverRef: null, date: "2026-07-14", location: "Parking centre commercial", description: "Coup de porte sur l'aile arrière droite.", severity: "minor", status: "open", photos: [] },
];

const inspections = [
  { vehicleRef: "v2", type: "sortie", date: "2026-07-08", mileage: 27950, fuelLevel: 90, notes: "Rayure légère aile avant droite.", checklist: { tires: true, exteriorClean: true, interiorClean: true, spareWheel: true, triangle: true, vest: true }, photos: [img("1552519507-da3b142c6e3d"), img("1494976388531-d1058494cdd8")] },
  { vehicleRef: "v2", type: "entree", date: "2026-06-25", mileage: 27100, fuelLevel: 45, notes: "RAS.", checklist: { tires: true, exteriorClean: false, interiorClean: true, spareWheel: true, triangle: true, vest: true }, photos: [img("1580273916550-e323be2ae537")] },
  { vehicleRef: "v4", type: "sortie", date: "2026-07-05", mileage: 8850, fuelLevel: 100, notes: "Véhicule impeccable.", checklist: { tires: true, exteriorClean: true, interiorClean: true, spareWheel: true, triangle: true, vest: true }, photos: [img("1621007947382-bb3c3994e3fb")] },
];

const maintenances = [
  { vehicleRef: "v5", type: "Révision complète", scheduledDate: "2026-07-14", status: "in_progress", garage: "Garage Central", recurrence: "none" },
  { vehicleRef: "v12", type: "Plaquettes de frein", scheduledDate: "2026-07-15", status: "upcoming", garage: "AutoPro Sud", recurrence: "none" },
  { vehicleRef: "v2", type: "Vidange", scheduledDate: "2026-07-20", status: "upcoming", garage: "Garage Central", recurrence: "none" },
  { vehicleRef: "v7", type: "Révision 60 000 km", scheduledDate: "2026-07-22", status: "upcoming", garage: "AutoPro Sud", recurrence: "none" },
  { vehicleRef: "v1", type: "Changement pneus", scheduledDate: "2026-06-15", completedDate: "2026-06-15", status: "completed", cost: 480, garage: "PneuExpress", recurrence: "none" },
  { vehicleRef: "v3", type: "Vidange", scheduledDate: "2026-05-20", completedDate: "2026-05-20", status: "completed", cost: 120, garage: "Garage Central", recurrence: "none" },
  { vehicleRef: "v9", type: "Contrôle technique", scheduledDate: "2026-04-10", completedDate: "2026-04-10", status: "completed", cost: 85, garage: "Contrôle+", recurrence: "none" },
  { vehicleRef: "v8", type: "Réparation moteur", scheduledDate: "2026-06-30", status: "in_progress", garage: "Mécanique Pro", recurrence: "none" },
];

const documents = [
  { vehicleRef: "v1", type: "assurance", number: "ASS-2024-001", expiryDate: "2027-03-15" },
  { vehicleRef: "v1", type: "controle_technique", number: "CT-2024-001", expiryDate: "2026-11-20" },
  { vehicleRef: "v2", type: "assurance", number: "ASS-2024-002", expiryDate: "2026-08-10" },
  { vehicleRef: "v5", type: "assurance", number: "ASS-2024-005", expiryDate: "2026-07-16" },
  { vehicleRef: "v8", type: "controle_technique", number: "CT-2024-008", expiryDate: "2026-06-28" },
  { vehicleRef: "v3", type: "assurance", number: "ASS-2024-003", expiryDate: "2027-01-05" },
  { vehicleRef: "v4", type: "controle_technique", number: "CT-2024-004", expiryDate: "2028-02-14" },
  { vehicleRef: "v7", type: "assurance", number: "ASS-2024-007", expiryDate: "2026-07-30" },
  { vehicleRef: "v10", type: "carte_grise", number: "CG-2024-010", expiryDate: "2034-05-01" },
  { vehicleRef: "v12", type: "controle_technique", number: "CT-2024-012", expiryDate: "2026-09-12" },
  { vehicleRef: "v6", type: "assurance", number: "ASS-2024-006", expiryDate: "2026-12-01" },
  { vehicleRef: "v11", type: "assurance", number: "ASS-2024-011", expiryDate: "2027-04-20" },
];

module.exports = {
  vehicles,
  drivers,
  reservations,
  fuelEntries,
  incidents,
  inspections,
  maintenances,
  documents,
};

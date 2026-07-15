-- ============================================================================
-- FleetOps (fleet-focus) — Schéma MySQL
-- Généré à partir des modèles Sequelize (src/models/*.js).
-- Usage recommandé : `npm run seed` (Sequelize) pour créer + peupler la base
-- automatiquement. Ce fichier est fourni comme référence / pour un déploiement
-- où les migrations SQL manuelles sont préférées à `sequelize.sync()`.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS fleetops CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fleetops;

SET FOREIGN_KEY_CHECKS = 0;

-- ─── users ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'manager', 'staff') NOT NULL DEFAULT 'staff',
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─── vehicles ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  brand VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  year INT NOT NULL,
  plate VARCHAR(255) NOT NULL UNIQUE,
  vin VARCHAR(255) NOT NULL UNIQUE,
  color VARCHAR(255),
  transmission ENUM('manuelle', 'automatique') NOT NULL DEFAULT 'manuelle',
  fuel ENUM('essence', 'diesel', 'hybride', 'electrique') NOT NULL,
  mileage INT NOT NULL DEFAULT 0,
  status ENUM('available', 'rented', 'maintenance', 'out_of_service') NOT NULL DEFAULT 'available',
  image VARCHAR(500),
  photos JSON,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─── drivers ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS drivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firstName VARCHAR(255) NOT NULL,
  lastName VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50) NOT NULL,
  licenseNumber VARCHAR(100) NOT NULL UNIQUE,
  licenseExpiry DATE NOT NULL,
  assignedVehicleId INT NULL,
  photo VARCHAR(500),
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_drivers_vehicle FOREIGN KEY (assignedVehicleId) REFERENCES vehicles(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ─── reservations ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicleId INT NOT NULL,
  driverId INT NULL,
  type ENUM('transfer', 'day_trip', 'multi_day', 'airport') NOT NULL,
  status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  startDate DATE NOT NULL,
  startTime VARCHAR(10) NOT NULL,
  endDate DATE NOT NULL,
  endTime VARCHAR(10) NOT NULL,
  pickupLocation VARCHAR(255) NOT NULL,
  dropoffLocation VARCHAR(255) NOT NULL,
  clientName VARCHAR(255) NOT NULL,
  clientPhone VARCHAR(50) NOT NULL,
  notes TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_reservations_vehicle FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE CASCADE,
  CONSTRAINT fk_reservations_driver FOREIGN KEY (driverId) REFERENCES drivers(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ─── incidents ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS incidents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicleId INT NOT NULL,
  driverId INT NULL,
  date DATE NOT NULL,
  location VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  severity ENUM('minor', 'moderate', 'severe') NOT NULL DEFAULT 'minor',
  status ENUM('open', 'in_progress', 'resolved') NOT NULL DEFAULT 'open',
  photos JSON,
  cost DECIMAL(10, 2),
  insuranceClaim BOOLEAN NOT NULL DEFAULT FALSE,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_incidents_vehicle FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE CASCADE,
  CONSTRAINT fk_incidents_driver FOREIGN KEY (driverId) REFERENCES drivers(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ─── maintenances ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS maintenances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicleId INT NOT NULL,
  type VARCHAR(255) NOT NULL,
  scheduledDate DATE NOT NULL,
  completedDate DATE NULL,
  status ENUM('upcoming', 'in_progress', 'completed') NOT NULL DEFAULT 'upcoming',
  cost DECIMAL(10, 2),
  garage VARCHAR(255) NOT NULL,
  recurrence ENUM('none', 'monthly', 'quarterly', 'biannual', 'annual') NOT NULL DEFAULT 'none',
  seriesId VARCHAR(64) NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_maintenances_vehicle FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── fuel_entries ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fuel_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicleId INT NOT NULL,
  date DATE NOT NULL,
  station VARCHAR(255) NOT NULL,
  liters DECIMAL(8, 2) NOT NULL,
  pricePerLiter DECIMAL(8, 3) NOT NULL,
  totalCost DECIMAL(10, 2) NOT NULL,
  mileage INT NOT NULL,
  fullTank BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_fuel_vehicle FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── inspections ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inspections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicleId INT NOT NULL,
  type ENUM('entree', 'sortie') NOT NULL,
  date DATE NOT NULL,
  mileage INT NOT NULL,
  fuelLevel INT NOT NULL,
  notes TEXT,
  checklist JSON NOT NULL,
  photos JSON,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_inspections_vehicle FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── documents ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicleId INT NOT NULL,
  type ENUM('carte_grise', 'assurance', 'controle_technique', 'Contrat de location', 'Constat assurance') NOT NULL,
  number VARCHAR(255) NOT NULL,
  expiryDate DATE NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_documents_vehicle FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── history_entries (journal d'activité) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS history_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicleId INT NULL,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  kind ENUM(
    'vehicle_created', 'vehicle_updated', 'vehicle_deleted',
    'maintenance_scheduled', 'inspection_created', 'document_created',
    'driver_created', 'driver_updated', 'incident_created',
    'fuel_added', 'reservation_created', 'reservation_updated'
  ) NOT NULL,
  label VARCHAR(255) NOT NULL,
  details VARCHAR(500),
  userId INT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_history_vehicle FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE SET NULL,
  CONSTRAINT fk_history_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ─── dismissed_alerts ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dismissed_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  alertKey VARCHAR(255) NOT NULL UNIQUE,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─── settings (singleton) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  companyName VARCHAR(255) NOT NULL DEFAULT 'MH Digital Solution',
  companyEmail VARCHAR(255),
  companyPhone VARCHAR(50),
  companyAddress VARCHAR(255),
  siret VARCHAR(50),
  tva VARCHAR(50),
  logo VARCHAR(500),
  theme ENUM('light', 'dark', 'system') NOT NULL DEFAULT 'light',
  language ENUM('fr', 'en') NOT NULL DEFAULT 'fr',
  emailAlerts BOOLEAN NOT NULL DEFAULT TRUE,
  alertDaysBefore INT NOT NULL DEFAULT 30,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

-- ─── Index utiles pour la recherche / le tri ──────────────────────────────
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_reservations_vehicle_dates ON reservations(vehicleId, startDate, endDate);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_maintenances_status ON maintenances(status);
CREATE INDEX idx_documents_expiry ON documents(expiryDate);
CREATE INDEX idx_history_vehicle ON history_entries(vehicleId);

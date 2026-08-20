-- ============================================================================
-- FleetOps — Migration : table payments
-- À exécuter après le schema.sql initial (ou via `npm run seed`)
-- ============================================================================

USE fleetops;

CREATE TABLE IF NOT EXISTS payments (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  reservationId INT NOT NULL,
  amount       DECIMAL(10, 2) NOT NULL,
  method       ENUM('cash', 'card', 'transfer', 'cheque') NOT NULL DEFAULT 'cash',
  status       ENUM('pending', 'paid', 'partial', 'refunded') NOT NULL DEFAULT 'pending',
  paidAt       DATE NULL,
  reference    VARCHAR(100) NULL,
  notes        TEXT NULL,
  createdAt    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_reservation
    FOREIGN KEY (reservationId) REFERENCES reservations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX IF NOT EXISTS idx_payments_reservation ON payments(reservationId);
CREATE INDEX IF NOT EXISTS idx_payments_status      ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at     ON payments(paidAt);

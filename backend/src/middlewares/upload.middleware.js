const multer = require("multer");
const path = require("path");
const fs = require("fs");

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error("Format de fichier non supporté (JPG, PNG, WEBP uniquement)"));
};

// Fabrique un middleware multer dédié à un sous-dossier de uploads/ (ex: "documents", "drivers", "vehicles").
function makeUploader(subfolder) {
  const uploadDir = path.join(__dirname, "..", "uploads", subfolder);
  fs.mkdirSync(uploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const safeName = `${subfolder}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, safeName);
    },
  });

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo par fichier
  });
}

module.exports = {
  makeUploader,
  documentUpload: makeUploader("documents"),
  driverUpload: makeUploader("drivers"),
  vehicleUpload: makeUploader("vehicles"),
};
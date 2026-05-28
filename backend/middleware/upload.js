const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG and WebP images are allowed."), false);
  }
};

const limits = { fileSize: 5 * 1024 * 1024 }; // 5 MB

const uploadSingle   = multer({ storage, fileFilter, limits }).single("image");
const uploadMultiple = multer({ storage, fileFilter, limits }).array("images", 5);

module.exports = { uploadSingle, uploadMultiple };

const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(
      new Error("Only JPG, PNG, and WebP images are allowed.")
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB
    files: 1,
  },
});

const uploadAvatar = (req, res, next) => {
  upload.single("avatar")(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      const message =
        error.code === "LIMIT_FILE_SIZE"
          ? "Avatar must be smaller than 2 MB."
          : "Unable to process uploaded image.";

      return res.status(400).json({
        success: false,
        message,
      });
    }

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    next();
  });
};

module.exports = uploadAvatar;
import multer from "multer";

// Keep the file temporarily in memory
const storage = multer.memoryStorage();

// Check that the uploaded file is an image
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

const upload = multer({
  storage,

  fileFilter,

  limits: {
    // Maximum file size = 5 MB
    fileSize: 5 * 1024 * 1024,
  },
});

export default upload;
const multer = require("multer");
const path = require("path");

// Cấu hình storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = "public/uploads/";

    if (file.fieldname === "product_images") {
      uploadPath += "products/";
    } else if (file.fieldname === "category_image") {
      uploadPath += "categories/";
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// Filter file
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ chấp nhận file ảnh (JPEG, PNG, WEBP)"), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: fileFilter,
});

module.exports = {
  productUpload: upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 5 },
  ]),

  categoryUpload: upload.single("image"),
};

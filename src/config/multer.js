import multer from "multer";
import path from "path";

// Cấu hình storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = "public/uploads/products";
    // Xác định thư mục lưu trữ dựa vào field name
    if (file.fieldname === "categoryImage") {
      uploadPath = "public/uploads/categories";
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// Filter file types
const fileFilter = function (req, file, cb) {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ cho phép upload file ảnh"), false);
  }
};

// Tạo và export multer instance
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter,
});

export default upload;

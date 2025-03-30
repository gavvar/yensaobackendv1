import express from "express";
import {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImages,
  setThumbnail,
  // uploadProductImages,
  deleteImage,
  getProductById,
  getFeaturedProducts,
  getProductsByCategory,
  viewProduct,
  getRelatedProducts,
} from "../controllers/product.controller.js";
import upload from "../config/multer.js";
import { validate } from "../middlewares/validation.middleware.js";
import { productSchemas } from "../validations/product.validation.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { parseProductData } from "../middlewares/parse-product-data.middleware.js";

const router = express.Router();

// Lấy danh sách và chi tiết sản phẩm
router.get("/", validate(productSchemas.getProducts, "query"), getProducts);

// Thêm route featured TRƯỚC
router.get("/featured", getFeaturedProducts);
// lay danh sach san pham theo danh muc
router.get("/category/:slug", getProductsByCategory);

// Route với path cố định phải đặt TRƯỚC route động
router.get("/id/:id", getProductById);

// Thêm route cho view count - đặt TRƯỚC route động
router.post("/id/:id/view", viewProduct);

// Thêm route cho sản phẩm liên quan - đặt TRƯỚC route động
router.get("/related/:id", getRelatedProducts);

// Route với path động đặt SAU CÙNG
router.get("/:slug", getProductBySlug);

// ADMIN endpoints: tạo, cập nhật, xóa sản phẩm
router.post(
  "/",
  authenticate,
  authorize("admin"),
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 5 },
  ]),
  parseProductData, // Thêm middleware để parse productData
  // validate(productSchemas.create),
  createProduct
);

router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  validate(productSchemas.update),
  updateProduct
);

router.delete("/:id", authenticate, authorize("admin"), deleteProduct);

// Upload ảnh sản phẩm
router.post(
  "/:productId/images",
  authenticate,
  authorize("admin"),
  uploadImages
);

// Set thumbnail
router.put(
  "/:productId/images/:imageId/thumbnail",
  authenticate,
  authorize("admin"),
  setThumbnail
);

// Thêm routes cho quản lý ảnh sản phẩm

router.delete(
  "/:productId/images/:imageId",
  authenticate,
  authorize("admin"),
  deleteImage
);

export default router;

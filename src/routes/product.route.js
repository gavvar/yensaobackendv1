import express from "express";
import {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImages,
  setThumbnail,
} from "../controllers/product.controller.js";
import { validate } from "../middlewares/validation.middleware.js";
import { productSchemas } from "../validations/product.validation.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Lấy danh sách và chi tiết sản phẩm
router.get("/", validate(productSchemas.getProducts, "query"), getProducts);
router.get("/:slug", getProductBySlug);

// ADMIN endpoints: tạo, cập nhật, xóa sản phẩm
router.post(
  "/",
  authenticate,
  authorize("admin"),
  validate(productSchemas.create),
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

export default router;

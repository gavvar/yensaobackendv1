import express from "express";
import {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategoryList,
} from "../controllers/category.controller.js";
import { validate } from "../middlewares/validation.middleware.js";
import { categorySchemas } from "../validations/category.validation.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes
router.get(
  "/",
  validate(categorySchemas.getCategories, "query"),
  getCategories
);
router.get("/:slug", getCategoryBySlug);

// Admin routes
router.post(
  "/",
  authenticate,
  authorize("admin"),
  validate(categorySchemas.create),
  createCategory
);

router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  validate(categorySchemas.update),
  updateCategory
);

router.delete("/:id", authenticate, authorize("admin"), deleteCategory);

router.post(
  "/reorder",
  authenticate,
  authorize("admin"),
  validate(categorySchemas.reorder),
  reorderCategoryList
);

export default router;

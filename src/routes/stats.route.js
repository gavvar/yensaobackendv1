import express from "express";
import {
  getDashboardStats,
  getRevenueStats,
  getTopProducts,
  getPaymentMethodStats,
  getOrderStatusStats,
  exportRevenueReport,
} from "../controllers/stats.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Tất cả các route thống kê đều yêu cầu quyền admin
router.get("/dashboard", authenticate, authorize("admin"), getDashboardStats);
router.get("/revenue", authenticate, authorize("admin"), getRevenueStats);
router.get("/top-products", authenticate, authorize("admin"), getTopProducts);
router.get(
  "/payment-methods",
  authenticate,
  authorize("admin"),
  getPaymentMethodStats
);
router.get(
  "/order-status",
  authenticate,
  authorize("admin"),
  getOrderStatusStats
);
router.get(
  "/export/revenue",
  authenticate,
  authorize("admin"),
  exportRevenueReport
);

export default router;

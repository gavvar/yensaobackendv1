import express from "express";
import {
  getShippingProviders,
  calculateShippingFee,
} from "../controllers/shipping.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Lấy danh sách đơn vị vận chuyển
router.get("/providers", getShippingProviders);

// Tính phí vận chuyển
router.post("/calculate-fee", calculateShippingFee);

// Chỉ admin mới được cập nhật thông tin vận chuyển
router.patch(
  "/orders/:id",
  authenticate,
  authorize("admin"),
  (req, res, next) => {
    // Xử lý cập nhật thông tin vận chuyển (tracking, provider)
    // Có thể triển khai sau
  }
);

export default router;

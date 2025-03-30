import express from "express";
import {
  getPaymentMethods,
  createPayment,
  verifyPayment,
  processPayment,
  processPaymentStatus,
} from "../controllers/payment.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Lấy danh sách phương thức thanh toán
router.get("/methods", getPaymentMethods);

// Tạo yêu cầu thanh toán mới
router.post("/", authenticate, createPayment);

// Xác thực kết quả thanh toán
router.post("/verify", authenticate, verifyPayment);

// Xử lý callback từ các cổng thanh toán (VNPay, Momo,...)
router.post("/callback/:provider", processPayment);

// Kiểm tra trạng thái thanh toán
router.post("/process", authenticate, processPaymentStatus);

export default router;

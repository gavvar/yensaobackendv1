import express from "express";
import {
  createNewOrder,
  getOrderDetail,
  getUserOrders,
  getAllOrders,
  updateOrder,
} from "../controllers/order.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Tạo đơn hàng (thường yêu cầu xác thực người dùng)
router.post("/", authenticate, createNewOrder);

// Lấy danh sách đơn hàng của người dùng hiện tại (dựa trên token)
router.get("/user", authenticate, getUserOrders);

// Dành cho quản trị viên: lấy toàn bộ đơn hàng
router.get("/admin", authenticate, authorize("admin"), getAllOrders);

// Lấy chi tiết đơn hàng theo id (yêu cầu xác thực)
router.get("/:id", authenticate, getOrderDetail);

// Cập nhật trạng thái đơn hàng (Admin)
router.put("/:id", authenticate, authorize("admin"), updateOrder);

export default router;

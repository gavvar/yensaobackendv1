import express from "express";
import {
  createNewOrder,
  getOrderList,
  getOrder,
  getOrderByNumber,
  updateOrder,
  updatePayment,
  cancelUserOrder,
  updateOrderInfoController,
  getOrderStatuses,
  getOrderDashboard,
  addOrderNote,
  exportOrdersToExcel,
  deleteOrder,
  restoreOrder,
} from "../controllers/order.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Lấy trạng thái đơn hàng và thanh toán (không yêu cầu xác thực)
router.get("/statuses", getOrderStatuses);

// Tạo đơn hàng (không cần đăng nhập)
router.post("/", authenticate, createNewOrder);

// Routes cần xác thực
router.get("/", authenticate, getOrderList);
router.get("/id/:id", authenticate, getOrder);
router.get("/number/:orderNumber", authenticate, getOrderByNumber);
router.post("/:id/cancel", authenticate, cancelUserOrder);

// THÊM ROUTE MỚI: Cập nhật thông tin đơn hàng
router.patch("/:id/info", authenticate, updateOrderInfoController);

// Routes chỉ dành cho admin
router.get("/dashboard", authenticate, authorize("admin"), getOrderDashboard);
router.patch("/:id/status", authenticate, authorize("admin"), updateOrder);
router.patch("/:id/payment", authenticate, authorize("admin"), updatePayment);
router.post("/:id/notes", authenticate, authorize("admin"), addOrderNote);
router.get("/export", authenticate, authorize("admin"), exportOrdersToExcel);
router.delete("/:id", authenticate, authorize("admin"), deleteOrder);
router.patch("/:id/restore", authenticate, authorize("admin"), restoreOrder);

export default router;

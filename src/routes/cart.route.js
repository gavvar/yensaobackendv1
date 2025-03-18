import express from "express";
import {
  getCart,
  addToCart,
  updateCart,
  deleteCartItem,
} from "../controllers/cart.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Các endpoint của giỏ hàng yêu cầu xác thực (authenticate middleware)
router.get("/", authenticate, getCart); // Lấy giỏ hàng của user
router.post("/", authenticate, addToCart); // Thêm sản phẩm vào giỏ
router.put("/:cartItemId", authenticate, updateCart); // Cập nhật số lượng sản phẩm trong giỏ
router.delete("/:cartItemId", authenticate, deleteCartItem); // Xóa sản phẩm khỏi giỏ

export default router;

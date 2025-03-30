import express from "express";
import {
  getCart,
  addToCart,
  updateCart,
  deleteCartItem,
  toggleSelectedStatus,
  updateCartItemNotes,
  batchUpdateCartItems,
  deleteManyCartItems, // Thêm import
} from "../controllers/cart.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Các endpoint của giỏ hàng yêu cầu xác thực (authenticate middleware)
router.get("/", authenticate, getCart); // Lấy giỏ hàng của user
router.post("/", authenticate, addToCart); // Thêm sản phẩm vào giỏ
router.put("/:cartItemId", authenticate, updateCart); // Cập nhật số lượng sản phẩm trong giỏ
router.delete("/:cartItemId", authenticate, deleteCartItem); // Xóa sản phẩm khỏi giỏ

// Thêm các endpoint mới
router.patch("/:cartItemId/select", authenticate, toggleSelectedStatus);
router.patch("/:cartItemId/notes", authenticate, updateCartItemNotes);
router.patch("/batch-update", authenticate, batchUpdateCartItems); // Cập nhật nhiều sản phẩm trong giỏ hàng (nếu cần)
router.post("/delete-many", authenticate, deleteManyCartItems); // Thêm endpoint mới để xóa nhiều sản phẩm

export default router;

import express from "express";
import { body } from "express-validator";
import {
  getProfile,
  updateProfile,
  updatePassword,
  listUsers,
  updateUser,
  removeUser,
  getUserStats,
} from "../controllers/user.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Routes for regular users
router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateProfile);

// New route for changing password
router.post(
  "/change-password",
  authenticate,
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Mật khẩu hiện tại không được để trống"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("Mật khẩu mới phải có ít nhất 6 ký tự"),
  ],
  updatePassword
);

// Admin routes
router.get("/", authenticate, authorize("admin"), listUsers);

// New route for user statistics
router.get("/stats", authenticate, authorize("admin"), getUserStats); //dung de lay thong ke user

router.put("/:id", authenticate, authorize("admin"), updateUser);

router.delete("/:id", authenticate, authorize("admin"), removeUser);

export default router;

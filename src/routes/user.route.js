import express from "express";
import { body } from "express-validator";
import {
  getProfile,
  updateProfile,
  listUsers,
  updateUser,
  removeUser,
} from "../controllers/user.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Endpoints cho user tự quản lý thông tin (đã đăng nhập)
router.get("/me", authenticate, getProfile);

router.put(
  "/me",
  authenticate,
  [
    body("fullName")
      .optional()
      .notEmpty()
      .withMessage("Full name không được để trống"),
    body("email").optional().isEmail().withMessage("Email không hợp lệ"),
  ],
  updateProfile
);

// Endpoints quản trị (Admin)
router.get("/", authenticate, authorize("admin"), listUsers);
router.put("/:id", authenticate, authorize("admin"), updateUser);
router.delete("/:id", authenticate, authorize("admin"), removeUser);

export default router;

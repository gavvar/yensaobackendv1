import express from "express";
import { body } from "express-validator";
import {
  loginUser,
  registerUser,
  forgotPasswordRequest,
  resetPasswordRequest,
  logoutUser,
  logoutAllDevices,
  changePasswordRequest,
  getActiveSessionsRequest,
  getCurrentUser,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import emailService from "../services/email.service.js";

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Đăng ký tài khoản mới
 * @access Public
 */
router.post(
  "/register",
  [
    body("fullName").notEmpty().withMessage("Full name không được để trống"),
    body("email").isEmail().withMessage("Email không hợp lệ"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Mật khẩu tối thiểu 6 ký tự"),
  ],
  registerUser
);

/**
 * @route POST /api/auth/login
 * @desc Đăng nhập
 * @access Public
 */
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Email không hợp lệ"),
    body("password").notEmpty().withMessage("Password không được để trống"),
  ],
  loginUser
);

/**
 * @route POST /api/auth/forgot-password
 * @desc Gửi email reset password
 * @access Public
 */
router.post(
  "/forgot-password",
  [body("email").isEmail().withMessage("Email không hợp lệ")],
  forgotPasswordRequest
);

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password với token
 * @access Public
 */
router.post(
  "/reset-password",
  [
    body("token").notEmpty().withMessage("Token không được để trống"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Mật khẩu tối thiểu 6 ký tự"),
  ],
  resetPasswordRequest
);

/**
 * @route POST /api/auth/logout
 * @desc Đăng xuất khỏi thiết bị hiện tại
 * @access Private
 */
router.post("/logout", authenticate, logoutUser);

/**
 * @route POST /api/auth/logout-all
 * @desc Đăng xuất khỏi tất cả thiết bị
 * @access Private
 */
router.post("/logout-all", authenticate, logoutAllDevices);

/**
 * @route POST /api/auth/change-password
 * @desc Thay đổi mật khẩu (khi đã đăng nhập)
 * @access Private
 */
router.post(
  "/change-password",
  authenticate,
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Mật khẩu hiện tại không được để trống"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("Mật khẩu mới tối thiểu 6 ký tự"),
  ],
  changePasswordRequest
);

/**
 * @route GET /api/auth/sessions
 * @desc Lấy danh sách phiên đăng nhập
 * @access Private
 */
router.get("/sessions", authenticate, getActiveSessionsRequest);

/**
 * @route GET /api/auth/me
 * @desc Lấy thông tin người dùng hiện tại
 * @access Private
 */
router.get("/me", authenticate, getCurrentUser);

/**
 * @route POST /api/auth/test-email
 * @desc Test gửi email (chỉ dùng trong development)
 * @access Development only
 */
if (process.env.NODE_ENV === "development") {
  router.post("/test-email", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: "Email address is required",
        });
      }

      const result = await emailService.sendResetPasswordEmail(
        email,
        "test-token-123",
        "Test User"
      );

      return res.json({
        success: result,
        message: result ? "Email sent successfully" : "Failed to send email",
        details: { email, timestamp: new Date().toISOString() },
      });
    } catch (error) {
      console.error("Error in test-email route:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
}

export default router;

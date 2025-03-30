import { validationResult } from "express-validator";
import * as authService from "../services/auth.service.js";
import { ValidationError } from "../utils/errors.js";
import config from "../config/auth.js";
import { getUserById } from "../services/user.service.js";
import jwt from "jsonwebtoken";

// Hàm tạo refresh token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, tokenVersion: user.tokenVersion },
    config.refreshTokenSecret,
    { expiresIn: "7d" } // Thời gian dài hơn access token
  );
};

// auth.controller.js
const setAuthCookies = (res, accessToken, refreshToken) => {
  let expiryMs;

  // Phân tích chuỗi thời gian (15m, 2h, vv)
  if (typeof config.jwtExpiration === "string") {
    const match = config.jwtExpiration.match(/^(\d+)([smhd])$/);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2];

      switch (unit) {
        case "s":
          expiryMs = value * 1000;
          break;
        case "m":
          expiryMs = value * 60 * 1000;
          break;
        case "h":
          expiryMs = value * 60 * 60 * 1000;
          break;
        case "d":
          expiryMs = value * 24 * 60 * 60 * 1000;
          break;
        default:
          expiryMs = 2 * 60 * 60 * 1000; // 2 giờ mặc định
      }
    } else {
      expiryMs = parseInt(config.jwtExpiration) * 1000;
    }
  } else {
    expiryMs = 2 * 60 * 60 * 1000; // 2 giờ mặc định
  }

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: expiryMs,
    path: "/",
  });

  // Phần còn lại của hàm giữ nguyên
};

// Đăng ký user mới
export const registerUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const result = await authService.register({
      fullName: req.body.fullName,
      email: req.body.email,
      password: req.body.password,
      userAgent: req.headers["user-agent"],
    });

    // Sử dụng refresh token
    const refreshToken = generateRefreshToken(result.user);
    setAuthCookies(res, result.token, refreshToken);

    return res.status(201).json({
      success: true,
      data: { user: result.user },
    });
  } catch (error) {
    next(error);
  }
};

// Đăng nhập
export const loginUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const result = await authService.login(
      req.body.email,
      req.body.password,
      req.headers["user-agent"]
    );

    // Sử dụng refresh token thay vì chỉ access token
    const refreshToken = generateRefreshToken(result.user);
    setAuthCookies(res, result.token, refreshToken);

    // Không trả về token trong response
    return res.json({
      success: true,
      data: { user: result.user },
    });
  } catch (error) {
    next(error);
  }
};

// Đăng xuất
export const logoutUser = async (req, res, next) => {
  try {
    // Xóa cả hai cookies
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/refresh",
    });

    await authService.logout(req.user.id);

    return res.json({
      success: true,
      message: "Đăng xuất thành công",
    });
  } catch (error) {
    next(error);
  }
};

// Đăng xuất tất cả thiết bị
export const logoutAllDevices = async (req, res, next) => {
  try {
    // Đăng xuất tất cả (tăng tokenVersion)
    await authService.logoutAll(req.user.id);

    // Xóa cả hai cookies
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/refresh",
    });

    return res.json({
      success: true,
      message: "Đã đăng xuất khỏi tất cả thiết bị",
    });
  } catch (error) {
    next(error);
  }
};

// Quên mật khẩu
export const forgotPasswordRequest = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const result = await authService.forgotPassword(req.body.email);
    return res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// Reset mật khẩu
export const resetPasswordRequest = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const result = await authService.resetPassword(
      req.body.token,
      req.body.password
    );
    return res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// Đổi mật khẩu
export const changePasswordRequest = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const result = await authService.changePassword(
      req.user.id,
      req.body.currentPassword,
      req.body.newPassword
    );

    // Xóa cả hai cookies
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/refresh",
    });

    return res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// Lấy danh sách sessions
export const getActiveSessionsRequest = async (req, res, next) => {
  try {
    const result = await authService.getActiveDevices(req.user.id);
    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Lấy thông tin người dùng hiện tại
export const getCurrentUser = async (req, res, next) => {
  try {
    return res.json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          fullName: req.user.fullName,
          role: req.user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Thêm vào cuối auth.controller.js
export const refreshTokenHandler = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: "Refresh token không tìm thấy",
      });
    }

    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.refreshTokenSecret);

      // Kiểm tra user và tokenVersion
      const user = await getUserById(decoded.id);

      if (
        !user ||
        !user.isActive ||
        user.tokenVersion !== decoded.tokenVersion
      ) {
        throw new ValidationError("Refresh token không hợp lệ", 401);
      }

      // Tạo access token mới
      const accessToken = authService.generateToken(user);

      // Thiết lập cookie mới
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: parseInt(config.jwtExpiration) * 1000,
        path: "/",
      });

      return res.json({
        success: true,
        message: "Access token đã được làm mới",
      });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          success: false,
          error: "Refresh token không hợp lệ hoặc đã hết hạn",
        });
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

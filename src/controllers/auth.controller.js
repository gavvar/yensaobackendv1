import {
  register,
  login,
  forgotPassword,
  resetPassword,
  logout,
  logoutAll,
  changePassword,
  getActiveDevices,
} from "../services/auth.service.js";
import { getUserById } from "../services/user.service.js";
/**
 * Đăng ký tài khoản
 */
export const registerUser = async (req, res, next) => {
  try {
    // Lấy deviceId và userAgent để hỗ trợ đa thiết bị
    const userData = req.body;
    const deviceId = req.body.deviceId || req.headers["x-device-id"];
    const userAgent = req.headers["user-agent"];

    // Chuyển cả deviceId và userAgent vào userData
    if (deviceId) userData.deviceId = deviceId;
    if (userAgent) userData.userAgent = userAgent;

    const result = await register(userData, deviceId);
    return res.status(201).json({
      success: true,
      data: result,
      message: "Đăng ký tài khoản thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Đăng nhập
 */
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // Lấy deviceId và userAgent từ headers hoặc body
    const deviceId = req.body.deviceId || req.headers["x-device-id"];
    const userAgent = req.headers["user-agent"];

    const result = await login(email, password, deviceId, userAgent);
    return res.status(200).json({
      success: true,
      data: result,
      message: "Đăng nhập thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Quên mật khẩu
 */
export const forgotPasswordRequest = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await forgotPassword(email);
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Đặt lại mật khẩu
 */
export const resetPasswordRequest = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const result = await resetPassword(token, password);
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Đăng xuất từ thiết bị hiện tại
 */
export const logoutUser = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const deviceId = req.body.deviceId || req.headers["x-device-id"];

    const result = await logout(userId, deviceId);
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Đăng xuất khỏi tất cả thiết bị
 */
export const logoutAllDevices = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await logoutAll(userId);
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Thay đổi mật khẩu (khi đã đăng nhập)
 */
export const changePasswordRequest = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const result = await changePassword(userId, currentPassword, newPassword);
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};
/**
 * Lấy thông tin người dùng hiện tại
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    // req.user đã có từ middleware authenticate
    // nhưng có thể chỉ chứa thông tin từ JWT token
    // nên cần lấy thông tin đầy đủ từ database
    const user = await getUserById(req.user.id);

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
/**
 * Lấy danh sách phiên đăng nhập
 */
export const getActiveSessionsRequest = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await getActiveDevices(userId);
    return res.status(200).json({
      success: true,
      data: result.devices,
    });
  } catch (error) {
    next(error);
  }
};

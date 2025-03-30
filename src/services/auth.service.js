import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import db from "../models/index.js";
import { ValidationError } from "../utils/errors.js";
import config from "../config/auth.js";
import emailService from "../services/email.service.js";
import crypto from "crypto";

const { User } = db;

/**
 * Tạo JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiration }
  );
};

/**
 * Đăng ký tài khoản mới
 */
export const register = async (userData) => {
  // Tối ưu hiệu suất: Chỉ lấy id để kiểm tra tồn tại
  const existingUser = await User.findOne({
    where: { email: userData.email.toLowerCase() }, // Đảm bảo email lowercase
    attributes: ["id"],
  });

  if (existingUser) {
    throw new ValidationError("Email này đã được sử dụng", 400);
  }

  // Mặc định là customer
  userData.role = "customer";
  userData.email = userData.email.toLowerCase();
  userData.tokenVersion = 0; // Khởi tạo tokenVersion

  const newUser = await User.create(userData);
  const token = generateToken(newUser);

  return {
    token,
    user: newUser.getBasicProfile(),
  };
};

/**
 * Đăng nhập
 */
export const login = async (email, password, userAgent = null) => {
  // Tối ưu: Chỉ lấy các trường cần thiết
  const user = await User.unscoped().findOne({
    where: { email: email.toLowerCase() }, // Đảm bảo email lowercase
    attributes: [
      "id",
      "email",
      "password",
      "role",
      "isActive",
      "fullName",
      "tokenVersion",
    ],
  });

  if (!user || !user.isActive) {
    throw new ValidationError("Email hoặc mật khẩu không chính xác", 401);
  }

  // Sử dụng method của model để so sánh password (encapsulation)
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ValidationError("Email hoặc mật khẩu không chính xác", 401);
  }

  // Generate token với tokenVersion
  const token = generateToken(user);

  return {
    token,
    user: user.getBasicProfile(),
  };
};

/**
 * Khởi tạo quá trình đặt lại mật khẩu
 */
export const forgotPassword = async (email) => {
  const user = await User.findOne({
    where: { email: email.toLowerCase() },
    attributes: [
      "id",
      "email",
      "isActive",
      "fullName",
      "passwordResetRequestedAt",
    ],
  });

  if (!user || !user.isActive) {
    // Vẫn trả về message thành công để tránh user enumeration
    return {
      message: "Nếu email tồn tại, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu",
    };
  }

  // Chặn spam yêu cầu reset mật khẩu (mỗi 5 phút)
  if (
    user.passwordResetRequestedAt &&
    new Date() - new Date(user.passwordResetRequestedAt) < 5 * 60 * 1000
  ) {
    throw new ValidationError("Vui lòng đợi trước khi yêu cầu lại", 429);
  }

  // Tạo unique token với loại "reset"
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenHash = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Lưu token hash và cập nhật thời gian yêu cầu
  await user.update({
    resetPasswordToken: resetTokenHash,
    resetPasswordExpires: new Date(Date.now() + 3600000), // 1 giờ
    passwordResetRequestedAt: new Date(),
  });

  // Gửi email reset password
  const emailSent = await emailService.sendResetPasswordEmail(
    user.email,
    resetToken,
    {
      fullName: user.fullName,
    }
  );

  if (!emailSent) {
    console.error(`Failed to send reset password email to ${user.email}`);
    // Không throw error để tránh user enumeration
  }

  return {
    message: "Đã gửi email hướng dẫn đặt lại mật khẩu",
  };
};

/**
 * Đặt lại mật khẩu
 */
export const resetPassword = async (token, newPassword) => {
  try {
    // Hash token để so sánh với giá trị đã lưu
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Tìm user với token và token chưa hết hạn
    const user = await User.unscoped().findOne({
      where: {
        resetPasswordToken: resetTokenHash,
        resetPasswordExpires: { [db.Sequelize.Op.gt]: new Date() },
      },
    });

    if (!user) {
      throw new ValidationError("Token đã hết hạn hoặc không hợp lệ", 400);
    }

    // Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Tăng tokenVersion, cập nhật mật khẩu và xóa thông tin reset
    await user.update({
      password: hashedPassword,
      tokenVersion: user.tokenVersion + 1,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      passwordResetRequestedAt: null,
    });

    return {
      message: "Đặt lại mật khẩu thành công",
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Đăng xuất khỏi thiết bị hiện tại
 * Lưu ý: Cookie sẽ được xóa ở controller
 */
export const logout = async (userId) => {
  return { message: "Đăng xuất thành công" };
};

/**
 * Đăng xuất khỏi tất cả thiết bị
 */
export const logoutAll = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new ValidationError("Người dùng không tồn tại", 404);
  }

  // Tăng tokenVersion để vô hiệu hóa tất cả token hiện tại
  await user.update({
    tokenVersion: user.tokenVersion + 1,
  });

  return { message: "Đã đăng xuất khỏi tất cả thiết bị" };
};

/**
 * Lấy thông tin phiên đăng nhập
 * Lưu ý: Không còn chi tiết về từng thiết bị
 */
export const getActiveDevices = async (userId) => {
  // Chỉ trả về thông tin phiên hiện tại vì không còn lưu thông tin nhiều thiết bị
  return {
    devices: [
      {
        deviceId: "current",
        lastLogin: new Date(),
        userAgent: "Current session",
      },
    ],
  };
};

/**
 * Thay đổi mật khẩu (khi đã đăng nhập)
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.unscoped().findByPk(userId, {
    attributes: ["id", "password", "tokenVersion"],
  });

  if (!user) {
    throw new ValidationError("Người dùng không tồn tại", 404);
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new ValidationError("Mật khẩu hiện tại không chính xác", 400);
  }

  await user.update({
    password: await bcrypt.hash(newPassword, 10),
    tokenVersion: user.tokenVersion + 1, // Tăng tokenVersion để vô hiệu hóa tất cả token hiện tại
  });

  return { message: "Thay đổi mật khẩu thành công" };
};

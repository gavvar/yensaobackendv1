import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import db from "../models/index.js";
import { ValidationError } from "../utils/errors.js";
import config from "../config/auth.js";
import redis from "../config/redis.js";
import crypto from "crypto";
import emailService from "../services/email.service.js";

const { User } = db;

/**
 * Hash key trước khi lưu vào Redis để tăng bảo mật
 * Ngăn chặn timing attacks và user enumeration
 */
const hashKey = (key) => crypto.createHash("sha256").update(key).digest("hex");

/**
 * Tạo JWT token
 */
const generateToken = (user, deviceId = null) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      device: deviceId,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiration }
  );
};

/**
 * Đăng ký tài khoản mới
 */
export const register = async (userData, deviceId = null) => {
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

  const newUser = await User.create(userData);
  const token = generateToken(newUser, deviceId);

  // Lưu session vào Redis với deviceId
  const sessionKey = deviceId
    ? hashKey(`auth:${newUser.id}:${deviceId}`)
    : hashKey(`auth:${newUser.id}`);

  await redis.set(
    sessionKey,
    JSON.stringify({
      lastLogin: new Date(),
      userAgent: userData.userAgent || "unknown",
    }),
    { EX: 60 * 60 * 24 * 7 } // 7 days
  );

  return {
    token,
    user: newUser.getBasicProfile(),
  };
};

/**
 * Đăng nhập
 */
export const login = async (
  email,
  password,
  deviceId = null,
  userAgent = null
) => {
  // Tối ưu: Chỉ lấy các trường cần thiết
  const user = await User.unscoped().findOne({
    where: { email: email.toLowerCase() }, // Đảm bảo email lowercase
    attributes: ["id", "email", "password", "role", "isActive", "fullName"],
  });

  if (!user || !user.isActive) {
    throw new ValidationError("Email hoặc mật khẩu không chính xác", 401);
  }

  // Sử dụng method của model để so sánh password (encapsulation)
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ValidationError("Email hoặc mật khẩu không chính xác", 401);
  }

  // Kiểm tra và giới hạn số lượng thiết bị đăng nhập đồng thời
  // nếu cần implement chức năng này trong tương lai

  // Lưu session vào Redis với deviceId
  const sessionKey = deviceId
    ? hashKey(`auth:${user.id}:${deviceId}`)
    : hashKey(`auth:${user.id}`);

  await redis.set(
    sessionKey,
    JSON.stringify({
      lastLogin: new Date(),
      userAgent: userAgent || "unknown",
    }),
    { EX: 60 * 60 * 24 * 7 } // 7 days
  );

  // Generate token với deviceId
  const token = generateToken(user, deviceId);

  return {
    token,
    user: user.getBasicProfile(),
  };
};

/**
 * Khởi tạo quá trình đặt lại mật khẩu
 * Với rate limiting để ngăn spam
 */
export const forgotPassword = async (email) => {
  const user = await User.findOne({
    where: { email: email.toLowerCase() },
    attributes: ["id", "email", "isActive", "fullName"], // Thêm fullName để sử dụng trong email
  });

  if (!user || !user.isActive) {
    // Vẫn trả về message thành công để tránh user enumeration
    return {
      message: "Nếu email tồn tại, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu",
    };
  }

  // Chặn spam yêu cầu reset mật khẩu (mỗi 5 phút)
  const rateLimitKey = hashKey(`reset_attempt:${user.id}`);
  const isRateLimited = await redis.get(rateLimitKey);

  if (isRateLimited) {
    throw new ValidationError("Vui lòng đợi trước khi yêu cầu lại", 429);
  }

  // Set rate limit
  await redis.set(rateLimitKey, "1", { EX: 300 }); // 5 phút

  // Tạo unique token với loại "reset"
  const resetToken = jwt.sign(
    { id: user.id, type: "reset", timestamp: Date.now() },
    config.jwtSecret,
    { expiresIn: "1h" }
  );

  // Lưu token trong Redis với TTL, sử dụng hash key
  await redis.set(hashKey(`reset:${user.id}`), resetToken, { EX: 3600 }); // 1 giờ

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
    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);

    if (decoded.type !== "reset") {
      throw new ValidationError("Token không hợp lệ", 400);
    }

    // Kiểm tra token trong Redis với hash key
    const storedToken = await redis.get(hashKey(`reset:${decoded.id}`));

    if (!storedToken || storedToken !== token) {
      throw new ValidationError("Token đã hết hạn hoặc đã sử dụng", 400);
    }

    // Tối ưu hiệu suất: Kết hợp tìm và cập nhật trong một query
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedRows = await User.update(
      { password: hashedPassword },
      { where: { id: decoded.id, isActive: true } }
    );

    if (updatedRows[0] === 0) {
      throw new ValidationError(
        "Không tìm thấy người dùng hoặc tài khoản không hoạt động",
        404
      );
    }

    // Xóa token khỏi Redis để ngăn sử dụng lại
    await redis.del(hashKey(`reset:${decoded.id}`));

    // Vô hiệu hóa tất cả session hiện tại (log out all devices)
    // Lấy tất cả session key
    const sessionPattern = hashKey(`auth:${decoded.id}`) + "*";
    const keys = await redis.keys(sessionPattern);

    // Xóa tất cả session
    if (keys.length > 0) {
      await redis.del(keys);
    }

    return {
      message: "Đặt lại mật khẩu thành công",
    };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new ValidationError("Token không hợp lệ hoặc đã hết hạn", 400);
    }
    throw error;
  }
};

/**
 * Đăng xuất khỏi thiết bị hiện tại
 */
export const logout = async (userId, deviceId = null) => {
  const sessionKey = deviceId
    ? hashKey(`auth:${userId}:${deviceId}`)
    : hashKey(`auth:${userId}`);

  await redis.del(sessionKey);
  return { message: "Đăng xuất thành công" };
};

/**
 * Đăng xuất khỏi tất cả thiết bị
 */
export const logoutAll = async (userId) => {
  const sessionPattern = hashKey(`auth:${userId}`) + "*";
  const keys = await redis.keys(sessionPattern);

  if (keys.length > 0) {
    await redis.del(keys);
  }

  return { message: "Đã đăng xuất khỏi tất cả thiết bị" };
};

/**
 * Lấy danh sách thiết bị đang đăng nhập
 */
export const getActiveDevices = async (userId) => {
  const sessionPattern = hashKey(`auth:${userId}`) + "*";
  const keys = await redis.keys(sessionPattern);

  const devices = [];
  for (const key of keys) {
    const sessionData = await redis.get(key);
    if (sessionData) {
      try {
        const data = JSON.parse(sessionData);
        // Extract deviceId từ key nếu có
        const keyParts = key.split(":");
        const deviceId = keyParts.length > 2 ? keyParts[2] : "unknown";

        devices.push({
          deviceId,
          lastLogin: data.lastLogin,
          userAgent: data.userAgent,
        });
      } catch (e) {
        console.error("Error parsing session data", e);
      }
    }
  }

  return { devices };
};

/**
 * Thay đổi mật khẩu (khi đã đăng nhập)
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.unscoped().findByPk(userId, {
    attributes: ["id", "password"],
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
  });

  return { message: "Thay đổi mật khẩu thành công" };
};

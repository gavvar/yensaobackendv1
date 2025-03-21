import db from "../models/index.js";
import { ValidationError } from "../utils/errors.js";
import bcrypt from "bcryptjs";

const { User } = db;

/**
 * Lấy thông tin người dùng theo ID
 */
export const getUserById = async (userId) => {
  const user = await User.scope("withoutPassword").findByPk(userId);
  if (!user) {
    throw new ValidationError("Không tìm thấy người dùng", 404);
  }
  return user;
};

/**
 * Cập nhật thông tin cá nhân người dùng (Không cho đổi mật khẩu trực tiếp)
 */
export const updateUserProfile = async (userId, userData) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new ValidationError("Không tìm thấy người dùng", 404);
  }

  // Người dùng không thể thay đổi role của mình
  delete userData.role;
  delete userData.password;

  await user.update(userData);
  return await User.scope("withoutPassword").findByPk(userId);
};

/**
 * Đổi mật khẩu khi nhớ mật khẩu
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new ValidationError("Không tìm thấy người dùng", 404);
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new ValidationError("Mật khẩu hiện tại không chính xác", 400);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await user.update({ password: hashedPassword });

  return { success: true, message: "Đổi mật khẩu thành công" };
};

/**
 * Lấy danh sách tất cả người dùng (dành cho admin)
 */
export const getAllUsers = async (options = {}) => {
  const { page = 1, limit = 10, search, role, isActive } = options;

  const whereClause = {};
  if (search) {
    whereClause[db.Sequelize.Op.or] = [
      { fullName: { [db.Sequelize.Op.like]: `%${search}%` } },
      { email: { [db.Sequelize.Op.like]: `%${search}%` } },
    ];
  }
  if (role) whereClause.role = role;
  if (isActive !== undefined) whereClause.isActive = isActive;

  const { count, rows } = await User.scope("withoutPassword").findAndCountAll({
    where: whereClause,
    offset: (page - 1) * limit,
    limit: parseInt(limit),
    order: [["createdAt", "DESC"]],
  });

  return {
    users: rows,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(count / limit),
    },
  };
};

/**
 * Cập nhật người dùng bởi admin (Có thể đặt lại mật khẩu)
 */
export const updateUserAdmin = async (userId, userData) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new ValidationError("Không tìm thấy người dùng", 404);
  }

  // Nếu admin đặt lại mật khẩu cho user
  if (userData.password) {
    userData.password = await bcrypt.hash(userData.password, 10);
  }

  await user.update(userData);
  return await User.scope("withoutPassword").findByPk(userId);
};

/**
 * Xóa người dùng (soft delete)
 */
export const deleteUser = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new ValidationError("Không tìm thấy người dùng", 404);
  }

  if (user.role === "admin") {
    throw new ValidationError("Không thể xóa tài khoản admin", 400);
  }

  await user.update({ isActive: false });
  return { success: true };
};

/**
 * Thống kê số lượng người dùng
 */
export const countUsers = async () => {
  const totalUsers = await User.count();
  const activeUsers = await User.count({ where: { isActive: true } });
  const admins = await User.count({ where: { role: "admin" } });
  const newUsersThisMonth = await User.count({
    where: {
      createdAt: {
        [db.Sequelize.Op.gte]: new Date(new Date().setDate(1)),
      },
    },
  });

  return {
    total: totalUsers,
    active: activeUsers,
    admins,
    newThisMonth: newUsersThisMonth,
  };
};

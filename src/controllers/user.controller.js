import {
  getUserById,
  updateUserProfile,
  changePassword,
  getAllUsers,
  updateUserAdmin,
  deleteUser,
  countUsers,
} from "../services/user.service.js";

export const getProfile = async (req, res, next) => {
  try {
    const user = await getUserById(req.user.id);
    return res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const updatedUser = await updateUserProfile(req.user.id, req.body);
    return res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};

// Thêm controller cho thay đổi mật khẩu
export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp cả mật khẩu hiện tại và mật khẩu mới",
      });
    }

    const result = await changePassword(
      req.user.id,
      currentPassword,
      newPassword
    );
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// Cập nhật controller lấy danh sách người dùng để hỗ trợ phân trang và tìm kiếm
export const listUsers = async (req, res, next) => {
  try {
    const { page, limit, search, role, isActive } = req.query;

    const options = {
      page: page || 1,
      limit: limit || 10,
      search,
      role,
      isActive: isActive !== undefined ? isActive === "true" : undefined,
    };

    const users = await getAllUsers(options);
    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// Thêm controller cho thống kê người dùng
export const getUserStats = async (req, res, next) => {
  try {
    const stats = await countUsers();
    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const updatedUser = await updateUserAdmin(userId, req.body);
    return res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};

export const removeUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    await deleteUser(userId);
    return res.status(200).json({ message: "Xóa user thành công" });
  } catch (error) {
    next(error);
  }
};

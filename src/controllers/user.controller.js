import {
  getUserById,
  updateUserProfile,
  getAllUsers,
  updateUserAdmin,
  deleteUser,
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

// Các hàm hỗ trợ quản trị viên
export const listUsers = async (req, res, next) => {
  try {
    const users = await getAllUsers();
    return res.status(200).json(users);
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

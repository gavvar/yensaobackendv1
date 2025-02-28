import db from "../models/index.js";
const { User } = db;

export const getUserById = async (id) => {
  const user = await User.findByPk(id, {
    attributes: { exclude: ["password"] },
  });
  if (!user) throw new Error("User không tồn tại");
  return user;
};

export const updateUserProfile = async (id, data) => {
  const user = await User.findByPk(id);
  if (!user) throw new Error("User không tồn tại");
  await user.update(data);
  return user;
};

export const getAllUsers = async () => {
  const users = await User.findAll({ attributes: { exclude: ["password"] } });
  return users;
};

export const updateUserAdmin = async (id, data) => {
  const user = await User.findByPk(id);
  if (!user) throw new Error("User không tồn tại");
  await user.update(data);
  return user;
};

export const deleteUser = async (id) => {
  const user = await User.findByPk(id);
  if (!user) throw new Error("User không tồn tại");
  await user.destroy();
};

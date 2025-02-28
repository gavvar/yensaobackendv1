import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import dotenv from "dotenv";
import db from "../models/index.js";
const { User } = db;

dotenv.config();

export const registerUser = async ({
  fullName,
  email,
  password,
  phone,
  address,
}) => {
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) throw new Error("Email đã tồn tại");

  // Tạo user mới, hook trong model sẽ tự động mã hóa mật khẩu
  const newUser = await User.create({
    fullName,
    email,
    password,
    phone,
    address,
  });
  return newUser;
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ where: { email } });
  if (!user) throw new Error("Email không tồn tại");

  // So sánh password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new Error("Mật khẩu không chính xác");

  // Tạo payload và cấp JWT token
  const payload = { id: user.id, email: user.email, role: user.role };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  return { token, user };
};

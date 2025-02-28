import { validationResult } from "express-validator";
import { registerUser, loginUser } from "../services/auth.service.js";

export const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { fullName, email, password, phone, address } = req.body;
    const newUser = await registerUser({
      fullName,
      email,
      password,
      phone,
      address,
    });
    return res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    const token = await loginUser({ email, password });
    return res.status(200).json(token);
  } catch (error) {
    next(error);
  }
};

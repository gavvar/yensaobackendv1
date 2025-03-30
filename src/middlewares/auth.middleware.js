import jwt from "jsonwebtoken";
import db from "../models/index.js";
import config from "../config/auth.js";
import { ValidationError } from "../utils/errors.js";

const { User, Cart, CartItem } = db; // Thêm Cart, CartItem

export const authenticate = (req, res, next) => {
  // Ưu tiên kiểm tra token từ cookie
  const token = req.cookies.accessToken;

  // Sau đó mới kiểm tra từ header nếu cần thiết
  const authHeader = !token && req.headers.authorization;

  if (!token && (!authHeader || !authHeader.startsWith("Bearer "))) {
    return res.status(401).json({
      error: {
        code: 400,
        message: "Bạn cần đăng nhập để tiếp tục",
      },
    });
  }

  const tokenToVerify = token || authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(tokenToVerify, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: {
        code: 400,
        message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn",
      },
    });
  }
};

// Thêm middleware linh hoạt hơn cho phép kiểm tra nhiều loại role
export const authorize = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Bạn cần đăng nhập để tiếp tục",
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        success: false,
        error: "Bạn không có quyền thực hiện hành động này",
      });
    }

    next();
  };
};

// Giữ lại như cũ để không ảnh hưởng đến code đang sử dụng
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      error: "Bạn không có quyền thực hiện hành động này",
    });
  }
  next();
};

// Thêm middleware kiểm tra sở hữu
export const checkCartItemOwnership = async (req, res, next) => {
  try {
    const { cartItemId } = req.params;
    const userId = req.user.id;

    const cartItem = await CartItem.findOne({
      where: { id: cartItemId },
      include: [
        {
          model: Cart,
          where: { userId },
        },
      ],
    });

    if (!cartItem) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thực hiện hành động này",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

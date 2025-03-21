import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Không có token. Truy cập bị từ chối" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token không hợp lệ" });
  }
};

// Thêm middleware authorize để kiểm tra quyền admin
export const authorize = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Không có quyền truy cập",
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền thực hiện hành động này",
      });
    }

    next();
  };
};

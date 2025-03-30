import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes/index.js";
import path from "path";
import { fileURLToPath } from "url";
import errorHandler from "./middlewares/error.middleware.js";
import cookieParser from "cookie-parser";
import {
  requestLogger,
  responseLogger,
  errorLogger,
} from "./middlewares/logging.middleware.js";

dotenv.config();

const app = express();

// Logging middleware - đặt trước các middleware khác
app.use(requestLogger);
app.use(responseLogger);

// Các middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000", // Đổi thành domain frontend của bạn
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "x-device-id"],
  })
);

// Quyết định thư mục tĩnh cho uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Thay vì
// app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// Sửa thành (đi lên một cấp từ thư mục src):
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// Đăng ký các route API với tiền tố /api
app.use("/api", routes);

// Error logging - đặt trước error handler
app.use(errorLogger);

// Middleware xử lý lỗi (nếu bạn đã định nghĩa)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

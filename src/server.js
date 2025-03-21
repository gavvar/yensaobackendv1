import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes/index.js";
import path from "path";
import { fileURLToPath } from "url";
import errorHandler from "./middlewares/error.middleware.js";

dotenv.config();

const app = express();

// Các middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:3000", // Đổi thành domain frontend của bạn
    credentials: true,
  })
);

// Quyết định thư mục tĩnh cho uploads (lưu ý xác định đúng đường dẫn cho public/uploads)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// Đăng ký các route API với tiền tố /api
app.use("/api", routes);

// Middleware xử lý lỗi (nếu bạn đã định nghĩa)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

import morgan from "morgan";
import logger from "../config/logger.js";

// Định dạng format cho morgan
const morganFormat =
  process.env.NODE_ENV !== "production"
    ? "dev"
    : ":remote-addr - :method :url :status :res[content-length] - :response-time ms";

// Middleware log request
export const requestLogger = morgan(morganFormat, {
  stream: logger.stream,
  skip: (req, res) => req.url.includes("/uploads"), // Bỏ qua log cho static files
});

// Middleware log response
export const responseLogger = (req, res, next) => {
  // Lưu thời điểm request bắt đầu
  req._startTime = new Date();

  // Lưu method ban đầu để log
  const originalSend = res.send;

  // Override send method
  res.send = function (body) {
    const responseTime = new Date() - req._startTime;

    // Log chi tiết nếu cần
    if (
      process.env.NODE_ENV === "development" &&
      !req.url.includes("/uploads")
    ) {
      let logData = {
        method: req.method,
        url: req.originalUrl || req.url,
        status: res.statusCode,
        user: req.user
          ? { id: req.user.id, email: req.user.email }
          : "unauthenticated",
        responseTime: `${responseTime}ms`,
      };

      // Thêm request body nếu không phải GET
      if (req.method !== "GET" && req.body && Object.keys(req.body).length) {
        // Ẩn mật khẩu
        const sanitizedBody = { ...req.body };
        if (sanitizedBody.password) sanitizedBody.password = "[REDACTED]";
        if (sanitizedBody.currentPassword)
          sanitizedBody.currentPassword = "[REDACTED]";
        if (sanitizedBody.newPassword) sanitizedBody.newPassword = "[REDACTED]";

        logData.body = sanitizedBody;
      }

      // Log response ở development
      logger.debug("API Request", logData);
    }

    // Gọi method gốc
    return originalSend.call(this, body);
  };

  next();
};

// Middleware log errors
export const errorLogger = (err, req, res, next) => {
  logger.error(`${req.method} ${req.originalUrl || req.url} - Error:`, {
    error: err.message,
    stack: err.stack,
    user: req.user
      ? { id: req.user.id, email: req.user.email }
      : "unauthenticated",
  });

  next(err);
};

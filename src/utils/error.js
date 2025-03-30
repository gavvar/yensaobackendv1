// Lớp lỗi cơ sở
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Lỗi không tìm thấy tài nguyên
export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

// Lỗi không có quyền truy cập
export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(message, 403);
  }
}

// Lỗi trạng thái không hợp lệ
export class InvalidStatusError extends AppError {
  constructor(message = "Invalid status transition") {
    super(message, 400);
  }
}

// Lỗi xác thực
export class AuthenticationError extends AppError {
  constructor(message = "Authentication failed") {
    super(message, 401);
  }
}

// Lỗi khi input không hợp lệ
export class ValidationError extends AppError {
  constructor(message = "Invalid input data", errors = {}) {
    super(message, 400);
    this.errors = errors;
  }
}

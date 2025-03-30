// src/middlewares/error.middleware.js
export default (err, req, res, next) => {
  console.error(`Error: ${err.message}`, err.stack);

  // Lấy status code từ error, mặc định là 500
  const statusCode = err.statusCode || 500;

  // Chuẩn bị response
  const errorResponse = {
    success: false,
    error: {
      code: statusCode,
      message: err.message || "Lỗi máy chủ nội bộ",
    },
  };

  // Thêm chi tiết lỗi nếu là lỗi validation
  if (err.errors) {
    errorResponse.error.details = err.errors;
  }

  // Thêm stack trace trong môi trường development
  if (process.env.NODE_ENV === "development") {
    errorResponse.error.stack = err.stack;
  }

  // Xử lý một số loại lỗi đặc biệt
  if (err.name === "SequelizeValidationError") {
    errorResponse.error.code = 400;
    errorResponse.error.message = "Dữ liệu không hợp lệ";
    errorResponse.error.details = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));
  } else if (err.name === "SequelizeUniqueConstraintError") {
    errorResponse.error.code = 400;
    errorResponse.error.message = "Dữ liệu đã tồn tại";
    errorResponse.error.details = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));
  } else if (err.name === "SequelizeForeignKeyConstraintError") {
    errorResponse.error.code = 400;
    errorResponse.error.message = "Dữ liệu tham chiếu không tồn tại";
  }

  // Trả về response với status code phù hợp
  res.status(errorResponse.error.code).json(errorResponse);
};

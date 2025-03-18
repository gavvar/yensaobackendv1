// src/middlewares/error.middleware.js
export default (err, req, res, next) => {
  console.log(`Error: ${err.message}, StatusCode: ${err.statusCode || 500}`); // Log để debug

  // Lấy status code từ error, mặc định là 500
  const statusCode = err.statusCode || 500;

  // Giữ cùng format response nhưng sử dụng statusCode từ error object
  res.status(statusCode).json({
    error: {
      code: statusCode,
      message: err.message,
    },
  });
};

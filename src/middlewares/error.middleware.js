// src/middlewares/error.middleware.js
export default (err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: {
      code: 500,
      message: err.message || "Internal Server Error",
    },
  });
};

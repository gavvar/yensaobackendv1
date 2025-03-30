export default {
  // JWT configuration
  jwtSecret: process.env.JWT_SECRET || "your-secret-key",
  jwtExpiration: process.env.JWT_EXPIRATION || "7200", // tiêu chuẩn 2h
  refreshTokenSecret: process.env.REFRESH_SECRET || "your-refresh-secret",

  // Thêm cấu hình cookie
  cookie: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },

  // Password hashing
  saltRounds: 10,

  // Token blacklist options
  tokenBlacklist: {
    enabled: false,
    expiry: 60 * 60 * 24 * 7, // 7 days (in seconds)
  },

  // Device management
  maxDevicesPerUser: 50, // Maximum number of devices a user can be logged in simultaneously

  // Rate limiting (attempts per time window)
  rateLimit: {
    login: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxAttempts: 5, // 5 attempts per 15 minutes
    },
    resetPassword: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxAttempts: 3, // 3 attempts per hour
    },
  },
};

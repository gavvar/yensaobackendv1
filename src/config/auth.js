export default {
  // JWT configuration
  jwtSecret:
    process.env.JWT_SECRET || "your-jwt-secret-key-should-be-long-and-secure",
  jwtExpiration: process.env.JWT_EXPIRATION || "7d", // 7 days

  // Password hashing
  saltRounds: 10,

  // Token blacklist options
  tokenBlacklist: {
    enabled: true,
    expiry: 60 * 60 * 24 * 7, // 7 days (in seconds)
  },

  // Device management
  maxDevicesPerUser: 5, // Maximum number of devices a user can be logged in simultaneously

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

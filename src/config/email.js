export default {
  // SMTP settings
  smtp: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true", // true nếu dùng SSL (port 465)
    auth: {
      user: process.env.SMTP_USER || "your-email@gmail.com",
      pass: process.env.SMTP_PASSWORD || "your-app-password",
    },
  },

  // Email sender details
  sender: {
    name: process.env.EMAIL_FROM_NAME || "Yến Sào",
    address: process.env.EMAIL_FROM_ADDRESS || "noreply@yensao.com",
  },

  // Frontend URL (reset password, xác thực email...)
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  // Email templates (có thể mở rộng sau này)
  templates: {
    resetPassword: {
      subject: "Đặt lại mật khẩu tài khoản Yến Sào",
    },
    welcome: {
      subject: "Chào mừng bạn đến với Yến Sào",
    },
  },
};

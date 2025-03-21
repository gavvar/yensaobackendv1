import nodemailer from "nodemailer";
import config from "../config/email.js";

// Khởi tạo transporter duy nhất
const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: {
    user: config.smtp.auth.user,
    pass: config.smtp.auth.pass,
  },
});

/**
 * Hàm chung để gửi email
 */
export const sendEmail = async ({ to, subject, html }) => {
  try {
    const mailOptions = {
      from: `"${config.sender.name}" <${config.sender.address}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending email: ${error.message}`);
    return false;
  }
};

/**
 * Gửi email đặt lại mật khẩu
 */
export const sendResetPasswordEmail = async (to, token, fullName = "") => {
  // Thêm fullName vào template
  const greeting = fullName ? `Xin chào ${fullName},` : `Xin chào,`;

  const resetLink = `${config.frontendUrl}/reset-password?token=${token}`;

  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
        <h2 style="color: #28a745;">Yến Sào - Đặt Lại Mật Khẩu</h2>
      </div>

      <div style="padding: 20px; border: 1px solid #e9ecef; border-top: none;">
        <p>${greeting}</p>
        <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấp vào nút dưới đây để tiếp tục:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Đặt Lại Mật Khẩu</a>
        </div>

        <p>Liên kết sẽ hết hạn sau 1 giờ.</p>
        <p>Nếu không phải bạn yêu cầu, hãy bỏ qua email này.</p>
      </div>

      <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #6c757d;">
        <p>&copy; ${new Date().getFullYear()} Yến Sào. Tất cả các quyền được bảo lưu.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: config.templates.resetPassword.subject,
    html: emailContent,
  });
};

/**
 * Gửi email chào mừng
 */
export const sendWelcomeEmail = async (to) => {
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
        <h2 style="color: #28a745;">Chào mừng bạn đến với Yến Sào!</h2>
      </div>

      <div style="padding: 20px; border: 1px solid #e9ecef; border-top: none;">
        <p>Xin chào,</p>
        <p>Chúng tôi rất vui mừng chào đón bạn. Hãy tận hưởng trải nghiệm tuyệt vời với các sản phẩm của chúng tôi.</p>
      </div>

      <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #6c757d;">
        <p>&copy; ${new Date().getFullYear()} Yến Sào. Tất cả các quyền được bảo lưu.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: config.templates.welcome.subject,
    html: emailContent,
  });
};

/**
 * Gửi email thông báo đăng nhập mới
 */
export const sendLoginNotificationEmail = async (to, ipAddress) => {
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
        <h2 style="color: #dc3545;">Thông báo đăng nhập mới</h2>
      </div>

      <div style="padding: 20px; border: 1px solid #e9ecef; border-top: none;">
        <p>Xin chào,</p>
        <p>Chúng tôi phát hiện một lần đăng nhập mới vào tài khoản của bạn từ địa chỉ IP: <strong>${ipAddress}</strong>.</p>
        <p>Nếu không phải bạn, vui lòng đổi mật khẩu ngay lập tức.</p>
      </div>

      <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #6c757d;">
        <p>&copy; ${new Date().getFullYear()} Yến Sào. Tất cả các quyền được bảo lưu.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: "Cảnh báo đăng nhập mới",
    html: emailContent,
  });
};

export default {
  sendResetPasswordEmail,
  sendWelcomeEmail,
  sendLoginNotificationEmail,
};

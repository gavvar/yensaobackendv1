import emailService from "../services/email.service.js";

export const testEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await emailService.sendResetPasswordEmail(
      email,
      "test-token-123",
      "Test User"
    );
    res.json({
      success: result,
      message: result ? "Email sent successfully" : "Failed to send email",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const express = require("express");
const router = express.Router();
const transporter = require("../config/mailer");

router.post("/send-test-email", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    await transporter.sendMail({
      from: `"Artistry" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Test Email from Artistry 🎨",
      html: `
        <h2>Email Test Successful 🎉</h2>
        <p>Your Gmail SMTP integration is working correctly.</p>
      `,
    });

    res.json({ message: "Test email sent successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
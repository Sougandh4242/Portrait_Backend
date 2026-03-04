const express = require("express");
const router = express.Router();
const Contact = require("../models/Contact");

router.post("/", async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "All required fields missing" });
    }

    const contact = await Contact.create({
      name,
      email,
      phone,
      message,
    });

    res.json({ success: true });

    // 🔥 Send emails in background
    sendContactEmails(contact).catch(() => {
        console.error("Contact email failed.");
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function sendContactEmails(contact) {
  const fetch = global.fetch;

  // Email to Admin
  await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: {
        name: "Artistry Website",
        email: process.env.BREVO_FROM_EMAIL,
      },
      to: [{ email: process.env.ARTIST_EMAIL }],
      subject: "📩 New Contact Message",
      htmlContent: `
        <h3>New Message Received</h3>
        <p><strong>Name:</strong> ${contact.name}</p>
        <p><strong>Email:</strong> ${contact.email}</p>
        <p><strong>Phone:</strong> ${contact.phone}</p>
        <p><strong>Message:</strong></p>
        <p>${contact.message}</p>
      `,
    }),
  });

  // Auto Reply
  await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: {
        name: "Artistry",
        email: process.env.BREVO_FROM_EMAIL,
      },
      to: [{ email: contact.email }],
      subject: "We received your message ",
      htmlContent: `
        <p>Hi ${contact.name},</p>
        <p>Thank you for reaching out. We will respond shortly.</p>
        <p>Warm regards,<br/>Team Artistry</p>
      `,
    }),
  });
}

module.exports = router;
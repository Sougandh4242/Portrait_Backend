const transporter = require("../config/mailer");
const express = require("express");
const router = express.Router();
const razorpay = require("../config/razorpay");
const crypto = require("crypto");

const Slot = require("../models/Slot");
const Booking = require("../models/Booking");

const Brevo = require("brevo");
const brevoClient = Brevo.default;
const client = brevoClient.ApiClient.instance;

// Configure API key
client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;
const apiInstance = new brevoClient.TransactionalEmailsApi();

// ----------------------
// Create Razorpay Order
// ----------------------
router.post("/create-order", async (req, res) => {
  try {
    const { amount, date, time } = req.body;

    // Check slot availability
    const slot = await Slot.findOne({ date, time, isBooked: false });

    if (!slot) {
      return res.status(400).json({ message: "Slot not available" });
    }


    const options = {
      amount: amount * 100, // in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.json(order);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------
// Verify Payment & Create Booking
// ----------------------
router.post("/verify-payment", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      name,
      email,
      phone,
      date,
      time,
      amount,
      imageUrl
    } = req.body;

console.log("---- VERIFY REQUEST RECEIVED ----");
console.log("Date:", date);
console.log("Time:", time);
console.log("Name:", name);
console.log("Email:", email);
console.log("Phone:", phone);
    
    // Generate expected signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    // Double-check slot availability (security check)
    const slot = await Slot.findOne({ date, time, isBooked: false });
    console.log("Slot found:", slot);

    if (!slot) {
      return res.status(400).json({ message: "Slot already booked" });
    }
    if (!name || !email || !phone) {
        return res.status(400).json({ message: "Customer details missing" });
    }

    // Create booking only after payment verified
    const booking = await Booking.create({
      name,
      email,
      phone,
      date,
      time,
      imageUrl,
      amount,
      paymentStatus: "paid",
      orderStatus: "pending",
    });

    // Lock slot
    slot.isBooked = true;
    await slot.save();

    //brevo email notification
    try {
      await apiInstance.sendTransacEmail({
        sender: {
          email: process.env.BREVO_FROM_EMAIL,
          name: process.env.BREVO_FROM_NAME,
        },
        to: [
          {
            email: email,
            name: name,
          },
        ],
        subject: "Your Portrait Booking is Confirmed 🎨",
        htmlContent: `
          <div style="font-family: Arial; padding: 20px;">
            <h2>🎉 Booking Confirmed!</h2>
            <p>Hi ${name},</p>
            <p>Your portrait booking is successfully confirmed.</p>
            <h3>Details:</h3>
            <ul>
              <li><strong>Order ID:</strong> ${booking._id}</li>
              <li><strong>Date:</strong> ${date}</li>
              <li><strong>Time:</strong> ${time}</li>
              <li><strong>Amount:</strong> ₹${amount}</li>
            </ul>
            <p>Thank you for choosing Artistry 🎨</p>
          </div>
        `,
      });

      console.log("Brevo email sent!");
    } catch (mailError) {
      console.error("Brevo email failed:", mailError);
    }
/*  

  try {
      await transporter.sendMail({
      from: `"Artistry" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Portrait Booking is Confirmed 🎨",
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2>Booking Confirmed 🎉</h2>
          <p>Hi ${name},</p>
    
          <p>Your portrait booking has been successfully confirmed.</p>
    
          <h3>Booking Details:</h3>
          <ul>
            <li><strong>Order ID:</strong> ${booking._id}</li>
            <li><strong>Date:</strong> ${date}</li>
            <li><strong>Time:</strong> ${time}</li>
            <li><strong>Amount Paid:</strong> ₹${amount}</li>
          </ul>
    
          <p>You can use your Order ID to track your booking anytime.</p>
    
          <p>Thank you for choosing Artistry 🎨</p>
        </div>
      `,
    });
console.log("Email sent successfully");
} catch (mailError) {
  console.log("Email sending failed:", mailError);
}
*/
    

    res.json({
      message: "Payment verified & booking confirmed",
      booking,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

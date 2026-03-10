// const transporter = require("../config/mailer");
const express = require("express");
const router = express.Router();
const razorpay = require("../config/razorpay");
const crypto = require("crypto");

const Booking = require("../models/Booking");
const BlockedDate = require("../models/BlockedDate");
const SiteConfig = require("../models/SiteConfig");

const FRONTEND_URL = process.env.FRONTEND_URL;


// ----------------------
// Create Razorpay Order
// ----------------------
router.post("/create-order", async (req, res) => {
  try {

    const { amount, date } = req.body;

    // Check if date is blocked
    const blocked = await BlockedDate.findOne({ date });

    if (blocked) {
      return res.status(400).json({ message: "Date blocked by admin" });
    }

    // Count bookings for that date
    const bookingsCount = await Booking.countDocuments({ date });

    // Get max booking limit
    const config = await SiteConfig.findOne();
    const maxBookings = config?.maxBookingsPerDay || 5;

    if (bookingsCount >= maxBookings) {
      return res.status(400).json({ message: "Date fully booked" });
    }

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`
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
      amount,
      imageUrl,
      address
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    // Check if date blocked
    const blocked = await BlockedDate.findOne({ date });

    if (blocked) {
      return res.status(400).json({ message: "Date blocked by admin" });
    }

    // Check booking count again (important security check)
    const bookingsCount = await Booking.countDocuments({ date });

    const config = await SiteConfig.findOne();
    const maxBookings = config?.maxBookingsPerDay || 5;

    if (bookingsCount >= maxBookings) {
      return res.status(400).json({ message: "Date fully booked" });
    }

    if (!name || !email || !phone || !address) {
      return res.status(400).json({ message: "Customer details missing" });
    }

    // Create booking
    const booking = await Booking.create({
      name,
      email,
      phone,
      date,
      imageUrl,
      amount,
      paymentStatus: "paid",
      orderStatus: "pending",
      address
    });

    //brevo email notification continues here...



try {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
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
      to: [
        {
          email: email,
          name: name,
        },
      ],
      subject: "Your Portrait Booking is Confirmed ",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 40px 20px;">
          <div style="max-width: 620px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 6px 18px rgba(0,0,0,0.08);">
            
            <!-- Header -->
            <div style="background-color: #1a1a1a; padding: 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Artistry </h1>
              <p style="color: #cccccc; margin: 5px 0 0; font-size: 13px;">
                Professional Portrait Services
              </p>
            </div>

            <!-- Body -->
            <div style="padding: 30px;">
              <h2 style="color: #2e7d32; margin-top: 0;">🎉 Booking Confirmed</h2>

              <p style="font-size: 15px; color: #333;">
                Dear <strong>${name}</strong>,
              </p>

              <p style="font-size: 14px; color: #555; line-height: 1.6;">
                Thank you for choosing <strong>Artistry</strong>.  
                Your portrait booking has been successfully confirmed.  
                We are excited to create something beautiful for you.
              </p>

              <hr style="margin: 25px 0; border: none; border-top: 1px solid #eee;" />

              <h3 style="margin-bottom: 15px; color: #444;">Booking Details</h3>

              <table style="width: 100%; font-size: 14px; color: #555;">
                <tr>
                  <td style="padding: 8px 0;"><strong>Order ID:</strong></td>
                  <td>${booking._id}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Date:</strong></td>
                  <td>${date}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Time:</strong></td>
                  <td>${new Date().toLocaleString("en-IN")}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Amount Paid:</strong></td>
                  <td>₹${amount}</td>
                </tr>
              </table>

              <!-- Track Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${FRONTEND_URL}/track/${booking._id}"
                  style="background-color: #c9a227; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-size: 14px; font-weight: bold;">
                  Track Your Order
                </a>
              </div>

              <p style="font-size: 14px; color: #555; line-height: 1.6;">
                If you have any questions, feel free to contact our support team at 
                <strong>support@artistry.com</strong>.
              </p>

              <p style="font-size: 12px; color: #888; margin-top: 25px;">
                Please do not reply to this email. This is a system-generated message.
              </p>

              <p style="margin-top: 20px; font-size: 14px; color: #333;">
                Warm regards,<br/>
                <strong>Team Artistry </strong>
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #fafafa; padding: 15px; text-align: center; font-size: 12px; color: #999;">
              © ${new Date().getFullYear()} Artistry. All rights reserved.
            </div>

          </div>
        </div>
        `
    }),
  });

  // console.log("Brevo status:", response.status);

  // ---------------------
// Notify Artist
// ---------------------

try {
  await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: {
        name: "Artistry System",
        email: process.env.BREVO_FROM_EMAIL,
      },
      to: [
        {
          email: process.env.ARTIST_EMAIL,   // <-- we add this in .env
          name: "Artist",
        },
      ],
      subject: "🔔 New Portrait Booking Received",
      htmlContent: `
        <h2>New Booking Alert</h2>
        <p><strong>Order ID:</strong> ${booking._id}</p>
        <p><strong>Customer:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString("en-IN")}</p>
        <p><strong>Amount:</strong> ₹${amount}</p>
      `,
    }),
  });

  // console.log("✅ Artist notification sent");

} catch (err) {
  // console.log("❌ Artist notification failed:", err);
}

  if (!response.ok) {
    const errorText = await response.text();
    // console.log("Brevo error:", errorText);
  } else {
    // console.log("✅ Email successfully accepted by Brevo");
  }

} catch (mailError) {
  // console.log("Brevo email failed:", mailError);
}


    res.json({
      success: true,
      booking
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//     res.json({
//       message: "Payment verified & booking confirmed",
//       booking,
//     });

//   } catch (error) {
//     // console.log("Hitting Catch Block:", error);
//     res.status(500).json({ error: error.message });
//   }
// });

module.exports = router;

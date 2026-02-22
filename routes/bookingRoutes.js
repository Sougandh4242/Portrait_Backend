const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");

// Track Order
router.post("/track", async (req, res) => {
  try {
    const { email, orderId } = req.body;

    if (!email || !orderId) {
      return res.status(400).json({ message: "Email and Order ID are required" });
    }

    const booking = await Booking.findOne({
      _id: orderId,
      email: email
    });

    if (!booking) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      message: "Order found",
      booking
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
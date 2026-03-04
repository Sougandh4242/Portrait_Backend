const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Booking = require("../models/Booking");

// Track Order by Order ID
router.get("/track/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid Order ID format" });
    }

    const booking = await Booking.findById(orderId);

    if (!booking) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      orderId: booking._id,
      name: booking.name,
      date: booking.date,
      time: booking.time,
      orderStatus: booking.orderStatus,
      paymentStatus: booking.paymentStatus,
      amount: booking.amount
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Booking = require("../models/Booking");
const SiteConfig = require("../models/SiteConfig");
const BlockedDate = require("../models/BlockedDate");

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
      orderStatus: booking.orderStatus,
      paymentStatus: booking.paymentStatus,
      amount: booking.amount
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/unavailable-dates", async (req, res) => {
  try {

    const blockedDates = await BlockedDate.find().select("date");

    const config = await SiteConfig.findOne();
    const maxBookings = config?.maxBookingsPerDay || 5;

    const bookings = await Booking.aggregate([
      {
        $group: {
          _id: "$date",
          count: { $sum: 1 }
        }
      }
    ]);

    const fullDates = bookings
      .filter(b => b.count >= maxBookings)
      .map(b => b._id);

    res.json({
      blocked: blockedDates.map(d => d.date),
      full: fullDates
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch unavailable dates" });
  }
});

module.exports = router;
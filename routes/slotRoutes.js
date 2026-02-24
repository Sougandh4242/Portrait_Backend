const express = require("express");
const router = express.Router();
const Slot = require("../models/Slot");

// Predefined time slots
const predefinedSlots = ["9:00 AM","10:00 AM","11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];

// Create slots for a date
router.post("/create-slots", async (req, res) => {
  const { date } = req.body;

  try {
    const existingSlots = await Slot.find({ date });

    if (existingSlots.length > 0) {
      return res.status(400).json({ message: "Slots already created for this date" });
    }

    const slots = predefinedSlots.map(time => ({
      date,
      time,
    }));

    await Slot.insertMany(slots);

    res.json({ message: "Slots created successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available slots for a date
router.get("/:date", async (req, res) => {
  try {
    const slots = await Slot.find({ date: req.params.date, isBooked: false });
    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

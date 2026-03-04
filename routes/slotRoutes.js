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
    const slots = await Slot.find({
      date: req.params.date,
      isBooked: false,
      isBlocked: false,
    });

    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/admin/:date", async (req, res) => {
  const slots = await Slot.find({ date: req.params.date });
  res.json(slots);
});

router.put("/admin/:id/toggle-block", async (req, res) => {
  const slot = await Slot.findById(req.params.id);

  if (!slot) {
    return res.status(404).json({ message: "Slot not found" });
  }

  if (slot.isBooked) {
    return res.status(400).json({ message: "Cannot block booked slot" });
  }

  slot.isBlocked = !slot.isBlocked;
  await slot.save();

  res.json({ message: "Slot updated", slot });
});

router.put("/admin/block-day/:date", async (req, res) => {
  await Slot.updateMany(
    { date: req.params.date, isBooked: false },
    { isBlocked: true }
  );

  res.json({ message: "Day blocked" });
});

router.put("/admin/unblock-day/:date", async (req, res) => {
  await Slot.updateMany(
    { date: req.params.date, isBooked: false },
    { isBlocked: false }
  );

  res.json({ message: "Day unblocked" });
});

router.post("/admin/create-date", async (req, res) => {
  const { date } = req.body;

  const existing = await Slot.find({ date });

  if (existing.length > 0) {
    return res.status(400).json({ message: "Slots already exist" });
  }

  const slots = predefinedSlots.map(time => ({
    date,
    time,
  }));

  await Slot.insertMany(slots);

  res.json({ message: "Slots created for date" });
});

//slots for  whole month
router.post("/admin/create-month", async (req, res) => {
  const { year, month } = req.body; 
  // month = 1-12

  const dates = [];

  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    dates.push(date);
  }

  for (const date of dates) {
    const existing = await Slot.find({ date });

    if (existing.length === 0) {
      const slots = predefinedSlots.map(time => ({
        date,
        time,
      }));

      await Slot.insertMany(slots);
    }
  }

  res.json({ message: "Month slots created successfully" });
});

module.exports = router;

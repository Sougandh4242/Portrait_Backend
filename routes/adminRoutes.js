const express = require("express");
const jwt = require("jsonwebtoken");
const Booking = require("../models/Booking");
const adminAuth = require("../middleware/adminAuth");
//gallery model
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const cloudinary = require("../config/cloudinary");
const Gallery = require("../models/Gallery");
//dashboard stats
// const Slot = require("../models/Slot");
//blocked slots
const BlockedDate = require("../models/BlockedDate");
const SiteConfig = require("../models/SiteConfig");

const router = express.Router();

router.get("/me", adminAuth, (req, res) => {
  res.json({ authenticated: true });
});

// ---------------- LOGIN ----------------
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (
    email !== process.env.ADMIN_EMAIL ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { email },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: true, // change to true in production
    sameSite: "none", // for cross-site cookies
  });

  res.json({ message: "Login successful" });
});

// ---------------- LOGOUT ----------------
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

// ---------------- GET BOOKINGS (PROTECTED) ----------------
router.get("/bookings", adminAuth, async (req, res) => {
  const bookings = await Booking.find().sort({ createdAt: -1 });
  res.json(bookings);
});

//-------------------- GALLERY UPLOAD (PROTECTED) ----------------
router.post("/gallery", adminAuth, upload.single("image"), async (req, res) => {
  try {
    const { title, category } = req.body;

    const result = await cloudinary.uploader.upload(req.file.path);

    const newImage = await Gallery.create({
      title,
      category,
      imageUrl: result.secure_url,
      publicId: result.public_id,
    });

    // 🔥 Delete temp file
    const fs = require("fs");
    fs.unlinkSync(req.file.path);

    res.json(newImage);

  } catch (error) {
    res.status(500).json({ message: "Upload failed" });
  }
});

//---------------------- DELETE GALLERY IMAGE (PROTECTED) ----------------
router.delete("/gallery/:id", adminAuth, async (req, res) => {
  try {
    const image = await Gallery.findById(req.params.id);

    if (!image) return res.status(404).json({ message: "Not found" });

    await cloudinary.uploader.destroy(image.publicId);

    await Gallery.findByIdAndDelete(req.params.id);

    res.json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
});

//---------------------- DASHBOARD STATS (PROTECTED) ----------------
router.get("/stats", adminAuth, async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();

    const completedBookings = await Booking.countDocuments({
      orderStatus: "completed",
    });

    const pendingBookings = await Booking.countDocuments({
      orderStatus: "pending",
    });

    const inProgressBookings = await Booking.countDocuments({
      orderStatus: "in-progress",
    });

    const earningsData = await Booking.aggregate([
      { $match: { paymentStatus: "paid" } },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: "$amount" },
        },
      },
    ]);

    const totalEarnings = earningsData[0]?.totalEarnings || 0;

    res.json({
      totalBookings,
      completedBookings,
      pendingBookings,
      inProgressBookings,
      totalEarnings,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching stats" });
  }
});

//revenue by month
router.get("/revenue", adminAuth, async (req, res) => {
  try {
    const revenue = await Booking.aggregate([
      { $match: { paymentStatus: "paid" } },
      {
        $group: {
          _id: { $month: "$createdAt" },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    res.json(revenue);
  } catch (error) {
    res.status(500).json({ message: "Revenue error" });
  }
});

// booking status update
router.put("/bookings/:id/status", adminAuth, async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = ["pending", "in-progress", "completed", "delivered"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { orderStatus: status },
      { new: true }
    );

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: "Status update failed" });
  }
});


// Block a date
router.post("/block-date", adminAuth, async (req, res) => {
  try {
    const { date } = req.body;

    const blocked = await BlockedDate.create({ date });

    res.json(blocked);
  } catch (error) {
    res.status(500).json({ message: "Date blocking failed" });
  }
});

// Unblock a date
router.delete("/block-date/:date", adminAuth, async (req, res) => {
  try {
    await BlockedDate.deleteOne({ date: req.params.date });
    res.json({ message: "Date unblocked" });
  } catch (error) {
    res.status(500).json({ message: "Unblock failed" });
  }
});

//updating booking limit
router.put("/booking-limit", adminAuth, async (req, res) => {
  try {

    const maxBookingsPerDay = Number(req.body.maxBookingsPerDay);

    const config = await SiteConfig.findOneAndUpdate(
      {},
      { maxBookingsPerDay },
      { new: true, upsert: true }
    );

    res.json(config);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Update failed", error: error.message });
  }
});

//download bookings as CSV
const { Parser } = require("json2csv");

router.get("/export-bookings", adminAuth, async (req, res) => {
  try {
    const bookings = await Booking.find();

    const parser = new Parser();
    const csv = parser.parse(bookings);

    res.header("Content-Type", "text/csv");
    res.attachment("bookings.csv");
    res.send(csv);

  } catch (error) {
    res.status(500).json({ message: "Export failed" });
  }
});

router.put("/gallery/:id/featured", async (req, res) => {
  const { featured } = req.body;

  const updated = await Gallery.findByIdAndUpdate(
    req.params.id,
    { featured },
    { new: true }
  );

  res.json(updated);
});

router.get("/admin-date-stats", adminAuth, async (req, res) => {
  try {

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

    const blocked = await BlockedDate.find();

    const stats = {};

    bookings.forEach(b => {
      stats[b._id] = { count: b.count, max: maxBookings };
    });

    blocked.forEach(b => {
      stats[b.date] = { blocked: true };
    });

    res.json(stats);

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

module.exports = router;
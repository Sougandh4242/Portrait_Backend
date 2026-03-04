require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/db");
const slotRoutes = require("./routes/slotRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
//admin routes
const adminRoutes = require("./routes/adminRoutes");
//gallery routes
const galleryRoutes = require("./routes/galleryRoutes");
//contact routes
const contactRoutes = require("./routes/contactRoutes");
//site content routes
const siteContentRoutes = require("./routes/siteContentRoutes");

connectDB();

const app = express();

// CORS (IMPORTANT for JWT cookies)
app.use(cors({
  origin: process.env.FRONTEND_URL, 
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Public routes
app.use("/api/slots", slotRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/bookings", bookingRoutes);
// Gallery routes
app.use("/api/gallery", galleryRoutes);

// Admin routes
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});
app.use("/api/contact", contactRoutes);
app.use("/api/site-content", siteContentRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  // console.log(`Server running on port ${PORT}`);
});
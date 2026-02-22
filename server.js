require("dotenv").config(); 

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const slotRoutes = require("./routes/slotRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
//test route for email
const testRoutes = require("./routes/testRoutes");


// Load environment variables
console.log(process.env.CLOUDINARY_API_KEY);

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: "*", // temporary - allow all
  methods: ["GET", "POST", "PUT", "DELETE"],
}));
app.use(express.json());
app.use("/api/slots", slotRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/bookings", bookingRoutes);
//test route for email
app.use("/api/test", testRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending",
  },
  orderStatus: {
    type: String,
    enum: ["pending", "in-progress", "completed", "delivered"],
    default: "pending",
  },
  amount: {
    type: Number,
    required: true,
  },
  address: {
  line1: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  country: { type: String, required: true },
  latitude: Number,
  longitude: Number,
},
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
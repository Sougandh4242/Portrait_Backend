const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema({
  title: String,
  category: {
    type: String,
    enum: ["Individual", "Couples", "Family", "Pets", "Celebrity"],
  },
  imageUrl: String,
  publicId: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  featured: {
  type: Boolean,
  default: false
}
});

module.exports = mongoose.model("Gallery", gallerySchema);
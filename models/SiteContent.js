const mongoose = require("mongoose");

const siteContentSchema = new mongoose.Schema({
  heroImage: String,
  heroPublicId: String,

  aboutImage: String,
  aboutPublicId: String,

  aboutText: String,
}, { timestamps: true });

module.exports = mongoose.model("SiteContent", siteContentSchema);
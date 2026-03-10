const mongoose = require("mongoose");

const siteConfigSchema = new mongoose.Schema({
  maxBookingsPerDay: {
    type: Number,
    default: 5
  }
});

module.exports = mongoose.model("SiteConfig", siteConfigSchema);
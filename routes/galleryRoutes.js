const express = require("express");
const Gallery = require("../models/Gallery");

const router = express.Router();

router.get("/", async (req, res) => {
  const images = await Gallery.find().sort({ createdAt: -1 });
  res.json(images);
});

module.exports = router;
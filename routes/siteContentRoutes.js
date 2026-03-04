const express = require("express");
const SiteContent = require("../models/SiteContent");

const router = express.Router();

// GET content
router.get("/", async (req, res) => {
  const content = await SiteContent.findOne();
  res.json(content);
});

// UPDATE content (admin only)
router.put("/", async (req, res) => {
  const { heroImage, aboutImage, aboutText } = req.body;

  let content = await SiteContent.findOne();

  if (!content) {
    content = await SiteContent.create({
      heroImage,
      aboutImage,
      aboutText
    });
  } else {
    content.heroImage = heroImage || content.heroImage;
    content.aboutImage = aboutImage || content.aboutImage;
    content.aboutText = aboutText || content.aboutText;
    await content.save();
  }

  res.json({ message: "Content updated", content });
});

module.exports = router;
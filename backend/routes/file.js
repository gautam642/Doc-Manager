const express = require("express");
const jwt = require("jsonwebtoken");
const { User, File } = require("../models");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to authenticate user
// Middleware for authenticating users
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log(req.headers)
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    
      return res.status(401).send("Unauthorized");
  }

  const token = authHeader.split(" ")[1];
  try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
      next();
  } catch (err) {
      return res.status(401).send("Unauthorized");
  }
};


// Upload file
router.post("/upload", authenticate, async (req, res) => {
  const { name, link } = await req.body;
  console.log(link)
  const file = new File({ name, link, uploaded_by: req.userId });
  await file.save();

  console.log(name,link)

  await User.findByIdAndUpdate(req.userId, { $push: { file_ids: file._id } });
  res.status(201).send("File uploaded");
});

// Get user files
router.get("/files", authenticate, async (req, res) => {
  const files = await File.find({ uploaded_by: req.userId });
  res.json(files);
});

// Fetch user profile with uploaded files
router.get("/profile", authenticate, async (req, res) => {
  try {
      const user = await User.findById(req.userId).populate("file_ids");
      if (!user) {
          return res.status(404).send("User not found");
      }

      res.status(200).json({
          name: user.name,
          email: user.email,
          files: user.file_ids,
      });
  } catch (err) {
      console.error("Error fetching user profile:", err);
      res.status(500).send("Internal Server Error");
  }
});

module.exports = router;

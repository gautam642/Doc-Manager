require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/auth");
const fileRoutes = require("./routes/file");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB  mongodb://localhost:27017/
mongoose
  .connect('mongodb://127.0.0.1:27017/docmanager')
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/auth", authRoutes);
app.use("/file", fileRoutes);
app.use("/user", fileRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

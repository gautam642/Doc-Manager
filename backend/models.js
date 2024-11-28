const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  file_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "File" }],
});

const FileSchema = new mongoose.Schema({
  name: String,
  link: String,
  uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const User = mongoose.model("User", UserSchema);
const File = mongoose.model("File", FileSchema);

module.exports = { User, File };

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FilesSchema = new Schema(
  {
    filename: { type: String, required: true, unique: true },
    s3Key: { type: String, required: true },
  },
  { timestamps: true, strict: false, minimize: false }
);
const Files = mongoose.model("filesmetadata", FilesSchema);

module.exports = Files;

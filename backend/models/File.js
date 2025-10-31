const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  filename: {
    type: String,
    required: true,
    unique: true,
  },
  path: {
    type: String,
    required: true,
  },
  mimetype: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  extension: {
    type: String,
    required: true,
  },
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Folder",
    default: null,
  },
  uploadProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  isUploaded: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
fileSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Update the updatedAt field before findOneAndUpdate operations
fileSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Virtual field for file URL
fileSchema.virtual("fileUrl").get(function () {
  return `/uploads/${this.filename}`;
});

// Index for better performance
fileSchema.index({ folderId: 1 });
fileSchema.index({ name: 1, folderId: 1 });
fileSchema.index({ mimetype: 1 });

module.exports = mongoose.model("File", fileSchema);


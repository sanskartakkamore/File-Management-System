const mongoose = require("mongoose");

const folderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: "",
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Folder",
    default: null,
  },
  path: {
    type: String,
    required: true,
  },
  level: {
    type: Number,
    default: 0,
  },
  children: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
    },
  ],
  files: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
    },
  ],
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
folderSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Update the updatedAt field before findOneAndUpdate operations
folderSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Virtual field for full path
folderSchema.virtual("fullPath").get(function () {
  return this.path + "/" + this.name;
});

// Index for better performance
folderSchema.index({ parentId: 1 });
folderSchema.index({ name: 1, parentId: 1 }, { unique: true });

module.exports = mongoose.model("Folder", folderSchema);


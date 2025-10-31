const express = require("express");
const multer = require("multer");
const Busboy = require("busboy");
const path = require("path");
const fs = require("fs-extra");
const { v4: uuidv4 } = require("uuid");
const router = express.Router();
const File = require("../models/File");
const Folder = require("../models/Folder");

// Ensure uploads directory exists
// Use env override, serverless /tmp on Vercel, or repo uploads folder locally
const uploadDir =
  process.env.UPLOAD_DIR ||
  (process.env.VERCEL ? "/tmp/uploads" : path.join(__dirname, "../../uploads"));
fs.ensureDirSync(uploadDir);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  // Allow all file types for now, but you can add restrictions here
  const allowedMimes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/bmp",
    "image/webp",
    "application/pdf",
    "text/plain",
    "text/csv",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("File type not allowed"), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: fileFilter,
});

// Custom middleware to handle upload progress
const uploadProgress = (req, res, next) => {
  const broadcastProgress = req.app.get("broadcastProgress");

  if (req.file) {
    // Simulate progress updates (in real implementation, you'd track actual upload progress)
    const fileId = req.body.tempFileId || uuidv4();

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;

      if (broadcastProgress) {
        broadcastProgress({
          type: "upload_progress",
          fileId,
          filename: req.file.originalname,
          progress: Math.min(progress, 100),
          size: req.file.size,
        });
      }

      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 200);

    req.uploadInfo = { fileId, interval };
  }

  next();
};

// Get all files with pagination and filtering
router.get("/", async (req, res) => {
  try {
    const {
      folderId,
      page = 1,
      limit = 10,
      search,
      type,
      description,
      dateFrom,
      dateTo,
    } = req.query;

    let query = {};

    // Filter by folder
    if (folderId && folderId !== "null" && folderId !== "undefined") {
      query.folderId = folderId;
    } else if (folderId === "null" || folderId === null) {
      query.folderId = null; // Root level files only
    }
    // If folderId is undefined or not provided, don't filter by folder (get all files)

    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { originalName: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by file type
    if (type) {
      switch (type.toLowerCase()) {
        case "images":
        case "image":
          query.mimetype = { $regex: "^image/", $options: "i" };
          break;
        case "documents":
        case "document":
          query.mimetype = {
            $regex: "^(application|text)/",
            $options: "i",
          };
          break;
        case "pdfs":
        case "pdf":
          query.mimetype = "application/pdf";
          break;
      }
    }

    // Filter by description
    if (description) {
      query.description = { $regex: description, $options: "i" };
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Add 24 hours to include the entire day
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    const files = await File.find(query)
      .select(
        "name originalName filename size mimetype extension createdAt updatedAt folderId"
      )
      .populate("folderId", "name path")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await File.countDocuments(query);

    res.json({
      success: true,
      data: files,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching files",
      error: error.message,
    });
  }
});

// Get single file
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const file = await File.findById(id)
      .populate("folderId", "name path")
      .lean();

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    res.json({
      success: true,
      data: file,
    });
  } catch (error) {
    console.error("Error fetching file:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching file",
      error: error.message,
    });
  }
});

// Download/serve file
router.get("/:id/download", async (req, res) => {
  try {
    const { id } = req.params;

    const file = await File.findById(id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    const filePath = path.join(uploadDir, file.filename);

    // Check if file exists on disk
    if (!(await fs.pathExists(filePath))) {
      return res.status(404).json({
        success: false,
        message: "File not found on disk",
      });
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.originalName}"`
    );
    res.setHeader("Content-Type", file.mimetype);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).json({
      success: false,
      message: "Error downloading file",
      error: error.message,
    });
  }
});

// RESTful content route (preferred over :id/download)
router.get("/:id/content", async (req, res) => {
  try {
    const { id } = req.params;

    const file = await File.findById(id).lean();
    if (!file) {
      return res
        .status(404)
        .json({ success: false, message: "File not found" });
    }

    const filePath = path.join(uploadDir, file.filename);
    if (!(await fs.pathExists(filePath))) {
      return res
        .status(404)
        .json({ success: false, message: "File not found on disk" });
    }

    res.setHeader("Content-Type", file.mimetype);
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Error streaming file content:", error);
    res.status(500).json({ success: false, message: "Error streaming file" });
  }
});

// Upload file
router.post(
  "/upload",
  upload.single("file"),
  uploadProgress,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const { name, description = "", folderId = null } = req.body;
      const broadcastProgress = req.app.get("broadcastProgress");

      // Validate folder if provided
      if (folderId && folderId !== "null") {
        const folder = await Folder.findById(folderId);
        if (!folder) {
          // Clean up uploaded file
          await fs.remove(req.file.path);
          return res.status(404).json({
            success: false,
            message: "Folder not found",
          });
        }
      }

      // Check if file with same name exists in the same folder
      const existingFile = await File.findOne({
        name: name || req.file.originalname,
        folderId: folderId || null,
      });

      if (existingFile) {
        // Clean up uploaded file
        await fs.remove(req.file.path);
        return res.status(400).json({
          success: false,
          message: "File with this name already exists in this location",
        });
      }

      const fileExtension = path.extname(req.file.originalname).toLowerCase();

      const newFile = new File({
        name: name || req.file.originalname,
        originalName: req.file.originalname,
        description: description,
        filename: req.file.filename,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size,
        extension: fileExtension,
        folderId: folderId || null,
        uploadProgress: 100,
        isUploaded: true,
      });

      await newFile.save();

      // Update folder's files array
      if (folderId && folderId !== "null") {
        await Folder.findByIdAndUpdate(folderId, {
          $push: { files: newFile._id },
        });
      }

      // Broadcast upload completion
      if (broadcastProgress && req.uploadInfo) {
        broadcastProgress({
          type: "upload_complete",
          fileId: req.uploadInfo.fileId,
          file: newFile,
          message: "Upload completed successfully",
        });

        clearInterval(req.uploadInfo.interval);
      }

      const populatedFile = await File.findById(newFile._id).populate(
        "folderId",
        "name path"
      );

      res.status(201).json({
        success: true,
        message: "File uploaded successfully",
        data: populatedFile,
      });
    } catch (error) {
      console.error("Error uploading file:", error);

      // Clean up uploaded file on error
      if (req.file && req.file.path) {
        await fs.remove(req.file.path).catch(console.error);
      }

      // Broadcast upload error
      const broadcastProgress = req.app.get("broadcastProgress");
      if (broadcastProgress && req.uploadInfo) {
        broadcastProgress({
          type: "upload_error",
          fileId: req.uploadInfo.fileId,
          message: error.message || "Upload failed",
        });

        clearInterval(req.uploadInfo.interval);
      }

      res.status(500).json({
        success: false,
        message: "Error uploading file",
        error: error.message,
      });
    }
  }
);

// Streaming upload with real-time SSE progress
router.post("/upload-stream", async (req, res) => {
  try {
    const uploadId =
      req.header("x-upload-id") || req.body?.tempFileId || uuidv4();
    const expectedSizeHeader = req.header("x-file-size");
    const expectedSize = expectedSizeHeader
      ? parseInt(expectedSizeHeader, 10)
      : undefined;
    const broadcastProgress = req.app.get("broadcastProgress");

    const bb = Busboy({
      headers: req.headers,
      limits: { fileSize: 50 * 1024 * 1024 },
    });

    let fields = {};
    let savedFileDoc = null;
    let fileHandled = false;

    bb.on("field", (name, val) => {
      fields[name] = val;
    });

    bb.on("file", (name, file, info) => {
      const { filename: originalName, mimeType } = info;
      const extension = path.extname(originalName).toLowerCase();
      const uniqueName = `${uuidv4()}${extension}`;
      const diskPath = path.join(uploadDir, uniqueName);

      let received = 0;

      file.on("data", (data) => {
        received += data.length;
        if (broadcastProgress) {
          const progress = expectedSize
            ? Math.min(Math.round((received / expectedSize) * 100), 100)
            : undefined;
          broadcastProgress({
            type: "upload_progress",
            fileId: uploadId,
            filename: originalName,
            progress: progress ?? 0,
            size: expectedSize ?? received,
          });
        }
      });

      const writeStream = fs.createWriteStream(diskPath);
      file.pipe(writeStream);

      writeStream.on("finish", async () => {
        try {
          const folderId =
            fields.folderId && fields.folderId !== "null"
              ? fields.folderId
              : null;

          if (folderId) {
            const folder = await Folder.findById(folderId).lean();
            if (!folder) {
              await fs.remove(diskPath);
              return res
                .status(404)
                .json({ success: false, message: "Folder not found" });
            }
          }

          const existingFile = await File.findOne({
            name: (fields.name || originalName).trim(),
            folderId: folderId || null,
          }).lean();
          if (existingFile) {
            await fs.remove(diskPath);
            return res.status(400).json({
              success: false,
              message: "File with this name already exists in this location",
            });
          }

          const stats = await fs.stat(diskPath);
          const newFile = new File({
            name: (fields.name || originalName).trim(),
            originalName,
            description: (fields.description || "").trim(),
            filename: uniqueName,
            path: diskPath,
            mimetype: mimeType,
            size: stats.size,
            extension,
            folderId: folderId || null,
            uploadProgress: 100,
            isUploaded: true,
          });

          await newFile.save();

          if (folderId) {
            await Folder.findByIdAndUpdate(folderId, {
              $push: { files: newFile._id },
            });
          }

          savedFileDoc = await File.findById(newFile._id).populate(
            "folderId",
            "name path"
          );

          if (broadcastProgress) {
            broadcastProgress({
              type: "upload_complete",
              fileId: uploadId,
              file: savedFileDoc,
            });
          }

          if (!fileHandled) {
            fileHandled = true;
            return res.status(201).json({
              success: true,
              message: "File uploaded successfully",
              data: savedFileDoc,
            });
          }
        } catch (err) {
          console.error("Error finalizing stream upload:", err);
          if (!fileHandled) {
            fileHandled = true;
            return res.status(500).json({
              success: false,
              message: "Error uploading file",
              error: err.message,
            });
          }
        }
      });

      writeStream.on("error", async (err) => {
        console.error("Stream write error:", err);
        if (!fileHandled) {
          fileHandled = true;
          return res.status(500).json({
            success: false,
            message: "Error writing file",
            error: err.message,
          });
        }
      });
    });

    bb.on("error", (err) => {
      console.error("Busboy error:", err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Upload failed",
          error: err.message,
        });
      }
    });

    req.pipe(bb);
  } catch (error) {
    console.error("Error in upload-stream:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading file",
      error: error.message,
    });
  }
});

// Update file
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const file = await File.findById(id);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    // Check if new name conflicts with existing file
    if (name && name !== file.name) {
      const existingFile = await File.findOne({
        name: name.trim(),
        folderId: file.folderId,
        _id: { $ne: id },
      });

      if (existingFile) {
        return res.status(400).json({
          success: false,
          message: "File with this name already exists in this location",
        });
      }
    }

    const updateData = {
      updatedAt: Date.now(), // Explicitly update the timestamp
    };
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();

    const updatedFile = await File.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("folderId", "name path");

    res.json({
      success: true,
      message: "File updated successfully",
      data: updatedFile,
    });
  } catch (error) {
    console.error("Error updating file:", error);
    res.status(500).json({
      success: false,
      message: "Error updating file",
      error: error.message,
    });
  }
});

// Delete file
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const file = await File.findById(id);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    // Remove file from disk
    const filePath = path.join(uploadDir, file.filename);
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
    }

    // Remove from folder's files array
    if (file.folderId) {
      await Folder.findByIdAndUpdate(file.folderId, { $pull: { files: id } });
    }

    await File.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting file",
      error: error.message,
    });
  }
});

// Move file to different folder (deprecated, prefer PATCH /files/:id)
router.post("/:id/move", async (req, res) => {
  try {
    const { id } = req.params;
    const { targetFolderId } = req.body;

    const file = await File.findById(id);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    // Validate target folder
    if (targetFolderId && targetFolderId !== "null") {
      const targetFolder = await Folder.findById(targetFolderId);
      if (!targetFolder) {
        return res.status(404).json({
          success: false,
          message: "Target folder not found",
        });
      }
    }

    // Remove from current folder
    if (file.folderId) {
      await Folder.findByIdAndUpdate(file.folderId, { $pull: { files: id } });
    }

    // Add to new folder
    if (targetFolderId && targetFolderId !== "null") {
      await Folder.findByIdAndUpdate(targetFolderId, { $push: { files: id } });
    }

    // Update file
    file.folderId = targetFolderId || null;
    await file.save();

    const updatedFile = await File.findById(id).populate(
      "folderId",
      "name path"
    );

    res.json({
      success: true,
      message: "File moved successfully",
      data: updatedFile,
    });
  } catch (error) {
    console.error("Error moving file:", error);
    res.status(500).json({
      success: false,
      message: "Error moving file",
      error: error.message,
    });
  }
});

// RESTful update with optional move via folderId
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, folderId } = req.body;

    const file = await File.findById(id);
    if (!file) {
      return res
        .status(404)
        .json({ success: false, message: "File not found" });
    }

    if (name && name !== file.name) {
      const existingFile = await File.findOne({
        name: name.trim(),
        folderId: folderId ?? file.folderId,
        _id: { $ne: id },
      });
      if (existingFile) {
        return res.status(400).json({
          success: false,
          message: "File with this name already exists in this location",
        });
      }
    }

    // Handle move if folderId provided
    if (typeof folderId !== "undefined") {
      if (folderId && folderId !== "null") {
        const targetFolder = await Folder.findById(folderId);
        if (!targetFolder) {
          return res
            .status(404)
            .json({ success: false, message: "Target folder not found" });
        }
      }
      if (file.folderId) {
        await Folder.findByIdAndUpdate(file.folderId, { $pull: { files: id } });
      }
      if (folderId && folderId !== "null") {
        await Folder.findByIdAndUpdate(folderId, { $push: { files: id } });
      }
      file.folderId = folderId || null;
    }

    if (name) file.name = name.trim();
    if (typeof description !== "undefined")
      file.description = description.trim();
    file.updatedAt = Date.now();
    await file.save();

    const updatedFile = await File.findById(id).populate(
      "folderId",
      "name path"
    );
    res.json({
      success: true,
      message: "File updated successfully",
      data: updatedFile,
    });
  } catch (error) {
    console.error("Error patching file:", error);
    res.status(500).json({
      success: false,
      message: "Error updating file",
      error: error.message,
    });
  }
});

module.exports = router;


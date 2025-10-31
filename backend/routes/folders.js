const express = require("express");
const router = express.Router();
const Folder = require("../models/Folder");
const File = require("../models/File");

// Get all folders with hierarchy
router.get("/", async (req, res) => {
  try {
    const {
      parentId,
      page = 1,
      limit = 10,
      search,
      description,
      dateFrom,
      dateTo,
    } = req.query;

    let query = {};

    // Filter by parent folder
    if (parentId && parentId !== "null") {
      query.parentId = parentId;
    } else if (!search) {
      // Only filter to root level folders if not searching
      // When searching, look through all folders regardless of parent
      query.parentId = null; // Root level folders
    }

    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by description (additional filter separate from search)
    if (description && description !== search) {
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

    // cleaned: removed unused options object

    // Get folders with pagination
    const folders = await Folder.find(query)
      .populate("children", "name description createdAt updatedAt")
      .populate(
        "files",
        "name originalName filename size mimetype createdAt updatedAt extension"
      )
      .sort({ name: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Folder.countDocuments(query);

    res.json({
      success: true,
      data: folders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching folders:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching folders",
      error: error.message,
    });
  }
});

// Get folder hierarchy for tree view
router.get("/tree", async (req, res) => {
  try {
    const buildTree = async (parentId = null, level = 0) => {
      const folders = await Folder.find({ parentId })
        .select("name description createdAt updatedAt")
        .sort({ name: 1 });

      const tree = [];
      for (const folder of folders) {
        // Get files in this folder
        const files = await require("../models/File")
          .find({ folderId: folder._id })
          .select(
            "name originalName filename size mimetype extension createdAt updatedAt"
          )
          .sort({ name: 1 });

        const children = await buildTree(folder._id, level + 1);

        const treeNode = {
          ...folder.toObject(),
          children,
          files: files.map((file) => ({
            ...file.toObject(),
            type: "file",
          })),
          hasChildren: children.length > 0,
          hasFiles: files.length > 0,
          level,
        };

        tree.push(treeNode);
      }
      return tree;
    };

    const tree = await buildTree();

    // Also get root level files (files not in any folder)
    const rootFiles = await require("../models/File")
      .find({ folderId: null })
      .select(
        "name originalName filename size mimetype extension createdAt updatedAt"
      )
      .sort({ name: 1 });

    res.json({
      success: true,
      data: {
        folders: tree,
        rootFiles: rootFiles.map((file) => ({
          ...file.toObject(),
          type: "file",
        })),
      },
    });
  } catch (error) {
    console.error("Error building folder tree:", error);
    res.status(500).json({
      success: false,
      message: "Error building folder tree",
      error: error.message,
    });
  }
});

// Get single folder with contents
router.get("/:id", async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const { id } = req.params;

    const folder = await Folder.findById(id)
      .populate("children", "name description createdAt updatedAt")
      .populate(
        "files",
        "name originalName filename size mimetype createdAt updatedAt extension"
      );

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: "Folder not found",
      });
    }

    // Get folder contents with pagination
    let childrenQuery = { parentId: id };
    let filesQuery = { folderId: id };

    if (search) {
      childrenQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
      filesQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { originalName: { $regex: search, $options: "i" } },
      ];
    }

    const children = await Folder.find(childrenQuery)
      .sort({ name: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const files = await File.find(filesQuery)
      .sort({ name: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalChildren = await Folder.countDocuments(childrenQuery);
    const totalFiles = await File.countDocuments(filesQuery);

    res.json({
      success: true,
      data: {
        folder,
        contents: {
          folders: children,
          files,
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalChildren + totalFiles,
          totalFolders: totalChildren,
          totalFiles: totalFiles,
          pages: Math.ceil((totalChildren + totalFiles) / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching folder:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching folder",
      error: error.message,
    });
  }
});

// Create new folder
router.post("/", async (req, res) => {
  try {
    const { name, description = "", parentId = null } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Folder name is required",
      });
    }

    // Check if folder with same name exists in the same parent
    const existingFolder = await Folder.findOne({
      name: name.trim(),
      parentId: parentId || null,
    });

    if (existingFolder) {
      return res.status(400).json({
        success: false,
        message: "Folder with this name already exists in this location",
      });
    }

    // Build path
    let path = "/";
    let level = 0;

    if (parentId) {
      const parentFolder = await Folder.findById(parentId);
      if (!parentFolder) {
        return res.status(404).json({
          success: false,
          message: "Parent folder not found",
        });
      }
      path =
        parentFolder.fullPath || parentFolder.path + "/" + parentFolder.name;
      level = parentFolder.level + 1;
    }

    const newFolder = new Folder({
      name: name.trim(),
      description: description.trim(),
      parentId: parentId || null,
      path,
      level,
    });

    await newFolder.save();

    // Update parent folder's children array
    if (parentId) {
      await Folder.findByIdAndUpdate(parentId, {
        $push: { children: newFolder._id },
      });
    }

    const populatedFolder = await Folder.findById(newFolder._id)
      .populate("children", "name description createdAt updatedAt")
      .populate(
        "files",
        "name originalName size mimetype createdAt updatedAt extension"
      );

    res.status(201).json({
      success: true,
      message: "Folder created successfully",
      data: populatedFolder,
    });
  } catch (error) {
    console.error("Error creating folder:", error);
    res.status(500).json({
      success: false,
      message: "Error creating folder",
      error: error.message,
    });
  }
});

// Update folder
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const folder = await Folder.findById(id);
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: "Folder not found",
      });
    }

    // Check if new name conflicts with existing folder
    if (name && name !== folder.name) {
      const existingFolder = await Folder.findOne({
        name: name.trim(),
        parentId: folder.parentId,
        _id: { $ne: id },
      });

      if (existingFolder) {
        return res.status(400).json({
          success: false,
          message: "Folder with this name already exists in this location",
        });
      }
    }

    const updateData = {
      updatedAt: Date.now(), // Explicitly update the timestamp
    };
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();

    const updatedFolder = await Folder.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("children", "name description createdAt updatedAt")
      .populate(
        "files",
        "name originalName size mimetype createdAt updatedAt extension"
      );

    res.json({
      success: true,
      message: "Folder updated successfully",
      data: updatedFolder,
    });
  } catch (error) {
    console.error("Error updating folder:", error);
    res.status(500).json({
      success: false,
      message: "Error updating folder",
      error: error.message,
    });
  }
});

// Delete folder
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const folder = await Folder.findById(id);
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: "Folder not found",
      });
    }

    // Check if folder has children or files
    const hasChildren = await Folder.countDocuments({ parentId: id });
    const hasFiles = await File.countDocuments({ folderId: id });

    if (hasChildren > 0 || hasFiles > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete folder that contains files or subfolders",
      });
    }

    // Remove from parent's children array
    if (folder.parentId) {
      await Folder.findByIdAndUpdate(folder.parentId, {
        $pull: { children: id },
      });
    }

    await Folder.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Folder deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting folder:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting folder",
      error: error.message,
    });
  }
});

// Get folder breadcrumb
router.get("/:id/breadcrumb", async (req, res) => {
  try {
    const { id } = req.params;
    const breadcrumb = [];

    let currentFolder = await Folder.findById(id);

    while (currentFolder) {
      breadcrumb.unshift({
        _id: currentFolder._id,
        name: currentFolder.name,
      });

      if (currentFolder.parentId) {
        currentFolder = await Folder.findById(currentFolder.parentId);
      } else {
        break;
      }
    }

    res.json({
      success: true,
      data: breadcrumb,
    });
  } catch (error) {
    console.error("Error getting breadcrumb:", error);
    res.status(500).json({
      success: false,
      message: "Error getting breadcrumb",
      error: error.message,
    });
  }
});

module.exports = router;


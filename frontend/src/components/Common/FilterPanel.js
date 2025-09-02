import React, { useState, useEffect } from "react";
import {
  Dialog,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Breadcrumbs,
  Link,
} from "@mui/material";
import {
  Close as CloseIcon,
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  Home as HomeIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { useApp } from "../../contexts/AppContext";

const FilterPanel = ({ open, onClose }) => {
  const { state, actions } = useApp();

  // Local filter state - hooks must be called before any early returns
  const [filters, setFilters] = useState({
    name: "",
    description: "",
    dateFrom: "",
    dateTo: "",
    fileType: "",
    folderType: "",
  });

  // Initialize filters with current state
  useEffect(() => {
    if (open) {
      setFilters({
        name: state.filters?.search || "",
        description: state.filters?.description || "",
        dateFrom: state.filters?.dateFrom || "",
        dateTo: state.filters?.dateTo || "",
        fileType: state.fileType || "",
        folderType: state.filters?.folderType || "",
      });
    }
  }, [open, state.filters, state.fileType]);

  if (!open) return null;

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      name: "",
      description: "",
      dateFrom: "",
      dateTo: "",
      fileType: "",
      folderType: "",
    });

    // Clear filters from app state and refresh data to show tree view
    actions.setPagination({ page: 1 });
    // search removed
    actions.setFileType("");
    actions.setFilters({});
    actions.setExpandedFolders([]);
    actions.navigateToFolder(null);
    actions.fetchFolderTree();
    actions.fetchFolders();
    actions.fetchFiles();
  };

  const handleApply = () => {
    // Apply filters to the app state
    // Use name in filters only for focusing logic below
    actions.setFileType(filters.fileType);

    // Build additional filters for API calls
    const filterParams = {};
    if (filters.name && filters.name.trim())
      filterParams.search = filters.name.trim();
    if (filters.description) filterParams.description = filters.description;
    if (filters.fileType) filterParams.fileType = filters.fileType;
    if (filters.dateFrom) filterParams.dateFrom = filters.dateFrom;
    if (filters.dateTo) filterParams.dateTo = filters.dateTo;

    // Apply filters and refresh data
    actions.setPagination({ page: 1 });
    actions.setFilters(filterParams);

    // If user typed an exact folder name, try to focus that folder's content
    // We'll locate it in current tree and show only that folder opened with its children
    const tryFocusByName = (name) => {
      if (!name) return false;
      const roots = Array.isArray(state.folderTree)
        ? state.folderTree
        : state.folderTree.folders || [];
      let target = null;
      const expanded = new Set();
      const dfs = (nodes, pathOpen = []) => {
        for (const node of nodes) {
          if (node.name?.toLowerCase() === name.toLowerCase()) {
            target = node;
            pathOpen.forEach((id) => expanded.add(id));
            expanded.add(node._id);
            return true;
          }
          if (node.children && node.children.length) {
            if (dfs(node.children, [...pathOpen, node._id])) return true;
          }
        }
        return false;
      };
      dfs(roots);
      if (target) {
        // Set expanded folders to open the path and selected folder
        actions.setExpandedFolders(Array.from(expanded));
        // Go to that folder to ensure next filter continues to focus correctly
        actions.navigateToFolder({ _id: target._id, name: target.name });
        return true;
      }
      return false;
    };

    tryFocusByName(filters.name?.trim());
    // Persist current filter set so the next apply uses them (pre-fill in panel and active detection)
    actions.setFilters(filterParams);

    // Fetch with current filter set
    actions.fetchFolders();
    actions.fetchFiles();

    onClose();
  };

  const handleCancel = () => {
    // Reset to current app state values
    setFilters({
      name: state.filters?.search || "",
      description: state.filters?.description || "",
      dateFrom: state.filters?.dateFrom || "",
      dateTo: state.filters?.dateTo || "",
      fileType: state.fileType || "",
      folderType: state.filters?.folderType || "",
    });
    onClose();
  };

  const getActiveFilterCount = () => {
    const { name, description, dateFrom, dateTo, fileType, folderType } =
      filters;
    const values = [name, description, dateFrom, dateTo, fileType, folderType];
    return values.filter((v) => v && v.toString().trim() !== "").length;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          borderRadius: "12px",
          maxWidth: "480px",
          width: "480px",
          position: "fixed",
          top: "80px",
          right: "24px",
          margin: "0",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        },
      }}
      sx={{
        "& .MuiDialog-container": {
          alignItems: "flex-start",
          justifyContent: "flex-end",
          paddingTop: "80px",
          paddingRight: "24px",
        },
      }}
    >
      <Box sx={{ position: "relative", backgroundColor: "#ffffff" }}>
        {/* Close button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 16,
            top: 16,
            color: "#9ca3af",
            zIndex: 1,
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        {/* Header */}
        <Box sx={{ p: 3, pb: 2 }}>
          {/* Breadcrumb */}
          <Box sx={{ mb: 3 }}>
            <Breadcrumbs
              separator={
                <ChevronRightIcon fontSize="small" sx={{ color: "#9ca3af" }} />
              }
            >
              <Link
                component="button"
                variant="body2"
                onClick={() => {}}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  color: "#9ca3af",
                  textDecoration: "none",
                  background: "none",
                  border: "none",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <HomeIcon fontSize="small" />
                NSM
              </Link>
              <Typography
                variant="body2"
                sx={{ color: "#374151", fontSize: "14px", fontWeight: 500 }}
              >
                Folders & Documents
              </Typography>
            </Breadcrumbs>
          </Box>

          {/* Title and Clear */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography
              variant="h6"
              sx={{ color: "#111827", fontWeight: 600, fontSize: "20px" }}
            >
              Filters
            </Typography>
            <Button
              onClick={handleClearFilters}
              sx={{
                color: "#ef4444",
                fontSize: "14px",
                fontWeight: 400,
                textTransform: "none",
                p: 0,
                minWidth: "auto",
                "&:hover": {
                  backgroundColor: "transparent",
                  textDecoration: "underline",
                },
              }}
              disabled={getActiveFilterCount() === 0}
            >
              Clear
            </Button>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ px: 3, pb: 3 }}>
          {/* Name Field */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="body2"
              sx={{
                color: "#374151",
                fontSize: "14px",
                fontWeight: 500,
                mb: 1,
              }}
            >
              Name
            </Typography>
            <TextField
              fullWidth
              placeholder="Folder name"
              value={filters.name}
              onChange={(e) => handleFilterChange("name", e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#9ca3af", fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  "& fieldset": {
                    borderColor: "#d1d5db",
                  },
                  "&:hover fieldset": {
                    borderColor: "#9ca3af",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#2563eb",
                    borderWidth: "2px",
                  },
                },
                "& .MuiOutlinedInput-input": {
                  padding: "12px 14px",
                  fontSize: "16px",
                  "&::placeholder": {
                    color: "#9ca3af",
                    opacity: 1,
                  },
                },
              }}
            />
          </Box>

          {/* Description Field */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="body2"
              sx={{
                color: "#374151",
                fontSize: "14px",
                fontWeight: 500,
                mb: 1,
              }}
            >
              Description
            </Typography>
            <TextField
              fullWidth
              placeholder="Description"
              value={filters.description}
              onChange={(e) =>
                handleFilterChange("description", e.target.value)
              }
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  "& fieldset": {
                    borderColor: "#d1d5db",
                  },
                  "&:hover fieldset": {
                    borderColor: "#9ca3af",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#2563eb",
                    borderWidth: "2px",
                  },
                },
                "& .MuiOutlinedInput-input": {
                  padding: "12px 14px",
                  fontSize: "16px",
                  "&::placeholder": {
                    color: "#9ca3af",
                    opacity: 1,
                  },
                },
              }}
            />
          </Box>

          {/* Date Field */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="body2"
              sx={{
                color: "#374151",
                fontSize: "14px",
                fontWeight: 500,
                mb: 1,
              }}
            >
              Date
            </Typography>
            <TextField
              fullWidth
              placeholder="DD-MM-YYYY"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <CalendarIcon sx={{ color: "#9ca3af", fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  "& fieldset": {
                    borderColor: "#d1d5db",
                  },
                  "&:hover fieldset": {
                    borderColor: "#9ca3af",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#2563eb",
                    borderWidth: "2px",
                  },
                },
                "& .MuiOutlinedInput-input": {
                  padding: "12px 14px",
                  fontSize: "16px",
                  "&::placeholder": {
                    color: "#9ca3af",
                    opacity: 1,
                  },
                },
              }}
            />
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              onClick={handleCancel}
              fullWidth
              variant="outlined"
              sx={{
                color: "#6b7280",
                borderColor: "#d1d5db",
                textTransform: "none",
                fontSize: "16px",
                fontWeight: 500,
                py: 1.5,
                borderRadius: "8px",
                "&:hover": {
                  borderColor: "#9ca3af",
                  backgroundColor: "#f9fafb",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              fullWidth
              variant="contained"
              sx={{
                backgroundColor: "#3b82f6",
                color: "#ffffff",
                textTransform: "none",
                fontSize: "16px",
                fontWeight: 600,
                py: 1.5,
                borderRadius: "8px",
                "&:hover": {
                  backgroundColor: "#2563eb",
                },
              }}
            >
              Apply
            </Button>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default FilterPanel;

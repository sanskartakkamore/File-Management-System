import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Breadcrumbs,
  Link,
  Box,
  Divider,
  Tooltip,
} from "@mui/material";
import {
  Menu as MenuIcon,
  AddRounded as AddIcon,
  FilterAltRounded as FilterIcon,
  CreateNewFolder as FolderIcon,
  Upload as UploadIcon,
  Home as HomeIcon,
  ChevronRight as ChevronRightIcon,
  Preview as PreviewIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";
import { useApp } from "../../contexts/AppContext";
import "./Header.css";

const Header = () => {
  const { state, actions } = useApp();
  const [anchorEl, setAnchorEl] = useState(null);
  // Search handled via FilterPanel

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleFilterMenuOpen = (event) => {
    actions.setFilterPanel(true);
  };

  const handleCreateFolder = () => {
    handleMenuClose();
    actions.setModal("createFolder", true);
  };

  const handleUploadFile = () => {
    handleMenuClose();
    actions.setModal("uploadFile", true);
  };

  // search logic is centralized in FilterPanel

  const handleBreadcrumbClick = (folder) => {
    if (folder) {
      actions.navigateToFolder(folder);
    } else {
      // Navigate to root
      actions.navigateToFolder(null);
    }
  };

  return (
    <AppBar position="static" className="app-header" elevation={1}>
      <Toolbar className="header-toolbar">
        {/* Left Section - Menu Toggle and Breadcrumb */}
        <Box className="header-left">
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={actions.toggleSidebar}
            className={`menu-toggle ${state.sidebarOpen ? "active" : ""}`}
            title={state.sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <MenuIcon />
          </IconButton>

          {/* Breadcrumb Navigation */}
          <Box className="breadcrumb-container">
            <Breadcrumbs
              separator={<ChevronRightIcon fontSize="small" />}
              aria-label="breadcrumb"
              className="breadcrumb"
            >
              <Link
                color="inherit"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleBreadcrumbClick(null);
                }}
                className="breadcrumb-link"
              >
                <HomeIcon className="breadcrumb-icon" />
                <span>NSM</span>
              </Link>

              {state.breadcrumb.map((folder, index) => (
                <Link
                  key={folder._id}
                  color="inherit"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleBreadcrumbClick(folder);
                  }}
                  className="breadcrumb-link"
                >
                  {folder.name}
                </Link>
              ))}
            </Breadcrumbs>
          </Box>
        </Box>

        {/* Center Section intentionally empty */}

        {/* Right Section - Actions */}
        <Box className="header-right">
          {/* Preview Toggle */}
          <Tooltip title={state.viewerOpen ? "Hide preview" : "Show preview"}>
            <IconButton
              color="inherit"
              onClick={actions.toggleViewer}
              className="preview-toggle-button"
            >
              {state.viewerOpen ? <VisibilityOffIcon /> : <PreviewIcon />}
            </IconButton>
          </Tooltip>
          {/* Filter Button */}
          <IconButton
            color="inherit"
            onClick={handleFilterMenuOpen}
            className="filter-button"
          >
            <FilterIcon />
          </IconButton>

          {/* Create Button (icon only) with Dropdown */}
          <IconButton
            onClick={handleMenuOpen}
            className="create-button"
            aria-label="Create"
            disableRipple
            sx={{
              backgroundColor: "#202a62",
              color: "#ffffff",
              borderRadius: "12px",
              width: 44,
              height: 44,
              boxShadow: "none",
              "&:hover": { backgroundColor: "#182050", boxShadow: "none" },
            }}
          >
            <AddIcon />
          </IconButton>

          {/* Create Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            className="create-menu"
          >
            <MenuItem onClick={handleCreateFolder} className="menu-item">
              <FolderIcon className="menu-icon" />
              <Typography variant="body2">Create Folder</Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleUploadFile} className="menu-item">
              <UploadIcon className="menu-icon" />
              <Typography variant="body2">Upload File</Typography>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;

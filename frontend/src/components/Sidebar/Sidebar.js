import React, { useState } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  Box,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  InsertDriveFile as FileIcon,
  ChevronLeft as ChevronLeftIcon,
  Add as AddIcon,
  Description as DocumentIcon,
} from "@mui/icons-material";
import { useApp } from "../../contexts/AppContext";
import "./Sidebar.css";

const DRAWER_WIDTH = 280;

const FileTreeNode = ({ file, level = 0, onFileClick }) => {
  const { state } = useApp();
  const isSelected = state.selectedFile?._id === file._id;

  const handleFileClick = () => {
    onFileClick(file);
  };

  const getFileIcon = (mimetype) => {
    if (mimetype?.startsWith("image/")) {
      return <DocumentIcon className="file-icon image" />;
    } else if (mimetype === "application/pdf") {
      return <DocumentIcon className="file-icon pdf" />;
    } else if (
      mimetype?.includes("document") ||
      mimetype?.includes("text") ||
      mimetype?.includes("sheet") ||
      mimetype?.includes("presentation")
    ) {
      return <DocumentIcon className="file-icon document" />;
    }
    return <FileIcon className="file-icon default" />;
  };

  return (
    <ListItem disablePadding className="tree-node file-node">
      <ListItemButton
        onClick={handleFileClick}
        selected={isSelected}
        className={`tree-node-button file-button ${
          isSelected ? "selected" : ""
        }`}
        style={{
          paddingLeft: 16 + level * 24,
          paddingRight: 8,
        }}
      >
        <ListItemIcon className="tree-node-icon">
          <Box className="expand-spacer" />
          {getFileIcon(file.mimetype)}
        </ListItemIcon>
        <ListItemText
          primary={file.name}
          className="tree-node-text file-text"
          primaryTypographyProps={{
            variant: "body2",
            noWrap: true,
          }}
        />
      </ListItemButton>
    </ListItem>
  );
};

const FolderTreeNode = ({ folder, level = 0, onFolderClick, onFileClick }) => {
  const [expanded, setExpanded] = useState(false);
  const { state } = useApp();

  const handleToggle = (event) => {
    event.stopPropagation();
    setExpanded(!expanded);
  };

  const handleFolderClick = () => {
    onFolderClick(folder);
  };

  const isSelected = state.selectedFolder?._id === folder._id;
  const hasChildren = folder.children && folder.children.length > 0;
  const hasFiles = folder.files && folder.files.length > 0;
  const hasContent = hasChildren || hasFiles;

  return (
    <>
      <ListItem disablePadding className="tree-node">
        <ListItemButton
          onClick={handleFolderClick}
          selected={isSelected}
          className={`tree-node-button ${isSelected ? "selected" : ""}`}
          style={{
            paddingLeft: 8 + level * 24,
            paddingRight: 8,
          }}
        >
          <ListItemIcon className="tree-node-icon">
            <Box className="expand-spacer" />
            {expanded ? (
              <FolderOpenIcon className="folder-icon open" />
            ) : (
              <FolderIcon className="folder-icon" />
            )}
          </ListItemIcon>
          <ListItemText
            primary={folder.name}
            className="tree-node-text"
            primaryTypographyProps={{
              variant: "body2",
              noWrap: true,
            }}
          />
          {hasContent && (
            <IconButton
              size="small"
              onClick={handleToggle}
              className="expand-button"
            >
              <AddIcon fontSize="small" />
            </IconButton>
          )}
        </ListItemButton>
      </ListItem>

      {hasContent && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {/* Render child folders first */}
            {hasChildren &&
              folder.children.map((child) => (
                <FolderTreeNode
                  key={child._id}
                  folder={child}
                  level={level + 1}
                  onFolderClick={onFolderClick}
                  onFileClick={onFileClick}
                />
              ))}

            {/* Then render files */}
            {hasFiles &&
              folder.files.map((file) => (
                <FileTreeNode
                  key={file._id}
                  file={file}
                  level={level + 1}
                  onFileClick={onFileClick}
                />
              ))}
          </List>
        </Collapse>
      )}
    </>
  );
};

const Sidebar = () => {
  const { state, actions } = useApp();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // Only very small screens

  const handleFolderClick = (folder) => {
    actions.setSelectedFolder(folder);
    actions.navigateToFolder(folder);

    // Close sidebar on mobile after selection for better UX
    if (isMobile) {
      actions.toggleSidebar();
    }
  };

  const handleFileClick = (file) => {
    actions.setSelectedFile(file);

    // Close sidebar on mobile after selection for better UX
    if (isMobile) {
      actions.toggleSidebar();
    }
  };

  const handleRootClick = () => {
    actions.setSelectedFolder(null);
    actions.navigateToFolder(null);

    // Close sidebar on mobile after selection for better UX
    if (isMobile) {
      actions.toggleSidebar();
    }
  };

  const isRootSelected = !state.selectedFolder && !state.currentFolder;

  // Calculate total counts
  const countFoldersRecursively = (folders) => {
    let count = folders.length;
    folders.forEach((folder) => {
      if (folder.children && folder.children.length > 0) {
        count += countFoldersRecursively(folder.children);
      }
    });
    return count;
  };

  const countFilesRecursively = (folders) => {
    let count = 0;
    folders.forEach((folder) => {
      if (folder.files && folder.files.length > 0) {
        count += folder.files.length;
      }
      if (folder.children && folder.children.length > 0) {
        count += countFilesRecursively(folder.children);
      }
    });
    return count;
  };

  const folderTreeData = Array.isArray(state.folderTree)
    ? state.folderTree
    : state.folderTree.folders || [];
  const rootFiles = Array.isArray(state.folderTree)
    ? []
    : state.folderTree.rootFiles || [];

  const totalFolders = countFoldersRecursively(folderTreeData);
  const totalFiles = countFilesRecursively(folderTreeData) + rootFiles.length;

  return (
    <Drawer
      variant={isMobile ? "temporary" : "persistent"}
      anchor="left"
      open={state.sidebarOpen}
      onClose={isMobile ? actions.toggleSidebar : undefined}
      className="sidebar-drawer"
      sx={{
        width: state.sidebarOpen && !isMobile ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        transition: "width 0.3s ease-in-out",
        "& .MuiDrawer-paper": {
          width: DRAWER_WIDTH,
          boxSizing: "border-box",
          position: isMobile ? "fixed" : "relative",
          transition: "transform 0.3s ease-in-out",
          transform: state.sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        },
      }}
    >
      <Box className="sidebar-content">
        {/* Header */}
        <Box className="sidebar-header">
          <Box className="sidebar-header-top">
            <Typography variant="h6" className="sidebar-title">
              Folders & Documents
            </Typography>
            <IconButton
              onClick={actions.toggleSidebar}
              className="sidebar-close-button"
              size="small"
              title="Close sidebar"
            >
              <ChevronLeftIcon />
            </IconButton>
          </Box>
          <Box className="folder-stats-new">
            <Box className="stat-card">
              <FolderIcon className="stat-card-icon" />
              <Box className="stat-card-content">
                <Typography variant="caption" className="stat-label">
                  Folders
                </Typography>
                <Typography variant="h6" className="stat-count">
                  {totalFolders > 0 ? `${totalFolders}+` : "0"}
                </Typography>
              </Box>
            </Box>
            <Box className="stat-divider" />
            <Box className="stat-card">
              <DocumentIcon className="stat-card-icon" />
              <Box className="stat-card-content">
                <Typography variant="caption" className="stat-label">
                  Documents
                </Typography>
                <Typography variant="h6" className="stat-count">
                  {totalFiles > 0 ? `${totalFiles}+` : "0"}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Divider />

        {/* Folder Tree */}
        <Box className="folder-tree-container">
          <List className="folder-tree">
            {/* Root folder */}
            <ListItem disablePadding className="tree-node">
              <ListItemButton
                onClick={handleRootClick}
                selected={isRootSelected}
                className={`tree-node-button ${
                  isRootSelected ? "selected" : ""
                }`}
              >
                <ListItemIcon className="tree-node-icon">
                  <Box className="expand-spacer" />
                  <FolderIcon className="folder-icon" />
                </ListItemIcon>
                <ListItemText
                  primary="All Files"
                  className="tree-node-text"
                  primaryTypographyProps={{
                    variant: "body2",
                    fontWeight: "medium",
                  }}
                />
              </ListItemButton>
            </ListItem>

            {/* Folder tree */}
            {state.loading.tree ? (
              <Box className="loading-container">
                <Typography variant="body2" color="textSecondary">
                  Loading folders...
                </Typography>
              </Box>
            ) : (
              <>
                {/* Render folder tree with files */}
                {folderTreeData.map((folder) => (
                  <FolderTreeNode
                    key={folder._id}
                    folder={folder}
                    onFolderClick={handleFolderClick}
                    onFileClick={handleFileClick}
                  />
                ))}

                {/* Render root level files */}
                {rootFiles.map((file) => (
                  <FileTreeNode
                    key={file._id}
                    file={file}
                    level={0}
                    onFileClick={handleFileClick}
                  />
                ))}
              </>
            )}
          </List>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;

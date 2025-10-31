import React, { useState } from "react";
import {
  Box,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  TablePagination,
  Skeleton,
} from "@mui/material";
import {
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  OpenInNew as OpenIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Upload as UploadIcon,
  CreateNewFolder as CreateFolderIcon,
} from "@mui/icons-material";
import { useApp } from "../../contexts/AppContext";
import { fileAPI } from "../../services/api";
import "./MainContent.css";

//

// Numbered Folder Icon Component with Badge
const NumberedFolderIcon = ({ number }) => {
  return (
    <div className="folder-icon-container">
      <FolderIcon className="folder-icon-base" />
      <div className="folder-number-badge">{number}</div>
    </div>
  );
};

//

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Table Folder Row Component
const TableFolderRow = ({
  folder,
  level = 0,
  number,
  onFolderClick,
  onMenuAction,
  onFileClick,
  onFileMenuAction,
  expanded,
  onToggle,
  expandedFolders = [],
}) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (action) => {
    onMenuAction(action, folder);
    handleMenuClose();
  };

  //

  const handleToggle = (event) => {
    event.stopPropagation();
    onToggle(folder._id);
  };

  // Check if this folder has children or files
  const hasChildren = folder.children && folder.children.length > 0;
  const hasFiles = folder.files && folder.files.length > 0;
  const hasContent = hasChildren || hasFiles;

  // Determine background color based on level
  const getBackgroundClass = () => {
    if (level === 1) return "first-level-card"; // Blue background for first expansion level
    return "white-card"; // White background for main level and deeper levels
  };

  // Badge is total immediate children: subfolders + files
  const subfolderCount = Array.isArray(folder.children)
    ? folder.children.length
    : 0;
  const fileCount = Array.isArray(folder.files) ? folder.files.length : 0;
  const badgeNumber = subfolderCount + fileCount;

  return (
    <tr className={`content-row folder-row ${getBackgroundClass()}`}>
      <td className="name-cell" colSpan="5">
        <div className="folder-card-content">
          {/* Main folder row */}
          <div className="folder-main-row">
            <div
              className="name-content"
              style={{ paddingLeft: `${2 + level * 16}px` }}
            >
              {hasContent ? (
                <button
                  className="expand-button hover-only"
                  onClick={handleToggle}
                >
                  {expanded ? (
                    <ExpandMoreIcon fontSize="small" />
                  ) : (
                    <ChevronRightIcon fontSize="small" />
                  )}
                </button>
              ) : (
                <div className="expand-spacer" />
              )}
              <div className="item-avatar folder">
                <NumberedFolderIcon number={badgeNumber} />
              </div>
              <div className="item-details">
                <div className="item-name">{folder.name}</div>
              </div>
            </div>
            <div className="description-cell">{folder.description || "—"}</div>
            <div className="date-cell">{formatDate(folder.createdAt)}</div>
            <div className="date-cell">{formatDate(folder.updatedAt)}</div>
            <div className="actions-cell">
              <IconButton
                size="small"
                onClick={handleMenuOpen}
                className="action-button"
              >
                <MoreVertIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                <MenuItem onClick={() => handleMenuItemClick("open")}>
                  <OpenIcon className="menu-icon" />
                  Open
                </MenuItem>
                <MenuItem onClick={() => handleMenuItemClick("uploadFile")}>
                  <UploadIcon className="menu-icon" />
                  Upload Document
                </MenuItem>
                <MenuItem onClick={() => handleMenuItemClick("createFolder")}>
                  <CreateFolderIcon className="menu-icon" />
                  Create Folder
                </MenuItem>
                <MenuItem onClick={() => handleMenuItemClick("edit")}>
                  <EditIcon className="menu-icon" />
                  Edit
                </MenuItem>
                <MenuItem onClick={() => handleMenuItemClick("delete")}>
                  <DeleteIcon className="menu-icon" />
                  Delete
                </MenuItem>
              </Menu>
            </div>
          </div>

          {/* Expanded content within the same card */}
          {expanded && hasContent && (
            <div className="expanded-content">
              {/* Render child folders first */}
              {hasChildren &&
                folder.children.map((subfolder, index) => (
                  <TableFolderRow
                    key={subfolder._id}
                    folder={subfolder}
                    level={level + 1}
                    number={index + 1}
                    onFolderClick={onFolderClick}
                    onMenuAction={onMenuAction}
                    onFileClick={onFileClick}
                    onFileMenuAction={onFileMenuAction}
                    expanded={expandedFolders.includes(subfolder._id)}
                    onToggle={onToggle}
                    expandedFolders={expandedFolders}
                  />
                ))}

              {/* Then render files */}
              {hasFiles &&
                folder.files.map((file) => (
                  <TableFileRow
                    key={file._id}
                    file={file}
                    level={level + 1}
                    onFileClick={onFileClick}
                    onMenuAction={onFileMenuAction}
                  />
                ))}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};

// Table File Row Component
const TableFileRow = ({ file, level = 0, onFileClick, onMenuAction }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (action) => {
    onMenuAction(action, file);
    handleMenuClose();
  };

  const handleFileClick = () => {
    onFileClick(file);
  };

  const getFileIcon = (mimetype) => {
    if (mimetype?.startsWith("image/")) {
      return <ImageIcon className="file-icon image" />;
    } else if (mimetype === "application/pdf") {
      return <PdfIcon className="file-icon pdf" />;
    } else if (
      mimetype?.includes("document") ||
      mimetype?.includes("text") ||
      mimetype?.includes("sheet") ||
      mimetype?.includes("presentation")
    ) {
      return <DocIcon className="file-icon document" />;
    }
    return <FileIcon className="file-icon default" />;
  };

  // Determine background class based on level
  const getBackgroundClass = () => {
    if (level === 1) return "first-level-card"; // Blue background only for first level files
    return "white-card"; // White background for all other cases
  };

  return (
    <div
      className={`file-row-content ${getBackgroundClass()}`}
      onClick={handleFileClick}
    >
      <div
        className="name-content"
        style={{ paddingLeft: `${2 + level * 16}px` }}
      >
        <div className="expand-spacer" />
        <div className="item-avatar file">{getFileIcon(file.mimetype)}</div>
        <div className="item-details">
          <div className="item-name">{file.name}</div>
        </div>
      </div>
      <div className="description-cell">{file.description || "—"}</div>
      <div className="date-cell">{formatDate(file.createdAt)}</div>
      <div className="date-cell">{formatDate(file.updatedAt)}</div>
      <div className="actions-cell">
        <IconButton
          size="small"
          onClick={handleMenuOpen}
          className="action-button"
        >
          <MoreVertIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <MenuItem onClick={() => handleMenuItemClick("open")}>
            <OpenIcon className="menu-icon" />
            Open
          </MenuItem>
          <MenuItem onClick={() => handleMenuItemClick("download")}>
            <DownloadIcon className="menu-icon" />
            Download
          </MenuItem>
          <MenuItem onClick={() => handleMenuItemClick("edit")}>
            <EditIcon className="menu-icon" />
            Edit
          </MenuItem>
          <MenuItem onClick={() => handleMenuItemClick("delete")}>
            <DeleteIcon className="menu-icon" />
            Delete
          </MenuItem>
        </Menu>
      </div>
    </div>
  );
};

const LoadingSkeleton = () => (
  <>
    {[...Array(5)].map((_, index) => (
      <tr key={index} className="content-row">
        <td className="name-cell">
          <div className="name-content">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="item-details">
              <Skeleton variant="text" width={200} />
            </div>
          </div>
        </td>
        <td className="description-cell">
          <Skeleton variant="text" width={150} />
        </td>
        <td className="date-cell">
          <Skeleton variant="text" width={120} />
        </td>
        <td className="date-cell">
          <Skeleton variant="text" width={120} />
        </td>
        <td className="actions-cell">
          <Skeleton variant="circular" width={24} height={24} />
        </td>
      </tr>
    ))}
  </>
);

const MainContent = () => {
  const { state, actions } = useApp();

  const handleFolderClick = (folder) => {
    actions.setSelectedFolder(folder);
    actions.navigateToFolder(folder);
  };

  const handleFileClick = (file) => {
    actions.setSelectedFile(file);
  };

  const handleFolderMenuAction = (action, folder) => {
    switch (action) {
      case "open":
        handleFolderClick(folder);
        break;
      case "uploadFile":
        actions.setCurrentFolder(folder);
        actions.setModal("uploadFile", true);
        break;
      case "createFolder":
        actions.setCurrentFolder(folder);
        actions.setModal("createFolder", true);
        break;
      case "edit":
        actions.setEditingFolder(folder);
        break;
      case "delete":
        if (window.confirm("Are you sure you want to delete this folder?")) {
          actions.deleteFolderAPI(folder._id);
        }
        break;
      default:
        break;
    }
  };

  const handleFileMenuAction = async (action, file) => {
    switch (action) {
      case "open":
        handleFileClick(file);
        break;
      case "download":
        try {
          const response = await fileAPI.downloadFile(file._id);
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", file.originalName);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
        } catch (error) {
          actions.setError("Failed to download file");
        }
        break;
      case "edit":
        actions.setEditingFile(file);
        break;
      case "delete":
        if (window.confirm("Are you sure you want to delete this file?")) {
          actions.deleteFileAPI(file._id);
        }
        break;
      default:
        break;
    }
  };

  //

  const handlePageChange = (event, newPage) => {
    actions.setPagination({ page: newPage + 1 });
    actions.fetchFolders();
    actions.fetchFiles();
  };

  const handleRowsPerPageChange = (event) => {
    const newLimit = parseInt(event.target.value, 10);
    actions.setPagination({ page: 1, limit: newLimit });
    actions.fetchFolders();
    actions.fetchFiles();
  };

  // Check if there are active filters (search/description/date/fileType, etc.)
  const hasActiveFilters = Boolean(
    (state.filters &&
      Object.values(state.filters).some(
        (v) => v !== undefined && v !== null && String(v).trim() !== ""
      )) ||
      state.fileType
  );

  // Get data based on whether filters are active
  let folderTreeData = [];
  let rootFiles = [];
  let isLoading = false;
  let hasData = false;
  let computedExpandedFolders = state.expandedFolders;

  if (hasActiveFilters) {
    // If currently navigated to a folder (due to focus), show only that folder's content
    if (state.currentFolder) {
      // Locate the current folder node in the full tree
      const locateNode = (nodes) => {
        for (const node of nodes) {
          if (node._id === state.currentFolder._id) return node;
          const found = node.children ? locateNode(node.children) : null;
          if (found) return found;
        }
        return null;
      };
      const roots = Array.isArray(state.folderTree)
        ? state.folderTree
        : state.folderTree.folders || [];
      const node = locateNode(roots);
      if (node) {
        folderTreeData = [node];
        // Ensure current folder is expanded to reveal its children
        computedExpandedFolders = Array.from(
          new Set([...(computedExpandedFolders || []), node._id])
        );
        // In focus mode, show files list as the node's files only in the row renderer
        rootFiles = [];
        isLoading =
          state.loading.folders || state.loading.files || state.loading.tree;
        hasData = true;
      } else {
        folderTreeData = state.folders || [];
        rootFiles = state.files || [];
        isLoading = state.loading.folders || state.loading.files;
        hasData = folderTreeData.length > 0 || rootFiles.length > 0;
      }
    } else {
      // No focused folder, fallback to combined lists
      folderTreeData = state.folders || [];
      rootFiles = state.files || [];
      isLoading = state.loading.folders || state.loading.files;
      hasData = folderTreeData.length > 0 || rootFiles.length > 0;
    }
  } else {
    // Show tree view when no filters are active
    folderTreeData = Array.isArray(state.folderTree)
      ? state.folderTree
      : state.folderTree.folders || [];
    rootFiles = Array.isArray(state.folderTree)
      ? []
      : state.folderTree.rootFiles || [];
    isLoading = state.loading.tree || state.loading.files;
    hasData = folderTreeData.length > 0 || rootFiles.length > 0;
  }

  return (
    <Box className="main-content">
      {/* Breadcrumb intentionally omitted to keep layout compact */}

      {/* Table Container */}
      <div className="content-table-container">
        {/* Fixed Table Header */}
        <div className="fixed-table-header">
          <div className="header-row">
            <div className="header-cell name-header">Name</div>
            <div className="header-cell description-header">Description</div>
            <div className="header-cell date-header">Created at</div>
            <div className="header-cell date-header">Updated at</div>
            <div className="header-cell actions-header">Actions</div>
          </div>
        </div>

        {/* Scrollable Table Body */}
        <div className="scrollable-table-body">
          <table className="content-table">
            {/* Table Body */}
            <tbody className="table-body">
              {isLoading ? (
                <LoadingSkeleton />
              ) : !hasData ? (
                <tr>
                  <td colSpan="5" className="empty-state-cell">
                    <div className="empty-state-content">
                      <Typography variant="body2" color="textSecondary">
                        {hasActiveFilters
                          ? "No files found or no items match your search criteria."
                          : "No files found or no items match your search criteria."}
                      </Typography>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {hasActiveFilters ? (
                    <>
                      {/* Render filtered folders with expandable hierarchy */}
                      {folderTreeData.map((folder, index) => (
                        <TableFolderRow
                          key={folder._id}
                          folder={folder}
                          level={0}
                          number={index + 1}
                          onFolderClick={handleFolderClick}
                          onMenuAction={handleFolderMenuAction}
                          onFileClick={handleFileClick}
                          onFileMenuAction={handleFileMenuAction}
                          expanded={computedExpandedFolders.includes(
                            folder._id
                          )}
                          onToggle={actions.toggleFolderExpansion}
                          expandedFolders={computedExpandedFolders}
                        />
                      ))}

                      {/* Render filtered files */}
                      {rootFiles.map((file) => (
                        <TableFileRow
                          key={file._id}
                          file={file}
                          level={0}
                          onFileClick={handleFileClick}
                          onMenuAction={handleFileMenuAction}
                        />
                      ))}
                    </>
                  ) : (
                    <>
                      {/* Render all folders with expandable hierarchy */}
                      {folderTreeData.map((folder, index) => (
                        <TableFolderRow
                          key={folder._id}
                          folder={folder}
                          level={0}
                          number={index + 1}
                          onFolderClick={handleFolderClick}
                          onMenuAction={handleFolderMenuAction}
                          onFileClick={handleFileClick}
                          onFileMenuAction={handleFileMenuAction}
                          expanded={computedExpandedFolders.includes(
                            folder._id
                          )}
                          onToggle={actions.toggleFolderExpansion}
                          expandedFolders={computedExpandedFolders}
                        />
                      ))}

                      {/* Render root files */}
                      {rootFiles.map((file) => (
                        <TableFileRow
                          key={file._id}
                          file={file}
                          level={0}
                          onFileClick={handleFileClick}
                          onMenuAction={handleFileMenuAction}
                        />
                      ))}
                    </>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {hasData && (
        <TablePagination
          component="div"
          count={state.pagination.total}
          page={state.pagination.page - 1}
          onPageChange={handlePageChange}
          rowsPerPage={state.pagination.limit}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25, 50]}
          className="content-pagination"
        />
      )}
    </Box>
  );
};

export default MainContent;


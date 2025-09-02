import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Close as CloseIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useDropzone } from "react-dropzone";
import { useApp } from "../../contexts/AppContext";
import { fileAPI } from "../../services/api";
import "./Modal.css";

const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const UploadFileModal = () => {
  const { state, actions } = useApp();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState({});

  const isOpen = state.modals.uploadFile;

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(
        (rejection) =>
          `${rejection.file.name}: ${rejection.errors
            .map((e) => e.message)
            .join(", ")}`
      );
      setError(errors.join("\n"));
    }

    // Add accepted files
    const newFiles = acceptedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension for editing
      description: "",
    }));

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    setError("");
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      maxSize: 50 * 1024 * 1024, // 50MB
      accept: {
        "image/*": [".jpeg", ".jpg", ".png", ".gif", ".bmp", ".webp"],
        "application/pdf": [".pdf"],
        "text/*": [".txt", ".csv"],
        "application/msword": [".doc"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          [".docx"],
        "application/vnd.ms-excel": [".xls"],
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
          ".xlsx",
        ],
        "application/vnd.ms-powerpoint": [".ppt"],
        "application/vnd.openxmlformats-officedocument.presentationml.presentation":
          [".pptx"],
      },
    });

  const handleClose = () => {
    if (uploading) return;

    actions.setModal("uploadFile", false);
    setSelectedFiles([]);
    setError("");
    setUploadProgress({});
  };

  const handleRemoveFile = (fileId) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleFileNameChange = (fileId, newName) => {
    setSelectedFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, name: newName } : f))
    );
  };

  const handleFileDescriptionChange = (fileId, newDescription) => {
    setSelectedFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, description: newDescription } : f
      )
    );
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setError("");

    const uploadPromises = selectedFiles.map(async (fileItem) => {
      const formData = new FormData();
      formData.append("file", fileItem.file);
      formData.append("name", fileItem.name || fileItem.file.name);
      formData.append("description", fileItem.description);
      formData.append("folderId", state.currentFolder?._id || "");
      formData.append("tempFileId", fileItem.id);

      try {
        const response = await fileAPI.uploadFile(formData, (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress((prev) => ({
            ...prev,
            [fileItem.id]: progress,
          }));
        });

        // Add the uploaded file to the progress tracking for SSE
        actions.addUploadProgress({
          fileId: fileItem.id,
          filename: fileItem.file.name,
          progress: 100,
          size: fileItem.file.size,
        });

        return response.data.data;
      } catch (error) {
        throw new Error(
          `Failed to upload ${fileItem.file.name}: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    });

    try {
      await Promise.all(uploadPromises);

      // Refresh all data to reflect the new uploads
      await Promise.all([
        actions.fetchFolderTree(),
        actions.fetchFiles(),
        actions.fetchFolders(),
      ]);

      // Close modal
      handleClose();

      // Files uploaded successfully
    } catch (error) {
      setError(error.message);
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const getDropzoneClass = () => {
    let className = "dropzone";
    if (isDragActive) className += " active";
    if (isDragReject) className += " reject";
    return className;
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      className="upload-file-modal"
      PaperProps={{
        className: "modal-paper",
      }}
    >
      <DialogTitle className="modal-title">
        <Box className="title-content">
          <Box className="title-left">
            <UploadIcon className="title-icon" />
            <Typography variant="h6" component="span">
              Upload Document
            </Typography>
          </Box>
          <Button
            onClick={handleClose}
            className="close-button"
            disabled={uploading}
          >
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent className="modal-content">
        {error && (
          <Alert severity="error" className="error-alert">
            {error}
          </Alert>
        )}

        {/* Target Folder Information */}
        <Box className="target-folder-info">
          <Typography variant="subtitle2" className="section-title">
            Upload Location
          </Typography>
          <Box className="folder-path">
            {state.currentFolder ? (
              <>
                <span className="path-label">Target Folder:</span>
                <span className="path-value">
                  {state.breadcrumb.length > 0
                    ? state.breadcrumb.map((item) => item.name).join(" / ")
                    : "Root"}
                </span>
                <Chip
                  label={`${
                    state.currentFolder.children?.length || 0
                  } subfolders, ${
                    state.currentFolder.files?.length || 0
                  } files`}
                  size="small"
                  className="folder-stats-chip"
                />
              </>
            ) : (
              <>
                <span className="path-label">Target Folder:</span>
                <span className="path-value">Root (All Files)</span>
                <Chip
                  label="Upload to root level"
                  size="small"
                  className="folder-stats-chip"
                />
              </>
            )}
          </Box>
        </Box>

        {/* Dropzone */}
        <Box {...getRootProps()} className={getDropzoneClass()}>
          <input {...getInputProps()} />
          <UploadIcon className="dropzone-icon" />
          {isDragActive ? (
            <Typography variant="body1" className="dropzone-text">
              Drop the files here...
            </Typography>
          ) : (
            <>
              <Typography variant="body1" className="dropzone-text">
                Browse document
              </Typography>
              <Typography variant="body2" className="dropzone-subtext">
                Drag and drop files here, or click to select files
              </Typography>
            </>
          )}
          <Typography variant="caption" className="dropzone-hint">
            Supported formats: Images, PDF, Documents (Max 50MB each)
          </Typography>
        </Box>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <Box className="selected-files">
            <Typography variant="subtitle2" className="section-title">
              Selected Files ({selectedFiles.length})
            </Typography>
            <List className="files-list">
              {selectedFiles.map((fileItem) => (
                <ListItem key={fileItem.id} className="file-item">
                  <ListItemIcon>
                    <FileIcon className="file-icon" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box className="file-details">
                        <TextField
                          size="small"
                          value={fileItem.name}
                          onChange={(e) =>
                            handleFileNameChange(fileItem.id, e.target.value)
                          }
                          className="file-name-field"
                          placeholder="File name"
                          disabled={uploading}
                        />
                        <Chip
                          label={formatFileSize(fileItem.file.size)}
                          size="small"
                          className="file-size-chip"
                        />
                      </Box>
                    }
                    secondary={
                      <TextField
                        size="small"
                        value={fileItem.description}
                        onChange={(e) =>
                          handleFileDescriptionChange(
                            fileItem.id,
                            e.target.value
                          )
                        }
                        className="file-description-field"
                        placeholder="Description (optional)"
                        disabled={uploading}
                        multiline
                        maxRows={2}
                      />
                    }
                  />
                  <ListItemSecondaryAction>
                    {uploadProgress[fileItem.id] !== undefined ? (
                      <Box className="upload-progress">
                        <CircularProgress
                          variant="determinate"
                          value={uploadProgress[fileItem.id]}
                          size={24}
                        />
                        <Typography variant="caption">
                          {uploadProgress[fileItem.id]}%
                        </Typography>
                      </Box>
                    ) : (
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveFile(fileItem.id)}
                        disabled={uploading}
                        className="remove-file-button"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {state.currentFolder && (
          <Box className="location-info">
            <Typography variant="body2" className="location-label">
              Upload to:
            </Typography>
            <Typography variant="body2" className="location-path">
              {state.breadcrumb.length > 0
                ? state.breadcrumb.map((folder) => folder.name).join(" / ") +
                  " / " +
                  state.currentFolder.name
                : state.currentFolder.name}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions className="modal-actions">
        <Button
          onClick={handleClose}
          disabled={uploading}
          className="cancel-button"
        >
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={uploading || selectedFiles.length === 0}
          className="upload-button"
        >
          {uploading ? (
            <>
              <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
              Uploading...
            </>
          ) : (
            "Upload"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UploadFileModal;

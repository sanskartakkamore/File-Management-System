import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  LinearProgress,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from "@mui/material";
import {
  Close as CloseIcon,
  InsertDriveFile as FileIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import { useApp } from "../../contexts/AppContext";
import "./Modal.css";

const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const UploadProgressModal = () => {
  const { state, actions } = useApp();

  const isOpen = state.uploadProgress.length > 0;
  const hasCompletedUploads = state.uploadProgress.some(
    (upload) => upload.progress === 100
  );

  const handleClose = () => {
    // Only allow close if all uploads are complete or there are no uploads
    const allComplete = state.uploadProgress.every(
      (upload) => upload.progress === 100
    );
    if (allComplete || state.uploadProgress.length === 0) {
      // Clear all completed uploads
      state.uploadProgress.forEach((upload) => {
        actions.removeUploadProgress(upload.fileId);
      });
    }
  };

  const handleCancel = (fileId) => {
    actions.removeUploadProgress(fileId);
  };

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      maxWidth="sm"
      fullWidth
      className="upload-progress-modal"
      PaperProps={{
        className: "modal-paper upload-progress-paper",
      }}
      // Don't close on backdrop click during active uploads
      disableEscapeKeyDown={!hasCompletedUploads}
    >
      <DialogTitle className="modal-title upload-progress-title">
        <Box className="title-content">
          <Box className="title-left">
            <FileIcon className="title-icon" />
            <Typography variant="h6" component="span">
              Document upload progress
            </Typography>
          </Box>
          {hasCompletedUploads && (
            <IconButton
              onClick={handleClose}
              className="close-button"
              size="small"
            >
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </DialogTitle>

      <DialogContent className="modal-content upload-progress-content">
        <List className="upload-progress-list">
          {state.uploadProgress.map((upload) => (
            <ListItem key={upload.fileId} className="upload-progress-item">
              <ListItemIcon className="upload-file-icon">
                <FileIcon color="primary" />
              </ListItemIcon>

              <ListItemText
                primary={
                  <Box className="upload-file-info">
                    <Typography variant="body1" className="upload-file-name">
                      {upload.filename}
                    </Typography>
                    <Typography variant="body2" className="upload-file-size">
                      {formatFileSize(upload.size)}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box className="upload-progress-details">
                    <LinearProgress
                      variant="determinate"
                      value={upload.progress}
                      className="upload-progress-bar"
                    />
                    <Typography
                      variant="body2"
                      className="upload-progress-text"
                    >
                      {upload.progress}% upload completed
                    </Typography>
                  </Box>
                }
              />

              <ListItemSecondaryAction>
                {upload.progress < 100 && (
                  <IconButton
                    edge="end"
                    onClick={() => handleCancel(upload.fileId)}
                    className="upload-cancel-button"
                    size="small"
                  >
                    <CancelIcon />
                  </IconButton>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
};

export default UploadProgressModal;




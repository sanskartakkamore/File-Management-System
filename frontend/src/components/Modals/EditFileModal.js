import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import { Edit as EditIcon, Close as CloseIcon } from "@mui/icons-material";
import { useApp } from "../../contexts/AppContext";
import { fileAPI } from "../../services/api";
import "./Modal.css";

const EditFileModal = () => {
  const { state, actions } = useApp();
  const [fileName, setFileName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isOpen = Boolean(state.editingFile);
  const selectedFile = state.editingFile;

  useEffect(() => {
    if (isOpen && selectedFile) {
      setFileName(selectedFile.name || "");
      setDescription(selectedFile.description || "");
      setError("");
    }
  }, [isOpen, selectedFile]);

  const handleClose = () => {
    if (loading) return;

    actions.setEditingFile(null);
    setFileName("");
    setDescription("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fileName.trim()) {
      setError("File name is required");
      return;
    }

    if (!selectedFile) return;

    setLoading(true);
    setError("");

    try {
      await fileAPI.updateFile(selectedFile._id, {
        name: fileName.trim(),
        description: description.trim(),
      });

      // Refresh all data to reflect the changes
      await Promise.all([
        actions.fetchFolderTree(),
        actions.fetchFiles(),
        actions.fetchFolders(),
      ]);

      handleClose();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to update file");
    } finally {
      setLoading(false);
    }
  };

  if (!selectedFile) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      className="edit-file-modal"
      PaperProps={{
        className: "modal-paper",
      }}
    >
      <DialogTitle className="modal-title">
        <Box className="title-content">
          <Box className="title-left">
            <EditIcon className="title-icon" />
            <Typography variant="h6" component="span">
              Edit File
            </Typography>
          </Box>
          <Button
            onClick={handleClose}
            className="close-button"
            disabled={loading}
          >
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent className="modal-content">
          {error && (
            <Alert severity="error" className="error-alert">
              {error}
            </Alert>
          )}

          <Box className="form-field">
            <TextField
              label="File Name"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              fullWidth
              required
              disabled={loading}
              className="form-input"
              helperText="Enter the new name for the file"
            />
          </Box>

          <Box className="form-field">
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
              disabled={loading}
              className="form-input"
              helperText="Optional description for the file"
            />
          </Box>

          <Box className="file-info">
            <Typography variant="body2" color="textSecondary">
              <strong>Original Name:</strong> {selectedFile.originalName}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <strong>Type:</strong>{" "}
              {selectedFile.extension?.toUpperCase() || "Unknown"}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <strong>Size:</strong>{" "}
              {((selectedFile.size || 0) / 1024).toFixed(2)} KB
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions className="modal-actions">
          <Button
            onClick={handleClose}
            disabled={loading}
            className="cancel-button"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !fileName.trim()}
            className="submit-button"
          >
            {loading ? (
              <>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                Updating...
              </>
            ) : (
              "Update File"
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditFileModal;

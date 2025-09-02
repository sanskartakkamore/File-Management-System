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
import { folderAPI } from "../../services/api";
import "./Modal.css";

const EditFolderModal = () => {
  const { state, actions } = useApp();
  const [folderName, setFolderName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isOpen = Boolean(state.editingFolder);
  const selectedFolder = state.editingFolder;

  useEffect(() => {
    if (isOpen && selectedFolder) {
      setFolderName(selectedFolder.name || "");
      setDescription(selectedFolder.description || "");
      setError("");
    }
  }, [isOpen, selectedFolder]);

  const handleClose = () => {
    if (loading) return;

    actions.setEditingFolder(null);
    setFolderName("");
    setDescription("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!folderName.trim()) {
      setError("Folder name is required");
      return;
    }

    if (!selectedFolder) return;

    setLoading(true);
    setError("");

    try {
      await folderAPI.updateFolder(selectedFolder._id, {
        name: folderName.trim(),
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
      setError(error.response?.data?.message || "Failed to update folder");
    } finally {
      setLoading(false);
    }
  };

  if (!selectedFolder) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      className="edit-folder-modal"
      PaperProps={{
        className: "modal-paper",
      }}
    >
      <DialogTitle className="modal-title">
        <Box className="title-content">
          <Box className="title-left">
            <EditIcon className="title-icon" />
            <Typography variant="h6" component="span">
              Edit Folder
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
              label="Folder Name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              fullWidth
              required
              disabled={loading}
              className="form-input"
              helperText="Enter the new name for the folder"
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
              helperText="Optional description for the folder"
            />
          </Box>

          <Box className="folder-info">
            <Typography variant="body2" color="textSecondary">
              <strong>Current Path:</strong> {selectedFolder.path || "/"}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <strong>Created:</strong>{" "}
              {new Date(selectedFolder.createdAt).toLocaleDateString()}
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
            disabled={loading || !folderName.trim()}
            className="submit-button"
          >
            {loading ? (
              <>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                Updating...
              </>
            ) : (
              "Update Folder"
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditFolderModal;

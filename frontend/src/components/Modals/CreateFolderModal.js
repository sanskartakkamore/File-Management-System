import React, { useState } from "react";
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
import {
  CreateNewFolder as FolderIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useApp } from "../../contexts/AppContext";
import { folderAPI } from "../../services/api";
import "./Modal.css";

const CreateFolderModal = () => {
  const { state, actions } = useApp();
  const [folderName, setFolderName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isOpen = state.modals.createFolder;

  const handleClose = () => {
    if (loading) return;

    actions.setModal("createFolder", false);
    setFolderName("");
    setDescription("");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!folderName.trim()) {
      setError("Folder name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await folderAPI.createFolder({
        name: folderName.trim(),
        description: description.trim(),
        parentId: state.currentFolder?._id || null,
      });

      // Refresh all data to reflect the new folder
      await Promise.all([
        actions.fetchFolderTree(),
        actions.fetchFolders(),
        actions.fetchFiles(),
      ]);

      // Close modal and reset form
      handleClose();

      // Folder created successfully
    } catch (error) {
      setError(error.response?.data?.message || "Failed to create folder");
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (event) => {
    setFolderName(event.target.value);
    if (error) setError("");
  };

  const handleDescriptionChange = (event) => {
    setDescription(event.target.value);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      className="create-folder-modal"
      PaperProps={{
        className: "modal-paper",
      }}
    >
      <DialogTitle className="modal-title">
        <Box className="title-content">
          <Box className="title-left">
            <FolderIcon className="title-icon" />
            <Typography variant="h6" component="span">
              Create Folder
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

          <Box className="form-group">
            <Typography variant="body2" className="field-label">
              Name *
            </Typography>
            <TextField
              fullWidth
              placeholder="Folder name"
              value={folderName}
              onChange={handleNameChange}
              disabled={loading}
              autoFocus
              className="form-field"
              inputProps={{
                maxLength: 100,
              }}
            />
          </Box>

          <Box className="form-group">
            <Typography variant="body2" className="field-label">
              Description
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Folder Description"
              value={description}
              onChange={handleDescriptionChange}
              disabled={loading}
              className="form-field"
              inputProps={{
                maxLength: 500,
              }}
            />
            <Typography variant="caption" className="field-helper">
              {description.length}/500 characters
            </Typography>
          </Box>

          {state.currentFolder && (
            <Box className="location-info">
              <Typography variant="body2" className="location-label">
                Location:
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
            disabled={loading}
            className="cancel-button"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !folderName.trim()}
            className="create-button"
          >
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Create"
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateFolderModal;

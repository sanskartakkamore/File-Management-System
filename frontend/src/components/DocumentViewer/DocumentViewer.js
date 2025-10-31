import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Toolbar,
  Tooltip,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Fullscreen as FullscreenIcon,
} from "@mui/icons-material";
import { useApp } from "../../contexts/AppContext";
import { fileAPI } from "../../services/api";
import "./DocumentViewer.css";

const DocumentViewer = () => {
  const { state, actions } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(100);

  const { selectedFile } = state;

  useEffect(() => {
    if (selectedFile) {
      setLoading(true);
      setError(null);

      // Simulate loading time for better UX
      const timer = setTimeout(() => {
        setLoading(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [selectedFile]);

  const handleClose = () => {
    actions.setSelectedFile(null);
  };

  // Viewer toggle is handled from header

  const handleDownload = async () => {
    if (!selectedFile) return;

    try {
      const response = await fileAPI.downloadFile(selectedFile._id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", selectedFile.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError("Failed to download file");
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  const handleFullscreen = () => {
    if (!selectedFile) return;

    const url = fileAPI.getFileUrl(selectedFile.filename);
    window.open(url, "_blank");
  };

  //

  const isPreviewable = (mimetype) => {
    return (
      mimetype?.startsWith("image/") ||
      mimetype === "application/pdf" ||
      mimetype?.startsWith("text/") ||
      mimetype === "application/json" ||
      // Microsoft Office formats
      mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || // .docx
      mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || // .xlsx
      mimetype ===
        "application/vnd.openxmlformats-officedocument.presentationml.presentation" || // .pptx
      mimetype === "application/msword" || // .doc
      mimetype === "application/vnd.ms-excel" || // .xls
      mimetype === "application/vnd.ms-powerpoint" || // .ppt
      // Other document formats
      mimetype === "application/rtf" || // .rtf
      mimetype === "application/vnd.oasis.opendocument.text" || // .odt
      mimetype === "application/vnd.oasis.opendocument.spreadsheet" || // .ods
      mimetype === "application/vnd.oasis.opendocument.presentation" // .odp
    );
  };

  const isOfficeDocument = (mimetype) => {
    return (
      mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || // .docx
      mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || // .xlsx
      mimetype ===
        "application/vnd.openxmlformats-officedocument.presentationml.presentation" || // .pptx
      mimetype === "application/msword" || // .doc
      mimetype === "application/vnd.ms-excel" || // .xls
      mimetype === "application/vnd.ms-powerpoint" || // .ppt
      mimetype === "application/rtf" || // .rtf
      mimetype === "application/vnd.oasis.opendocument.text" || // .odt
      mimetype === "application/vnd.oasis.opendocument.spreadsheet" || // .ods
      mimetype === "application/vnd.oasis.opendocument.presentation" // .odp
    );
  };

  const getFileUrl = () => {
    if (!selectedFile) return "";
    return fileAPI.getFileUrl(selectedFile.filename);
  };

  const renderFileContent = () => {
    if (!selectedFile) return null;

    const { mimetype } = selectedFile;
    const fileUrl = getFileUrl();

    if (loading) {
      return (
        <Box className="viewer-loading">
          <CircularProgress size={48} />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Loading preview...
          </Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Box className="viewer-error">
          <Alert severity="error" className="error-alert">
            {error}
          </Alert>
        </Box>
      );
    }

    if (!isPreviewable(mimetype)) {
      return (
        <Box className="viewer-not-supported">
          <Typography variant="h6" className="not-supported-title">
            Preview not available
          </Typography>
          <Typography variant="body2" className="not-supported-subtitle">
            This file type cannot be previewed. You can download it to view the
            content.
          </Typography>
          <IconButton
            onClick={handleDownload}
            className="download-button"
            size="large"
          >
            <DownloadIcon />
          </IconButton>
        </Box>
      );
    }

    if (mimetype?.startsWith("image/")) {
      return (
        <Box className="image-viewer">
          <img
            src={fileUrl}
            alt={selectedFile.name}
            className="preview-image"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top left",
            }}
            onError={() => setError("Failed to load image")}
          />
        </Box>
      );
    }

    if (isOfficeDocument(mimetype)) {
      // For Office documents, show a specialized preview with download option
      return (
        <Box className="viewer-not-supported office-document-preview">
          <Typography variant="h6" className="not-supported-title">
            {selectedFile.extension.toUpperCase()} Document
          </Typography>
          <Typography variant="body2" className="not-supported-subtitle">
            This {selectedFile.extension.toUpperCase()} document is ready to
            view. Click download to open it with your preferred application.
          </Typography>
          <Box className="office-preview-actions">
            <IconButton
              onClick={handleDownload}
              className="download-button"
              size="large"
            >
              <DownloadIcon />
            </IconButton>
            <Typography variant="body2" sx={{ mt: 1, color: "#666" }}>
              Download to view
            </Typography>
          </Box>
          <Box
            className="file-details"
            sx={{ mt: 3, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}
          >
            <Typography variant="body2">
              <strong>File:</strong> {selectedFile.name}
            </Typography>
            <Typography variant="body2">
              <strong>Size:</strong> {formatFileSize(selectedFile.size)}
            </Typography>
            <Typography variant="body2">
              <strong>Type:</strong> {selectedFile.extension.toUpperCase()}{" "}
              Document
            </Typography>
          </Box>
        </Box>
      );
    }

    if (mimetype === "application/pdf" || mimetype?.startsWith("text/")) {
      return (
        <iframe
          id="file-viewer-iframe"
          src={fileUrl}
          title={selectedFile.name}
          className="preview-iframe"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top left",
            width: `${(100 / zoom) * 100}%`,
            height: `${(100 / zoom) * 100}%`,
          }}
          onError={() => setError("Failed to load file")}
        />
      );
    }

    return null;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (!selectedFile) {
    return (
      <Box className="document-viewer no-selection">
        <Box className="no-selection-content">
          <Typography variant="h6" className="no-selection-title">
            Select a file to preview
          </Typography>
          <Typography variant="body2" className="no-selection-subtitle">
            Click on any file from the list to view its content here.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Paper className="document-viewer" elevation={2}>
      {/* Header Toolbar */}
      <Toolbar className="viewer-toolbar">
        <Box className="toolbar-left">
          <Typography variant="h6" className="file-title" noWrap>
            {selectedFile.name}
          </Typography>
          <Box
            className="file-meta"
            title={`${formatFileSize(
              selectedFile.size
            )} • ${selectedFile.extension.toUpperCase()}`}
          >
            <Typography variant="caption" className="file-info" noWrap>
              {formatFileSize(selectedFile.size)}
            </Typography>
            <span className="meta-separator">•</span>
            <Typography variant="caption" className="file-info" noWrap>
              {selectedFile.extension.toUpperCase()}
            </Typography>
          </Box>
        </Box>

        <Box className="toolbar-right">
          {isPreviewable(selectedFile.mimetype) &&
            !isOfficeDocument(selectedFile.mimetype) && (
              <>
                <Tooltip title="Zoom Out">
                  <IconButton
                    onClick={handleZoomOut}
                    disabled={zoom <= 50}
                    className="toolbar-button"
                  >
                    <ZoomOutIcon />
                  </IconButton>
                </Tooltip>

                <Typography variant="body2" className="zoom-text">
                  {zoom}%
                </Typography>

                <Tooltip title="Zoom In">
                  <IconButton
                    onClick={handleZoomIn}
                    disabled={zoom >= 200}
                    className="toolbar-button"
                  >
                    <ZoomInIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Open in New Tab">
                  <IconButton
                    onClick={handleFullscreen}
                    className="toolbar-button"
                  >
                    <FullscreenIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}

          <Tooltip title="Download">
            <IconButton onClick={handleDownload} className="toolbar-button">
              <DownloadIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Close">
            <IconButton onClick={handleClose} className="toolbar-button">
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>

      {/* File Content */}
      <Box className="viewer-content">{renderFileContent()}</Box>
    </Paper>
  );
};

export default DocumentViewer;


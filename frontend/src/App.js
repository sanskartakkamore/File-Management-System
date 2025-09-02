import React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Box } from "@mui/material";
import { AppProvider, useApp } from "./contexts/AppContext";
import Header from "./components/Header/Header";
import Sidebar from "./components/Sidebar/Sidebar";
import MainContent from "./components/MainContent/MainContent";
import DocumentViewer from "./components/DocumentViewer/DocumentViewer";
import CreateFolderModal from "./components/Modals/CreateFolderModal";
import UploadFileModal from "./components/Modals/UploadFileModal";
import UploadProgressModal from "./components/Modals/UploadProgressModal";
import EditFileModal from "./components/Modals/EditFileModal";
import EditFolderModal from "./components/Modals/EditFolderModal";
import FilterPanel from "./components/Common/FilterPanel";
import "./App.css";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

const AppContent = () => {
  const { state, actions } = useApp();

  return (
    <Box
      className={`app ${state.sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}
    >
      {/* Header */}
      <Header />

      {/* Main Layout */}
      <Box className="app-body">
        {/* Sidebar */}
        <Sidebar />

        {/* Content Area */}
        <Box
          className={`content-area ${
            state.viewerOpen ? "viewer-open" : "viewer-closed"
          }`}
        >
          {/* Main Content */}
          <Box className="main-content-container">
            <MainContent />
          </Box>

          {/* Document Viewer */}
          <Box
            className={`document-viewer-container ${
              state.viewerOpen ? "open" : "closed"
            }`}
          >
            <DocumentViewer />
          </Box>
        </Box>
      </Box>

      {/* Modals */}
      <CreateFolderModal />
      <UploadFileModal />
      <UploadProgressModal />
      <EditFileModal />
      <EditFolderModal />

      {/* Filter Modal */}
      <FilterPanel
        open={state.filterPanelOpen}
        onClose={() => actions.setFilterPanel(false)}
      />
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;

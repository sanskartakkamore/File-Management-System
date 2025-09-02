import React, { createContext, useContext, useReducer, useEffect } from "react";
import { folderAPI, fileAPI, createEventSource } from "../services/api";

// Initial state
const initialState = {
  // Navigation
  currentFolder: null,
  breadcrumb: [],

  // Data
  folders: [],
  files: [],
  folderTree: {
    folders: [],
    rootFiles: [],
  },

  // UI State
  selectedFile: null,
  selectedFolder: null,
  sidebarOpen: true,
  expandedFolders: [], // Track expanded folders in main content
  viewerOpen: true, // Preview panel open/closed
  // Focus/expansion helpers
  // When set programmatically (e.g., via filter focus), drives which rows are pre-expanded

  // Pagination
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },

  // Loading states
  loading: {
    folders: false,
    files: false,
    tree: false,
    upload: false,
  },

  // Filters
  fileType: "",
  filters: {},
  filterPanelOpen: false,

  // Upload progress
  uploadProgress: [],

  // Modals
  modals: {
    createFolder: false,
    uploadFile: false,
    editFile: false,
    editFolder: false,
  },

  // Editing states
  editingFile: null,
  editingFolder: null,

  // Error handling
  error: null,
};

// Action types
const actionTypes = {
  // Loading actions
  SET_LOADING: "SET_LOADING",

  // Data actions
  SET_FOLDERS: "SET_FOLDERS",
  SET_FILES: "SET_FILES",
  SET_FOLDER_TREE: "SET_FOLDER_TREE",
  ADD_FOLDER: "ADD_FOLDER",
  ADD_FILE: "ADD_FILE",
  UPDATE_FOLDER: "UPDATE_FOLDER",
  UPDATE_FILE: "UPDATE_FILE",
  DELETE_FOLDER: "DELETE_FOLDER",
  DELETE_FILE: "DELETE_FILE",

  // Navigation actions
  SET_CURRENT_FOLDER: "SET_CURRENT_FOLDER",
  SET_BREADCRUMB: "SET_BREADCRUMB",

  // Selection actions
  SET_SELECTED_FILE: "SET_SELECTED_FILE",
  SET_SELECTED_FOLDER: "SET_SELECTED_FOLDER",

  // Editing actions
  SET_EDITING_FILE: "SET_EDITING_FILE",
  SET_EDITING_FOLDER: "SET_EDITING_FOLDER",

  // UI actions
  TOGGLE_SIDEBAR: "TOGGLE_SIDEBAR",
  SET_PAGINATION: "SET_PAGINATION",
  SET_FILE_TYPE: "SET_FILE_TYPE",
  SET_FILTERS: "SET_FILTERS",
  SET_FILTER_PANEL: "SET_FILTER_PANEL",
  TOGGLE_VIEWER: "TOGGLE_VIEWER",
  SET_VIEWER_OPEN: "SET_VIEWER_OPEN",

  // Upload actions
  SET_UPLOAD_PROGRESS: "SET_UPLOAD_PROGRESS",
  ADD_UPLOAD_PROGRESS: "ADD_UPLOAD_PROGRESS",
  UPDATE_UPLOAD_PROGRESS: "UPDATE_UPLOAD_PROGRESS",
  REMOVE_UPLOAD_PROGRESS: "REMOVE_UPLOAD_PROGRESS",

  // Modal actions
  SET_MODAL: "SET_MODAL",

  // Expand/Collapse actions
  TOGGLE_FOLDER_EXPANSION: "TOGGLE_FOLDER_EXPANSION",

  // Error actions
  SET_ERROR: "SET_ERROR",
  CLEAR_ERROR: "CLEAR_ERROR",
  SET_EXPANDED_FOLDERS: "SET_EXPANDED_FOLDERS",
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value,
        },
      };

    case actionTypes.SET_FOLDERS:
      return {
        ...state,
        folders: action.payload.data,
        pagination: action.payload.pagination || state.pagination,
      };

    case actionTypes.SET_FILES:
      return {
        ...state,
        files: action.payload.data,
        pagination: action.payload.pagination || state.pagination,
      };

    case actionTypes.SET_FOLDER_TREE:
      return {
        ...state,
        folderTree: action.payload,
      };

    case actionTypes.ADD_FOLDER:
      return {
        ...state,
        folders: [...state.folders, action.payload],
        folderTree: updateTreeWithNewFolder(state.folderTree, action.payload),
      };

    case actionTypes.ADD_FILE:
      return {
        ...state,
        files: [...state.files, action.payload],
      };

    case actionTypes.UPDATE_FOLDER:
      return {
        ...state,
        folders: state.folders.map((folder) =>
          folder._id === action.payload._id ? action.payload : folder
        ),
        folderTree: updateTreeWithUpdatedFolder(
          state.folderTree,
          action.payload
        ),
      };

    case actionTypes.UPDATE_FILE:
      return {
        ...state,
        files: state.files.map((file) =>
          file._id === action.payload._id ? action.payload : file
        ),
      };

    case actionTypes.DELETE_FOLDER:
      return {
        ...state,
        folders: state.folders.filter(
          (folder) => folder._id !== action.payload
        ),
        folderTree: removeFromTree(state.folderTree, action.payload),
      };

    case actionTypes.DELETE_FILE:
      return {
        ...state,
        files: state.files.filter((file) => file._id !== action.payload),
      };

    case actionTypes.SET_CURRENT_FOLDER:
      return {
        ...state,
        currentFolder: action.payload,
      };

    case actionTypes.SET_BREADCRUMB:
      return {
        ...state,
        breadcrumb: action.payload,
      };

    case actionTypes.SET_SELECTED_FILE:
      return {
        ...state,
        selectedFile: action.payload,
      };

    case actionTypes.SET_SELECTED_FOLDER:
      return {
        ...state,
        selectedFolder: action.payload,
      };

    case actionTypes.SET_EDITING_FILE:
      return {
        ...state,
        editingFile: action.payload,
      };

    case actionTypes.SET_EDITING_FOLDER:
      return {
        ...state,
        editingFolder: action.payload,
      };

    case actionTypes.TOGGLE_SIDEBAR:
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen,
      };

    case actionTypes.TOGGLE_VIEWER:
      return {
        ...state,
        viewerOpen: !state.viewerOpen,
      };

    case actionTypes.SET_VIEWER_OPEN:
      return {
        ...state,
        viewerOpen: Boolean(action.payload),
      };

    case actionTypes.SET_PAGINATION:
      return {
        ...state,
        pagination: {
          ...state.pagination,
          ...action.payload,
        },
      };

    // Removed SET_SEARCH usage

    case actionTypes.SET_FILE_TYPE:
      return {
        ...state,
        fileType: action.payload,
      };

    case actionTypes.SET_FILTERS:
      return {
        ...state,
        filters: action.payload,
      };

    case actionTypes.SET_FILTER_PANEL:
      return {
        ...state,
        filterPanelOpen: action.payload,
      };

    case actionTypes.SET_UPLOAD_PROGRESS:
      return {
        ...state,
        uploadProgress: action.payload,
      };

    case actionTypes.ADD_UPLOAD_PROGRESS:
      return {
        ...state,
        uploadProgress: [...state.uploadProgress, action.payload],
      };

    case actionTypes.UPDATE_UPLOAD_PROGRESS:
      return {
        ...state,
        uploadProgress: state.uploadProgress.map((upload) =>
          upload.fileId === action.payload.fileId
            ? { ...upload, ...action.payload }
            : upload
        ),
      };

    case actionTypes.REMOVE_UPLOAD_PROGRESS:
      return {
        ...state,
        uploadProgress: state.uploadProgress.filter(
          (upload) => upload.fileId !== action.payload
        ),
      };

    case actionTypes.SET_MODAL:
      return {
        ...state,
        modals: {
          ...state.modals,
          [action.payload.modal]: action.payload.open,
        },
      };

    case actionTypes.TOGGLE_FOLDER_EXPANSION:
      const folderId = action.payload;
      const expandedFolders = state.expandedFolders.includes(folderId)
        ? state.expandedFolders.filter((id) => id !== folderId)
        : [...state.expandedFolders, folderId];
      return {
        ...state,
        expandedFolders,
      };

    case actionTypes.SET_EXPANDED_FOLDERS:
      return {
        ...state,
        expandedFolders: Array.isArray(action.payload) ? action.payload : [],
      };

    case actionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
      };

    case actionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// Helper functions for tree operations
const updateTreeWithNewFolder = (tree, newFolder) => {
  if (!newFolder.parentId) {
    return [...tree, { ...newFolder, children: [], hasChildren: false }];
  }

  return tree.map((node) => {
    if (node._id === newFolder.parentId) {
      return {
        ...node,
        children: [
          ...(node.children || []),
          { ...newFolder, children: [], hasChildren: false },
        ],
        hasChildren: true,
      };
    }
    if (node.children) {
      return {
        ...node,
        children: updateTreeWithNewFolder(node.children, newFolder),
      };
    }
    return node;
  });
};

const updateTreeWithUpdatedFolder = (tree, updatedFolder) => {
  return tree.map((node) => {
    if (node._id === updatedFolder._id) {
      return { ...node, ...updatedFolder };
    }
    if (node.children) {
      return {
        ...node,
        children: updateTreeWithUpdatedFolder(node.children, updatedFolder),
      };
    }
    return node;
  });
};

const removeFromTree = (tree, folderId) => {
  return tree
    .filter((node) => node._id !== folderId)
    .map((node) => ({
      ...node,
      children: node.children ? removeFromTree(node.children, folderId) : [],
    }));
};

// Create context
const AppContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Actions
  const actions = {
    // Loading actions
    setLoading: (key, value) => {
      dispatch({ type: actionTypes.SET_LOADING, payload: { key, value } });
    },

    // Data actions
    setFolders: (data, pagination) => {
      dispatch({
        type: actionTypes.SET_FOLDERS,
        payload: { data, pagination },
      });
    },

    setFiles: (data, pagination) => {
      dispatch({ type: actionTypes.SET_FILES, payload: { data, pagination } });
    },

    setFolderTree: (tree) => {
      dispatch({ type: actionTypes.SET_FOLDER_TREE, payload: tree });
    },

    addFolder: (folder) => {
      dispatch({ type: actionTypes.ADD_FOLDER, payload: folder });
    },

    addFile: (file) => {
      dispatch({ type: actionTypes.ADD_FILE, payload: file });
    },

    updateFolder: (folder) => {
      dispatch({ type: actionTypes.UPDATE_FOLDER, payload: folder });
    },

    updateFile: (file) => {
      dispatch({ type: actionTypes.UPDATE_FILE, payload: file });
    },

    deleteFolder: (folderId) => {
      dispatch({ type: actionTypes.DELETE_FOLDER, payload: folderId });
    },

    deleteFile: (fileId) => {
      dispatch({ type: actionTypes.DELETE_FILE, payload: fileId });
    },

    // Navigation actions
    setCurrentFolder: (folder) => {
      dispatch({ type: actionTypes.SET_CURRENT_FOLDER, payload: folder });
    },

    setBreadcrumb: (breadcrumb) => {
      dispatch({ type: actionTypes.SET_BREADCRUMB, payload: breadcrumb });
    },

    // Selection actions
    setSelectedFile: (file) => {
      dispatch({ type: actionTypes.SET_SELECTED_FILE, payload: file });
    },

    setSelectedFolder: (folder) => {
      dispatch({ type: actionTypes.SET_SELECTED_FOLDER, payload: folder });
    },

    // Editing actions
    setEditingFile: (file) => {
      dispatch({ type: actionTypes.SET_EDITING_FILE, payload: file });
    },

    setEditingFolder: (folder) => {
      dispatch({ type: actionTypes.SET_EDITING_FOLDER, payload: folder });
    },

    // UI actions
    toggleSidebar: () => {
      dispatch({ type: actionTypes.TOGGLE_SIDEBAR });
    },

    toggleViewer: () => {
      dispatch({ type: actionTypes.TOGGLE_VIEWER });
    },

    setViewerOpen: (open) => {
      dispatch({ type: actionTypes.SET_VIEWER_OPEN, payload: open });
    },

    setPagination: (pagination) => {
      dispatch({ type: actionTypes.SET_PAGINATION, payload: pagination });
    },

    //

    setFileType: (fileType) => {
      dispatch({ type: actionTypes.SET_FILE_TYPE, payload: fileType });
    },

    setFilters: (filters) => {
      dispatch({ type: actionTypes.SET_FILTERS, payload: filters });
    },

    setFilterPanel: (open) => {
      dispatch({ type: actionTypes.SET_FILTER_PANEL, payload: open });
    },

    // Upload actions
    setUploadProgress: (progress) => {
      dispatch({ type: actionTypes.SET_UPLOAD_PROGRESS, payload: progress });
    },

    addUploadProgress: (upload) => {
      dispatch({ type: actionTypes.ADD_UPLOAD_PROGRESS, payload: upload });
    },

    updateUploadProgress: (upload) => {
      dispatch({ type: actionTypes.UPDATE_UPLOAD_PROGRESS, payload: upload });
    },

    removeUploadProgress: (fileId) => {
      dispatch({ type: actionTypes.REMOVE_UPLOAD_PROGRESS, payload: fileId });
    },

    // Modal actions
    setModal: (modal, open) => {
      dispatch({ type: actionTypes.SET_MODAL, payload: { modal, open } });
    },

    // Expand/Collapse actions
    toggleFolderExpansion: (folderId) => {
      dispatch({
        type: actionTypes.TOGGLE_FOLDER_EXPANSION,
        payload: folderId,
      });
    },

    setExpandedFolders: (folderIds) => {
      dispatch({ type: actionTypes.SET_EXPANDED_FOLDERS, payload: folderIds });
    },

    // Error actions
    setError: (error) => {
      dispatch({ type: actionTypes.SET_ERROR, payload: error });
    },

    clearError: () => {
      dispatch({ type: actionTypes.CLEAR_ERROR });
    },

    // API actions
    fetchFolders: async (params = {}) => {
      try {
        actions.setLoading("folders", true);

        const queryParams = {
          page: state.pagination.page,
          limit: state.pagination.limit,
          search: state.filters?.search,
          ...state.filters,
          ...params,
        };

        // Only constrain to a parent when NOT searching
        if (state.filters?.search) {
          // Global search: let backend search across all levels (no parentId)
        } else if (state.currentFolder) {
          // In a specific folder without search: fetch only that folder's children
          queryParams.parentId = state.currentFolder._id;
        } else {
          // In root view without search: fetch only root-level folders
          queryParams.parentId = null;
        }

        const response = await folderAPI.getFolders(queryParams);
        actions.setFolders(response.data.data, response.data.pagination);
      } catch (error) {
        actions.setError(
          error.response?.data?.message || "Failed to fetch folders"
        );
      } finally {
        actions.setLoading("folders", false);
      }
    },

    fetchFiles: async (params = {}) => {
      try {
        actions.setLoading("files", true);

        // If no current folder is selected (All Files view), don't pass folderId to get all files
        const queryParams = {
          page: state.pagination.page,
          limit: state.pagination.limit,
          search: state.filters?.search,
          type: state.fileType,
          ...state.filters,
          ...params,
        };

        // Only add folderId if we're in a specific folder AND not searching
        if (!state.filters?.search && state.currentFolder) {
          queryParams.folderId = state.currentFolder._id;
        }
        // If currentFolder is null, we don't pass folderId to get files from all folders

        const response = await fileAPI.getFiles(queryParams);
        actions.setFiles(response.data.data, response.data.pagination);
      } catch (error) {
        actions.setError(
          error.response?.data?.message || "Failed to fetch files"
        );
      } finally {
        actions.setLoading("files", false);
      }
    },

    fetchFolderTree: async () => {
      try {
        actions.setLoading("tree", true);
        const response = await folderAPI.getFolderTree();

        // Handle both old and new API response formats
        const treeData = response.data.data;

        if (treeData.folders) {
          // New format with separate folders and rootFiles
          actions.setFolderTree({
            folders: treeData.folders,
            rootFiles: treeData.rootFiles || [],
          });
        } else {
          // Old format - just folders
          actions.setFolderTree({
            folders: treeData,
            rootFiles: [],
          });
        }
      } catch (error) {
        actions.setError(
          error.response?.data?.message || "Failed to fetch folder tree"
        );
      } finally {
        actions.setLoading("tree", false);
      }
    },

    navigateToFolder: async (folder, extraParams = {}) => {
      try {
        actions.setCurrentFolder(folder);

        // Update breadcrumb
        if (folder) {
          const response = await folderAPI.getBreadcrumb(folder._id);
          actions.setBreadcrumb(response.data.data);
        } else {
          actions.setBreadcrumb([]);
        }

        // Fetch folder contents with any provided filter params to avoid stale state
        await Promise.all([
          actions.fetchFolders(extraParams),
          actions.fetchFiles(extraParams),
        ]);
      } catch (error) {
        actions.setError(
          error.response?.data?.message || "Failed to navigate to folder"
        );
      }
    },

    // Delete actions
    deleteFolderAPI: async (folderId) => {
      try {
        actions.setLoading("delete", true);
        await folderAPI.deleteFolder(folderId);

        // Clear selection if the deleted folder was selected
        if (state.selectedFolder?._id === folderId) {
          actions.setSelectedFolder(null);
        }
        if (state.currentFolder?._id === folderId) {
          actions.navigateToFolder(null); // Navigate to root
        }

        // Refresh all data to reflect the deletion
        await Promise.all([
          actions.fetchFolderTree(),
          actions.fetchFolders(),
          actions.fetchFiles(),
        ]);
      } catch (error) {
        console.error("Failed to delete folder:", error);
        actions.setError(
          error.response?.data?.message || "Failed to delete folder"
        );
      } finally {
        actions.setLoading("delete", false);
      }
    },

    deleteFileAPI: async (fileId) => {
      try {
        actions.setLoading("delete", true);
        await fileAPI.deleteFile(fileId);

        // Clear selection if the deleted file was selected
        if (state.selectedFile?._id === fileId) {
          actions.setSelectedFile(null);
        }

        // Refresh all data to reflect the deletion
        await Promise.all([
          actions.fetchFolderTree(),
          actions.fetchFolders(),
          actions.fetchFiles(),
        ]);
      } catch (error) {
        console.error("Failed to delete file:", error);
        actions.setError(
          error.response?.data?.message || "Failed to delete file"
        );
      } finally {
        actions.setLoading("delete", false);
      }
    },
  };

  // Set up SSE for upload progress
  useEffect(() => {
    const eventSource = createEventSource();

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "upload_progress":
            actions.updateUploadProgress({
              fileId: data.fileId,
              progress: data.progress,
              filename: data.filename,
              size: data.size,
            });
            break;

          case "upload_complete":
            actions.removeUploadProgress(data.fileId);
            if (data.file) {
              actions.addFile(data.file);
            }
            break;

          case "upload_error":
            actions.removeUploadProgress(data.fileId);
            actions.setError(data.message);
            break;

          default:
            break;
        }
      } catch (error) {
        console.error("Error parsing SSE data:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE error:", error);
    };

    return () => {
      eventSource.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initial data fetch
  useEffect(() => {
    actions.fetchFolderTree();
    actions.fetchFolders();
    actions.fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

export default AppContext;

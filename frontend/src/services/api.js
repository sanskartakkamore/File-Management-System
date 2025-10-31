import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Folder API
export const folderAPI = {
  // Get all folders with pagination and search
  getFolders: (params = {}) => {
    return api.get("/folders", { params });
  },

  // Get folder tree for sidebar
  getFolderTree: () => {
    return api.get("/folders/tree");
  },

  // Get single folder with contents
  getFolder: (id, params = {}) => {
    return api.get(`/folders/${id}`, { params });
  },

  // Create new folder
  createFolder: (data) => {
    return api.post("/folders", data);
  },

  // Update folder
  updateFolder: (id, data) => {
    return api.put(`/folders/${id}`, data);
  },

  // Delete folder
  deleteFolder: (id) => {
    return api.delete(`/folders/${id}`);
  },

  // Get breadcrumb path
  getBreadcrumb: (id) => {
    return api.get(`/folders/${id}/breadcrumb`);
  },
};

// File API
export const fileAPI = {
  // Get all files with pagination and search
  getFiles: (params = {}) => {
    return api.get("/files", { params });
  },

  // Get single file
  getFile: (id) => {
    return api.get(`/files/${id}`);
  },

  // Upload file
  uploadFile: (formData, onUploadProgress) => {
    const uploadId =
      formData.get("tempFileId") || `${Date.now()}-${Math.random()}`;
    const file = formData.get("file");
    const size = typeof file?.size === "number" ? file.size : undefined;
    return api.post("/files/upload-stream", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        "X-Upload-Id": uploadId,
        ...(size ? { "X-File-Size": String(size) } : {}),
      },
      onUploadProgress,
    });
  },

  // Update file
  updateFile: (id, data) => {
    return api.put(`/files/${id}`, data);
  },

  // Delete file
  deleteFile: (id) => {
    return api.delete(`/files/${id}`);
  },

  // Move file
  moveFile: (id, data) => {
    return api.post(`/files/${id}/move`, data);
  },

  // Download file
  downloadFile: (id) => {
    return api.get(`/files/${id}/content`, {
      responseType: "blob",
    });
  },

  // Get file URL for preview
  getFileUrl: (filename) => {
    return `${API_BASE_URL.replace("/api", "")}/uploads/${filename}`;
  },
};

// SSE for upload progress
export const createEventSource = () => {
  const eventSource = new EventSource(`${API_BASE_URL}/progress/stream`);
  return eventSource;
};

export default api;


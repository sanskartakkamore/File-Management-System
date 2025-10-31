# File Management System

A comprehensive full-stack file management application built with React.js and Node.js, featuring advanced file organization, real-time upload progress, and document preview capabilities.

## 🚀 Features

### Frontend Features

- **Modern React UI** with Material-UI components
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Four-Section Layout**:
  - Top: Breadcrumb navigation and action buttons (filters via Filter Panel)
  - Left: Hierarchical folder and document tree with stats
  - Middle: File and folder table with pagination
  - Right: Document viewer with iframe support
- **Real-time Upload Progress** using Server-Sent Events (SSE)
- **Advanced Search & Filtering** by name, type, and date
- **Document Preview** for PDFs, images, and text files
- **Drag & Drop File Upload**
- **Two-way Navigation** between sidebar and main content
- **Context Menus** for file and folder operations

### Backend Features

- **RESTful API** with Express.js
- **MongoDB Database** with Mongoose ODM
- **File Upload Handling** with Multer
- **Real-time Progress Tracking** via Server-Sent Events
- **Hierarchical Folder Structure** with efficient queries
- **Pagination & Search** for large datasets
- **File Type Validation** and size limits
- **Error Handling** with meaningful messages

## 🛠 Technology Stack

### Frontend

- **React 19** - UI framework
- **Material-UI (MUI 7)** - Component library and icons
- **React Redux** - State management
- **Axios** - HTTP client
- **React Dropzone** - File upload handling
- **CSS3** - Custom styling

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Multer** - File upload middleware
- **CORS** - Cross-origin resource sharing
- **UUID** - Unique identifier generation

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** (v4.4 or higher)

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/sanskartakkamore/File-Management-System.git
cd file-management-app
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# No environment configuration required by default.
# The API base URL is set to http://localhost:5000/api in src/services/api.js
```

### 4. Database Setup

Make sure MongoDB is running on your system:

```bash
# Start MongoDB service (varies by OS)
# On macOS with Homebrew:
brew services start mongodb-community

# On Linux:
sudo systemctl start mongod

# On Windows:
net start MongoDB
```

## 🏃‍♂️ How to Run

### Method 1: Run Both Services Separately

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm start
```

<!-- Root-level combined scripts are not configured. Start frontend and backend separately as above. -->

The application will be available at:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api (endpoints listed below)

## 📚 API Endpoints

### Folder Endpoints

```
GET    /api/folders              # Get folders with pagination
GET    /api/folders/tree         # Get folder hierarchy tree
GET    /api/folders/:id          # Get single folder with contents
POST   /api/folders              # Create new folder
PUT    /api/folders/:id          # Update folder
DELETE /api/folders/:id          # Delete folder
GET    /api/folders/:id/breadcrumb # Get folder breadcrumb path
```

### File Endpoints

```
GET    /api/files                # Get files with pagination and filters
GET    /api/files/:id            # Get single file details
POST   /api/files/upload         # Upload file(s)
PUT    /api/files/:id            # Update file metadata
DELETE /api/files/:id            # Delete file
POST   /api/files/:id/move       # Move file to different folder
GET    /api/files/:id/download   # Download file
```

### Real-time Endpoints

```
GET    /api/progress/stream      # Server-Sent Events for upload progress
```

## 🗄 Database Schema

### Folder Collection

```javascript
{
  name: String,           // Folder name
  description: String,    // Optional description
  parentId: ObjectId,     // Reference to parent folder (null for root)
  path: String,           // Full path to folder
  level: Number,          // Depth level in hierarchy
  children: [ObjectId],   // Array of child folder IDs
  files: [ObjectId],      // Array of file IDs in this folder
  createdAt: Date,
  updatedAt: Date
}
```

### File Collection

```javascript
{
  name: String,           // Display name
  originalName: String,   // Original filename
  description: String,    // Optional description
  filename: String,       // Unique filename on disk
  path: String,           // Full file path
  mimetype: String,       // File MIME type
  size: Number,           // File size in bytes
  extension: String,      // File extension
  folderId: ObjectId,     // Reference to parent folder (null for root)
  uploadProgress: Number, // Upload progress percentage
  isUploaded: Boolean,    // Upload completion status
  createdAt: Date,
  updatedAt: Date
}
```

## 🎯 Usage Guide

### Creating Folders

1. Click the "Create" button in the top header
2. Select "Create Folder" from the dropdown
3. Enter folder name and optional description
4. The folder will be created in the current directory

### Uploading Files

1. Click the "Create" button in the top header
2. Select "Upload File" from the dropdown
3. Drag and drop files or click to browse
4. Edit file names and descriptions as needed
5. Click "Upload" to start the process
6. Monitor progress in the Upload Progress modal

### Navigating Folders

- Use the folder tree in the left sidebar
- Click on folders in the main content area
- Use breadcrumb navigation in the header
- Two-way synchronization between sidebar and main content

### Viewing Files

- Click on any file in the main content area
- The document viewer (right panel) will display:
  - PDF files: Embedded preview
  - Images: Full-size preview with zoom controls
  - Text files: Content preview
  - Other files: Download option

### Search and Filtering

- Open the Filter Panel from the header to search by name and apply filters
- Filter by file type (All Files, Images, Documents, PDFs)
- Date range and description filters supported
- Works across both folders and files

## 🔧 Configuration

### Environment Variables

**Backend (.env):**

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/filemanagement
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Frontend (.env):**

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### File Upload Limits

- Maximum file size: 50MB per file
- Supported formats: Images, PDFs, Documents, Text files
- Multiple file upload supported

### Pagination Settings

- Default page size: 10 items
- Configurable options: 5, 10, 25, 50 items per page

## 🧪 Testing

### Manual Testing Checklist

- [ ] Create folder functionality
- [ ] Upload file functionality
- [ ] File and folder navigation
- [ ] Search and filtering
- [ ] Document preview
- [ ] Upload progress tracking
- [ ] Responsive design on different screen sizes
- [ ] Error handling

### Testing the APIs

Use tools like Postman or curl to test the API endpoints:

```bash
# Test folder creation
curl -X POST http://localhost:5000/api/folders \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Folder", "description": "Test description"}'

# Test file upload
curl -X POST http://localhost:5000/api/files/upload \
  -F "file=@/path/to/your/file.pdf" \
  -F "name=Test File"
```

## 🚨 Troubleshooting

### Common Issues

**MongoDB Connection Error:**

- Ensure MongoDB service is running
- Check connection string in environment variables
- Verify MongoDB is accessible on the specified port

**File Upload Issues:**

- Check file size limits (50MB max)
- Verify supported file types
- Ensure uploads directory has write permissions

**CORS Errors:**

- Verify frontend URL in backend CORS configuration
- Check if both frontend and backend are running on expected ports

**Port Already in Use:**

- Change ports in environment variables
- Kill existing processes using the ports

### Performance Optimization

- For large file uploads, consider implementing chunked uploads
- Use database indexing for better search performance
- Implement Redis caching for frequently accessed data
- Consider CDN for file serving in production

## 🔐 Security Considerations

- File type validation implemented
- File size limits enforced
- Input sanitization for folder/file names
- Consider adding authentication/authorization for production use
- Implement virus scanning for uploaded files in production

## 🚀 Production Deployment

### Environment Setup

1. Set up production MongoDB instance
2. Configure environment variables for production
3. Set up file storage (consider cloud storage like AWS S3)
4. Configure reverse proxy (nginx/Apache)
5. Set up SSL certificates
6. Configure logging and monitoring

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Your Name** - _Sanskar Takkamore_ - https://github.com/sanskartakkamore

## 🙏 Acknowledgments

- Material-UI for the beautiful component library
- React team for the amazing framework
- MongoDB team for the flexible database
- Express.js team for the robust web framework

---

**Happy coding! 🎉**


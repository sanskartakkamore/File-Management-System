const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const connectDB = require("./config/database");

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// SSE endpoint for upload progress
const clients = new Map();

app.get("/api/progress/stream", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin":
      process.env.FRONTEND_URL || "http://localhost:3000",
    "Access-Control-Allow-Credentials": "true",
  });

  const clientId = Date.now().toString();
  clients.set(clientId, res);

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: "connected", clientId })}\n\n`);

  // Handle client disconnect
  req.on("close", () => {
    clients.delete(clientId);
  });
});

// Function to broadcast upload progress
const broadcastProgress = (data) => {
  clients.forEach((client) => {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  });
};

// Make broadcastProgress available globally
app.set("broadcastProgress", broadcastProgress);

// Routes
app.use("/api/folders", require("./routes/folders"));
app.use("/api/files", require("./routes/files"));

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Error:", error);

  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File size too large",
    });
  }

  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal Server Error",
  });
});

// Handle 404
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

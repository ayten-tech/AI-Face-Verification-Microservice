//Application entry point and Express server initialization:

//start flow of this file:
// 1. Load .env → 2. Create Express app → 3. Add middleware
// → 4. Register routes → 5. Load AI model → 6. Start server
// → 7. Log ready message
require('dotenv').config(); // Load environment variables
const express = require('express');
const fileUpload = require('express-fileupload');
const appRoutes = require('./routes');
const { loadModel } = require('./services/embeddingService'); // Preload the ONNX model

const app = express(); // <--- ADD THIS LINE HERE
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());//parse json request bodies
app.use(fileUpload()); // For handling multipart/form-data (image uploads)

// register Routes
app.use('/', appRoutes);

// Defines Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Face Verification Service is running.' });
});

// Start the server
//pre loads ONNX model in memory before any requests sent ,so that any request is sent the onnx model is loaded and doesn't take time to reload
async function startServer() {
  try {
    await loadModel(); // Load the ONNX model when the server starts
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API accessible at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
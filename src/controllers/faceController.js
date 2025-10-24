//no buisness logic:
//validates data (image is uploaded and file type ex: png,etc..)
//calls service layer
//returns JSON response
const faceService = require('../services/faceService');
async function encodeFaceController(req, res) {
  try {
    if (!req.files || Object.keys(req.files).length === 0 || !req.files.image) {
      return res.status(400).json({ success: false, message: 'No image file uploaded.' });
    }

    const imageFile = req.files.image; // 'image' is the field name from multipart/form-data

    // Ensure the image is a valid type
    if (!['image/jpeg', 'image/png'].includes(imageFile.mimetype)) {
        return res.status(400).json({ success: false, message: 'Only JPEG and PNG images are allowed.' });
    }

    const result = await faceService.encodeFace(imageFile.data); // imageFile.data is the buffer

    res.status(200).json(result);
  } catch (error) {
    console.error('Error handling /encode request:', error);
    if (error.message.includes('No face detected')) {
        return res.status(400).json({ success: false, message: error.message });
    }
    if (error.message.includes('ONNX model not found')) {
        return res.status(500).json({ success: false, message: 'Internal server error: Face embedding model not found.' });
    }
    // Return more detailed error for debugging
    res.status(500).json({ 
      success: false, 
      error: `Embedding extraction failed: ${error.message}` 
    });
  }
}

async function compareFaceController(req, res) {
  try {
    // Validate that an image file was uploaded
    if (!req.files || Object.keys(req.files).length === 0 || !req.files.image) {
      return res.status(400).json({ success: false, error: 'No image file uploaded.' });
    }

    // Validate that storedEmbedding was provided
    if (!req.body.storedEmbedding) {
      return res.status(400).json({ success: false, error: 'storedEmbedding is required.' });
    }

    const imageFile = req.files.image;
    const storedEmbedding = req.body.storedEmbedding;

    // Ensure the image is a valid type
    if (!['image/jpeg', 'image/png'].includes(imageFile.mimetype)) {
      return res.status(400).json({ success: false, error: 'Only JPEG and PNG images are allowed.' });
    }

    // Call the service layer with default threshold of 0.6
    const result = await faceService.compareFace(imageFile.data, storedEmbedding, 0.6);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error handling /compare request:', error);
    
    // Handle specific error messages
    if (error.message.includes('No face detected')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    if (error.message.includes('Invalid embedding format')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    if (error.message.includes('ONNX model not found')) {
      return res.status(500).json({ success: false, error: 'Internal server error: Face embedding model not found.' });
    }
    
    // Generic error response
    res.status(500).json({ 
      success: false, 
      error: `Face comparison failed: ${error.message}` 
    });
  }
}

module.exports = {
  encodeFaceController,
  compareFaceController,
};
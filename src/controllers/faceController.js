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

module.exports = {
  encodeFaceController,
};
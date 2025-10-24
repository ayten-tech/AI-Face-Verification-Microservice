const Jimp = require('jimp');
// For a real-world scenario, you'd use a library like face-api.js
// along with a pre-trained face detection model here.
// e.g., const faceapi = require('face-api.js');
// await faceapi.nets.tinyFaceDetector.loadFromDisk('./models');

/**
 * Calculate average brightness of an image
 * Returns value between 0 (black) and 255 (white)
 */
function calculateAverageBrightness(image) {
  let totalBrightness = 0;
  let pixelCount = 0;
  
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
    // Calculate perceived brightness using luminosity formula
    const r = this.bitmap.data[idx];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
    totalBrightness += brightness;
    pixelCount++;
  });
  
  return totalBrightness / pixelCount;
}

/**
 * Validate image quality before processing
 * Checks: file size, dimensions, lighting
 */
async function validateImageQuality(imageBuffer) {
  const errors = [];
  
  // 1. File size check (max 10MB)
  if (imageBuffer.length > 10 * 1024 * 1024) {
    errors.push('Image file too large (maximum 10MB allowed)');
  }
  
  // 2. Minimum file size check (avoid empty files)
  if (imageBuffer.length < 1024) {
    errors.push('Image file too small or empty');
  }
  
  // 3. Try to decode image
  let image;
  try {
    image = await Jimp.read(imageBuffer);
  } catch (e) {
    throw new Error('Unable to read image file - it may be corrupted or in an unsupported format');
  }
  
  // 4. Brightness/Lighting check
  const { width, height } = image.bitmap;
  const avgBrightness = calculateAverageBrightness(image);
  console.log(`Image brightness: ${avgBrightness.toFixed(2)}`);
  
  if (avgBrightness < 40) {
    errors.push('Image is too dark - please retake photo in better lighting conditions');
  } else if (avgBrightness > 220) {
    errors.push('Image is overexposed - please reduce lighting or avoid direct sunlight');
  } else if (avgBrightness < 60) {
    console.warn('Warning: Image lighting is on the darker side, may affect accuracy');
  } else if (avgBrightness > 200) {
    console.warn('Warning: Image lighting is on the brighter side, may affect accuracy');
  }
  
  if (errors.length > 0) {
    throw new Error(errors.join('. '));
  }
  
  return { 
    valid: true, 
    brightness: avgBrightness,
    dimensions: { width, height }
  };
}

/**
 * Detect if the face area contains enough facial features
 * This checks if the detected region likely contains a full face
 */
function validateFaceCompleteness(image, faceBox) {
  // Calculate what percentage of the image the face occupies
  const imageArea = image.bitmap.width * image.bitmap.height;
  const faceArea = faceBox.width * faceBox.height;
  const facePercentage = (faceArea / imageArea) * 100;
  
  console.log(`Face occupies ${facePercentage.toFixed(2)}% of image`);
  
  // Face should occupy at least 10% of the image
  if (facePercentage < 10) {
    throw new Error('Face is too small in the image - please move closer or crop the image');
  }
  
  // Face shouldn't occupy more than 95% (likely too close or cropped)
  if (facePercentage > 95) {
    console.warn('Warning: Face is very close to camera, ensure entire face is visible');
  }
  
  // Check if face is too close to edges (might be cut off)
  const margin = 10; // pixels
  if (faceBox.x < margin || faceBox.y < margin) {
    throw new Error('Face appears to be cut off at the edge - please center the face in the frame');
  }
  
  if (faceBox.x + faceBox.width > image.bitmap.width - margin ||
      faceBox.y + faceBox.height > image.bitmap.height - margin) {
    throw new Error('Face appears to be cut off at the edge - please center the face in the frame');
  }
  
  // Check face aspect ratio (faces should be roughly rectangular)
  const aspectRatio = faceBox.width / faceBox.height;
  if (aspectRatio < 0.5 || aspectRatio > 2.0) {
    throw new Error('Detected face has unusual proportions - please ensure full face is visible');
  }
  
  return true;
}

// Placeholder for face detection. In a real app, this would use a DL model.
async function detectFace(imageBuffer) {
  // First, validate image quality
  const qualityCheck = await validateImageQuality(imageBuffer);
  console.log('Image quality validation passed:', qualityCheck);
  
  // In a real application, you'd use a face detection model here.
  // This is a simplified placeholder that assumes the entire image is the face
  // or that a face detection library would return bounding box.
  // For demonstration, we'll assume a face is detected and provide dummy coordinates.
  const image = await Jimp.read(imageBuffer);
  const width = image.bitmap.width;
  const height = image.bitmap.height;

  // Simulate a face detection result (e.g., a single large face in the center)
  // In reality, this would come from a model's output.
  const faceBox = {
    x: Math.floor(width * 0.1),
    y: Math.floor(height * 0.1),
    width: Math.floor(width * 0.8),
    height: Math.floor(height * 0.8),
  };

  // Validate face completeness
  validateFaceCompleteness(image, faceBox);
  
  return faceBox; // Returns null if no face detected
}

async function preprocessFace(imageBuffer, faceBox) {
  try {
    const image = await Jimp.read(imageBuffer);

    if (!faceBox) {
      throw new Error('No face detected to preprocess.');
    }

    // Crop the face
    const croppedImage = image.crop(faceBox.x, faceBox.y, faceBox.width, faceBox.height);

    // Resize to 112x112
    const resizedImage = croppedImage.resize(112, 112, Jimp.RESIZE_BICUBIC);

    // Create interleaved RGB data for NHWC format: [Height, Width, Channels]
    // Each pixel's R, G, B values are stored consecutively
    const normalizedPixels = new Float32Array(112 * 112 * 3);
    let pixelIndex = 0;

    resizedImage.scan(0, 0, resizedImage.bitmap.width, resizedImage.bitmap.height, function(x, y, idx) {
        // Normalize and store RGB values consecutively for each pixel
        normalizedPixels[pixelIndex++] = this.bitmap.data[idx] / 255.0;     // R
        normalizedPixels[pixelIndex++] = this.bitmap.data[idx + 1] / 255.0; // G
        normalizedPixels[pixelIndex++] = this.bitmap.data[idx + 2] / 255.0; // B
    });

    return normalizedPixels;
  } catch (error) {
    console.error('Error during face preprocessing:', error);
    throw error;
  }
}

module.exports = {
  detectFace,
  preprocessFace,
};
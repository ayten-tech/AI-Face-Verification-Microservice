const ort = require('onnxruntime-node'); // Changed from 'onnxjs'
const path = require('path');
const fs = require('fs');

let session = null;

async function loadModel() {
  const modelPath = process.env.MODEL_PATH || './models/arcface.onnx';
  const fullModelPath = path.resolve(modelPath);

  if (!fs.existsSync(fullModelPath)) {
    throw new Error(`ONNX model not found at: ${fullModelPath}. Please ensure 'arcface.onnx' is in the 'models/' directory.`);
  }

  try {
    // For onnxruntime-node, create is an async static method
    session = await ort.InferenceSession.create(fullModelPath);
    console.log('ONNX model loaded successfully using onnxruntime-node.');
  } catch (error) {
    console.error('Error loading ONNX model with onnxruntime-node:', error);
    throw error;
  }
}

async function generateEmbedding(preprocessedFaceData) {
  if (!session) {
    await loadModel(); // Ensure model is loaded if not already
  }

  // ONNX models expect input in specific formats.
  // This ArcFace model expects input in NHWC format: [batch, height, width, channels]
  // Our preprocessedFaceData is an interleaved flat array of RGB values for 112x112 pixels
  // We need to reshape it into a Tensor.

  // For onnxruntime-node, the Tensor constructor is more explicit:
  // It expects data type, data array, and shape.
  const inputTensor = new ort.Tensor(
    'float32', // Data type
    Float32Array.from(preprocessedFaceData),
    [1, 112, 112, 3]  // Shape: [batch_size, height, width, channels] (NHWC)
  );

  // The input name from the error message is 'input_1'
  const feeds = { 'input_1': inputTensor };

  try {
    const results = await session.run(feeds);
    // The output name might vary. If your model's output is not 'output',
    // you might need to find the correct key, e.g., Object.keys(results)[0]
    // For ArcFace, 'output' is common.
    const outputName = Object.keys(results)[0]; // Dynamically get the first output name
    const embedding = results[outputName].data;
    return Array.from(embedding);
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

module.exports = {
  loadModel,
  generateEmbedding,
};
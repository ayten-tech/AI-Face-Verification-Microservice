const { detectFace, preprocessFace } = require('../utils/imageProcessor');
const { generateEmbedding } = require('./embeddingService');
const db = require('../config/db');

//encodeface func:
//detect face in image
//preprocess face using imageProcessor.preprocessFace()
//generate embedding using using AI model to generate a 512-dimension facial embedding
//store in database with insert query
//return result with id, embedding , timestamp
async function encodeFace(imageBuffer) {
  try {
    // 1. Detect a face in the image
    const faceBox = await detectFace(imageBuffer);
    if (!faceBox) {
      throw new Error('No face detected in the image.');
    }

    // 2. Preprocess the face (crop, resize to 112x112, normalize)
    const preprocessedFaceData = await preprocessFace(imageBuffer, faceBox);

    // 3. Use the AI model to generate a 512-dimension facial embedding
    const embedding = await generateEmbedding(preprocessedFaceData);

    // 4. Store it in PostgreSQL DB
    const insertQuery = `
      INSERT INTO face_embeddings (embedding)
      VALUES ($1)
      RETURNING id, created_at;
    `;
    const result = await db.query(insertQuery, [JSON.stringify(embedding)]);
    console.log(`Embedding stored with ID: ${result.rows[0].id}`);

    return { 
      success: true, 
      id: result.rows[0].id,
      embedding,
      created_at: result.rows[0].created_at
    };
  } catch (error) {
    console.error('Error in encodeFace service:', error);
    throw error;
  }
}

module.exports = {
  encodeFace,
};

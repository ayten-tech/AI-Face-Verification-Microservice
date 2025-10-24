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

// Helper function to calculate cosine similarity between two embeddings
function cosineSimilarity(embedding1, embedding2) {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have the same length');
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }

  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);

  if (norm1 === 0 || norm2 === 0) {
    throw new Error('Cannot calculate similarity with zero-norm vectors');
  }

  return dotProduct / (norm1 * norm2);
}

// compareFace func:
// detect face in new image
// preprocess and generate new embedding
// parse stored embedding from JSON string
// calculate cosine similarity
// compare against threshold and return result
async function compareFace(imageBuffer, storedEmbeddingString, threshold = 0.8) {
  try {
    // 1. Detect face in the new verification image
    const faceBox = await detectFace(imageBuffer);
    if (!faceBox) {
      throw new Error('No face detected in the image.');
    }

    // 2. Preprocess the face
    const preprocessedFaceData = await preprocessFace(imageBuffer, faceBox);

    // 3. Generate new embedding
    const newEmbedding = await generateEmbedding(preprocessedFaceData);

    // 4. Parse the stored embedding from JSON string to numerical array ,so it's ready for mathermatical comparison (cosine similarity)
    let storedEmbedding;
    try {
      storedEmbedding = JSON.parse(storedEmbeddingString);
      if (!Array.isArray(storedEmbedding)) {
        throw new Error('Stored embedding must be an array');
      }
    } catch (error) {
      throw new Error('Invalid embedding format: Must be a valid JSON array');
    }

    // 5. Calculate cosine similarity
    const similarity = cosineSimilarity(newEmbedding, storedEmbedding);

    // 6. Compare against threshold
    const isMatch = similarity >= threshold;

    return {
      success: true,
      isMatch,
      similarity: parseFloat(similarity.toFixed(4))
    };
  } catch (error) {
    console.error('Error in compareFace service:', error);
    throw error;
  }
}

module.exports = {
  encodeFace,
  compareFace,
};

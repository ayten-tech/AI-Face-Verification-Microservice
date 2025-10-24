-- Face Encoding Database Schema

-- Create database (run this separately as superuser if needed)
-- CREATE DATABASE face_verification_db;

-- Connect to database
-- \c face_verification_db;

-- Create extension for UUID support (optional)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Face embeddings table
CREATE TABLE IF NOT EXISTS face_embeddings (
    id SERIAL PRIMARY KEY,
    embedding JSONB NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_face_embeddings_created_at ON face_embeddings(created_at DESC);


-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_face_embeddings_updated_at
    BEFORE UPDATE ON face_embeddings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- Comments
COMMENT ON TABLE face_embeddings IS 'Stores face embeddings';
COMMENT ON COLUMN face_embeddings.embedding IS 'Face embedding vector stored as JSONB array';
COMMENT ON COLUMN face_embeddings.metadata IS 'Additional metadata like image source, device info, etc.';


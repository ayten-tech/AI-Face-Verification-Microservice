# AI Face Verification Microservice

## 📹 Demo Video
Watch the complete walkthrough: [Loom Video Demo](https://www.loom.com/share/21c5c668e1ea4680b599ca40e878b2ca)

## 📋 Overview
A robust face verification microservice built with Node.js that provides face encoding and comparison capabilities. The service uses deep learning models to generate face embeddings and verify identities with high accuracy.

### Key Features
- **Face Encoding**: Generate 512-dimensional face embeddings from images
- **Face Verification**: Compare faces with configurable similarity thresholds
- **Image Quality Validation**: Automatic checks for brightness, size, and face completeness
- **PostgreSQL Integration**: Store and manage face embeddings
- **Docker Support**: Containerized deployment with Docker Compose
- **Production Ready**: Health checks, error handling, and logging

---

## 🤖 AI Model

**Model Used**: **ArcFace (arcface.onnx)**

ArcFace is a state-of-the-art face recognition model developed by InsightFace. It uses additive angular margin loss to obtain highly discriminative features for face recognition.

- **Input**: 112x112 RGB face image
- **Output**: 512-dimensional face embedding vector
- **Format**: ONNX (Open Neural Network Exchange)
- **Source**: InsightFace project

The model is stored in the `models/` directory and loaded using ONNX Runtime for optimized inference.

---

## 🚀 Installation

### Prerequisites
- **Node.js**: v16 or higher
- **PostgreSQL**: v15 or higher
- **npm**: v7 or higher

### Option 1: Local Installation

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd AI-Face-Verification-Microservice
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Set Up PostgreSQL Database

Start PostgreSQL and create the database:
```bash
# Start PostgreSQL (method varies by OS)
# macOS (Homebrew)
brew services start postgresql@15

# Ubuntu/Debian
sudo service postgresql start
```

Create the database and schema:
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE face_verification_db;

# Exit psql
\q

# Run schema setup
psql -U postgres -d face_verification_db -f database/schema.sql
```

#### 4. Configure Environment Variables

Create a `.env` file in the root directory:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=face_verification_db
DB_USER=postgres
DB_PASSWORD=postgres
MODEL_PATH=./models/arcface.onnx
NODE_ENV=development
```

#### 5. Ensure Model File Exists
Verify that `models/arcface.onnx` exists in the project directory. This file should be included in the repository.

#### 6. Start the Server
```bash
npm start

# For development with auto-reload:
npm run dev
```

The API will be available at `http://localhost:3000`

### Option 2: Docker Installation

#### 1. Prerequisites
- Docker Desktop or Docker Engine installed
- Docker Compose v2.0+

#### 2. Start Services
```bash
# Build and start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

#### 3. Stop Services
```bash
docker-compose down

# Remove volumes (database data)
docker-compose down -v
```

The API will be available at `http://localhost:3000`

---

## 🧪 Testing the Complete Workflow
### Visual Examples of Test Results

#### Output /encode endpoint

![Encode Endpoint Output](screenshots/encode%20screenshot.png)

*Screenshot showing successful face encoding with the complete embedding array response*
**Save this embedding** - you'll need it for comparison. Copy the entire embedding array and paste it in compare endpoint as shown down in pictures

#### 1. Identical Picture Comparison

![Identical Picture](screenshots/identical%20picture.png)

*Comparing the exact same image - shows perfect match with highest similarity score*

#### 2. Same Person Different Photo

![Same Person Different Photo](screenshots/same%20person%20different%20picture.png)

*Comparing different photos of the same person - shows successful match*

#### 3. Different Person

![Different Person](screenshots/another%20person.png)

*Comparing photos of different people - correctly identifies as non-match*

#### 4. Poor Lighting

![Poor Lighting](screenshots/poor%20lightning.png)

*Image quality validation rejects images with inadequate lighting*

#### 5. Not Full Face

![Not Full Face](screenshots/not%20full%20face.png)

*System rejects partial or cut-off faces to ensure quality*

#### 6. Wrong Format

![Wrong Format](screenshots/wrong%20format.png)

*API rejects unsupported file formats*

#### 7. No Image Uploaded

![No Image Uploaded](screenshots/no%20image%20uploaded.png)

*Error handling when no image file is provided*

---

**Step 3: Encode Second Face (Same Person)**
Encode another image of Leo:

```bash
curl -X POST http://localhost:3000/encode \
  -F "image=@images/leo/copy.png"
```

**Step 4: Compare Faces - Same Person (Should Match)**
Compare the second image against the stored embedding from Step 2:

```bash
curl -X POST http://localhost:3000/compare \
  -F "image=@images/leo/copy.png" \
  -F "storedEmbedding=[0.123,-0.456,0.789,...]"  # Use embedding from Step 2
```

**Expected Response (Match):**
```json
{
  "success": true,
  "message": "Face verified successfully.",
  "match": true,
  "similarity": 0.87,
  "threshold": 0.6
}
```

**Step 5: Verify with Different Photo (Same Person)**
Test with Leo's third image:

```bash
curl -X POST http://localhost:3000/compare \
  -F "image=@images/leo/images.jpeg" \
  -F "storedEmbedding=[0.123,-0.456,0.789,...]"  # Use embedding from Step 2
```

**Expected Response (Match):**
```json
{
  "success": true,
  "message": "Face verified successfully.",
  "match": true,
  "similarity": 0.82,
  "threshold": 0.6
}
```

**Step 6: Test with Different Person (Should Not Match)**
For a complete test, try encoding a different person's image:

```bash
# First encode your own photo or another person's photo
curl -X POST http://localhost:3000/encode \
  -F "image=@/path/to/different-person.jpg"

# Then compare against Leo's embedding
curl -X POST http://localhost:3000/compare \
  -F "image=@/path/to/different-person.jpg" \
  -F "storedEmbedding=[0.123,-0.456,0.789,...]"  # Leo's embedding
```

**Expected Response (No Match):**
```json
{
  "success": true,
  "message": "Face does not match.",
  "match": false,
  "similarity": 0.34,
  "threshold": 0.6
}
```

---

## 📡 API Endpoints

### 1. Health Check
**Endpoint:** `GET /health`

**Description:** Check if the service is running.

**Response:**
```json
{
  "status": "UP",
  "message": "Face Verification Service is running."
}
```

---

### 2. Encode Face
**Endpoint:** `POST /encode`

**Description:** Generate a face embedding from an uploaded image.

**Request:**
- **Content-Type:** `multipart/form-data`
- **Body Parameter:**
  - `image` (file): Image file (JPEG or PNG)

**Example:**
```bash
curl -X POST http://localhost:3000/encode \
  -F "image=@images/leo/first.png"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Face encoding successful.",
  "embedding": [0.123, -0.456, 0.789, ... /* 512 values */]
}
```

**Error Responses:**

**400 - No Image Uploaded:**
```json
{
  "success": false,
  "message": "No image file uploaded."
}
```

**400 - Invalid Image Format:**
```json
{
  "success": false,
  "message": "Only JPEG and PNG images are allowed."
}
```

**400 - No Face Detected:**
```json
{
  "success": false,
  "message": "No face detected in the image."
}
```

**400 - Quality Issues:**
```json
{
  "success": false,
  "message": "Image is too dark. Please use better lighting."
}
```

---

### 3. Compare Face
**Endpoint:** `POST /compare`

**Description:** Compare an uploaded face image against a stored embedding.

**Request:**
- **Content-Type:** `multipart/form-data`
- **Body Parameters:**
  - `image` (file): Image file (JPEG or PNG)
  - `storedEmbedding` (string): JSON array of 512 float values

**Example:**
```bash
curl -X POST http://localhost:3000/compare \
  -F "image=@images/leo/copy.png" \
  -F "storedEmbedding=[0.123,-0.456,0.789,...]"
```

**Success Response - Match (200):**
```json
{
  "success": true,
  "message": "Face verified successfully.",
  "match": true,
  "similarity": 0.87,
  "threshold": 0.6
}
```

**Success Response - No Match (200):**
```json
{
  "success": true,
  "message": "Face does not match.",
  "match": false,
  "similarity": 0.34,
  "threshold": 0.6
}
```

**Error Responses:**

**400 - Missing Parameters:**
```json
{
  "success": false,
  "error": "No image file uploaded."
}
```

**400 - Invalid Embedding:**
```json
{
  "success": false,
  "error": "Invalid embedding format. Expected array of 512 numbers."
}
```

---

## 🔍 Understanding Similarity Scores

The `/compare` endpoint returns a similarity score between 0 and 1:

- **0.9 - 1.0**: Extremely high confidence match (same person, same conditions)
- **0.7 - 0.9**: High confidence match (same person, different lighting/angle)
- **0.6 - 0.7**: Moderate confidence match (threshold boundary)
- **0.4 - 0.6**: Low confidence (likely different people)
- **0.0 - 0.4**: Very low confidence (definitely different people)

**Default Threshold:** 0.6 (configurable in the code)

---

## 🐳 Docker Deployment

### Architecture
The Docker setup includes:
- **PostgreSQL Database**: Stores face embeddings
- **Face Verification Service**: Node.js API
- **Persistent Volume**: Database data persistence
- **Health Checks**: Automatic service monitoring

### Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f face-verification-service
docker-compose logs -f postgres

# Check service health
docker-compose ps

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Stop and remove all data
docker-compose down -v

# Rebuild after code changes
docker-compose up -d --build
```

### Accessing Services

- **API**: http://localhost:3000
- **PostgreSQL**: localhost:5432
  - Database: `face_verification_db`
  - User: `postgres`
  - Password: `postgres`

---

## 📂 Project Structure

```
AI-Face-Verification-Microservice/
├── src/
│   ├── config/
│   │   └── db.js                  # Database configuration
│   ├── controllers/
│   │   └── faceController.js       # Request validation & response handling
│   ├── services/
│   │   ├── embeddingService.js     # ONNX model & embedding generation
│   │   └── faceService.js          # Business logic for face operations
│   ├── utils/
│   │   └── imageProcessor.js       # Face detection & image quality checks
│   ├── routes/
│   │   └── index.js                # API route definitions
│   └── server.js                   # Express server initialization
├── models/
│   └── arcface.onnx               # ArcFace face recognition model
├── database/
│   ├── schema.sql                 # PostgreSQL schema
│   └── db.js                      # Database connection (legacy)
├── images/
│   └── leo/                       # Test images
│       ├── first.png              # Reference image
│       ├── copy.png               # Verification image
│       ├── images.jpeg            # Alternative image
│       └── ZAR5ba74f...jpg        # Another test image
├── test_image_quality.js          # Image quality validation test
├── test_partial_face.js           # Partial face detection test
├── docker-compose.yml             # Docker orchestration
├── Dockerfile                     # Container image definition
├── package.json                   # Node.js dependencies
└── README.md                      # This file
```


---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

## 🙏 Acknowledgments

- **InsightFace** for the ArcFace model
- **ONNX Runtime** for efficient model inference
- **Express.js** for the web framework
- **PostgreSQL** for robust data storage

---

## 📞 Support

For issues, questions, or suggestions:
- Open an issue in the repository
- Watch the [demo video](https://www.loom.com/share/21c5c668e1ea4680b599ca40e878b2ca) for visual guidance

---

**Built with Node.js and Express server **


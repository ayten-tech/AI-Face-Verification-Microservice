# AI Face Encoding Microservice

A high-performance face encoding microservice using ArcFace ONNX model, Express.js, and PostgreSQL.

## Why This Is a Microservice

This follows microservice architecture principles:

✅ **Single Responsibility** - Focuses exclusively on face encoding, nothing else  
✅ **API-First Design** - Exposes RESTful APIs, consumable by any client  
✅ **Independent Database** - Owns its data in a dedicated PostgreSQL database  
✅ **Stateless** - No session state, enabling horizontal scaling  
✅ **Independently Deployable** - Can be deployed, scaled, and updated independently  
✅ **Containerized** - Docker support for easy deployment anywhere  
✅ **Cloud-Native** - Kubernetes manifests for orchestration  
✅ **Health Checks** - Proper liveness and readiness probes  
✅ **Technology Agnostic** - Clients don't care about implementation details  

## Features

- **Face Encoding**: Extract and store face embeddings in PostgreSQL
- **RESTful API**: Clean and intuitive REST endpoints
- **ONNX Runtime**: Fast inference using ONNX Runtime
- **Scalable**: Connection pooling and optimized for production
- **Containerized**: Docker and Docker Compose support
- **Kubernetes Ready**: K8s manifests with auto-scaling

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- Python 3.x (for ONNX model compatibility check)

## Installation

1. **Clone and navigate to the project**
   ```bash
   cd "AI Face-Verification Microservice"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Download the ArcFace ONNX model** (already done)
   ```bash
   # Model should be present as arcface.onnx
   ls -lh arcface.onnx
   ```

4. **Set up configuration**
   ```bash
   cp config.example.js config.js
   # Edit config.js with your database credentials
   ```

5. **Set up the database**
   ```bash
   # Create database
   createdb face_verification_db
   
   # Run schema
   npm run db:setup
   # OR manually:
   psql -U postgres -d face_verification_db -f database/schema.sql
   ```

## Configuration

Edit `config.js` (or set environment variables) with your settings:

```javascript
{
  server: {
    port: 3000,
    nodeEnv: 'development'
  },
  database: {
    host: 'localhost',
    port: 5432,
    database: 'face_verification_db',
    user: 'postgres',
    password: 'your_password'
  },
  faceEncoding: {
    modelPath: './models/arcface.onnx'
  }
}
```

## Deployment Options

### Option 1: Local Development

```bash
# Production
npm start

# Development (with auto-reload if nodemon is installed)
npm run dev
```

### Option 2: Docker Compose (Recommended)

```bash
# Build and start all services (app + database)
docker-compose up -d

# View logs
docker-compose logs -f face-verification-service

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

### Option 3: Docker Only

```bash
# Build image
docker build -t face-verification-service .

# Run container
docker run -d \
  -p 3000:3000 \
  -e DB_HOST=your-db-host \
  -e DB_PASSWORD=your-password \
  --name face-verification \
  face-verification-service
```

### Option 4: Kubernetes

```bash
# Apply all manifests
kubectl apply -f kubernetes/deployment.yaml

# Check status
kubectl get pods -l app=face-verification

# View logs
kubectl logs -l app=face-verification -f

# Scale replicas
kubectl scale deployment face-verification-service --replicas=5

# Delete deployment
kubectl delete -f kubernetes/deployment.yaml
```

The service will be available at `http://localhost:3000` (or your K8s ingress)

### API Endpoints

#### 1. Health Check
```bash
GET /health
```

Response:
```json
{
  "status": "ok",
  "message": "Face Encoding Service is running",
  "timestamp": "2025-10-22T21:30:00.000Z",
  "uptime": 3600.5,
  "version": "1.0.0"
}
```

#### Readiness Check (for K8s)
```bash
GET /ready
```

Response:
```json
{
  "status": "ready"
}
```

#### Metrics
```bash
GET /metrics
```

Response:
```json
{
  "uptime": 3600.5,
  "memory": {
    "rss": 52428800,
    "heapTotal": 20971520,
    "heapUsed": 15728640,
    "external": 1048576
  },
  "pid": 12345,
  "version": "1.0.0"
}
```

#### 2. Register a Face
```bash
POST /api/faces/register
Content-Type: multipart/form-data

Fields:
- image: (file) Image file
- userId: (string) User identifier
- metadata: (string, optional) Additional metadata
```

Example using curl:
```bash
curl -X POST http://localhost:3000/api/faces/register \
  -F "image=@path/to/photo.jpg" \
  -F "userId=user123" \
  -F "metadata={\"source\":\"mobile_app\"}"
```

Response:
```json
{
  "success": true,
  "message": "Face registered successfully",
  "faceId": 1,
  "userId": "user123"
}
```

#### 3. Verify a Face (1:1)
```bash
POST /api/faces/verify
Content-Type: multipart/form-data

Fields:
- image: (file) Image file to verify
- userId: (string) User identifier to verify against
```

Example:
```bash
curl -X POST http://localhost:3000/api/faces/verify \
  -F "image=@path/to/photo.jpg" \
  -F "userId=user123"
```

Response:
```json
{
  "verified": true,
  "similarity": 0.8234,
  "threshold": 0.6,
  "matchedFaceId": 1,
  "userId": "user123"
}
```


Response:
```json
{
  "identified": true,
  "similarity": 0.8234,
  "threshold": 0.6,
  "userId": "user123",
  "faceId": 1
}
```

#### 5. Get User's Faces
```bash
GET /api/users/:userId/faces
```

Example:
```bash
curl http://localhost:3000/api/users/user123/faces
```

Response:
```json
{
  "userId": "user123",
  "faces": [
    {
      "id": 1,
      "user_id": "user123",
      "metadata": {"source": "mobile_app"},
      "created_at": "2025-10-22T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

#### 6. Delete a Face
```bash
DELETE /api/faces/:faceId
```

Example:
```bash
curl -X DELETE http://localhost:3000/api/faces/1
```

Response:
```json
{
  "success": true,
  "message": "Face deleted successfully",
  "faceId": "1"
}
```

## Architecture

```
├── server.js                      # Main Express server
├── config.example.js              # Configuration template
├── Dockerfile                     # Container image definition
├── docker-compose.yml             # Multi-container orchestration
├── .dockerignore                  # Docker build exclusions
├── services/
│   └── faceService.js            # ONNX model inference logic
├── database/
│   ├── db.js                     # PostgreSQL connection pool
│   └── schema.sql                # Database schema
├── kubernetes/
│   └── deployment.yaml           # K8s deployment manifests
├── arcface.onnx                  # ArcFace model file (130MB)
└── package.json                  # Dependencies
```

### Microservice Integration Pattern

```
┌─────────────────┐
│   Web/Mobile    │
│   Application   │
└────────┬────────┘
         │ REST API
         ▼
┌─────────────────┐     ┌──────────────┐
│ API Gateway/    │────▶│   Face       │
│ Load Balancer   │     │ Verification │
└─────────────────┘     │ Microservice │
                        │  (This one)  │
                        └──────┬───────┘
                               │
                        ┌──────▼───────┐
                        │  PostgreSQL  │
                        │   Database   │
                        └──────────────┘
```

This service is designed to be **one component** in a larger microservices ecosystem. It communicates via REST APIs and can be discovered and consumed by other services.

## Face Encoding Flow

1. **Encoding**:
   - User uploads a face image
   - Face detection finds the face in the image
   - Crop and preprocess the face to 112x112 pixels
   - ArcFace model extracts 512-dimensional embedding
   - Embedding is stored in PostgreSQL with a unique ID

## Performance Tuning

### Database Optimization
- Use indexes on `created_at` for faster lookups
- Consider partitioning `face_embeddings` table for large datasets
- Use connection pooling (already implemented)

### Scalability

### Horizontal Scaling
```bash
# Docker Compose
docker-compose up -d --scale face-verification-service=3

# Kubernetes (with HPA)
# Auto-scales based on CPU/memory (already configured in deployment.yaml)
kubectl get hpa face-verification-hpa
```

### Additional Optimizations
- Deploy behind a load balancer (Nginx, HAProxy, or K8s Service)
- Use Redis for caching frequently accessed embeddings
- Consider using vector databases (pgvector, Milvus) for large-scale embedding storage
- Implement connection pooling (already included)
- Use CDN for serving static assets if needed

## Troubleshooting

### Model fails to load
- Ensure `arcface.onnx` is in the project root
- Check file permissions
- Verify ONNX Runtime installation: `npm list onnxruntime-node`

### Database connection errors
- Verify PostgreSQL is running: `pg_isready`
- Check credentials in `config.js`
- Ensure database exists: `psql -l`

### Low similarity scores
- Ensure images contain clear, frontal faces
- Check image preprocessing (size, normalization)
- Adjust similarity threshold in config

## Security Considerations

- Implement rate limiting for API endpoints
- Add authentication/authorization middleware
- Sanitize user inputs
- Use HTTPS in production
- Regularly backup the database
- Consider encrypting embeddings at rest

## License

ISC

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

fd
# AI Service API Reference

The AI Service is a high-performance Python FastAPI application responsible for image analysis and verification.

## Endpoints
Base Path: `/ai` (Internal network only)

### 1. Face Blurring
* **URL**: `/process/blur`
* **Method**: `POST`
* **Payload**: `multipart/form-data` (Image file)
* **Response**: Returns the processed image with all detected human faces obfuscated.

### 2. Deepfake Detection
* **URL**: `/verify/deepfake`
* **Method**: `POST`
* **Payload**: `multipart/form-data` (Image file)
* **Response**:
  ```json
  {
    "is_authentic": true,
    "confidence_score": 0.98,
    "artifacts_detected": []
  }
  ```

### 3. Image Similarity (Duplicate Check)
* **URL**: `/verify/uniqueness`
* **Method**: `POST`
* **Payload**: `multipart/form-data` (Image file)
* **Response**:
  ```json
  {
    "is_unique": true,
    "similarity_score": 0.05,
    "matched_with": null
  }
  ```

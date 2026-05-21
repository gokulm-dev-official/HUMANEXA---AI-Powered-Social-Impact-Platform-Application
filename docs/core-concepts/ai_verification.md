# AI Verification Pipeline

HUMANEXA leverages state-of-the-art artificial intelligence to maintain platform integrity, protect recipient privacy, and prevent charity fraud.

## 1. Automated Privacy (Face Blurring)
All images uploaded to HUMANEXA as Proof-of-Delivery (PoD) are automatically processed by our Python AI worker (using OpenCV) to detect and blur faces.
* **Why**: To ensure GDPR/CCPA compliance and protect the dignity of individuals receiving aid.
* **How**: Haar cascades and deep learning-based face detection pipelines run before the image is ever saved to standard storage.

## 2. Fraud Detection
To prevent the reuse of old or generic "proof" images:
* **Similarity Checks**: We use CLIP and image embedding comparisons to ensure the uploaded image has not been used in previous campaigns.
* **Deepfake Detection**: Analysis of image noise profiles and artifacts to detect synthesized images.
* **Metadata Verification**: EXIF data extraction confirms the time and location the photo was taken.

## 3. Geolocation Matching
Real-time GPS mapping ensures that the "Need" location and the "Delivery" location match within an acceptable radius, proving physical proximity and delivery.

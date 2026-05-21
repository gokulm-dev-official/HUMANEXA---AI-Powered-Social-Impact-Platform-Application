# Quickstart

Get HUMANEXA running locally for development and testing.

## Prerequisites
* Node.js 20+
* Python 3.10+
* MongoDB (Running locally on port 27017)
* Redis (Running locally on port 6379)

## 1. Clone the Repository
```bash
git clone https://github.com/gokulm-dev-official/HUMANEXA---AI-Powered-Social-Impact-Platform-Application.git
cd HUMANEXA---AI-Powered-Social-Impact-Platform-Application
```

## 2. Start the Backend API
The backend is a Node.js Express application.
```bash
cd backend
npm install
npm run dev
```

## 3. Start the AI Service
The AI service is a Python FastAPI application.
```bash
cd ai_service
# Create and activate virtual environment
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Start the service
python -m app.main
```

## 4. Start the Frontend
The frontend is a React Single Page Application (SPA).
```bash
cd frontend
npm install
npm run dev
```

You can now access the frontend at `http://localhost:5173`.

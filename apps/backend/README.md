# BetterMe Next-Gen (G-AI) — Backend API & AI Engine

## 1. Overview
FastAPI-based asynchronous backend providing core services for:
- User Profiling & BMR/TDEE 28-day Program Generation (`UC-1.1`, `UC-1.2`)
- Real-time Workout Companion & Pose Deviation Validation (`UC-2.4`)
- Nutrition Tracking & Calorie Balancing (`UC-3.1`, `UC-3.2`)
- US Navy Body Fat Calculator (`UC-4.1`)
- CBT Mental Well-being & AI Journal Integration (`UC-5.2`)

## 2. Directory Structure
```text
app/
├── api/          # Versioned API routes (v1 endpoints)
├── core/         # Settings, security, database session
├── models/       # SQLAlchemy / SQLModel database entities
├── schemas/      # Pydantic request & response validation schemas
├── services/     # Pure business logic and mathematical algorithms
└── main.py       # FastAPI application entrypoint
```

## 3. Running Locally
```bash
# Activate virtual environment
source .venv/bin/activate  # or .\.venv\Scripts\Activate.ps1 on Windows

# Install dependencies
pip install -r requirements.txt

# Start development server
uvicorn app.main:app --reload --port 8000
```
Open interactive Swagger documentation at: `http://localhost:8000/api/v1/docs`

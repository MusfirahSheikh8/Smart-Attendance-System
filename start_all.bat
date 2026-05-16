@echo off
echo Starting Smart Attendance System Services...
echo ==============================================

echo 1. Starting Node.js Backend Server (Port 3000)
start cmd /k "cd backend && npm run dev"

echo 2. Starting Python Face Recognition Microservice (Port 8000)
start cmd /k "cd python-service && python -m venv venv && call venv\Scripts\activate && pip install -r requirements.txt && python run.py"

echo 3. Starting Next.js Frontend App (Port 3001)
start cmd /k "cd frontend && npm install && npm run dev"

echo All services are starting up in separate windows.
echo - Node.js Backend: http://localhost:3000
echo - Python CV Service: http://localhost:8000
echo - Next.js Frontend: http://localhost:3000 (Check terminal output for exact port, typically 3000 or 3001 if 3000 is taken)
echo ==============================================
echo Press any key to close this launcher window...
pause >nul

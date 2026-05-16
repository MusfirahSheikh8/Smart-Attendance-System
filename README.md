# 🎓 Smart Attendance System with Face Recognition & Verification

Welcome to the fully integrated **Smart Attendance System**, built with a modern microservices architecture spanning across Node.js, Python, and Next.js. 

This repository represents the completed **Phase 5** of the application structure, integrating advanced Computer Vision with a robust backend and an intuitive user interface.

## 🔧 Architecture Overview

This project is separated into 4 distinct domains:

1. **Database** (`/database`)
   - Advanced relational database definitions containing triggers, procedures, views, and migrations.
   - Holds schemas for Users, Biometric Encodings, Access Logs, and OTP audit trails.
2. **Node.js Backbone API** (`/backend`)
   - Express.js / TypeScript Core Server.
   - Handles the principal business logic, JWT authentication, user management, and the transaction logic for marking attendance.
   - Integrates with an external Email/SMS service to send OTP validations dynamically.
3. **Python Vision Microservice** (`/python-service`)
   - A standalone Flask API specialized heavily in deep learning facial recognition natively compiled via `dlib` & `opencv-python`.
   - Compares captured images against multidimensional biometric encodings in real-time.
   - Tunable confidence score and spoofing thresholds.
4. **Next.js & Tailwind Interface** (`/frontend`)
   - React 19 / Next.js Framework handling the visual UX via Tailwind CSS and `lucide-react`.
   - Embedded `react-webcam` capturing physical hardware devices and dispatching Base64 matrix structures entirely over HTTP bypassing slow disk reads.
   - Secure Admin Dashboards visualizing live biometric traffic using `recharts`.

---

## 🚀 Getting Started

The platform utilizes interconnected ports in local development environments. To automatically bring all services online on Windows, we've provided an orchestration script:

### The Easy Way (Windows):
Double-click the `start_all.bat` file in the root directory. This will spawn three independent terminal windows targeting the respective services and their dependencies.

### The Manual Way:

#### 1. Setup Node.js Backend (Port 3000)
```bash
cd backend
npm install
npm run dev
```

#### 2. Setup Python Microservice (Port 8000)
*Ensure you have Python 3.9+ and C++ Build Tools installed for `dlib`.*
```bash
cd python-service
python -m venv venv
# Activate the environment
# Windows:
venv\Scripts\activate 
# Mac/Linux:
source venv/bin/activate
# Install deps
pip install -r requirements.txt
# Start the Face Recognition Server
python run.py
```

#### 3. Setup Next.js Frontend (Port 3001)
```bash
cd frontend
npm install
npm run dev
```

---

## 🛡️ Security Features implemented:
* **Liveness & Thresholding:** Statically mapped geometric facial distances reject photographic or 2D image spoofing.
* **OTP 2FA Authorization:** The system bridges the AI verification with an external validation vector (OTP sent to user's registered ID/Email) confirming the user wasn't unknowingly scanned from a distance.
* **Rate Limiting & Proxy Deterrence:** Admin dashboards track multiple failed attempts, logging the confidence score metadata immediately natively through the Node Router securely preventing dictionary attacks on the API.

> Note: Ensure you configure your `.env` files in both the `/backend` and `/python-service` folders before going to Production!

---

*System Completed — End of Phase 5 🎉*

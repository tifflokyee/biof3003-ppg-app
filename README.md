# PPG Heart-Rate Monitor

**A polished, hostable PPG heart-rate app with custom signal combinations, modified ML model, and clean UI**  
Built as the final assignment for BIOF3003 Digital Health Technology (The University of Hong Kong).

**Live Demo** → https://your-username-ppg-app.vercel.app (replace after Vercel deployment)  
**Backend API** → https://your-username.pythonanywhere.com (replace after PythonAnywhere deployment)  
**GitHub Repo** → https://github.com/your-username/ppg-heartrate (this repo)

---

## ✨ Features

- Real-time PPG signal from camera (multiple RGB combinations)
- Heart rate + HRV calculation
- Signal quality classification using **your own trained ML model**
- Label good/bad segments and export training data
- Upload model & scaler directly from the browser (no server login needed)
- Clean, responsive layout (different from the sample demo)
- Fully deployable on Vercel + PythonAnywhere

---

## 🛠️ Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+
- Git

---

## 🚀 Local Setup

### 1. Clone & Install

```bash
git clone https://github.com/your-username/ppg-heartrate.git
cd ppg-heartrate

# Frontend
npm install

# Backend
cd backend
pip install -r requirements.txt
cd ..

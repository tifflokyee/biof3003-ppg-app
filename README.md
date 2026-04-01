# PPG Heart-Rate Monitor

### Live Links
- **Frontend (Vercel)**: https://biof3003-ppg-app.vercel.app
- **Backend API (PythonAnywhere)**: https://tifflok.pythonanywhere.com
- **GitHub Repository**: https://github.com/tifflokyee/biof3003-ppg-app

---

## ✨ Features

- Real-time PPG signal from camera with multiple RGB combinations
- Heart rate and HRV calculation
- Signal quality classification using custom **RandomForestClassifier** model
- Label good/bad segments and export training data
- Upload model and scaler directly from the browser
- Clean, responsive, modified layout (different from sample)
- Fully deployable on Vercel + PythonAnywhere

---

## 🛠️ Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- Git

---

## Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/tifflokyee/biof3003-ppg-app.git
cd biof3003-ppg-app
```






































AreaChanges MadeDetailsSignal CombinationsAdded 3 extra modesredOnly, greenOnly, 2xG-R-B (plus default)Feature ExtractionNew 8 features in ppg_features.pymax, min, range, rms, energy, mean_abs_diff, skewness, kurtosisML ModelSwitched to RandomForestClassifiern_estimators=200, random_state=42 + stratified splitDownload JSONImplemented "Download labeled_records.json" buttonBlob + URL.createObjectURLUpload ModelFull upload flow (frontend + Next.js proxy + Flask endpoint)Base64 decoding + in-memory loadingLayoutComplete redesign with Tailwind grid and modern cardsVisibly different from sample demo

📦 Deployment

Frontend: Deployed on Vercel
Backend: Deployed on PythonAnywhere

Vercel Setup

Import GitHub repo into Vercel
Add environment variable: FLASK_URL=https://tifflok.pythonanywhere.com
Deploy

PythonAnywhere Setup

Create Python 3.10+ web app
Upload/clone repo
Install dependencies in virtualenv (pip install -r requirements.txt)
Set WSGI file to backend/pythonanywhere_wsgi.py
Reload web app

Backend Health Check: https://tifflok.pythonanywhere.com/health

📋 Quick User Guide

Allow camera access and select a signal combination
Observe PPG waveform and heart rate
Label segments as Good or Bad → Send
Download labeled data when ready
Train model locally
Upload model & scaler in the app
Real-time signal quality will work automatically

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

### 2. Frontend Setup
```bash
Bashnpm install
```
Create .env.local in the root folder:
```bash
FLASK_URL=http://127.0.0.1:5000
```

### 3. Backend Setup & Run
```Bash
cd backend
pip install -r requirements.txt
python app.py
```

### 4. Run Frontend (new terminal)
```Bash
npm run dev
```
Open http://localhost:3000

---

## Training Your Own Model 
1. Collect labeled segments (Good / Bad) in the app
2. Click "Download labeled_records.json"
3. Save the downloaded file to backend/labeled_records.json
4. Train the model:Bash
```bash
cd backend
python train_quality_model.py
```
5. In the app, click "Upload model and scaler" and select the two .joblib files

Your custom RandomForest model will now be used for real-time quality inference.


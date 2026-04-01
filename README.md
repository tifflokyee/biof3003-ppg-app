# PPG Heart-Rate Monitor

**A polished, hostable PPG heart-rate app with custom signal combinations, modified ML model, and clean UI**  

**Live Demo** -> https://biof3003-ppg-app.vercel.app
**Backend API** -> https://tifflok.pythonanywhere.com/health  
**GitHub Repo** -> https://github.com/tifflokyee/biof3003-ppg-app.git

## Features

- Real-time PPG signal from camera with multiple RGB combinations
- Heart rate and HRV calculation
- Signal quality classification using a trained ML model
- Label good and bad segments and export training data
- Upload model and scaler from the browser
- Responsive custom layout
- Deployable on Vercel and PythonAnywhere

## Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- Git

## Local Setup

Clone the repository and install the frontend dependencies:

```bash
git clone https://github.com/tifflokyee/biof3003-ppg-app.git
cd biof3003-ppg-app
npm install
```

Start the frontend:

```bash
npm run dev
```

Install backend dependencies and run Flask:

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The frontend expects this environment variable:

```env
FLASK_URL=http://127.0.0.1:5000
```

## Deployment

Recommended split deployment:

- Vercel for the Next.js frontend
- PythonAnywhere for the Flask backend

### Vercel

1. Import the GitHub repo into Vercel.
2. Keep the root directory as the repo root.
3. Add this environment variable in the Vercel project settings:

```env
FLASK_URL=https://tifflok.pythonanywhere.com
```

4. Redeploy after saving the environment variable.

### PythonAnywhere

1. Create a new Python 3 web app with manual configuration.
2. Upload or clone this repo to your PythonAnywhere home directory.
3. Create a virtualenv and install the backend dependencies:

```bash
cd ~/biof3003-ppg-app/backend
pip install -r requirements.txt
```

4. In the PythonAnywhere WSGI configuration, use `backend/pythonanywhere_wsgi.py` as the template.
5. Reload the web app.

### Backend Health Check

After deployment, confirm the backend is live:

```text
https://tifflok.pythonanywhere.com/health
```

Expected response:

```json
{"ok": true}
```

# DocClassify — AI Document Classifier

A browser-based document classifier powered by the Anthropic Claude API.
Train it with labeled examples, then classify any text document instantly.

---

## Project Structure

```
document-classifier/
├── index.html      ← App UI
├── style.css       ← Styling
├── app.js          ← Frontend logic (calls /api/classify)
├── server.js       ← Node.js proxy server (fixes CORS)
├── package.json    ← Dependencies
└── README.md       ← This file
```

---

## How to Run Locally

### Step 1 — Install Node.js
Download from https://nodejs.org and install the LTS version.

### Step 2 — Get your Anthropic API key
1. Go to https://console.anthropic.com
2. Click API Keys → Create Key
3. Copy the key (starts with sk-ant-...)

### Step 3 — Install dependencies
Open Command Prompt in the project folder and run:
```
npm install
```

### Step 4 — Start the server

Windows Command Prompt:
```
set ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE
node server.js
```

Windows PowerShell:
```
$env:ANTHROPIC_API_KEY="sk-ant-YOUR_KEY_HERE"
node server.js
```

You should see:
```
  ⬡  DocClassify server running
  →  http://localhost:8080
  ✓  API key loaded
```

### Step 5 — Open the app
Go to: http://localhost:8080

---

## How to Use

1. Click "Load sample dataset" to add 4 labels + 12 training examples
2. Switch to the Classify tab
3. Paste any document text
4. Click "Classify document"
5. See the predicted label, confidence score, and reasoning

---

## Deploy to GitHub Pages (for submission)

### Step 1 — Create a GitHub repo
1. Go to https://github.com/new
2. Name: document-classifier, set to Public
3. Click Create repository

### Step 2 — Push your code
```
git init
git add .
git commit -m "AI Document Classifier"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/document-classifier.git
git push -u origin main
```

### Step 3 — Enable GitHub Pages
1. Go to your repo → Settings → Pages
2. Source: Deploy from a branch → branch: main, folder: / (root)
3. Click Save

Live at: https://YOUR_USERNAME.github.io/document-classifier

### Step 4 — Submit
- GitHub link: https://github.com/YOUR_USERNAME/document-classifier
- Live link: https://YOUR_USERNAME.github.io/document-classifier

---

## Tech Stack
- Frontend: HTML + CSS + Vanilla JavaScript
- Backend: Node.js + Express (local proxy)
- AI Model: Anthropic Claude claude-sonnet-4-20250514
- Hosting: GitHub Pages

---

## License
MIT

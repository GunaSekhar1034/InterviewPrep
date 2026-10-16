# Interview Prep App

Multi-device web app for Azure Data Engineer, AI Data Engineer, Data Architect, and Databricks Architect interview prep.

## Features
- Category > Topic > Questions hierarchy
- In-browser search and progress tracking
- Add questions manually or import documents (PDF, DOCX, CSV, XLSX, TXT, MD, images)
- Sync to GitHub to share between devices
- Auto-fetch new questions from web (with AI provider keys)
- Runs fully in browser; static files only

## Local run
Serve the folder with any static server:
```bash
python -m http.server 8000
```
Then open http://localhost:8000/

## Deploy
Push to main; GitHub Actions deploys to GitHub Pages.


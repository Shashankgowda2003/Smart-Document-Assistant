# 📄 Smart Document Assistant - Backend

A Flask-based backend API for uploading, processing, and managing documents.  
This backend extracts text from images using **OpenAI Vision API**, and if AI fails, falls back to **Tesseract OCR**.  
It also provides an interactive **Swagger UI** for testing APIs.

---

## 🚀 Features
- **User Management** – Create, view, and delete users.
- **Document Upload** – Upload image files (`jpg`, `jpeg`, `png`, `gif`).
- **AI-powered OCR** – Extract text and auto-generate titles using OpenAI GPT-4o Vision.
- **Fallback OCR** – Uses Tesseract OCR when AI fails.
- **Search Documents** – Search by title or extracted text.
- **Export Documents** – Download extracted text as `.txt`.
- **Swagger UI** – Interactive API documentation.

---

## 🛠 Tech Stack
- **Python 3.12**
- **Flask** (REST API)
- **SQLite** (Database)
- **OpenAI API** (Text extraction & title generation)
- **Flask-CORS** (Cross-Origin Resource Sharing)

---

## 📂 Project Structure
Backend/
│
├── app.py # Main Flask app
├── db.py # DB connection & initialization
├── ai_service.py # AI + OCR processing logic
├── requirements.txt # Python dependencies
├── .env # Environment variables
├── uploads/ # Uploaded files storage
└── data/app.db # SQLite database (auto-created)


---

## ⚙️ Installation & Setup

## Create Virtual Environment
python -m venv venv
venv\Scripts\activate  

## Install Python Dependencies
pip install -r requirements.txt

##  Environment Variables (.env)
Create a .env file in the project root:
OPENAI_API_KEY=your_openai_api_key_here

## Running the Backend
python app.py

The server will run at:
http://127.0.0.1:5000

## Database
SQLite database file is created automatically in:
data/app.db

## Swagger UI
Open in browser:
http://127.0.0.1:5000/apidocs/

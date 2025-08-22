# 📄 Smart Document Assistant

Smart Document Assistant is a full-stack web application that allows users to upload images, extract text using AI (OCR with Tesseract), manage documents, and interact with them easily.  
It includes **user authentication (JWT)**, secure **password hashing**.

---

## 🚀 Features
- 🔑 **User Authentication**
  - Register and login using JWT tokens
  - Passwords stored securely using hashing
- 📂 **Document Management**
  - Upload images
  - Extract text and auto-generate titles using OpenAI GPT-4o Vision.
  - Uses Tesseract OCR when AI fails.
  - View all uploaded documents
  - Download extracted text as `.txt`.
  - Delete documents
- 🖥️ **Responsive UI**
  - Built with React and styled with modern CSS for a clean experience

---

## 🛠️ Tech Stack

### **Frontend**
- React.js
- Axios (API communication)
- Bootstrap / Custom CSS

### **Backend**
- Flask (Python)
- Flask-CORS (cross-origin requests)
- Flask-JWT-Extended (authentication)
- SQLite (database)
- Tesseract OCR (text extraction)

## ⚙️ Installation & Setup

### 1️⃣ Backend Setup (Flask)
1. Navigate to the backend folder:
    cd backend

2. Create virtual environment and activate:
    python -m venv venv
    venv\Scripts\activate      

3. Install dependencies:
    pip install -r requirements.txt

4. Environment Variables (.env)
    Create a .env file in the project root:
    OPENAI_API_KEY=your_openai_api_key_here

5. Run the server:
    python app.py

## Database
SQLite database file is created automatically in:
data/app.db

---

### 2️⃣ Frontend Setup (React)
1. Navigate to the frontend folder:
    cd frontend

2. Install dependencies:
    npm install

3. Run the development server:
    npm  start

    

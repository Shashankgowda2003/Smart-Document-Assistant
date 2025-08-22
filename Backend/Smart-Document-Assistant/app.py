import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent))
import os
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path
from flask import Flask, request, jsonify, send_file
from werkzeug.utils import secure_filename
from flask_cors import CORS
from db import get_conn, init_db
from ai_service import process_image_with_ai
from flasgger import Swagger
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import hashlib

app = Flask(__name__)
CORS(app)
swagger = Swagger(app)

# JWT Configuration
app.config['JWT_SECRET_KEY'] = 'smart-document-assistant-secret-key'  # Change this in production!
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config['PROPAGATE_EXCEPTIONS'] = True  # Propagate JWT exceptions to see them in the logs
jwt = JWTManager(app)

# Custom error handler for JWT errors
@jwt.invalid_token_loader
def invalid_token_callback(error_string):
    print(f"Invalid token: {error_string}")
    return jsonify({"error": f"Invalid token: {error_string}"}), 401

@jwt.unauthorized_loader
def unauthorized_callback(error_string):
    print(f"Missing Authorization header: {error_string}")
    return jsonify({"error": f"Missing Authorization header: {error_string}"}), 401

# Configure upload folder and allowed extensions
UPLOAD_FOLDER = Path("uploads")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

def allowed_file(filename):
    """Check if uploaded file has allowed extension."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ------------------------
# Auth Routes
# ------------------------

# Helper function to hash passwords
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

@app.route("/api/auth/register", methods=["POST"])
def api_register():
    """
    Register a new user
    ---
    tags:
      - Auth
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - username
            - password
            - email
          properties:
            username:
              type: string
              example: demo
            password:
              type: string
              example: secure_password
            email:
              type: string
              example: user@example.com
    responses:
      201:
        description: User created successfully
        schema:
          type: object
          properties:
            message:
              type: string
            user_id:
              type: integer
      400:
        description: Invalid input data
    """
    try:
        data = request.get_json()
        username = data.get("username", "").strip()
        password = data.get("password", "").strip()
        email = data.get("email", "").strip()

        # Validate input
        if not username or not (3 <= len(username) <= 20) or not username.isalnum():
            return jsonify({"error": "Invalid username (3-20 alphanumeric characters required)"}), 400
        
        if not password or len(password) < 6:
            return jsonify({"error": "Password must be at least 6 characters"}), 400
            
        if not email or '@' not in email:
            return jsonify({"error": "Valid email is required"}), 400

        # Check if username or email already exists
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE username = ? OR email = ?", (username, email))
        existing_user = cur.fetchone()
        
        if existing_user:
            conn.close()
            return jsonify({"error": "Username or email already exists"}), 400

        # Hash the password
        hashed_password = hash_password(password)
        
        # Insert the new user
        cur.execute(
            "INSERT INTO users (username, password, email) VALUES (?, ?, ?)", 
            (username, hashed_password, email)
        )
        conn.commit()
        user_id = cur.lastrowid
        conn.close()

        return jsonify({"message": "User registered successfully", "user_id": user_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/auth/login", methods=["POST"])
def api_login():
    """
    Login a user
    ---
    tags:
      - Auth
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - username
            - password
          properties:
            username:
              type: string
              example: demo
            password:
              type: string
              example: secure_password
    responses:
      200:
        description: Login successful
        schema:
          type: object
          properties:
            access_token:
              type: string
            user:
              type: object
      401:
        description: Invalid credentials
    """
    try:
        data = request.get_json()
        username = data.get("username", "").strip()
        password = data.get("password", "").strip()
        
        if not username or not password:
            return jsonify({"error": "Username and password are required"}), 400
            
        # Hash the provided password
        hashed_password = hash_password(password)
        
        # Check credentials
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            "SELECT * FROM users WHERE username = ? AND password = ?", 
            (username, hashed_password)
        )
        user = cur.fetchone()
        conn.close()
        
        if not user:
            return jsonify({"error": "Invalid username or password"}), 401
            
        # Create access token
        access_token = create_access_token(
            identity=str(user["user_id"])  # Use user_id as a string for the identity
        )
        
        return jsonify({
            "access_token": access_token,
            "user": {
                "user_id": user["user_id"],
                "username": user["username"],
                "email": user["email"]
            }
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/auth/profile", methods=["GET"])
@jwt_required()
def api_profile():
    """Get current user profile from JWT token."""
    try:
        # Get user_id from token - now it's just a string
        user_id = get_jwt_identity()
        
        # Get user data from database
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
        user = cur.fetchone()
        conn.close()
        
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        return jsonify({
            "user_id": user["user_id"],
            "username": user["username"],
            "email": user["email"] if "email" in user else None
        }), 200
    except Exception as e:
        print(f"Error in api_profile: {str(e)}")
        return jsonify({"error": str(e)}), 500

# ------------------------
# User Routes
# ------------------------

@app.route("/api/users", methods=["POST"])
def api_create_user():
    """
    Create a new user
    ---
    tags:
      - Users
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - username
          properties:
            username:
              type: string
              example: demo
    responses:
      201:
        description: User created successfully
        schema:
          type: object
          properties:
            message:
              type: string
            user_id:
              type: integer
      400:
        description: Invalid username
    """
    try:
        data = request.get_json()
        username = data.get("username", "").strip()

        if not username or not (3 <= len(username) <= 20) or not username.isalnum():
            return jsonify({"error": "Invalid username (3-20 alphanumeric)"}), 400

        conn = get_conn()
        cur = conn.cursor()
        cur.execute("INSERT INTO users (username) VALUES (?)", (username,))
        conn.commit()
        user_id = cur.lastrowid
        conn.close()

        return jsonify({"message": "user created", "user_id": user_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route("/api/users", methods=["GET"])
def api_get_users():
    """Get all users."""
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users")
    rows = cur.fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows]), 200


@app.route("/api/users/<int:user_id>", methods=["GET"])
def api_get_user(user_id):
    """Get specific user by ID."""
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE user_id=?", (user_id,))
    row = cur.fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "user not found"}), 404

    return jsonify(dict(row)), 200


@app.route("/api/users/<int:user_id>", methods=["DELETE"])
def api_delete_user(user_id):
    """Delete user by ID (and their documents)."""
    try:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("DELETE FROM documents WHERE user_id=?", (user_id,))
        cur.execute("DELETE FROM users WHERE user_id=?", (user_id,))
        conn.commit()
        conn.close()
        return jsonify({"message": f"user {user_id} deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ------------------------
# Document Routes
# ------------------------

@app.route("/api/upload", methods=["POST"])
@jwt_required()
def api_upload():
    try:
        # Get user_id from token - now it's just a string
        user_id = get_jwt_identity()
        
        print(f"Upload request - JWT user: {user_id}")
        
        title = request.form.get("title", "").strip()
        file = request.files.get("file")

        if not file:
            return jsonify({"error": "file required"}), 400
        if not allowed_file(file.filename):
            return jsonify({"error": "invalid file type"}), 400

        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        dest_dir = UPLOAD_FOLDER / today
        dest_dir.mkdir(parents=True, exist_ok=True)

        filename = secure_filename(file.filename)
        save_path = dest_dir / f"{user_id}{int(datetime.now(timezone.utc).timestamp())}{filename}"
        file.save(str(save_path))

        # Process image with OpenAI — get title & text
        ai_title, extracted_text = process_image_with_ai(str(save_path))
        if not title:  # Use AI-generated title if not provided
            title = ai_title

        conn = get_conn()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO documents (user_id, title, file_path, extracted_text)
            VALUES (?, ?, ?, ?)
        """, (user_id, title, str(save_path), extracted_text))
        conn.commit()
        doc_id = cur.lastrowid
        conn.close()

        return jsonify({
            "doc_id": doc_id,
            "message": "File uploaded and processed successfully",
            "title": title,
            "extracted_text": extracted_text
        }), 201

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/api/document/<int:doc_id>", methods=["GET"])
@jwt_required()
def api_document(doc_id):
    """View full document details."""
    current_user_id = get_jwt_identity()
    user_id = int(current_user_id)  # Convert string back to int

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT * FROM documents
        WHERE doc_id=? AND user_id=?
    """, (doc_id, user_id))
    row = cur.fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "not found"}), 404

    return jsonify(dict(row)), 200


@app.route("/api/documents", methods=["GET"])
@jwt_required()
def api_documents():
    """Get all documents for the authenticated user."""
    try:
        # Get user_id from token - now it's just a string
        user_id = get_jwt_identity()

        conn = get_conn()
        cur = conn.cursor()
        cur.execute("""
            SELECT * FROM documents
            WHERE user_id=?
            ORDER BY upload_date DESC
        """, (user_id,))
        rows = cur.fetchall()
        conn.close()

        return jsonify([dict(row) for row in rows]), 200
    except Exception as e:
        print(f"Error in api_documents: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/search", methods=["GET"])
def api_search():
    """Search user's documents by title or extracted text."""
    user_id = request.args.get("user_id")
    query = request.args.get("q", "").strip()

    if not user_id:
        return jsonify({"error": "user_id required"}), 400

    conn = get_conn()
    cur = conn.cursor()

    if query:  # Search if query is provided
        cur.execute("""
            SELECT * FROM documents
            WHERE user_id=?
            AND (title LIKE ? OR extracted_text LIKE ?)
        """, (user_id, f"%{query}%", f"%{query}%"))
    else:  # Return all documents for user if no query
        cur.execute("""
            SELECT * FROM documents
            WHERE user_id=?
        """, (user_id,))

    rows = cur.fetchall()
    conn.close()

    return jsonify([dict(row) for row in rows]), 200


@app.route("/api/export/<int:doc_id>", methods=["GET"])
@jwt_required()
def api_export(doc_id):
    """Export extracted text as .txt file."""
    try:
        current_user_id = get_jwt_identity()
        user_id = int(current_user_id)  # Convert string back to int
        
        print(f"Export request for doc_id: {doc_id}, user_id: {user_id}")

        conn = get_conn()
        cur = conn.cursor()
        cur.execute("""
            SELECT title, extracted_text
            FROM documents
            WHERE doc_id=? AND user_id=?
        """, (doc_id, user_id))
        row = cur.fetchone()
        conn.close()

        if not row:
            print(f"Document not found: doc_id={doc_id}, user_id={user_id}")
            return jsonify({"error": "Document not found"}), 404

        title = row["title"] or f"document_{doc_id}"
        text = row["extracted_text"] or ""
        
        if not text.strip():
            text = "No extracted text available for this document."
        
        # Clean title for filename
        safe_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).strip()
        filename = f"{safe_title}.txt"

        tmp_path = Path("data") / f"export_{doc_id}.txt"
        tmp_path.parent.mkdir(parents=True, exist_ok=True)
        tmp_path.write_text(text, encoding="utf-8")
        
        print(f"Successfully created export file: {tmp_path}")
        return send_file(str(tmp_path), as_attachment=True, download_name=filename)
        
    except Exception as e:
        print(f"Export error: {str(e)}")
        return jsonify({"error": f"Export failed: {str(e)}"}), 500


@app.route("/api/document/<int:doc_id>", methods=["DELETE"])
@jwt_required()
def api_delete(doc_id):
    """Delete document and remove file from disk."""
    # Get user ID from JWT token
    user_id = get_jwt_identity()

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT file_path FROM documents
        WHERE doc_id=? AND user_id=?
    """, (doc_id, user_id))
    row = cur.fetchone()

    if not row:
        conn.close()
        return jsonify({"error": "Document not found or access denied"}), 404

    file_path = row["file_path"]

    try:
        if file_path and Path(file_path).exists():
            Path(file_path).unlink()
    except Exception as e:
        print(f"Warning: failed to remove file {file_path}: {e}")

    cur.execute("""
        DELETE FROM documents
        WHERE doc_id=? AND user_id=?
    """, (doc_id, user_id))
    conn.commit()
    conn.close()

    return jsonify({"message": "Document deleted successfully"}), 200


@app.route("/api/auth/delete_account", methods=["DELETE"])
@jwt_required()
def delete_account():
    """
    Delete the current user's account and all associated documents
    """
    try:
        user_id = get_jwt_identity()
        print(f"Delete account request for user_id: {user_id}")
        
        conn = get_conn()
        cur = conn.cursor()
        
        # First, get all documents for this user to delete files
        print("Getting user documents...")
        cur.execute("SELECT file_path FROM documents WHERE user_id=?", (user_id,))
        documents = cur.fetchall()
        print(f"Found {len(documents)} documents to delete")
        
        # Delete all document files
        for doc in documents:
            file_path = doc[0]
            try:
                if file_path and Path(file_path).exists():
                    print(f"Deleting file: {file_path}")
                    Path(file_path).unlink()
                else:
                    print(f"File not found or path empty: {file_path}")
            except Exception as e:
                print(f"Warning: failed to remove file {file_path}: {e}")
        
        # Delete all user documents from database
        print("Deleting user documents from database...")
        cur.execute("DELETE FROM documents WHERE user_id=?", (user_id,))
        documents_deleted = cur.rowcount
        print(f"Deleted {documents_deleted} document records")
        
        # Delete the user account
        print("Deleting user account...")
        cur.execute("DELETE FROM users WHERE user_id=?", (user_id,))
        user_deleted = cur.rowcount
        print(f"Deleted {user_deleted} user record")
        
        if user_deleted == 0:
            conn.close()
            print(f"Warning: No user found with id {user_id}")
            return jsonify({"error": "User not found"}), 404
        
        conn.commit()
        conn.close()
        
        print("Account deletion successful")
        return jsonify({"message": "Account deleted successfully"}), 200
        
    except Exception as e:
        print(f"Error deleting account: {e}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        try:
            conn.close()
        except:
            pass
        return jsonify({"error": f"Failed to delete account: {str(e)}"}), 500


if __name__ == "__main__":
    init_db()
    app.run(debug=True)
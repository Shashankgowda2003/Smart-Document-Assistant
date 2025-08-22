import os
import base64
import json
import logging
from dotenv import load_dotenv
from openai import OpenAI
from typing import Tuple
import pytesseract
from PIL import Image

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY") or exit("OPENAI_API_KEY missing"))

# Logger setup
logger = logging.getLogger("ai_service")
logger.setLevel(logging.INFO)

# Tesseract path (Windows only - change if installed elsewhere)
TESSERACT_PATH = os.getenv("TESSERACT_PATH", r"C:\Program Files\Tesseract-OCR\tesseract.exe")
if os.path.exists(TESSERACT_PATH):
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH

# ---------- Helper Functions ----------
def image_to_base64(path: str) -> str:
    """Convert image to Base64 string."""
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode()

def _strip_code_fence(s: str) -> str:
    return s.strip("` \n")

def _parse_json(s: str) -> dict:
    """Parse JSON safely from AI output."""
    s = _strip_code_fence(s)
    try:
        return json.loads(s)
    except:
        start, depth, in_str, esc = s.find("{"), 0, False, False
        for i, ch in enumerate(s[start:], start):
            if ch == '"' and not esc:
                in_str = not in_str
            esc = ch == "\\" and not esc
            if not in_str:
                depth += ch == "{"
                depth -= ch == "}"
                if depth == 0:
                    return json.loads(s[start:i+1])
        return {}

def _title_from_text(text: str) -> str:
    """Generate title from extracted text."""
    for line in text.splitlines():
        if line.strip() and not line.strip().isdigit():
            return " ".join(line.split()[:6]).rstrip(",:;.").title()
    return "Image (no text)"

def _ocr_fallback(path: str) -> str:
    """Extract text using Tesseract OCR."""
    try:
        img = Image.open(path)
        return pytesseract.image_to_string(img)
    except Exception as e:
        logger.error(f"OCR failed: {e}")
        return ""

# ---------- Main Processing Function ----------
def process_image_with_ai(path: str) -> Tuple[str, str]:
    """
    Process an image to extract text and generate a title.
    1. Try OpenAI Vision API first
    2. Fallback to Tesseract OCR if OpenAI fails or text is empty
    """
    b64 = image_to_base64(path)
    sys_prompt = (
        "Extract all text from the image and create a short (3-8 words) descriptive title. "
        "Reply in JSON: {\"title\":\"...\",\"text\":\"...\"}, no 'Untitled'."
    )
    user_content = [
        {"type": "text", "text": "Return JSON with title and text."},
        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}}
    ]

    title, text = "", ""

    # Step 1: Try OpenAI Vision API
    try:
        resp = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": user_content}
            ],
            temperature=0.0
        )
        data = _parse_json(resp.choices[0].message.content)
        title = (data.get("title") or "").strip()
        text = (data.get("text") or "").strip()

        # If AI gave no title, try generating again
        if not title or title.lower() in {"untitled", "none"}:
            resp2 = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "Give only a short (3-8 words) descriptive title."},
                    {"role": "user", "content": user_content}
                ],
                temperature=0.0,
                max_tokens=40
            )
            title = _strip_code_fence(resp2.choices[0].message.content.strip())

    except Exception as e:
        logger.error(f"AI processing failed: {e}")

    # Step 2: If AI failed or returned no text, fallback to OCR
    if not text.strip():
        logger.info("Falling back to OCR...")
        text = _ocr_fallback(path)

    # Step 3: If still no title, generate from text
    if not title.strip():
        title = _title_from_text(text)

    return title or "Image (no title)", text or ""
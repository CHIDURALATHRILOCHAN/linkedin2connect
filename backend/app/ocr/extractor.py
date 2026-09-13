import os
import re
import logging
from typing import Dict, Any, List, Optional
from pathlib import Path
from PIL import Image

from app.core.config import settings

logger = logging.getLogger(__name__)

# Known technical and domain skills to scan for in certificate text
KNOWN_SKILLS = [
    "AI/ML", "Machine Learning", "Artificial Intelligence", "Deep Learning",
    "Python", "Data Science", "Cloud Computing", "AWS", "Azure", "GCP",
    "DevOps", "Full Stack", "React", "Node.js", "Java", "C++", "Cybersecurity",
    "Blockchain", "NLP", "Computer Vision", "Neural Networks", "Generative AI",
    "Transformers", "PyTorch", "TensorFlow", "SQL", "Database Management",
    "Hackathon", "Problem Solving", "Teamwork", "Agile", "API Development"
]

KNOWN_ORGANIZATIONS = [
    "Indian Institute of Technology", "IIT", "Vasavi College of Engineering", "VCE",
    "Unstop", "National Institute of Technology", "NIT", "Stanford Online", "Stanford University",
    "DeepLearning.AI", "Amazon Web Services", "AWS", "Google Cloud", "Google",
    "Microsoft", "IBM", "Meta", "Coursera", "edX", "Udemy", "HackerRank", "DevPost"
]

class DocumentExtractionService:
    def __init__(self):
        self._reader = None

    def _get_ocr_reader(self):
        """
        Lazy-initialize EasyOCR reader on CPU.
        Uses verbose=False to avoid Windows CP1252 character mapping issues.
        """
        if self._reader is None:
            try:
                import easyocr
                # Enforce utf-8 encoding for standard output if needed
                os.environ["PYTHONIOENCODING"] = "utf-8"
                self._reader = easyocr.Reader(["en"], gpu=False, verbose=False)
            except Exception as e:
                logger.error(f"Failed to initialize EasyOCR reader: {str(e)}")
                raise RuntimeError(f"OCR engine initialization failed: {str(e)}")
        return self._reader

    def extract_document(self, filepath: str, file_type: str) -> Dict[str, Any]:
        """
        Extract text and structured details from an uploaded certificate document (image or PDF).
        Extracts real data using EasyOCR/pypdf and parses recipient, title, organization, etc.
        Does NOT inject fake or fabricated mock data.
        """
        raw_text_lines = []
        is_pdf = file_type == "application/pdf" or filepath.lower().endswith(".pdf")

        if is_pdf:
            raw_text_lines = self._extract_text_from_pdf(filepath)

        # If not PDF, or if PDF text was empty (scanned image inside PDF), run OCR
        if not raw_text_lines:
            raw_text_lines = self._extract_text_from_image(filepath)

        if not raw_text_lines:
            logger.warning(f"No text could be extracted from {filepath}")
            return self._empty_extraction_result()

        # If a real LLM API key is configured, attempt intelligent LLM structuring
        if settings.AI_API_KEY and not settings.AI_API_KEY.startswith(("mock_", "YOUR_")):
            try:
                llm_data = self._try_llm_parsing(raw_text_lines)
                if llm_data and llm_data.get("recipient_name"):
                    return llm_data
            except Exception as e:
                logger.warning(f"LLM parsing fallback to rule-based: {str(e)}")

        # Primary rule-based parser on actual OCR text
        return self._rule_based_parse(raw_text_lines)

    def _extract_text_from_image(self, filepath: str) -> List[str]:
        """Runs EasyOCR on image file and returns extracted text lines."""
        if not os.path.exists(filepath):
            logger.error(f"File not found: {filepath}")
            return []

        try:
            reader = self._get_ocr_reader()
            results = reader.readtext(filepath, detail=0)
            return [str(line).strip() for line in results if str(line).strip()]
        except Exception as e:
            logger.error(f"EasyOCR image processing failed on {filepath}: {str(e)}")
            return []

    def _extract_text_from_pdf(self, filepath: str) -> List[str]:
        """Extracts text from PDF pages using pypdf."""
        lines = []
        try:
            import pypdf
            reader = pypdf.PdfReader(filepath)
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    for line in text.splitlines():
                        cleaned = line.strip()
                        if cleaned:
                            lines.append(cleaned)
        except Exception as e:
            logger.warning(f"PDF direct text extraction failed: {str(e)}")
        return lines

    def _rule_based_parse(self, lines: List[str]) -> Dict[str, Any]:
        """
        Accurately parses real certificate fields from OCR text lines without fake placeholders.
        """
        full_text = "\n".join(lines)
        # Normalize common OCR character confusions
        normalized_full = full_text.replace("AIJML", "AI/ML").replace("AI/ ML", "AI/ML")
        single_line_text = " ".join(normalized_full.split())

        # 1. Recipient Name
        recipient_name = ""
        name_confidence = 0.0

        for i, line in enumerate(lines):
            # Check for trigger phrase on same line
            m = re.search(
                r"(?:this\s+is\s+to\s+certify\s+that|certifies\s+that|certify\s+that|awarded\s+to|presented\s+to|conferred\s+upon|granted\s+to)\s+([A-Za-z\s\.\'\-]{3,40})",
                line,
                re.IGNORECASE
            )
            if m:
                extracted = m.group(1).strip()
                # Ensure it's not a connecting word
                if not re.match(r"^(?:the|an?|for|in|from|that)$", extracted, re.I):
                    recipient_name = extracted
                    name_confidence = 0.95
                    break

            # Check if current line is the trigger and next line is the name
            if re.search(r"^(?:this\s+is\s+to\s+)?certify\s+that\b|^\s*awarded\s+to\b|^\s*presented\s+to\b|^\s*certifies\s+that\b", line, re.I):
                if i + 1 < len(lines):
                    candidate = lines[i + 1].strip()
                    # Filter out common false positives
                    if candidate and not re.search(r"\b(?:from|for|in|on|with|as|team)\b", candidate, re.I):
                        recipient_name = candidate
                        name_confidence = 0.96
                        break

        # 2. Achievement Title
        achievement_title = ""
        title_confidence = 0.0

        # Look for participation / completion clause
        m_part = re.search(
            r"(?:participated\s+in|completed(?:\s+the)?|completion\s+of|won(?:\s+the)?)\s+([A-Za-z0-9\s\/\&\-\:\.]+?)(?=\s+(?:organised|organized|conducted|hosted|held)\s+by|\.|$|,)",
            single_line_text,
            re.IGNORECASE
        )
        if m_part:
            achievement_title = m_part.group(1).strip()
            title_confidence = 0.95
        else:
            # Look for certificate title lines e.g. "Certificate of Participation" or "AWS Certified Solutions Architect"
            for line in lines:
                if re.search(r"Certificate\s+of\s+[A-Za-z\s]+", line, re.I):
                    achievement_title = line.strip()
                    title_confidence = 0.90
                    break
                elif re.search(r"\b(?:Certified|Specialization|Masterclass|Diploma)\b", line, re.I):
                    achievement_title = line.strip()
                    title_confidence = 0.85
                    break

        if not achievement_title and lines:
            achievement_title = lines[0]
            title_confidence = 0.60

        # 3. Issuing Organization
        issuing_organization = ""
        org_confidence = 0.0

        # Pattern: "organised by Org", "organized by Org", "issued by Org", "conducted by Org"
        m_org = re.search(
            r"(?:organised\s+by|organized\s+by|issued\s+by|conducted\s+by|hosted\s+by)\s+([A-Za-z0-9\s\(\)\,\.\-]+?)(?=\s+(?:on|during|dated)\b|\.|$)",
            single_line_text,
            re.IGNORECASE
        )
        if m_org:
            issuing_organization = m_org.group(1).strip().rstrip(".,")
            org_confidence = 0.94
        else:
            # Check for known organizations in the text
            for known_org in KNOWN_ORGANIZATIONS:
                if known_org.lower() in normalized_full.lower():
                    # If IIT or Indian Institute of Technology, grab location if possible
                    if "indian institute of technology" in known_org.lower() or "iit" == known_org.lower():
                        loc_match = re.search(r"(?:Indian\s+Institute\s+of\s+Technology|IIT)[\s\(\)\w]*?(Hyderabad|Bombay|Delhi|Madras|Kharagpur|Roorkee|Kanpur|Guwahati)?", normalized_full, re.I)
                        if loc_match and loc_match.group(1):
                            issuing_organization = f"Indian Institute of Technology (IIT), {loc_match.group(1)}"
                        else:
                            issuing_organization = "Indian Institute of Technology (IIT)"
                    else:
                        issuing_organization = known_org
                    org_confidence = 0.88
                    break

        # 4. Achievement Type
        text_lower = normalized_full.lower()
        if "hackathon" in text_lower:
            achievement_type = "Hackathon"
        elif "internship" in text_lower or "intern" in text_lower:
            achievement_type = "Internship"
        elif "workshop" in text_lower or "bootcamp" in text_lower:
            achievement_type = "Workshop"
        elif "course" in text_lower or "curriculum" in text_lower:
            achievement_type = "Course"
        elif any(w in text_lower for w in ["winner", "1st place", "2nd place", "3rd place", "runner up", "award of excellence"]):
            achievement_type = "Award"
        else:
            achievement_type = "Certification"

        # 5. Issue Date (Strictly from text, never fabricated)
        issue_date = ""
        date_confidence = 0.0

        # Pattern: YYYY-MM-DD or DD/MM/YYYY
        date_match = re.search(r"\b(20\d{2}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]20\d{2})\b", normalized_full)
        if not date_match:
            # Pattern: Month DD, YYYY or DD Month YYYY
            date_match = re.search(
                r"\b(?:\d{1,2}(?:st|nd|rd|th)?\s+)?(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+20\d{2}\b",
                normalized_full,
                re.IGNORECASE
            )
        if not date_match:
            # Pattern: Month YYYY
            date_match = re.search(
                r"\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+20\d{2}\b",
                normalized_full,
                re.IGNORECASE
            )

        if date_match:
            issue_date = date_match.group(0).strip()
            date_confidence = 0.90

        # 6. Certificate ID (Strictly from text, never fabricated)
        certificate_id = ""
        id_confidence = 0.0
        id_match = re.search(
            r"(?:Credential\s*ID|Certificate\s*(?:ID|No\.?|Number)|Verify\s*(?:Code|ID|at)?|License\s*#?|Ref\s*(?:No\.?)?)\s*[:#\-]?\s*([A-Za-z0-9\-_]{5,30})",
            normalized_full,
            re.IGNORECASE
        )
        if id_match:
            certificate_id = id_match.group(1).strip()
            id_confidence = 0.92

        # 7. Skills (Extracted from actual mentions, never fake lists)
        detected_skills = []
        for skill in KNOWN_SKILLS:
            pattern = rf"\b{re.escape(skill)}\b"
            if re.search(pattern, normalized_full, re.IGNORECASE):
                if skill not in detected_skills:
                    detected_skills.append(skill)

        # 8. Description: synthesized directly from genuine extracted context
        summary_parts = []
        if achievement_title:
            summary_parts.append(f"Achievement: {achievement_title}")
        if issuing_organization:
            summary_parts.append(f"Issued/Organized by {issuing_organization}")
        if recipient_name:
            summary_parts.append(f"Awarded to {recipient_name}")

        description = ". ".join(summary_parts) + ("." if summary_parts else "")

        return {
            "recipient_name": recipient_name,
            "achievement_title": achievement_title,
            "issuing_organization": issuing_organization,
            "issue_date": issue_date,
            "certificate_id": certificate_id,
            "achievement_type": achievement_type,
            "skills": detected_skills,
            "course_name": achievement_title if achievement_type in ["Course", "Certification"] else None,
            "event_name": achievement_title if achievement_type == "Hackathon" else None,
            "role": None,
            "description": description,
            "confidence": {
                "recipient_name": name_confidence if recipient_name else 0.0,
                "achievement_title": title_confidence if achievement_title else 0.0,
                "issuing_organization": org_confidence if issuing_organization else 0.0,
                "issue_date": date_confidence if issue_date else 0.0,
                "certificate_id": id_confidence if certificate_id else 0.0,
                "skills": 0.90 if detected_skills else 0.0
            }
        }

    def _try_llm_parsing(self, lines: List[str]) -> Optional[Dict[str, Any]]:
        """
        Optional helper if user provides a live OpenAI or Gemini API key.
        """
        import json
        import httpx

        prompt = (
            "You are an expert OCR certificate extractor. Parse the following OCR text from an achievement certificate.\n"
            "Return a JSON object with strictly these keys:\n"
            "- recipient_name (string)\n"
            "- achievement_title (string)\n"
            "- issuing_organization (string)\n"
            "- issue_date (string, YYYY-MM-DD or empty string if not found)\n"
            "- certificate_id (string, or empty string if not found)\n"
            "- achievement_type (one of: Certification, Course, Hackathon, Internship, Award, Workshop, Other)\n"
            "- skills (list of strings found in certificate)\n"
            "- description (concise factual summary)\n"
            "Do NOT invent or fabricate fake dates, names, or IDs. If a field is not present, use empty string or empty list.\n\n"
            f"OCR TEXT:\n{chr(10).join(lines)}"
        )

        try:
            if settings.AI_PROVIDER == "openai":
                resp = httpx.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {settings.AI_API_KEY}"},
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [{"role": "user", "content": prompt}],
                        "response_format": {"type": "json_object"}
                    },
                    timeout=15.0
                )
                if resp.status_code == 200:
                    content = resp.json()["choices"][0]["message"]["content"]
                    parsed = json.loads(content)
                    parsed["confidence"] = {k: 0.95 for k in parsed.keys()}
                    return parsed
        except Exception as e:
            logger.warning(f"LLM extraction error: {str(e)}")
        return None

    def _empty_extraction_result(self) -> Dict[str, Any]:
        """Returns clean empty structure without any fake data."""
        return {
            "recipient_name": "",
            "achievement_title": "",
            "issuing_organization": "",
            "issue_date": "",
            "certificate_id": "",
            "achievement_type": "Certification",
            "skills": [],
            "course_name": None,
            "event_name": None,
            "role": None,
            "description": "",
            "confidence": {
                "recipient_name": 0.0,
                "achievement_title": 0.0,
                "issuing_organization": 0.0,
                "issue_date": 0.0,
                "certificate_id": 0.0,
                "skills": 0.0
            }
        }

ocr_service = DocumentExtractionService()

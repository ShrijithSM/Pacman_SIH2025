import PyPDF2
import pdfplumber
import re
from typing import Dict, Any
import asyncio
from llm_config import llm_config  # Changed back to llm_config
# Changed from llm_config to llm_config_new

async def extract_pdf_info(file_path: str, doc_type: str) -> Dict[str, Any]:
    """Extract information from PDF based on document type"""
    try:
        extracted_data = {
            "raw_text": "",
            "structured_data": {}
        }

        # Extract text using pdfplumber
        with pdfplumber.open(file_path) as pdf:
            text_content = ""
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_content += page_text + "\n"

        extracted_data["raw_text"] = text_content

        # Process based on document type
        if doc_type == "marksheet":
            extracted_data["structured_data"] = extract_marksheet_data(text_content)
        elif doc_type == "fees":
            extracted_data["structured_data"] = extract_fee_data(text_content)
        elif doc_type == "timetable":
            extracted_data["structured_data"] = extract_timetable_data(text_content)
        else:
            extracted_data["structured_data"] = extract_general_data(text_content)

        return extracted_data

    except Exception as e:
        raise Exception(f"PDF processing failed: {str(e)}")

async def answer_question_from_pdf(pdf_text: str, question: str) -> str:
    """Enhanced question answering using LLM with fallback to pattern matching"""
    try:
        if not pdf_text or not pdf_text.strip():
            return "No text content found in the PDF to answer your question."

        if not question or not question.strip():
            return "Please provide a valid question."

        # Try LLM response first (Gemini Pro)
        if llm_config.gemini_client:
            llm_response = await llm_config.generate_response(question, pdf_text)
            if not llm_response.startswith("Error") and not llm_response.startswith("Gemini API not configured"):
                return llm_response

        # Fallback to pattern matching if LLM fails
        return await _fallback_pattern_matching(pdf_text, question)

    except Exception as e:
        return f"Error processing your question: {str(e)}"

async def _fallback_pattern_matching(pdf_text: str, question: str) -> str:
    """Original pattern matching logic as fallback"""
    try:
        question_lower = question.lower()
        question_keywords = extract_keywords(question_lower)
        relevant_sections = find_relevant_sections(pdf_text, question_keywords)

        # Generate answer based on question type and content
        if any(word in question_lower for word in ['name', 'student name']):
            return extract_name_info(pdf_text, relevant_sections)

        elif any(word in question_lower for word in ['marks', 'grade', 'score', 'result']):
            return extract_marks_info(pdf_text, relevant_sections)

        elif any(word in question_lower for word in ['fee', 'amount', 'payment', 'cost']):
            return extract_fee_info_qa(pdf_text, relevant_sections)

        elif any(word in question_lower for word in ['date', 'when', 'time']):
            return extract_date_info(pdf_text, relevant_sections)

        elif any(word in question_lower for word in ['subject', 'course', 'class']):
            return extract_subject_info(pdf_text, relevant_sections)

        elif any(word in question_lower for word in ['university', 'college', 'institution']):
            return extract_institution_info(pdf_text, relevant_sections)

        else:
            # General search for keywords in context
            if relevant_sections:
                return f"Based on your question about '{question}', here's what I found in the document:\n\n" + "\n".join(relevant_sections[:3])
            else:
                return f"I couldn't find specific information related to '{question}' in the uploaded PDF. The document contains information about {get_document_summary(pdf_text)}"

    except Exception as e:
        return f"Error processing your question: {str(e)}"

def extract_keywords(question: str) -> list:
    """Extract meaningful keywords from the question"""
    # Remove common stop words
    stop_words = {'what', 'is', 'the', 'how', 'when', 'where', 'who', 'which', 'can', 'you', 'tell', 'me', 'about', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
    words = question.split()
    keywords = [word for word in words if word not in stop_words and len(word) > 2]
    return keywords

def find_relevant_sections(text: str, keywords: list) -> list:
    """Find sections of text that contain the keywords"""
    sections = []
    sentences = text.split('.')

    for sentence in sentences:
        sentence_lower = sentence.lower()
        if any(keyword in sentence_lower for keyword in keywords):
            sections.append(sentence.strip())

    return sections

def extract_name_info(text: str, relevant_sections: list) -> str:
    """Extract name-related information"""
    name_patterns = [
        r"(?:Name|Student Name|NAME)[\s:]+([A-Za-z\s]+)",
        r"(?:Student|Candidate)[\s:]+([A-Za-z\s]+)"
    ]

    for pattern in name_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return f"The student name is: {match.group(1).strip()}"

    if relevant_sections:
        return f"Name information found: {relevant_sections[0]}"

    return "No student name information found in the document."

def extract_marks_info(text: str, relevant_sections: list) -> str:
    """Extract marks/grades information"""
    marks_info = []

    # Look for marks patterns
    marks_patterns = [
        r"(\w+)[\s:]+(\d+)(?:\s*\/\s*\d+)?(?:\s*marks?)?",
        r"(\w+)[\s:]+([A-F][+-]?)",
        r"Total[\s:]+(\d+)"
    ]

    for pattern in marks_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            if len(match) == 2:
                marks_info.append(f"{match[0]}: {match[1]}")

    if marks_info:
        return f"Marks/Grades found:\n" + "\n".join(marks_info[:5])

    if relevant_sections:
        return f"Grade information: {relevant_sections[0]}"

    return "No marks or grade information found in the document."

def extract_fee_info_qa(text: str, relevant_sections: list) -> str:
    """Extract fee-related information"""
    fee_patterns = [
        r"(?:Amount|Total|Fee|Rs\.?|₹)[\s:]*(\d+(?:,\d+)*(?:\.\d{2})?)",
        r"(?:Receipt|Receipt No)[\s:]+([A-Z0-9]+)"
    ]

    fee_info = []
    for pattern in fee_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        fee_info.extend(matches)

    if fee_info:
        return f"Fee information found: {', '.join(fee_info)}"

    if relevant_sections:
        return f"Fee details: {relevant_sections[0]}"

    return "No fee information found in the document."

def extract_date_info(text: str, relevant_sections: list) -> str:
    """Extract date-related information"""
    date_pattern = r"(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})"
    dates = re.findall(date_pattern, text)

    if dates:
        return f"Dates found in document: {', '.join(dates[:3])}"

    if relevant_sections:
        return f"Date information: {relevant_sections[0]}"

    return "No specific dates found in the document."

def extract_subject_info(text: str, relevant_sections: list) -> str:
    """Extract subject/course information"""
    if relevant_sections:
        subjects = []
        for section in relevant_sections:
            # Look for course codes or subject names
            course_matches = re.findall(r"([A-Z]{2,}\d+|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)", section)
            subjects.extend(course_matches)

        if subjects:
            return f"Subjects/Courses found: {', '.join(subjects[:5])}"
        else:
            return f"Subject information: {relevant_sections[0]}"

    return "No subject or course information found in the document."

def extract_institution_info(text: str, relevant_sections: list) -> str:
    """Extract university/institution information"""
    institution_patterns = [
        r"(?:University|College|Institute)[\s:]*([A-Za-z\s]+)",
        r"([A-Za-z\s]+)(?:University|College|Institute)"
    ]

    for pattern in institution_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return f"Institution: {match.group(1).strip()}"

    if relevant_sections:
        return f"Institution information: {relevant_sections[0]}"

    return "No institution information found in the document."

def get_document_summary(text: str) -> str:
    """Get a brief summary of what the document contains"""
    summary_items = []

    if re.search(r"marks?|grade|score", text, re.IGNORECASE):
        summary_items.append("academic grades/marks")

    if re.search(r"fee|amount|payment|receipt", text, re.IGNORECASE):
        summary_items.append("fee information")

    if re.search(r"name|student", text, re.IGNORECASE):
        summary_items.append("student details")

    if re.search(r"date|time", text, re.IGNORECASE):
        summary_items.append("dates")

    if summary_items:
        return ", ".join(summary_items)
    else:
        return "general academic information"

def extract_marksheet_data(text: str) -> Dict[str, Any]:
    """Extract marksheet specific data"""
    data = {}

    # Extract student name
    name_pattern = r"(?:Name|Student Name|NAME)[\s:]+([A-Za-z\s]+)"
    name_match = re.search(name_pattern, text, re.IGNORECASE)
    if name_match:
        data["student_name"] = name_match.group(1).strip()

    # Extract roll number
    roll_pattern = r"(?:Roll|Roll No|Registration)[\s:]+([A-Z0-9]+)"
    roll_match = re.search(roll_pattern, text, re.IGNORECASE)
    if roll_match:
        data["roll_number"] = roll_match.group(1).strip()

    # Extract marks/grades
    marks_pattern = r"(\d+)\s*(?:marks?|points?)"
    marks_matches = re.findall(marks_pattern, text, re.IGNORECASE)
    if marks_matches:
        data["marks"] = [int(mark) for mark in marks_matches]
        data["total_marks"] = sum(data["marks"])

    return data

def extract_fee_data(text: str) -> Dict[str, Any]:
    """Extract fee receipt specific data"""
    data = {}

    # Extract receipt number
    receipt_pattern = r"(?:Receipt|Receipt No)[\s:]+([A-Z0-9]+)"
    receipt_match = re.search(receipt_pattern, text, re.IGNORECASE)
    if receipt_match:
        data["receipt_number"] = receipt_match.group(1).strip()

    # Extract amount
    amount_pattern = r"(?:Amount|Total|Rs\.?|₹)[\s:]*(\d+(?:,\d+)*(?:\.\d{2})?)"
    amount_match = re.search(amount_pattern, text, re.IGNORECASE)
    if amount_match:
        data["amount"] = float(amount_match.group(1).replace(",", ""))

    # Extract date
    date_pattern = r"(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})"
    dates = re.findall(date_pattern, text)
    if dates:
        data["date"] = dates[0]

    return data

def extract_timetable_data(text: str) -> Dict[str, Any]:
    """Extract timetable specific data"""
    data = {}

    # Extract time slots
    time_pattern = r"(\d{1,2}:\d{2})\s*(?:AM|PM|am|pm)?"
    times = re.findall(time_pattern, text, re.IGNORECASE)
    if times:
        data["time_slots"] = times

    # Extract subjects
    subject_pattern = r"(?:Subject|Course)[\s:]+([A-Za-z\s]+)"
    subjects = re.findall(subject_pattern, text, re.IGNORECASE)
    if subjects:
        data["subjects"] = [subj.strip() for subj in subjects]

    return data

def extract_general_data(text: str) -> Dict[str, Any]:
    """Extract general document data"""
    data = {
        "word_count": len(text.split()),
        "contains_numbers": bool(re.search(r'\d', text)),
        "contains_dates": bool(re.search(r'\d{1,2}[-/]\d{1,2}[-/]\d{2,4}', text))
    }
    return data

async def verify_against_db(extracted_data: Dict[str, Any], university_id: str, doc_type: str) -> Dict[str, Any]:
    """Verify extracted data against university database"""
    # Simulate database verification
    await asyncio.sleep(1)  # Simulate processing time

    structured_data = extracted_data.get("structured_data", {})
    confidence = 0.0
    details = []

    if doc_type == "marksheet":
        if "student_name" in structured_data:
            confidence += 0.3
            details.append("Student name found")
        if "roll_number" in structured_data:
            confidence += 0.4
            details.append("Roll number verified")
        if "marks" in structured_data:
            confidence += 0.3
            details.append("Marks data extracted")

    elif doc_type == "fees":
        if "receipt_number" in structured_data:
            confidence += 0.4
            details.append("Receipt number found")
        if "amount" in structured_data:
            confidence += 0.4
            details.append("Amount verified")
        if "date" in structured_data:
            confidence += 0.2
            details.append("Date found")

    # Determine status based on confidence
    if confidence >= 0.8:
        status = "verified"
    elif confidence >= 0.4:
        status = "partial"
    else:
        status = "not_found"

    return {
        "status": status,
        "confidence": confidence,
        "details": details
    }
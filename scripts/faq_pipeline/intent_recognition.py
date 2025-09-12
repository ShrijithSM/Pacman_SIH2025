import csv
import os
from typing import List, Dict, Optional
from langdetect import detect
from difflib import SequenceMatcher

CATEGORY_KEYWORDS = {
    'fees': ['fee', 'tuition', 'cost', 'payment', 'charges', 'dues', 'installment', 'registration'],
    'admissions': ['admission', 'apply', 'application', 'eligibility', 'enroll', 'seat', 'registration', 'gap year'],
    'timetable': ['timetable', 'schedule', 'date', 'calendar', 'registration', 'level', 'coursework'],
    'scholarships': ['scholarship', 'grant', 'financial aid', 'stipend', 'concession', 'waiver'],
    'exams': ['exam', 'test', 'assessment', 'result', 'marks', 'score', 'merit', 'entrance']
}

LANG_COLS = {
    'en': ('question', 'answer'),
    'hi': ('question_hindi', 'answer_hindi'),
    'mr': ('question_marathi', 'answer_marathi'),
    'ta': ('question_tamil', 'answer_tamil')
}

FALLBACKS = {
    'en': "Sorry, I couldn't find an answer. Please rephrase or contact the university.",
    'hi': "क्षमा करें, मुझे उत्तर नहीं मिला। कृपया प्रश्न दोहराएं या विश्वविद्यालय से संपर्क करें।",
    'mr': "माफ करा, मला उत्तर सापडले नाही. कृपया प्रश्न पुन्हा विचारा किंवा विद्यापीठाशी संपर्क साधा.",
    'ta': "மன்னிக்கவும், பதில் கிடைக்கவில்லை. தயவுசெய்து மீண்டும் கேளுங்கள் அல்லது பல்கலைக்கழகத்தை தொடர்பு கொள்ளுங்கள்."
}

def load_faqs(csv_path: str) -> List[Dict]:
    with open(csv_path, encoding='utf-8') as f:
        reader = csv.DictReader(f)
        return list(reader)

def detect_language(text: str) -> str:
    try:
        lang = detect(text)
        return lang if lang in LANG_COLS else 'en'
    except:
        return 'en'

def fuzzy_match(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def extract_keywords(text: str) -> List[str]:
    return [w for w in text.lower().split() if len(w) > 2]

def find_best_faq(user_input: str, faqs: List[Dict], lang: str) -> Optional[Dict]:
    q_col, a_col = LANG_COLS.get(lang, LANG_COLS['en'])
    best = None
    best_score = 0.0
    user_kw = set(extract_keywords(user_input))
    for faq in faqs:
        faq_q = faq.get(q_col) or ''
        score = fuzzy_match(user_input, faq_q)
        # Keyword overlap boost
        faq_kw = set(extract_keywords(faq_q))
        overlap = len(user_kw & faq_kw) / (len(user_kw | faq_kw) or 1)
        score += 0.3 * overlap
        if score > best_score:
            best_score = score
            best = faq
    return best if best_score > 0.5 else None

def get_category(user_input: str) -> str:
    for cat, kws in CATEGORY_KEYWORDS.items():
        if any(kw in user_input.lower() for kw in kws):
            return cat
    return 'general'

def answer_query(user_input: str, faqs: List[Dict]) -> Dict:
    lang = detect_language(user_input)
    best = find_best_faq(user_input, faqs, lang)
    if best:
        q_col, a_col = LANG_COLS.get(lang, LANG_COLS['en'])
        return {
            'answer': best.get(a_col) or best.get('answer'),
            'question': best.get(q_col) or best.get('question'),
            'category': best.get('category'),
            'language': lang,
            'confidence': 1.0,
            'fallback': False
        }
    # fallback
    return {
        'answer': FALLBACKS.get(lang, FALLBACKS['en']),
        'question': None,
        'category': get_category(user_input),
        'language': lang,
        'confidence': 0.0,
        'fallback': True
    }

if __name__ == "__main__":
    faqs = load_faqs(os.path.join(os.path.dirname(__file__), '../../data/faq.csv'))
    test_inputs = [
        "How do I pay my fees?",
        "पंजीकरण शुल्क कैसे जमा करें?",
        "மும்பை பல்கலைக்கழகத்தில் சேர்வது எப்படி?",
        "What is the admission process for JNU?",
        "scholarship eligibility",
        "exam schedule",
        "I have a gap year, can I apply?"
    ]
    for q in test_inputs:
        result = answer_query(q, faqs)
        print(f"Q: {q}\nA: {result['answer']}\nLang: {result['language']} | Cat: {result['category']} | Fallback: {result['fallback']}\n---")

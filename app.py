from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from models.intent_classifier import IntentClassifier
from models.translator import TextTranslator
from utils.knowledge_base import KnowledgeBase
from utils.logger import ConversationLogger
import json
import os

app = Flask(__name__)
CORS(app)

# Initialize components
intent_classifier = IntentClassifier()
translator = TextTranslator()
knowledge_base = KnowledgeBase()
logger = ConversationLogger()

# Train or load model on startup
try:
    intent_classifier.load_model()
    print("Model loaded successfully")
except:
    print("Training model...")
    intent_classifier.train()
    print("Model trained successfully")

@app.route('/')
def serve_frontend():
    return send_from_directory('static', 'index.html')

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message', '')
    session_id = data.get('session_id', 'default')
    
    # Detect input language
    input_lang = translator.detect_language(user_message)
    
    # Translate to English for intent classification if needed
    if input_lang != 'en':
        english_message = translator.translate_text(user_message, 'en')
    else:
        english_message = user_message
    
    # Classify intent
    intent = intent_classifier.predict(english_message)
    
    # Get appropriate response in the same language as the question
    # Map detected language to our supported language codes
    lang_map = {
        'hi': 'hi',  # Hindi
        'ta': 'ta',  # Tamil
        'te': 'te',  # Telugu
        'bn': 'bn',  # Bengali
        'ml': 'en',  # Malayalam (fallback to English)
        'kn': 'en',  # Kannada (fallback to English)
        'mr': 'en',  # Marathi (fallback to English)
        'gu': 'en',  # Gujarati (fallback to English)
        'pa': 'en',  # Punjabi (fallback to English)
    }
    
    # Use the detected language if supported, otherwise default to English
    response_language = lang_map.get(input_lang, 'en')
    
    # Get answer in the appropriate language
    answer = knowledge_base.get_answer(intent, response_language)
    
    # Log conversation
    logger.log_interaction(session_id, user_message, answer, intent, input_lang)
    
    return jsonify({
        'response': answer,
        'intent': intent,
        'detected_language': input_lang,
        'response_language': response_language
    })

@app.route('/languages', methods=['GET'])
def get_languages():
    return jsonify({
        'supported_languages': [
            {'code': 'en', 'name': 'English'},
            {'code': 'hi', 'name': 'Hindi'},
            {'code': 'ta', 'name': 'Tamil'},
            {'code': 'te', 'name': 'Telugu'},
            {'code': 'bn', 'name': 'Bengali'}
        ]
    })

@app.route('/conversations', methods=['GET'])
def get_conversations():
    date_filter = request.args.get('date', None)
    conversations = logger.get_conversations(date_filter)
    return jsonify(conversations)

if __name__ == '__main__':
    # Create data directory if it doesn't exist
    if not os.path.exists('data'):
        os.makedirs('data')
        
    app.run(debug=True, port=5000)
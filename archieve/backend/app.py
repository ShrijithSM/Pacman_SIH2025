from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
import os
from model import train_intent_classifier, train_faq_retriever, get_bot_response, INTENT_MODEL_PATH, FAQ_EMBEDDINGS_PATH

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# --- ML Model and Data Loading ---
intent_model = None

def load_models():
    """Loads the ML models into memory."""
    global intent_model
    
    # Train models if they don't exist
    if not os.path.exists(INTENT_MODEL_PATH):
        print("Intent model not found. Training...")
        train_intent_classifier()
    
    if not os.path.exists(FAQ_EMBEDDINGS_PATH):
        print("FAQ embeddings not found. Training...")
        train_faq_retriever()

    # Load the trained models
    try:
        intent_model = joblib.load(INTENT_MODEL_PATH)
        print("Intent classifier loaded successfully.")
    except FileNotFoundError:
        print("ERROR: Intent model file not found after training.")
    except Exception as e:
        print(f"An error occurred while loading the intent model: {e}")

# --- API Endpoints ---
@app.route('/predict', methods=['POST'])
def predict():
    """
    Handles chatbot queries.
    It expects a JSON payload with 'message' and 'language'.
    """
    data = request.get_json()
    if not data or 'message' not in data:
        return jsonify({'error': 'Invalid input. "message" is required.'}), 400

    user_message = data.get('message', '')
    language = data.get('language', 'en')

    if not user_message.strip():
        return jsonify({'response': "Please provide a message."})

    # Get response from the bot
    if intent_model:
        response_text = get_bot_response(user_message, language, intent_model)
    else:
        response_text = "I'm sorry, my brain is not available right now. Please try again later."

    # Log the conversation
    log_conversation(user_message, response_text)

    return jsonify({'response': response_text})

def log_conversation(user_message, bot_response):
    """Logs the user message and bot response to a CSV file."""
    log_file = 'conversation_logs.csv'
    new_log = pd.DataFrame({
        'user_message': [user_message],
        'bot_response': [bot_response],
        'timestamp': [pd.to_datetime('now')]
    })
    
    log_path = os.path.join(os.path.dirname(__file__), log_file)
    
    if not os.path.exists(log_path):
        new_log.to_csv(log_path, index=False)
    else:
        new_log.to_csv(log_path, mode='a', header=False, index=False)

# --- Main Execution ---
if __name__ == '__main__':
    load_models()
    app.run(debug=True, port=5000)

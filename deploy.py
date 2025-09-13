import sqlite3
import joblib
from models.intent_classifier import IntentClassifier
import os

def setup_database():
    """Initialize the database with required tables"""
    # Create data directory if it doesn't exist
    if not os.path.exists('data'):
        os.makedirs('data')
        
    conn = sqlite3.connect('data/conversations.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            timestamp DATETIME,
            user_message TEXT,
            bot_response TEXT,
            intent TEXT,
            detected_language TEXT
        )
    ''')
    conn.commit()
    conn.close()
    print("Database setup completed.")

def train_initial_model():
    """Train the initial intent classification model"""
    classifier = IntentClassifier()
    classifier.train()
    print("Model training completed.")

if __name__ == '__main__':
    setup_database()
    train_initial_model()
    print("Setup completed. Run 'python app.py' to start the chatbot server.")
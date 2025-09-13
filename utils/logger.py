import sqlite3
import datetime
import json

class ConversationLogger:
    def __init__(self, db_path='data/conversations.db'):
        self.db_path = db_path
        
    def log_interaction(self, session_id, user_message, bot_response, intent, detected_language):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO conversations (session_id, timestamp, user_message, bot_response, intent, detected_language)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (session_id, datetime.datetime.now(), user_message, bot_response, intent, detected_language))
        conn.commit()
        conn.close()
        
    def get_conversations(self, date_filter=None):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        if date_filter:
            cursor.execute('''
                SELECT * FROM conversations 
                WHERE DATE(timestamp) = ?
                ORDER BY timestamp DESC
            ''', (date_filter,))
        else:
            cursor.execute('SELECT * FROM conversations ORDER BY timestamp DESC')
            
        columns = [description[0] for description in cursor.description]
        conversations = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        conn.close()
        return conversations
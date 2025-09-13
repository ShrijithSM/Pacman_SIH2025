from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder
import pandas as pd
import joblib
import os
import json

class IntentClassifier:
    def __init__(self):
        self.pipeline = Pipeline([
            ('tfidf', TfidfVectorizer()),
            ('clf', MultinomialNB())
        ])
        self.label_encoder = LabelEncoder()
        self.is_trained = False
        
    def train(self, data_path='data/faqs.json'):
        # Load training data
        with open(data_path, 'r', encoding='utf-8') as f:
            faqs = json.load(f)
            
        # Combine questions in all languages for training
        questions = []
        intents = []
        
        for faq in faqs:
            questions.append(faq['question_en'])
            questions.append(faq['question_hi'])
            questions.append(faq['question_ta'])
            questions.append(faq['question_te'])
            questions.append(faq['question_bn'])
            intents.extend([faq['intent']] * 5)  # Same intent for all languages
        
        # Encode labels
        encoded_intents = self.label_encoder.fit_transform(intents)
        
        # Train model
        self.pipeline.fit(questions, encoded_intents)
        self.is_trained = True
        
        # Create models directory if it doesn't exist
        if not os.path.exists('models'):
            os.makedirs('models')
            
        # Save model
        joblib.dump({
            'pipeline': self.pipeline,
            'label_encoder': self.label_encoder
        }, 'models/intent_classifier.joblib')
        
    def load_model(self):
        try:
            model_data = joblib.load('models/intent_classifier.joblib')
            self.pipeline = model_data['pipeline']
            self.label_encoder = model_data['label_encoder']
            self.is_trained = True
        except FileNotFoundError:
            self.is_trained = False
            
    def predict(self, text):
        if not self.is_trained:
            self.load_model()
            if not self.is_trained:
                return "unknown"
        
        predicted = self.pipeline.predict([text])
        return self.label_encoder.inverse_transform(predicted)[0]
import pandas as pd
import json
import re
import nltk
from nltk.stem import PorterStemmer
import os

# --- Global Variables ---
INTENTS_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'intents.json')
FAQ_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'faq.csv')

# --- Data Loading ---

def load_intents_data():
    """Loads intents from the intents.json file."""
    try:
        with open(INTENTS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: {INTENTS_FILE} not found.")
        return None
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {INTENTS_FILE}.")
        return None

def load_faq_data():
    """Loads and preprocesses the FAQ data from faq.csv."""
    try:
        df = pd.read_csv(FAQ_FILE)
        # Fill missing values to avoid errors
        df.fillna('', inplace=True)
        return df
    except FileNotFoundError:
        print(f"Error: {FAQ_FILE} not found.")
        return None

# --- Text Preprocessing ---

def preprocess_text(text):
    """
    Cleans and preprocesses text by:
    1. Converting to lowercase
    2. Removing punctuation
    3. Tokenizing
    4. Stemming
    """
    if not isinstance(text, str):
        return ""
        
    # Download necessary NLTK data if not present
    try:
        nltk.data.find('tokenizers/punkt')
    except nltk.downloader.DownloadError:
        nltk.download('punkt')
        
    stemmer = PorterStemmer()
    
    text = text.lower()
    text = re.sub(r'[^\w\s]', '', text) # Remove punctuation
    tokens = nltk.word_tokenize(text)
    stemmed_tokens = [stemmer.stem(word) for word in tokens]
    
    return " ".join(stemmed_tokens)

if __name__ == '__main__':
    # Test the functions
    intents = load_intents_data()
    if intents:
        print(f"Successfully loaded {len(intents.get('intents', []))} intents.")

    faq_df = load_faq_data()
    if faq_df is not None:
        print(f"Successfully loaded FAQ data with {len(faq_df)} rows.")
        print("Columns:", faq_df.columns.tolist())

    sample_text = "What are the college timings?"
    processed_text = preprocess_text(sample_text)
    print(f"Original: '{sample_text}'")
    print(f"Processed: '{processed_text}'")

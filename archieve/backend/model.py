import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sentence_transformers import SentenceTransformer, util
import joblib
import os
from utils import load_intents_data, load_faq_data, preprocess_text

# --- Global Variables & Model Paths ---
INTENT_MODEL_PATH = 'intent_classifier.pkl'
FAQ_EMBEDDINGS_PATH = 'faq_embeddings.pkl'
FAQ_DATA_PATH = 'faq_data.pkl'

# --- 1. Intent Classification Model ---

def train_intent_classifier():
    """
    Trains a TF-IDF and Logistic Regression pipeline for intent classification.
    Saves the trained model to a file.
    """
    print("Training intent classifier...")
    intents_data = load_intents_data()
    if not intents_data:
        print("Could not load intents data. Aborting training.")
        return

    # Prepare training data
    texts = []
    labels = []
    for intent in intents_data['intents']:
        for text in intent['text']:
            texts.append(preprocess_text(text))
            labels.append(intent['intent'])

    # Create and train the pipeline
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer()),
        ('clf', LogisticRegression(random_state=42))
    ])
    pipeline.fit(texts, labels)

    # Save the model
    joblib.dump(pipeline, INTENT_MODEL_PATH)
    print(f"Intent classifier trained and saved to {INTENT_MODEL_PATH}")
    return pipeline

def get_intent(query, model):
    """Predicts the intent of a given query."""
    processed_query = preprocess_text(query)
    intent = model.predict([processed_query])[0]
    return intent

# --- 2. FAQ Retrieval Model ---

def train_faq_retriever():
    """
    Generates and saves sentence embeddings for the FAQ questions.
    """
    print("Training FAQ retriever...")
    faq_df = load_faq_data()
    if faq_df is None:
        print("Could not load FAQ data. Aborting training.")
        return

    # Use a pre-trained multilingual model
    model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

    # Create embeddings for all questions in all available languages
    questions_to_embed = []
    for index, row in faq_df.iterrows():
        questions_to_embed.append(row['question'])
        if 'question_hindi' in row and row['question_hindi']:
            questions_to_embed.append(row['question_hindi'])
        if 'question_marathi' in row and row['question_marathi']:
            questions_to_embed.append(row['question_marathi'])
        if 'question_tamil' in row and row['question_tamil']:
            questions_to_embed.append(row['question_tamil'])
            
    # Remove duplicates
    questions_to_embed = list(set(questions_to_embed))

    embeddings = model.encode(questions_to_embed, convert_to_tensor=True)

    # Save embeddings and the corresponding questions
    faq_data = {'questions': questions_to_embed}
    joblib.dump(embeddings, FAQ_EMBEDDINGS_PATH)
    joblib.dump(faq_data, FAQ_DATA_PATH)
    
    print(f"FAQ embeddings created and saved to {FAQ_EMBEDDINGS_PATH}")

def find_best_faq_answer(query, language='en'):
    """
    Finds the most relevant FAQ answer for a given query using cosine similarity.
    """
    faq_df = load_faq_data()
    try:
        embeddings = joblib.load(FAQ_EMBEDDINGS_PATH)
        faq_data = joblib.load(FAQ_DATA_PATH)
        all_questions = faq_data['questions']
    except FileNotFoundError:
        print("FAQ model files not found. Please train the model first.")
        return "I'm sorry, my knowledge base is not available right now."

    retriever_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
    query_embedding = retriever_model.encode(query, convert_to_tensor=True)

    # Compute cosine similarities
    cosine_scores = util.pytorch_cos_sim(query_embedding, embeddings)[0]
    
    # Find the best match
    best_score_idx = cosine_scores.argmax().item()
    best_score = cosine_scores[best_score_idx]

    if best_score < 0.6: # Confidence threshold
        return None

    # Retrieve the original question and find its answer in the correct language
    matched_question = all_questions[best_score_idx]
    
    # Find the row containing the matched question
    for index, row in faq_df.iterrows():
        if row['question'] == matched_question or \
           row.get('question_hindi') == matched_question or \
           row.get('question_marathi') == matched_question or \
           row.get('question_tamil') == matched_question:
            
            # Return the answer in the requested language
            lang_col = f'answer_{language}' if language != 'en' else 'answer'
            if lang_col in row and row[lang_col]:
                return row[lang_col]
            else:
                return row['answer'] # Default to English answer

    return None # Should not happen if data is consistent

# --- Orchestration ---

def get_bot_response(query, language, intent_model):
    """
    Orchestrates the response generation by first checking intent, then FAQ.
    """
    # 1. Check for a matching intent
    intent = get_intent(query, intent_model)
    
    intents_data = load_intents_data()
    for i in intents_data['intents']:
        if i['intent'] == intent:
            # Simple intents have predefined responses
            if i['responses']:
                return pd.Series(i['responses']).sample().iloc[0]

    # 2. If no simple intent, search the FAQ knowledge base
    faq_answer = find_best_faq_answer(query, language)
    if faq_answer:
        return faq_answer

    # 3. Fallback response
    return "I'm sorry, I don't have an answer for that. Could you try rephrasing your question?"

if __name__ == '__main__':
    # This block allows you to train the models directly
    print("Starting model training...")
    train_intent_classifier()
    train_faq_retriever()
    print("Model training complete.")

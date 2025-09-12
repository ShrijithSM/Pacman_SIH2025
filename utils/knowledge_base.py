import json
import pandas as pd

class KnowledgeBase:
    def __init__(self, data_path='data/faqs.json'):
        with open(data_path, 'r', encoding='utf-8') as f:
            self.faqs = json.load(f)
            
        # Create a DataFrame for easier searching
        self.df = pd.DataFrame(self.faqs)
        
    def get_answer(self, intent, language='en'):
        try:
            result = self.df[self.df['intent'] == intent].iloc[0]
            return result[f'answer_{language}']
        except:
            return "I'm sorry, I don't have information about that yet. Please contact the administration office for assistance."
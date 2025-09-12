from googletrans import Translator

class TextTranslator:
    def __init__(self):
        self.translator = Translator()
        # Language code mapping for better detection
        self.lang_map = {
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
        
    def detect_language(self, text):
        try:
            # For very short texts, language detection can be unreliable
            if len(text.strip()) < 3:
                return 'en'
                
            detection = self.translator.detect(text)
            detected_lang = detection.lang
            
            # Map to our supported languages or default to English
            return self.lang_map.get(detected_lang, 'en')
        except:
            return 'en'  # Default to English if detection fails
            
    def translate_text(self, text, dest_language='en'):
        try:
            # Don't translate if already in the target language
            if self.detect_language(text) == dest_language:
                return text
                
            translation = self.translator.translate(text, dest=dest_language)
            return translation.text
        except:
            return text  # Return original text if translation fails
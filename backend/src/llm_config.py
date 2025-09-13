import os
from dotenv import load_dotenv
import google.generativeai as genai
from typing import Optional

# Load environment variables
load_dotenv()

class LLMConfig:
    def __init__(self):
        self.provider = os.getenv('LLM_PROVIDER', 'gemini').lower()
        # Prefer a modern, supported default model
        self.model = os.getenv('LLM_MODEL', 'gemini-1.5-pro').strip()
        self.max_tokens = int(os.getenv('MAX_TOKENS', '1000'))
        self.temperature = float(os.getenv('TEMPERATURE', '0.3'))

        # Initialize all clients as None (required by pdf_processor.py)
        self.openai_client = None
        self.anthropic_client = None
        self.gemini_client = None

        # Initialize Gemini client
        if self.provider == 'gemini':
            google_key = os.getenv('GOOGLE_API_KEY')
            if google_key and google_key != 'your_google_api_key_here':
                try:
                    genai.configure(api_key=google_key)

                    # Try env model first, then fall back to known supported ones
                    candidates = [
                        self.model,
                        'gemini-1.5-pro',
                        'gemini-1.5-flash',
                        'gemini-2.0-flash',
                    ]
                    last_err = None
                    for m in candidates:
                        try:
                            self.gemini_client = genai.GenerativeModel(m)
                            self.model = m
                            print(f"✅ Gemini initialized with model: {m}")
                            last_err = None
                            break
                        except Exception as e:
                            last_err = e
                            continue
                    if last_err is not None and self.gemini_client is None:
                        print(f"❌ Failed to initialize Gemini with any supported model. Last error: {last_err}")
                except Exception as e:
                    print(f"❌ Failed to initialize Gemini client: {e}")
                    self.gemini_client = None
            else:
                print("❌ GOOGLE_API_KEY not found or invalid in .env")

    async def generate_response(self, prompt: str, context: str = "") -> str:
        """Generate response using Gemini API"""
        try:
            if self.provider == 'gemini' and self.gemini_client:
                return await self._gemini_response(prompt, context)
            else:
                return self._fallback_response(prompt, context)
        except Exception as e:
            return f"Error generating response: {str(e)}"

    async def _gemini_response(self, prompt: str, context: str) -> str:
        """Generate response using Google Gemini API"""
        user_message = f"""You are an AI assistant that helps analyze college documents like marksheets, fee receipts, timetables, and exam schedules.

Instructions:
- Provide accurate, factual answers based only on the document content
- If specific information is not in the document, clearly state this
- Extract precise data points (names, dates, amounts, grades) when requested
- Keep responses concise and directly relevant to the question

Document Content:
{context}

Question: {prompt}

Based on the document content above, please provide a precise answer."""

        try:
            generation_config = {
                "temperature": self.temperature,
                "top_p": 0.95,
                "top_k": 64,
                "max_output_tokens": self.max_tokens,
            }

            response = self.gemini_client.generate_content(
                user_message,
                generation_config=generation_config
            )

            if hasattr(response, 'text') and response.text:
                return response.text.strip()
            # Some SDK versions return candidates
            try:
                cand_text = (response.candidates[0].content.parts[0].text or '').strip()
                if cand_text:
                    return cand_text
            except Exception:
                pass
            return "I couldn't generate a response. Please try rephrasing your question."

        except Exception as e:
            return f"Gemini API error: {str(e)}"

    def _fallback_response(self, prompt: str, context: str) -> str:
        """Fallback response when no LLM API is available"""
        return (
            "Gemini API not configured properly. Question: "
            + prompt
            + "\n\nPlease check GOOGLE_API_KEY and LLM_MODEL in the backend .env file."
        )

# Global LLM configuration instance
llm_config = LLMConfig()

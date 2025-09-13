import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()


class LLMHandler:
    def __init__(self):
        # Configure Gemini API
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        self.model = genai.GenerativeModel('gemini-pro')

    def generate_response(self, query: str, context: str) -> str:
        """Generate response using retrieved context"""

        prompt = f"""
You are a helpful campus assistant chatbot. Use the provided context to answer the user's question accurately and helpfully.

Context from the college website:
{context}

User Question: {query}

Instructions:
- Answer based on the provided context
- If the context doesn't contain relevant information, say so politely
- Be concise but informative
- Use a friendly, helpful tone
- If asked about specific details (dates, fees, procedures), provide exact information from context

Answer:"""

        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"LLM Error: {e}")
            return "I apologize, but I'm having trouble generating a response right now. Please try again later."


# Global instance
llm_handler = LLMHandler()

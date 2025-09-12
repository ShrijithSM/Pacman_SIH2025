# 🏫 Campus Multilingual Chatbot

A Flask-based multilingual chatbot designed to assist students with campus-related queries. The chatbot can understand and respond in multiple Indian languages including Hindi, Tamil, Telugu, and Bengali, making campus information accessible to students from diverse linguistic backgrounds.

## 🌟 Features

- **Multilingual Support**: Supports English, Hindi, Tamil, Telugu, and Bengali
- **Automatic Language Detection**: Detects the input language and responds in the same language
- **Intent Classification**: Uses machine learning to understand user queries and provide relevant responses
- **Real-time Translation**: Powered by Google Translate API for seamless language conversion
- **Conversation Logging**: Stores all interactions in SQLite database for analytics
- **Web Interface**: Clean, responsive web interface for easy interaction
- **RESTful API**: Backend API endpoints for integration with other systems

## 🏗️ Architecture

```
├── app.py                      # Main Flask application
├── deploy.py                   # Database setup and model training script
├── requirements.txt            # Python dependencies
├── models/
│   ├── intent_classifier.py    # ML model for intent classification
│   └── translator.py           # Language detection and translation
├── utils/
│   ├── knowledge_base.py       # FAQ knowledge base handler
│   └── logger.py               # Conversation logging utility
├── data/
│   ├── faqs.json              # Multilingual FAQ dataset
│   └── conversations.db       # SQLite database for conversation logs
└── static/
    └── index.html             # Web interface
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- pip package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd campus-multilingual-chatbot
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Setup database and train model**
   ```bash
   python deploy.py
   ```

4. **Run the application**
   ```bash
   python app.py
   ```

5. **Access the chatbot**
   Open your browser and navigate to `http://localhost:5000`

## 🔧 Configuration

### Adding New FAQs

Edit the `data/faqs.json` file to add new questions and answers. Each FAQ entry should include:

```json
{
    "question_en": "English question",
    "question_hi": "Hindi question",
    "question_ta": "Tamil question", 
    "question_te": "Telugu question",
    "question_bn": "Bengali question",
    "answer_en": "English answer",
    "answer_hi": "Hindi answer",
    "answer_ta": "Tamil answer",
    "answer_te": "Telugu answer",
    "answer_bn": "Bengali answer",
    "intent": "unique_intent_name"
}
```

After adding new FAQs, retrain the model:
```bash
python deploy.py
```

### Supported Languages

| Language | Code | Status |
|----------|------|--------|
| English  | en   | ✅ Full Support |
| Hindi    | hi   | ✅ Full Support |
| Tamil    | ta   | ✅ Full Support |
| Telugu   | te   | ✅ Full Support |
| Bengali  | bn   | ✅ Full Support |
| Malayalam| ml   | ⚠️ Fallback to English |
| Kannada  | kn   | ⚠️ Fallback to English |
| Marathi  | mr   | ⚠️ Fallback to English |
| Gujarati | gu   | ⚠️ Fallback to English |
| Punjabi  | pa   | ⚠️ Fallback to English |

## 📡 API Endpoints

### Chat Endpoint
```http
POST /chat
Content-Type: application/json

{
    "message": "User message in any supported language",
    "session_id": "unique_session_identifier"
}
```

**Response:**
```json
{
    "response": "Bot response in detected language",
    "intent": "classified_intent",
    "detected_language": "detected_language_code",
    "response_language": "response_language_code"
}
```

### Get Supported Languages
```http
GET /languages
```

**Response:**
```json
{
    "supported_languages": [
        {"code": "en", "name": "English"},
        {"code": "hi", "name": "Hindi"},
        {"code": "ta", "name": "Tamil"},
        {"code": "te", "name": "Telugu"},
        {"code": "bn", "name": "Bengali"}
    ]
}
```

### Get Conversation History
```http
GET /conversations?date=YYYY-MM-DD
```

**Response:**
```json
[
    {
        "id": 1,
        "session_id": "session_123",
        "timestamp": "2024-01-15 10:30:00",
        "user_message": "User query",
        "bot_response": "Bot response",
        "intent": "classified_intent",
        "detected_language": "hi"
    }
]
```

## 🧠 Machine Learning Components

### Intent Classification
- **Algorithm**: Multinomial Naive Bayes with TF-IDF vectorization
- **Training Data**: Multilingual FAQ questions
- **Features**: TF-IDF vectors of preprocessed text
- **Model Storage**: Serialized using joblib

### Language Detection & Translation
- **Service**: Google Translate API
- **Capabilities**: 
  - Automatic language detection
  - Real-time translation between supported languages
  - Fallback mechanisms for unsupported languages

## 📊 Database Schema

### Conversations Table
```sql
CREATE TABLE conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    timestamp DATETIME,
    user_message TEXT,
    bot_response TEXT,
    intent TEXT,
    detected_language TEXT
);
```

## 🛠️ Development

### Project Structure
- **app.py**: Main Flask application with route handlers
- **models/**: Machine learning models and utilities
- **utils/**: Helper utilities for knowledge base and logging
- **data/**: Data files and database
- **static/**: Frontend assets

### Adding New Features

1. **New Intent**: Add FAQ entries to `data/faqs.json` and retrain model
2. **New Language**: Update language mappings in `translator.py` and add FAQ translations
3. **New Endpoint**: Add route handlers in `app.py`

### Testing

Test the chatbot with various queries:
```bash
# Test in different languages
curl -X POST http://localhost:5000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "फीस कब देनी है?", "session_id": "test_session"}'
```

## 🚀 Deployment

### Production Setup

1. **Use Gunicorn for production**
   ```bash
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```

2. **Environment Variables**
   ```bash
   export FLASK_ENV=production
   export DATABASE_URL=sqlite:///data/conversations.db
   ```

3. **Docker Deployment** (Optional)
   ```dockerfile
   FROM python:3.9-slim
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install -r requirements.txt
   COPY . .
   RUN python deploy.py
   EXPOSE 5000
   CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the FAQ section in `data/faqs.json`

## 🔮 Future Enhancements

- [ ] Voice input/output support
- [ ] Integration with campus management systems
- [ ] Advanced NLP models (BERT, GPT)
- [ ] Mobile app development
- [ ] Analytics dashboard
- [ ] Multi-tenant support for different institutions
- [ ] Integration with popular messaging platforms (WhatsApp, Telegram)

---

**Made with ❤️ for making campus information accessible to all students**

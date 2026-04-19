from flask import Flask, render_template, request, jsonify
import os
from dotenv import load_dotenv
from google import genai

# Load environment variables from .env
load_dotenv()

# Initialize the client (automatically uses GEMINI_API_KEY from os.environ)
client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))

# Using Gemini 2.5 Flash (the recommended 2026 free tier model)
model_name = "gemini-2.5-flash"

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/chat')
def chat():
    return render_template('chat.html')

@app.route('/ask', methods=['POST'])
def ask():
    user_question = request.form['question']
    conversation_history = request.form.get('history', '[]')
    
    # Build context from conversation history
    history_text = ""
    if conversation_history and conversation_history != '[]':
        import json
        history = json.loads(conversation_history)
        history_text = "\n\nPrevious conversation context:\n"
        for msg in history:
            if msg['type'] == 'user':
                history_text += f"User: {msg['content']}\n"
            else:
                history_text += f"Assistant: {msg['content']}\n"
    
    details = f"You are an educator that is teaching the user more about deep-sea topics. Answer the question: {user_question}. For testing purposes keep it very blunt to a few word responses.{history_text}"

    response = client.models.generate_content(
        model=model_name,
        contents=details
    )

    return jsonify({'response': response.text})

if __name__ == '__main__':
    app.run(debug=True)

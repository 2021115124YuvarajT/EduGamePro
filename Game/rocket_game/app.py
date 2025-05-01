import google.generativeai as genai
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import os
import json
import random
from dotenv import load_dotenv
from bson import ObjectId
import re

# Load API key from .env file
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Configure Gemini API
genai.configure(api_key=GEMINI_API_KEY)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# MongoDB connection
client = MongoClient("mongodb://localhost:27017/")
db = client["rocket_quiz_db"]
collection = db["questions"]

@app.route("/generate_questions", methods=["POST"])
def generate_questions_api():
    try:
        data = request.get_json()
        topic = data.get("topic", "").strip()
        num_questions = data.get("num_questions", 10)

        if not topic:
            return jsonify({"error": "Topic is required"}), 400
        
        # Clear existing questions
        collection.delete_many({})

        # Generate new questions
        questions = generate_questions(topic, num_questions)

        if not questions:
            return jsonify({"error": "No questions were generated. Check API response."}), 500

        inserted_docs = collection.insert_many(questions)

        # Convert ObjectId to string for JSON response
        for i, q in enumerate(questions):
            q["_id"] = str(inserted_docs.inserted_ids[i])

        return jsonify({"message": f"{len(questions)} questions generated successfully", "questions": questions})
    
    except Exception as e:
        print("❌ Server Error:", str(e))  # Debugging output
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500

def generate_questions(topic, num_questions=10):
    try:
        print(f"🔹 Generating {num_questions} questions for topic: {topic}")

        model = genai.GenerativeModel("gemini-1.5-flash-002")
        prompt = f"""
        Generate {num_questions} multiple-choice questions about "{topic}".
        Each question should be in JSON format like this:

        [
            {{
                "topic": "{topic}",
                "question": "Your generated question?",
                "options": ["a) Option A", "b) Option B", "c) Option C", "d) Option D"],
                "correctAnswer": "a) Option A"
            }}
        ]

        Ensure:
        - Each question has exactly 4 labeled options (a to d).
        - The `correctAnswer` is one of the labeled options: "a)", "b)", "c)", or "d)".
        - The response is **pure JSON** without any explanations or extra text.
        """

        response = model.generate_content(prompt)

        print("🔹 Raw API Response:", response.text)

        if not response.text:
            raise ValueError("Empty response from Gemini API")

        cleaned_text = re.sub(r'```json|```', '', response.text).strip()
        questions = json.loads(cleaned_text)
        return questions

    except Exception as e:
        print(f"❌ Error generating questions: {str(e)}")
        print("⚠️ Using default fallback questions.")

        default_questions = [
            {
                "topic": topic,
                "question": "What is the capital of France?",
                "options": ["a) Paris", "b) London", "c) Berlin", "d) Madrid"],
                "correctAnswer": "b) London"
            },
            {
                "topic": topic,
                "question": "Which planet is known as the Red Planet?",
                "options": ["a) Earth", "b) Venus", "c) Mars", "d) Jupiter"],
                "correctAnswer": "d) Jupiter"
            },
            {
                "topic": topic,
                "question": "Who wrote the play 'Romeo and Juliet'?",
                "options": ["a) Charles Dickens", "b) William Shakespeare", "c) Mark Twain", "d) Leo Tolstoy"],
                "correctAnswer": "b) William Shakespeare"
            },
            {
                "topic": topic,
                "question": "What gas do plants absorb from the atmosphere?",
                "options": ["a) Oxygen", "b) Carbon Dioxide", "c) Nitrogen", "d) Hydrogen"],
                "correctAnswer": "b) Carbon Dioxide"
            },
            {
                "topic": topic,
                "question": "Which is the largest ocean on Earth?",
                "options": ["a) Atlantic Ocean", "b) Indian Ocean", "c) Pacific Ocean", "d) Arctic Ocean"],
                "correctAnswer": "c) Pacific Ocean"
            },
            {
                "topic": topic,
                "question": "What is H2O commonly known as?",
                "options": ["a) Hydrogen", "b) Salt", "c) Water", "d) Oxygen"],
                "correctAnswer": "c) Water"
            },
            {
                "topic": topic,
                "question": "Which country is famous for the Great Wall?",
                "options": ["a) India", "b) Egypt", "c) China", "d) Mexico"],
                "correctAnswer": "c) China"
            },
            {
                "topic": topic,
                "question": "What is the process by which plants make their food?",
                "options": ["a) Transpiration", "b) Photosynthesis", "c) Respiration", "d) Digestion"],
                "correctAnswer": "b) Photosynthesis"
            },
            {
                "topic": topic,
                "question": "What is the freezing point of water?",
                "options": ["a) 0°C", "b) 32°C", "c) 100°C", "d) -10°C"],
                "correctAnswer": "a) 0°C"
            },
            {
                "topic": topic,
                "question": "Who is known as the father of computers?",
                "options": ["a) Charles Babbage", "b) Alan Turing", "c) Thomas Edison", "d) Bill Gates"],
                "correctAnswer": "a) Charles Babbage"
            }
        ]

        return default_questions

@app.route('/get_all_questions', methods=['GET'])
def get_all_questions():
    try:
        questions = list(collection.find({}, {"_id": 0}))  # Exclude _id from results
        return jsonify({"questions": questions})
    except Exception as e:
        print("❌ Error fetching questions:", e)
        return jsonify({"error": "Failed to fetch questions"}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5104)

from flask import Flask, request, jsonify
from pymongo import MongoClient
import os
from dotenv import load_dotenv
from flask_cors import CORS  # ✅ Import CORS
import google.generativeai as genai  # ✅ Gemini API Import
import json
from bson import ObjectId

# Load environment variables
load_dotenv()

app = Flask(__name__)

# ✅ Fix CORS issue: Allow all origins and methods
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# MongoDB Setup
client = MongoClient("mongodb://localhost:27017/")
db = client["frog_game"]
questions_collection = db["questions"]

# API Key (Store in .env file)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

# ✅ Function to Generate Quiz Questions using Gemini API
def generate_questions(topic, count=10):
    prompt = f"""
    Generate {count} multiple-choice quiz questions about {topic}.
    Return the output in the following JSON format:
    
    [
        {{
            "topic": "{topic}",
            "question": "Your question text?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct_answer": "Correct option"
        }}
    ]
    """

    try:
        model = genai.GenerativeModel("gemini-1.5-flash-002")
        response = model.generate_content(prompt)

        # ✅ Debugging: Print API response
        print("Raw API Response:", response)

        # ✅ Extract text from response
        response_text = response.text.strip()

        # ✅ Remove markdown JSON formatting (```json ... ```)
        if response_text.startswith("```json"):
            response_text = response_text[7:-3].strip()  # Remove first 7 chars (```json) and last 3 chars (```)

        # ✅ Convert text to JSON
        questions_json = json.loads(response_text)  # Convert to JSON

        return questions_json[:count]  # Ensure only required number of questions

    except Exception as e:
        print(f"❌ Error generating questions: {e}")
        print("⚠️ Falling back to default questions...")

        # ✅ Default fallback questions (10 fixed questions)
        default_questions = [
            {
                "topic": topic,
                "question": "What is the capital of France?",
                "options": ["Paris", "London", "Berlin", "Madrid"],
                "correct_answer": "Paris"
            },
            {
                "topic": topic,
                "question": "Which planet is known as the Red Planet?",
                "options": ["Earth", "Venus", "Mars", "Jupiter"],
                "correct_answer": "Mars"
            },
            {
                "topic": topic,
                "question": "Who wrote 'Romeo and Juliet'?",
                "options": ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
                "correct_answer": "William Shakespeare"
            },
            {
                "topic": topic,
                "question": "What is H2O commonly known as?",
                "options": ["Oxygen", "Water", "Hydrogen", "Salt"],
                "correct_answer": "Water"
            },
            {
                "topic": topic,
                "question": "How many continents are there?",
                "options": ["5", "6", "7", "8"],
                "correct_answer": "7"
            },
            {
                "topic": topic,
                "question": "Which is the largest ocean on Earth?",
                "options": ["Atlantic", "Indian", "Arctic", "Pacific"],
                "correct_answer": "Pacific"
            },
            {
                "topic": topic,
                "question": "Which gas do plants absorb?",
                "options": ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
                "correct_answer": "Carbon Dioxide"
            },
            {
                "topic": topic,
                "question": "Which is the smallest prime number?",
                "options": ["1", "2", "3", "5"],
                "correct_answer": "2"
            },
            {
                "topic": topic,
                "question": "What is the boiling point of water?",
                "options": ["50°C", "100°C", "0°C", "150°C"],
                "correct_answer": "100°C"
            },
            {
                "topic": topic,
                "question": "Who is known as the father of computers?",
                "options": ["Isaac Newton", "Charles Babbage", "Albert Einstein", "Alan Turing"],
                "correct_answer": "Charles Babbage"
            }
        ]


        # ✅ Return the default questions, limited to the requested count
        return default_questions[:count]

# ✅ Clear DB & Generate New Questions
@app.route("/generate", methods=["POST"])
def generate():
    try:
        data = request.json
        topic = data.get("topic")

        if not topic:
            return jsonify({"error": "Topic is required"}), 400

        # ✅ Clear existing questions
        questions_collection.delete_many({})
        print("✅ Database cleared!")

        # ✅ Generate first batch of 10 questions
        new_questions = generate_questions(topic, 10)
        print("Generated Questions:", new_questions)

        if new_questions:
            questions_collection.insert_many(new_questions)
            return jsonify({"message": "Questions generated successfully!"})

        return jsonify({"error": "No questions generated!"}), 500

    except Exception as e:
        print(f"❌ Error in /generate: {e}")
        return jsonify({"error": str(e)}), 500

# ✅ Fetch Questions for Levels
@app.route('/get_questions', methods=['POST'])
def get_questions():
    try:
        data = request.json
        topic = data.get("topic")
        
        if not topic:
            return jsonify({"error": "Topic is required!"}), 400

        # ✅ Debugging: Print incoming request
        print(f"📢 Fetching questions for topic: {topic}")

        # ✅ Fetch questions from `questions_collection`
        questions = list(questions_collection.find({"topic": topic}))

        # ✅ Debugging: Print questions found
        if questions:
            print(f"✅ {len(questions)} questions found!")
        else:
            print("⚠ No questions found in the database!")

        # ✅ Convert ObjectId to string
        for question in questions:
            question["_id"] = str(question["_id"])

        if not questions:
            return jsonify({"error": "No questions found for this topic!"}), 404

        return jsonify({"questions": questions})

    except Exception as e:
        print(f"❌ Error in /get_questions: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5102)
 
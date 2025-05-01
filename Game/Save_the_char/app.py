import google.generativeai as genai
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import os
import re
from dotenv import load_dotenv
import random
import csv

# Load API key from .env file
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Configure Gemini API
genai.configure(api_key=GEMINI_API_KEY)

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# MongoDB connection
client = MongoClient("mongodb://localhost:27017/")
db = client["save_char_quiz_db"]
collection = db["questions"]

@app.route("/generate_question", methods=["POST"])
def generate_question():
    try:
        data = request.get_json()
        topic = data.get("topic", "").strip()
        num_questions = data.get("num_questions",10)

        if not topic:
            return jsonify({"error": "Topic is required"}), 400
        if not num_questions:
            return jsonify({"error": "No. of questions is required"}), 400
        
        collection.delete_many({})

        # ✅ Generate questions
        questions = generate_questions(topic, num_questions)

        if not questions:
            return jsonify({"error": "Failed to generate questions"}), 500

        # ✅ Save questions to MongoDB
        inserted_docs = collection.insert_many(questions)

        # ✅ Convert ObjectId to string before returning
        for i, q in enumerate(questions):
            q["_id"] = str(inserted_docs.inserted_ids[i])  # Convert ObjectId to string

        return jsonify(questions)  # Now JSON serializable

    except Exception as e:
        print("❌ Server Error:", str(e))
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500

def generate_questions(topic, num_questions):
    try:
        prompt = f"""
        Generate {num_questions} multiple-choice questions about {topic}.
        Each question should have 4 options labeled 'a)', 'b)', 'c)', 'd)'.
        Provide the correct answer at the end of each question like this:
        Question: <question>
        Options:
        a) <option 1>
        b) <option 2>
        c) <option 3>
        d) <option 4>
        Correct Answer: <correct option>
        """

        model = genai.GenerativeModel("gemini-1.5-flash-002")
        response = model.generate_content(prompt)

        response_text = response.text if hasattr(response, "text") else ""
        print("🔹 Gemini API Raw Response:", response_text)  # Debugging

        if not response_text:
            return None  

        # Using regex to properly extract questions
        pattern = re.compile(r"Question: (.*?)\nOptions:\n(a\) .*?)\n(b\) .*?)\n(c\) .*?)\n(d\) .*?)\nCorrect Answer: (a\)|b\)|c\)|d\))", re.DOTALL)
        matches = pattern.findall(response_text)

        questions = []
        for match in matches:
            question_text = match[0]
            options = [match[1], match[2], match[3], match[4]]
            correct_answer = match[5]

            questions.append({
                "topic": topic,
                "question": question_text,
                "options": options,
                "correctAnswer": correct_answer
            })

        return questions if questions else None

    except Exception as e:
        print("❌ Error generating questions:", e)
        print("⚠️ Using default questions...")

        default_questions = [
            {
                "topic": topic,
                "question": "What is the capital of France?",
                "options": ["a) Paris", "b) London", "c) Berlin", "d) Madrid"],
                "correctAnswer": "a)"
            },
            {
                "topic": topic,
                "question": "Which planet is known as the Red Planet?",
                "options": ["a) Earth", "b) Venus", "c) Mars", "d) Jupiter"],
                "correctAnswer": "c)"
            },
            {
                "topic": topic,
                "question": "What is H2O commonly known as?",
                "options": ["a) Oxygen", "b) Water", "c) Hydrogen", "d) Salt"],
                "correctAnswer": "b)"
            },
            {
                "topic": topic,
                "question": "Who is known as the father of computers?",
                "options": ["a) Isaac Newton", "b) Charles Babbage", "c) Alan Turing", "d) Albert Einstein"],
                "correctAnswer": "b)"
            },
            {
                "topic": topic,
                "question": "How many continents are there?",
                "options": ["a) 5", "b) 6", "c) 7", "d) 8"],
                "correctAnswer": "c)"
            },
            {
                "topic": topic,
                "question": "Which gas do plants absorb from the atmosphere?",
                "options": ["a) Oxygen", "b) Nitrogen", "c) Carbon Dioxide", "d) Hydrogen"],
                "correctAnswer": "c)"
            },
            {
                "topic": topic,
                "question": "Which is the smallest prime number?",
                "options": ["a) 1", "b) 2", "c) 3", "d) 5"],
                "correctAnswer": "b)"
            },
            {
                "topic": topic,
                "question": "What is the boiling point of water?",
                "options": ["a) 50°C", "b) 0°C", "c) 150°C", "d) 100°C"],
                "correctAnswer": "d)"
            },
            {
                "topic": topic,
                "question": "Who wrote 'Romeo and Juliet'?",
                "options": ["a) Jane Austen", "b) Mark Twain", "c) William Shakespeare", "d) Charles Dickens"],
                "correctAnswer": "c)"
            },
            {
                "topic": topic,
                "question": "Which is the largest ocean on Earth?",
                "options": ["a) Atlantic", "b) Pacific", "c) Indian", "d) Arctic"],
                "correctAnswer": "b)"
            }
        ]

        return default_questions[:num_questions]

@app.route('/clear-items', methods=['DELETE'])
def clear_items():
    try:
        collection.delete_many({})
        return jsonify({"message": "All items cleared"}), 200
    except Exception as e:
        print("❌ Error clearing items:", e)
        return jsonify({"error": "Failed to clear items"}), 500

# Store used questions
used_questions = set()  # Set to track already used question IDs

@app.route('/get_question', methods=['GET'])
def get_question():
    global used_questions  # Use the global set

    try:
        # Fetch all question IDs
        all_questions = list(collection.find({}, {"_id": 1}))

        if not all_questions:
            return jsonify({"error": "No questions found in the database"}), 404

        # Get unused question IDs
        unused_questions = [q["_id"] for q in all_questions if q["_id"] not in used_questions]

        if not unused_questions:
            # If all questions have been used, reset the used_questions list
            used_questions.clear()
            unused_questions = [q["_id"] for q in all_questions]

        # Randomly select a new question
        selected_id = random.choice(unused_questions)
        used_questions.add(selected_id)  # Mark question as used

        # Fetch the selected question details
        question_data = collection.find_one({"_id": selected_id}, {"_id": 0})

        if not question_data:
            return jsonify({"error": "Error fetching question"}), 500

        return jsonify(question_data)

    except Exception as e:
        print("❌ Error fetching question from DB:", e)
        return jsonify({"error": "Failed to fetch question"}), 500
    
# Define the CSV file name
CSV_FILE = "game_metrics.csv"

# Initialize CSV file with headers if it doesn't exist
def initialize_csv():
    if not os.path.exists(CSV_FILE):
        with open(CSV_FILE, mode='w', newline='') as file:
            writer = csv.writer(file)
            writer.writerow(["Total Time", "STM", "LTM", "WM", "PSI", "AVP", "ATI", "ATN", "Task Completion"])

initialize_csv()  # Ensure the file is initialized

@app.route('/save_metrics', methods=['POST'])
def save_metrics():
    try:
        data = request.get_json()
        
        # Extract metric values from the request
        total_time = data.get("total_time", 0)
        STM = data.get("STM", 0)
        LTM = data.get("LTM", 0)
        WM = data.get("WM", 0)
        PSI = data.get("PSI", 0)
        AVP = data.get("AVP", 0)
        ATI = data.get("ATI", 0)
        ATN = data.get("ATN", 0)
        task_completion = data.get("task_completion", 0)

        # Append data to the CSV file
        with open(CSV_FILE, mode='a', newline='') as file:
            writer = csv.writer(file)
            writer.writerow([total_time, STM, LTM, WM, PSI, AVP, ATI, ATN, task_completion])

        return jsonify({"message": "Metrics saved successfully"}), 200
    
    except Exception as e:
        print(f"❌ Error saving metrics: {e}")
        return jsonify({"error": "Failed to save metrics"}), 500

# ✅ Run the Flask app
if __name__ == '__main__':
    app.run(debug=True, port=5200)

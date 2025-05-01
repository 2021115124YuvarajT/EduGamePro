import google.generativeai as genai
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import os
import re
from dotenv import load_dotenv
import random

# Load API key from .env file
load_dotenv()
GEMINI_API_KEY = os.getenv("")

# Configure Gemini API
genai.configure(api_key=GEMINI_API_KEY)

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# MongoDB connection
client = MongoClient("mongodb://localhost:27017/")
db = client["quiz_db"]
collection = db["questions"]

@app.route("/generate_question", methods=["POST"])
def generate_question():
    try:
        data = request.get_json()
        topic = data.get("topic", "").strip()

        if not topic:
            return jsonify({"error": "Topic is required"}), 400
        
        collection.delete_many({})

        # ✅ Generate questions
        questions = generate_questions(topic)

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

def generate_questions(topic, num_questions=10):
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
        print("🔹 Gemini API Raw Response:", response_text)

        if not response_text:
            raise ValueError("Empty response from Gemini API.")

        pattern = re.compile(
            r"Question: (.*?)\nOptions:\n(a\) .*?)\n(b\) .*?)\n(c\) .*?)\n(d\) .*?)\nCorrect Answer: (a\)|b\)|c\)|d\))",
            re.DOTALL
        )
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

        if not questions:
            raise ValueError("No valid questions parsed.")

        return questions[:num_questions]

    except Exception as e:
        print("❌ Error generating questions:", e)
        print("⚠️ Falling back to default questions...")

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
                "question": "Who wrote 'Romeo and Juliet'?",
                "options": ["a) Charles Dickens", "b) William Shakespeare", "c) Jane Austen", "d) Mark Twain"],
                "correctAnswer": "b)"
            },
            {
                "topic": topic,
                "question": "What is H2O commonly known as?",
                "options": ["a) Oxygen", "b) Water", "c) Hydrogen", "d) Salt"],
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
                "question": "Which is the largest ocean on Earth?",
                "options": ["a) Atlantic", "b) Indian", "c) Arctic", "d) Pacific"],
                "correctAnswer": "d)"
            },
            {
                "topic": topic,
                "question": "Which gas do plants absorb?",
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
                "options": ["a) 50°C", "b) 100°C", "c) 0°C", "d) 150°C"],
                "correctAnswer": "b)"
            },
            {
                "topic": topic,
                "question": "Who is known as the father of computers?",
                "options": ["a) Isaac Newton", "b) Charles Babbage", "c) Albert Einstein", "d) Alan Turing"],
                "correctAnswer": "b)"
            }
        ]

        return default_questions[:num_questions]

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


@app.route("/save_psi", methods=["POST"])
def save_psi():
    data = request.json.get("entry")
    if not data:
        return jsonify({"error": "No data received"}), 400

    with open("psi_results.csv", "a") as f:
        f.write(data)

    return jsonify({"message": "PSI data saved successfully!"})
# ✅ Run the Flask app
if __name__ == '__main__':
    app.run(debug=True, port=5101)

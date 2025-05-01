from flask import Flask, jsonify, request
from dotenv import load_dotenv
import os
import google.generativeai as genai
import re
from flask_cors import CORS
from pymongo import MongoClient

# Load environment variables from .env file
load_dotenv()

# Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# MongoDB client setup
mongo_client = MongoClient(os.getenv("mongodb://localhost:27017/"))  # Update your MongoDB connection string in .env
db = mongo_client["gameDB"]  # Replace with your database name
student_eval_collection = db["studentevals"]  # Replace with your collection name

# Configure the Generative AI client with the API key
api_key = os.getenv('API_KEY')
genai.configure(api_key=api_key)

# Function to generate questions
def generate_mcq():
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content(
        """
        Generate 10 multiple-choice questions on science topics for class 5 students.
        The response must strictly follow the below format:

        1. Each question should be preceded by "**<number>. <question text>**".
        2. Each option should be in the format "<letter>) <option text>", where <letter> can be 'a', 'b', 'c', or 'd'.
        3. After all the options, provide the correct answer in the format "**Correct Answer: <letter>**".
        4. Ensure that the format is followed exactly as described.
        """
    )

    return response.text

# Parsing MCQ text to structured JSON format
def parse_mcq(response_text):
    lines = response_text.split("\n")
    questions = []
    current_question = None
    
    for line in lines:
        question_match = re.match(r"\*\*(\d+)\. (.+)\*\*", line)
        if question_match:
            if current_question:
                questions.append(current_question)
            question_number = question_match.group(1)
            question_text = question_match.group(2)
            current_question = {
                "question_number": question_number,
                "question": question_text,
                "options": {},
                "correct_answer": None
            }

        option_match = re.match(r"([a-dA-D])\) (.+)", line)
        if option_match and current_question:
            option_letter = option_match.group(1).lower()
            option_text = option_match.group(2)
            current_question["options"][option_letter] = option_text

        correct_answer_match = re.match(r"\*\*Correct Answer: ([a-d])\*\*", line, re.IGNORECASE)
        if correct_answer_match and current_question:
            current_question["correct_answer"] = correct_answer_match.group(1).lower()

    if current_question:
        questions.append(current_question)

    return questions

# API endpoint to serve MCQ questions
@app.route('/get-questions', methods=['GET'])
def get_questions():
    mcq_text = generate_mcq()
    questions = parse_mcq(mcq_text)
    return jsonify(questions)

# API endpoint to update student evaluation data
@app.route('/api/students/eval-leaderboard', methods=['POST'])  # Ensure this matches your JavaScript fetch URL
def update_evaluation():
    data = request.json
    roll_number = data.get('roll_number')
    total_questions = data.get('total_questions', 0)  # Default to 0 if not provided
    answered_correctly = data.get('answered_correctly', 0)  # Default to 0 if not provided

    if not roll_number:
        return jsonify({"error": "Roll number is required"}), 400

    # Increment total questions and correctly answered questions
    result = student_eval_collection.update_one(
        {"roll_number": roll_number},
        {
            "$inc": {
                "total_questions": total_questions,
                "answered_correctly": answered_correctly
            },
            "$setOnInsert": {"roll_number": roll_number}
        },
        upsert=True
    )
    print(f"Update Result: {result.raw_result}")  # Debug print

    # Retrieve the updated student data for verification
    student_data = student_eval_collection.find_one({"roll_number": roll_number})
    print(f"Updated Student Data: {student_data}") 

    return jsonify({"message": "Evaluation updated successfully"}), 200

# Run Flask server
if __name__ == '__main__':
    app.run(debug=True, port=5303)

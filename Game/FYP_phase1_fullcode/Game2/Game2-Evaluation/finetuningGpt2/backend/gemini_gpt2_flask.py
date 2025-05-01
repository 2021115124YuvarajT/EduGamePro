from flask import Flask, jsonify
from dotenv import load_dotenv
from transformers import GPT2LMHeadModel, GPT2Tokenizer
import google.generativeai as genai
import os
import re
from flask_cors import CORS  # Enable CORS for frontend-backend communication

# Load environment variables
load_dotenv()

# Configure Gemini API
api_key = os.getenv('API_KEY')
genai.configure(api_key=api_key)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS to allow frontend requests

# Load GPT-2 model and tokenizer
def load_model_and_tokenizer(model_path):
    model = GPT2LMHeadModel.from_pretrained(model_path)
    tokenizer = GPT2Tokenizer.from_pretrained(model_path)
    return model, tokenizer

# Generate questions with GPT-2
def generate_questions_from_gpt2(model, tokenizer, num_questions=10, max_length=150):
    questions_with_answers = []
    for _ in range(num_questions):
        input_ids = tokenizer.encode("Question:", return_tensors="pt")
        output = model.generate(
            input_ids,
            max_length=max_length,
            pad_token_id=tokenizer.eos_token_id,
            do_sample=True,
            top_k=50,
            top_p=0.95
        )
        generated_text = tokenizer.decode(output[0], skip_special_tokens=True).strip()

        # Extract question and answer
        question_match = re.match(r"Question:\s*(.*)", generated_text, re.IGNORECASE)
        answer_match = re.search(r"Answer:\s*(.*)", generated_text, re.IGNORECASE)

        question = question_match.group(1).strip() if question_match else "No question found."
        answer = answer_match.group(1).strip() if answer_match else "No answer found."

        questions_with_answers.append((question, answer))

    return questions_with_answers
#gpt2 finetuned model
#q a q a q a
# gemini - > send with options
#q , o and a 
#text filtering
#send to frontend
# Send questions to Gemini in one batch
def generate_options_batch_with_gemini(questions_with_answers):
    prompt = "Generate multiple-choice questions with the following:\n\n"
    for i, (question, answer) in enumerate(questions_with_answers):
        prompt += f"Question {i + 1}: {question}\nCorrect Answer: {answer}\n"

    prompt += """
    The response must strictly follow this format:
    1. **<number>. <question text>**
    2. <letter>) <option text> (where <letter> can be 'a', 'b', 'c', or 'd').
    3. **Correct Answer: <letter>**
    """

    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content(prompt)
    return response.text

# Parse Gemini's response into structured JSON
def parse_mcq(response_text):
    lines = response_text.split("\n")
    questions = []
    current_question = None

    for line in lines:
        question_match = re.match(r"\*\*(\d+)\. (.+)\*\*", line)
        if question_match:
            if current_question:
                questions.append(current_question)
            current_question = {
                "question_number": question_match.group(1),
                "question": question_match.group(2),
                "options": {},
                "correct_answer": None
            }

        option_match = re.match(r"([a-dA-D])\) (.+)", line)
        if option_match and current_question:
            current_question["options"][option_match.group(1).lower()] = option_match.group(2)

        correct_answer_match = re.match(r"\*\*Correct Answer: ([a-d])\*\*", line, re.IGNORECASE)
        if correct_answer_match and current_question:
            current_question["correct_answer"] = correct_answer_match.group(1).lower()

    if current_question:
        questions.append(current_question)

    return questions

# Flask route to serve questions
@app.route('/get-questions', methods=['GET'])
def get_questions():
    model_path = "./fine_tuned_gpt2_sciq_no_prompt"
    model, tokenizer = load_model_and_tokenizer(model_path)

    questions_with_answers = generate_questions_from_gpt2(model, tokenizer)
    gemini_response = generate_options_batch_with_gemini(questions_with_answers)
    structured_questions = parse_mcq(gemini_response)

    return jsonify(structured_questions)

# Run Flask server
if __name__ == '__main__':
    app.run(debug=True,port=5302)

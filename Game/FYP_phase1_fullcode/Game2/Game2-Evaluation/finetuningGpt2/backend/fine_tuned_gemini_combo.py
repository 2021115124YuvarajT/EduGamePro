import os
import re
from dotenv import load_dotenv
from transformers import GPT2LMHeadModel, GPT2Tokenizer
import google.generativeai as genai

# Load environment variables for API key
load_dotenv()

# Configure Gemini API
api_key = os.getenv('API_KEY')
genai.configure(api_key=api_key)

# Load GPT-2 model and tokenizer
def load_model_and_tokenizer(model_path):
    print("Loading GPT-2 model and tokenizer...")
    model = GPT2LMHeadModel.from_pretrained(model_path)
    tokenizer = GPT2Tokenizer.from_pretrained(model_path)
    print("Model and tokenizer loaded successfully.")
    return model, tokenizer

# Generate multiple questions with GPT-2
def generate_questions_from_gpt2(model, tokenizer, num_questions=15, max_length=150):
    questions_with_answers = []
    for _ in range(num_questions):
        input_ids = tokenizer.encode("Question:", return_tensors="pt")
        output = model.generate(
            input_ids,
            max_length=max_length,
            num_return_sequences=1,
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

# Send batch of questions and answers to Gemini for generating MCQs
def generate_options_batch_with_gemini(questions_with_answers):
    # Construct a batch prompt with all questions and answers
    prompt = "Generate multiple-choice questions with the following:\n\n"
    for i, (question, answer) in enumerate(questions_with_answers):
        prompt += f"""
        Question {i + 1}: {question}
        Correct Answer: {answer}
        """

    # Add formatting instructions to the prompt
    prompt += """
    The response must strictly follow this format:

    1. Each question should be preceded by "**<number>. <question text>**".
    2. Each option should be in the format "<letter>) <option text>", where <letter> can be 'a', 'b', 'c', or 'd'.
    3. After all the options, provide the correct answer in the format "**Correct Answer: <letter>**".
    4. Ensure the format is followed exactly.
    """

    # Send the entire batch to Gemini in a single call
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content(prompt)
    return response.text

# Parse the Gemini response into structured JSON
def parse_mcq(response_text):
    lines = response_text.split("\n")
    questions = []
    current_question = None

    for line in lines:
        # Detect question lines
        question_match = re.match(r"\*\*(\d+)\. (.+)\*\*", line)
        if question_match:
            if current_question:
                questions.append(current_question)  # Save previous question
            question_number = question_match.group(1)
            question_text = question_match.group(2)
            current_question = {
                "question_number": question_number,
                "question": question_text,
                "options": {},
                "correct_answer": None
            }

        # Detect option lines
        option_match = re.match(r"([a-dA-D])\) (.+)", line)
        if option_match and current_question:
            option_letter = option_match.group(1).lower()
            option_text = option_match.group(2)
            current_question["options"][option_letter] = option_text

        # Detect correct answer
        correct_answer_match = re.match(r"\*\*Correct Answer: ([a-d])\*\*", line, re.IGNORECASE)
        if correct_answer_match and current_question:
            current_question["correct_answer"] = correct_answer_match.group(1).lower()

    if current_question:
        questions.append(current_question)  # Add the last question

    return questions

def main():
    # Path to your fine-tuned GPT-2 model
    model_path = "./fine_tuned_gpt2_sciq_no_prompt"

    # Load GPT-2 model and tokenizer
    model, tokenizer = load_model_and_tokenizer(model_path)

    # Generate 15 questions with GPT-2
    print("Generating 15 questions with GPT-2...")
    questions_with_answers = generate_questions_from_gpt2(model, tokenizer)

    # Send all questions to Gemini in one batch
    print("\nSending batch of questions to Gemini...")
    gemini_response = generate_options_batch_with_gemini(questions_with_answers)
    print(f"Gemini Response:\n{gemini_response}")

    # Parse the Gemini response into structured JSON
    structured_questions = parse_mcq(gemini_response)

    # Print the structured questions
    print("\nStructured MCQs:")
    for mcq in structured_questions:
        print(mcq)

if __name__ == "__main__":
    main()

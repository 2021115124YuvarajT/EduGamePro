# generate_mcqs_th_answers.py

from transformers import GPT2LMHeadModel, GPT2Tokenizer
import re

def load_model_and_tokenizer(model_path):
    """
    Load the fine-tuned model and tokenizer from the specified local directory.
    
    Args:
        model_path (str): Path to the directory containing the fine-tuned model and tokenizer.
    
    Returns:
        model: The loaded GPT2 model.
        tokenizer: The loaded GPT2 tokenizer.
    """
    print("Loading model and tokenizer...")
    model = GPT2LMHeadModel.from_pretrained(model_path)
    tokenizer = GPT2Tokenizer.from_pretrained(model_path)
    print("Model and tokenizer loaded successfully.")
    return model, tokenizer

def generate_mcq_with_answer(model, tokenizer, max_length=150):
    """
    Generate a multiple-choice question with options and an answer using the loaded model.
    
    Args:
        model: The loaded GPT2 model.
        tokenizer: The loaded GPT2 tokenizer.
        max_length (int): Maximum length of the generated text.
    
    Returns:
        str: The formatted MCQ with the correct answer.
    """
    # Start the generation with a generic "Question:" prompt
    input_ids = tokenizer.encode("Question:", return_tensors="pt")

    # Generate text
    output = model.generate(
        input_ids,
        max_length=max_length,
        num_return_sequences=1,
        pad_token_id=tokenizer.eos_token_id,
        do_sample=True,
        top_k=50,
        top_p=0.95
    )

    # Decode the generated text
    generated_text = tokenizer.decode(output[0], skip_special_tokens=True)

    # Format the text into a question with multiple choices and extract the correct answer
    mcq = format_mcq_with_answer(generated_text)
    return mcq

def format_mcq_with_answer(text):
    """
    Format the generated text into an MCQ with question, options, and the correct answer.
    
    Args:
        text (str): The generated text.
    
    Returns:
        str: The formatted MCQ text with the correct answer indicated.
    """
    # Basic formatting to split the generated text into a question and options
    text = text.replace("\n", " ").strip()
    question_match = re.match(r"Question:\s*(.*?)(?:Answer:|Options:|$)", text, re.IGNORECASE)
    question = question_match.group(1).strip() if question_match else "No question found."

    # Extract possible options (splitting by common delimiters for multiple choices)
    options = re.split(r'\s*[a-dA-D][.)]\s*', text)[1:]  # Split on patterns like "a. " or "B) "
    options = [opt.strip() for opt in options if opt.strip()]

    # Try to find the answer in the generated text
    answer_match = re.search(r"Answer:\s*(.*)", text, re.IGNORECASE)
    correct_answer = answer_match.group(1).strip() if answer_match else "No answer found."

    # Format the final MCQ
    mcq = f"Q: {question}\n"
    for i, option in enumerate(options[:4], start=1):  # Limit to the first 4 options
        mcq += f"{chr(96 + i)}. {option}\n"
    
    # Add the correct answer at the end
    mcq += f"Answer: {correct_answer}\n"
    return mcq

def main():
    # Path to the directory containing the fine-tuned model and tokenizer
    model_path = "./fine_tuned_gpt2_sciq_no_prompt"

    # Load the model and tokenizer
    model, tokenizer = load_model_and_tokenizer(model_path)

    # Generate multiple MCQs
    num_mcqs = 15
    all_mcqs = []  # List to store all MCQs
    print(f"Generating {num_mcqs} multiple-choice questions...\n")
    for i in range(num_mcqs):
        mcq = generate_mcq_with_answer(model, tokenizer)
        all_mcqs.append(mcq)  # Store the MCQ in the list

    # Combine all MCQs into a single string variable
    all_mcqs_text = "\n".join([f"MCQ {i+1}:\n{mcq}" for i, mcq in enumerate(all_mcqs)])

    # Print all MCQs
    print("All Generated MCQs:\n")
    print(all_mcqs_text)

if __name__ == "__main__":
    main()

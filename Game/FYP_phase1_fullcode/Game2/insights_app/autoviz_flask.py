import os  # For directory management and file operations
from flask import Flask, send_file, jsonify  # For Flask app and API endpoints
from dotenv import load_dotenv  # To load environment variables from .env file
import pandas as pd  # For data manipulation and analysis
import matplotlib  # For setting a non-GUI backend for plots
import matplotlib.pyplot as plt  # For creating visualizations
import google.generativeai as genai  # For generating insights using generative AI
from flask_cors import CORS  # To enable Cross-Origin Resource Sharing for the Flask app


# Initialize Flask app
app = Flask(__name__)

# Enable CORS for the entire app
CORS(app, resources={r"/": {"origins": ""}})

# Set Matplotlib backend to a non-GUI backend
matplotlib.use("Agg")

# Load environment variables from .env file
load_dotenv()
api_key = os.getenv("API_KEY")

# Check if the API key is available
if not api_key:
    raise ValueError("API_KEY not found in .env file. Please add it and try again.")
genai.configure(api_key=api_key)
# Path to save the images
IMAGE_DIR = "generated_images"
os.makedirs(IMAGE_DIR, exist_ok=True)

# Load the dataset
filename = "student.csv"
df = pd.read_csv(filename)
summary_stats = df.describe().round(2)  # Calculate summary statistics
numeric_df = df.select_dtypes(include=["number"])  # Select only numeric columns
correlation = numeric_df.corr().round(2)

# Generate and save the three best plots
# 1. Rank vs TotalQuestionsAnswered
plt.figure()
plt.scatter(df["rank"], df["TotalQuestionsAnswered"], color="blue", alpha=0.7)
plt.xlabel("Rank")
plt.ylabel("Total Questions Answered")
plt.title("Rank vs Total Questions Answered")
plt.savefig(f"{IMAGE_DIR}/rank_vs_questions.svg", format="svg", bbox_inches="tight")
plt.close()

# 2. Level vs CorrectlyAnswered
plt.figure()
plt.bar(df["level"], df["CorrectlyAnswered"], color="green", alpha=0.7)
plt.xlabel("Level")
plt.ylabel("Correctly Answered")
plt.title("Level vs Correctly Answered")
plt.savefig(f"{IMAGE_DIR}/level_vs_correctly_answered.svg", format="svg", bbox_inches="tight")
plt.close()

# 3. Score vs CorrectlyAnswered
plt.figure()
plt.scatter(df["score"], df["CorrectlyAnswered"], color="orange", alpha=0.7)
plt.xlabel("Score")
plt.ylabel("Correctly Answered")
plt.title("Score vs Correctly Answered")
plt.savefig(f"{IMAGE_DIR}/score_vs_correctly_answered.svg", format="svg", bbox_inches="tight")
plt.close()

# Update the prompt to reflect new features
prompt = (
    f"The dataset contains information about user performance in a quiz. "
    f"Summary statistics:\n{summary_stats}\n"
    f"Correlation matrix:\n{correlation}\n"
    f"Based on this information, generate actionable insights about user performance. "
    f"Provide only concise statements without extra explanations."
    f"give insights."
    
)


try:
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(prompt)
    insights_text = response.text
except Exception as e:
    insights_text = f"Error generating insights: {e}"


# Route to serve generated images
@app.route("/images/<filename>")
def get_image(filename):
    image_path = os.path.join(IMAGE_DIR, filename)
    if not os.path.exists(image_path):
        return jsonify({"error": "Image not found"}), 404
    return send_file(image_path, mimetype="image/svg+xml")


# Route to get basic summary statistics
@app.route("/summary", methods=["GET"])
def get_summary():
    summary_dict = summary_stats.to_dict()
    return jsonify({"summary_statistics": summary_dict})


# Route to get correlation matrix
@app.route("/correlation", methods=["GET"])
def get_correlation():
    correlation_dict = correlation.to_dict()
    return jsonify({"correlation_matrix": correlation_dict})


@app.route("/insights", methods=["GET"])
def get_insights():
    return jsonify({"insights": insights_text})


# Start the Flask server
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
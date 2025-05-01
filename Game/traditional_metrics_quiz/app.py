from flask import Flask, render_template, request, redirect, url_for, session, jsonify
import random
import csv
import os
from datetime import datetime

from game_data.ordering_questions import ORDERING_QUESTIONS
from game_data.save_character_questions import SAVE_CHARACTER_QUESTIONS

app = Flask(__name__)
app.secret_key = 'secret_key_for_session'

# CSV file paths
ORDERING_CSV_PATH = 'data/ordering_game_data.csv'
SAVE_CHAR_CSV_PATH = 'data/save_character_game_data.csv'

# Ensure data directory exists
os.makedirs('data', exist_ok=True)

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        session['name'] = request.form['name']
        session['class'] = request.form['class']
        session['first_game'] = request.form['game']

        if session['first_game'] == 'ordering':
            return redirect(url_for('ordering_game'))
        else:
            return redirect(url_for('save_character_game'))

    return render_template('index.html')


@app.route('/ordering', methods=['GET'])
def ordering_game():
    # Choose a random question set
    question = random.choice(ORDERING_QUESTIONS)
    session['ordering_question_id'] = question['id']  # Store to validate later
    return render_template('ordering_game.html', question=question, game_name="Ordering Game")


@app.route('/submit_ordering_game', methods=['POST'])
def submit_ordering_game():
    data = request.get_json()
    student_name = session.get('name')
    student_class = session.get('class')

    with open(ORDERING_CSV_PATH, mode='a', newline='') as file:
        writer = csv.writer(file)
        writer.writerow([
            datetime.now().isoformat(),
            student_name,
            student_class,
            data['time_spent'],
            data['task_completion'],
            data['incorrect_attempts']
        ])

    # Decide which game to go next
    if session['first_game'] == 'ordering':
        next_url = url_for('save_character_game')
    else:
        next_url = url_for('done')

    return jsonify({'next_url': next_url})


@app.route('/save-character', methods=['GET'])
def save_character_game():
    # Use fixed 10 MCQs
    topic = random.choice(list(SAVE_CHARACTER_QUESTIONS.keys()))
    questions = SAVE_CHARACTER_QUESTIONS[topic][:10]
    random.shuffle(questions)
    return render_template('save_character_game.html', questions=questions, game_name="Save the Character Game")


@app.route('/submit_save_character_game', methods=['POST'])
def submit_save_character_game():
    data = request.get_json()
    student_name = session.get('name')
    student_class = session.get('class')

    with open(SAVE_CHAR_CSV_PATH, mode='a', newline='') as file:
        writer = csv.writer(file)
        writer.writerow([
            datetime.now().isoformat(),
            student_name,
            student_class,
            data['total_time'],
            data['stm'],
            data['ltm'],
            data['wm'],
            data['psi'],
            data['avp'],
            data['ati'],
            data['atn'],
            data['task_completion']
        ])

    if session['first_game'] == 'save-character':
        next_url = url_for('ordering_game')
    else:
        next_url = url_for('done')

    return jsonify({'next_url': next_url})


@app.route('/done')
def done():
    return '✅ Both games completed! Thank you for playing.'

if __name__ == '__main__':
    app.run(debug=True)

from flask import Flask, render_template, request, redirect, url_for, session
import time
import csv
import random 

app = Flask(__name__)
app.secret_key = 'randomsecretkey'

# Original Question Bank
original_questions = [
    {"q": "Which is a type of honeybee?", "options": ["Worker", "Robot", "King", "Farmer"], "answer": "Worker"},
    {"q": "What do honeybees make?", "options": ["Milk", "Honey", "Oil", "Juice"], "answer": "Honey"},
    {"q": "What is the name of the female bee that lays eggs?", "options": ["Worker", "Drone", "Queen", "Guard"], "answer": "Queen"},
    {"q": "Which bee collects nectar from flowers?", "options": ["Queen", "Worker", "Drone", "Soldier"], "answer": "Worker"},
    {"q": "How many queens are there in a hive?", "options": ["One", "Ten", "Many", "None"], "answer": "One"},
    {"q": "What do drone bees do?", "options": ["Guard the hive", "Mate with queen", "Collect nectar", "Make wax"], "answer": "Mate with queen"},
    {"q": "Which bee lives the longest?", "options": ["Worker", "Queen", "Drone", "Guard"], "answer": "Queen"},
    {"q": "What color are honeybees usually?", "options": ["Red and white", "Black and yellow", "Blue and green", "Brown and pink"], "answer": "Black and yellow"},
    {"q": "Which bee cannot sting?", "options": ["Drone", "Worker", "Queen", "All can sting"], "answer": "Drone"},
    {"q": "Where do bees store honey?", "options": ["Cups", "Flowers", "Hive", "Leaves"], "answer": "Hive"}
]


@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        session['student_name'] = request.form['name']
        session['student_class'] = request.form['class']
        session['start_time'] = time.time()
        session['current'] = 0
        session['correct'] = 0
        session['times'] = []
        session['answers'] = []

        # Shuffle questions and add repeats
        questions = original_questions.copy()
        random.shuffle(questions)
        repeats = random.sample(questions, 3)
        questions += repeats
        random.shuffle(questions)
        for q in questions:
            random.shuffle(q['options'])

        session['questions'] = questions
        return redirect(url_for('quiz'))
    return render_template('index.html')

@app.route('/quiz', methods=['GET', 'POST'])
def quiz():
    if 'current' not in session:
        return redirect(url_for('index'))

    current = session['current']
    questions = session['questions']
    feedback = None
    show_feedback = False
    selected = None
    correct_answer = None

    if request.method == 'POST':
        selected = request.form.get('answer')
        time_taken = time.time() - session['start_time']
        session['times'].append(time_taken)

        correct_answer = questions[current]['answer']
        is_correct = selected == correct_answer

        session['answers'].append({
            "selected": selected,
            "correct": correct_answer,
            "is_correct": is_correct
        })

        if is_correct:
            session['correct'] += 1

        show_feedback = True

        if request.form.get('action') == 'Next':
            session['start_time'] = time.time()
            session['current'] += 1
            if session['current'] >= len(questions):
                return redirect(url_for('result'))
            
            return redirect(url_for('quiz'))

        feedback = {
            'selected': selected,
            'correct': correct_answer,
            'is_correct': is_correct
        }

    return render_template('quiz.html',
                           qno=current + 1,
                           question=questions[current]['q'],
                           options=questions[current]['options'],
                           show_feedback=show_feedback,
                           feedback=feedback)

@app.route('/result')
def result():
    points_per_question = 1
    total_questions = len(session['questions'])
    sf = session['correct'] * points_per_question
    sa = total_questions * points_per_question
    stm_score = round(sf / sa, 2)

    taccess = sum(session['times'])  # total actual time taken
    tmax = len(session['questions']) * 10  # assuming max 10s per question

    # To avoid negative scores, we use max() to clip to 0
    avpi = round(max((tmax - taccess) / tmax, 0), 2)

    # PSI is same formula for now (processing speed index)
    psi = round(max((tmax - taccess) / tmax, 0), 2)


    y1, y2 = 0.6, 0.4
    avp_score = round(y1 * stm_score + y2 * avpi, 2)

    # ---- New: PSI and PS calculations ----
    psi = round((tmax - taccess) / tmax, 2)  # Same formula as AVPI in this case

    a1, a2 = 0.5, 0.5
    ps_score = round(a1 * stm_score + a2 * psi, 2)
    # --------------------------------------

    # Save to CSV
    with open('traditional_learning_metrics.csv', 'a', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([
            session['student_name'],
            session['student_class'],
            'Traditional Learning',
            stm_score,
            avpi,
            avp_score,
            psi,
            ps_score
        ])

    return render_template('result.html',
                           name=session['student_name'],
                           student_class=session['student_class'],
                           stm=stm_score,
                           avpi=avpi,
                           avp=avp_score,
                           psi=psi,
                           ps=ps_score)

if __name__ == "__main__":
    app.run(debug=True)

import os
import time
import uuid
import csv
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

CSV_FILE = "quiz_metadata.csv"

# 🔒 Hardcoded question bank with 10 topics × 10 questions each
QUESTION_BANK = {
    "Arithmetics": [
        {"question": "What is 15 + 6?", "options": ["20", "21", "22", "23"], "answer": "b"},
        {"question": "What is 25 - 9?", "options": ["14", "15", "16", "17"], "answer": "c"},
        {"question": "What is 8 × 7?", "options": ["56", "64", "49", "48"], "answer": "a"},
        {"question": "What is 81 ÷ 9?", "options": ["8", "9", "10", "11"], "answer": "b"},
        {"question": "What is 12 × 5?", "options": ["60", "55", "65", "50"], "answer": "a"},
        {"question": "What is 100 - 45?", "options": ["55", "60", "50", "65"], "answer": "a"},
        {"question": "What is 6 + 7?", "options": ["12", "13", "14", "11"], "answer": "b"},
        {"question": "What is 9 × 9?", "options": ["81", "72", "90", "99"], "answer": "a"},
        {"question": "What is 45 ÷ 5?", "options": ["9", "10", "8", "7"], "answer": "a"},
        {"question": "What is 14 + 13?", "options": ["26", "27", "28", "29"], "answer": "b"},
    ],
    "Agriculture": [
        {"question": "Which crop is known as the staple food of India?", "options": ["Wheat", "Maize", "Rice", "Barley"], "answer": "c"},
        {"question": "Which tool is used to plough the field?", "options": ["Sickle", "Plough", "Hoe", "Tractor"], "answer": "b"},
        {"question": "Which season is best for growing wheat?", "options": ["Summer", "Monsoon", "Winter", "Autumn"], "answer": "c"},
        {"question": "Which state is the largest producer of rice?", "options": ["Punjab", "West Bengal", "Tamil Nadu", "Maharashtra"], "answer": "b"},
        {"question": "What is used to increase soil fertility?", "options": ["Plastic", "Pesticides", "Fertilizers", "Sand"], "answer": "c"},
        {"question": "What is organic farming?", "options": ["Farming using machines", "Farming without chemicals", "Farming in water", "Farming indoors"], "answer": "b"},
        {"question": "What is a Kharif crop?", "options": ["Grown in winter", "Grown in summer", "Grown in rainy season", "Grown in spring"], "answer": "c"},
        {"question": "Which crop needs the most water?", "options": ["Bajra", "Rice", "Wheat", "Gram"], "answer": "b"},
        {"question": "Which machine helps in sowing seeds?", "options": ["Seed drill", "Combine harvester", "Rotavator", "Plough"], "answer": "a"},
        {"question": "Which is a rabi crop?", "options": ["Paddy", "Rice", "Wheat", "Maize"], "answer": "c"},
    ],
    "Seasons": [
        {"question": "How many seasons are there in India?", "options": ["2", "3", "4", "5"], "answer": "c"},
        {"question": "Which season comes after winter?", "options": ["Summer", "Rainy", "Autumn", "Spring"], "answer": "d"},
        {"question": "In which season do flowers bloom?", "options": ["Winter", "Summer", "Spring", "Autumn"], "answer": "c"},
        {"question": "Which season is the hottest?", "options": ["Winter", "Rainy", "Summer", "Spring"], "answer": "c"},
        {"question": "When does the monsoon start?", "options": ["May", "June", "July", "August"], "answer": "b"},
        {"question": "Which season has snow in hilly areas?", "options": ["Summer", "Winter", "Spring", "Rainy"], "answer": "b"},
        {"question": "What season comes before autumn?", "options": ["Summer", "Rainy", "Spring", "Monsoon"], "answer": "b"},
        {"question": "Which season do we wear woolen clothes?", "options": ["Summer", "Winter", "Rainy", "Spring"], "answer": "b"},
        {"question": "Which season do farmers sow seeds?", "options": ["Winter", "Summer", "Spring", "Rainy"], "answer": "d"},
        {"question": "Which season has the longest days?", "options": ["Winter", "Spring", "Summer", "Autumn"], "answer": "c"},
    ],
    "Continents and oceans": [
        {"question": "How many continents are there?", "options": ["5", "6", "7", "8"], "answer": "c"},
        {"question": "Which is the largest ocean?", "options": ["Indian", "Pacific", "Atlantic", "Arctic"], "answer": "b"},
        {"question": "Which continent is India in?", "options": ["Asia", "Africa", "Europe", "Australia"], "answer": "a"},
        {"question": "Which ocean is near India's southern tip?", "options": ["Arctic", "Atlantic", "Indian", "Pacific"], "answer": "c"},
        {"question": "Which is the smallest continent?", "options": ["Africa", "Europe", "Australia", "South America"], "answer": "c"},
        {"question": "Which ocean is near Antarctica?", "options": ["Indian", "Atlantic", "Pacific", "Southern"], "answer": "d"},
        {"question": "How many oceans are there?", "options": ["4", "5", "6", "7"], "answer": "b"},
        {"question": "Which is the coldest ocean?", "options": ["Arctic", "Pacific", "Indian", "Atlantic"], "answer": "a"},
        {"question": "Which continent is known as the 'Dark Continent'?", "options": ["Asia", "Africa", "Europe", "Australia"], "answer": "b"},
        {"question": "Which continent is also a country?", "options": ["Asia", "Europe", "Australia", "Africa"], "answer": "c"},
    ],
    "Mountains in India": [
        {"question": "Which is the highest mountain in India?", "options": ["Mount Everest", "K2", "Kanchenjunga", "Nanda Devi"], "answer": "c"},
        {"question": "In which state is Nanda Devi located?", "options": ["Himachal", "Uttarakhand", "Sikkim", "Jammu"], "answer": "b"},
        {"question": "Which range forms the northern boundary of India?", "options": ["Western Ghats", "Eastern Ghats", "Himalayas", "Aravalli"], "answer": "c"},
        {"question": "Which mountain is in Kashmir?", "options": ["Trisul", "Nanda Devi", "Nun Kun", "Kangchenjunga"], "answer": "c"},
        {"question": "Which range runs parallel to the Arabian Sea?", "options": ["Eastern Ghats", "Western Ghats", "Vindhya", "Satpura"], "answer": "b"},
        {"question": "Aravalli hills are located in?", "options": ["Kerala", "Rajasthan", "Gujarat", "Madhya Pradesh"], "answer": "b"},
        {"question": "Which mountain range is the oldest?", "options": ["Himalayas", "Aravalli", "Vindhya", "Satpura"], "answer": "b"},
        {"question": "Which is the youngest mountain range?", "options": ["Satpura", "Vindhya", "Himalayas", "Aravalli"], "answer": "c"},
        {"question": "Which mountain is sacred to Hindus?", "options": ["Mount Kailash", "Everest", "K2", "Kanchenjunga"], "answer": "a"},
        {"question": "Which hill station is in Nilgiri hills?", "options": ["Manali", "Shimla", "Ooty", "Darjeeling"], "answer": "c"},
    ],
    "Palaces and forts in india": [
        {"question": "Where is Mysore Palace located?", "options": ["Kerala", "Karnataka", "Tamil Nadu", "Andhra Pradesh"], "answer": "b"},
        {"question": "Which fort is in Delhi?", "options": ["Amber Fort", "Red Fort", "Agra Fort", "Jaisalmer Fort"], "answer": "b"},
        {"question": "Where is Mehrangarh Fort?", "options": ["Udaipur", "Jodhpur", "Jaipur", "Jaisalmer"], "answer": "b"},
        {"question": "City Palace is in?", "options": ["Jaipur", "Udaipur", "Jodhpur", "Bikaner"], "answer": "b"},
        {"question": "Amber Fort is located in?", "options": ["Jaipur", "Agra", "Delhi", "Kolkata"], "answer": "a"},
        {"question": "Which fort is shaped like a ship?", "options": ["Red Fort", "Golconda Fort", "Vijaygarh Fort", "Vijaydurg Fort"], "answer": "d"},
        {"question": "Which fort was built by Akbar?", "options": ["Red Fort", "Agra Fort", "Gwalior Fort", "Chittorgarh Fort"], "answer": "b"},
        {"question": "Which palace is in Hyderabad?", "options": ["Lalitha Mahal", "Falaknuma Palace", "City Palace", "Rambagh Palace"], "answer": "b"},
        {"question": "Red Fort is made of?", "options": ["White Marble", "Sandstone", "Red Sandstone", "Granite"], "answer": "c"},
        {"question": "Where is Golconda Fort?", "options": ["Telangana", "Tamil Nadu", "Karnataka", "Kerala"], "answer": "a"},
    ],
        "Types of wastes": [
        {"question": "Which of these is biodegradable?", "options": ["Plastic", "Banana peel", "Glass", "Metal can"], "answer": "b"},
        {"question": "What type of waste is a broken glass bottle?", "options": ["Wet waste", "Dry waste", "Hazardous waste", "E-waste"], "answer": "b"},
        {"question": "Old batteries are an example of?", "options": ["Biodegradable", "Hazardous", "Wet", "Plastic"], "answer": "b"},
        {"question": "Which waste can be composted?", "options": ["Vegetable peels", "Plastic", "Metal", "Styrofoam"], "answer": "a"},
        {"question": "Plastic is what kind of waste?", "options": ["Biodegradable", "Hazardous", "Non-biodegradable", "Dry"], "answer": "c"},
        {"question": "Food leftovers are?", "options": ["Wet waste", "Dry waste", "E-waste", "Hazardous waste"], "answer": "a"},
        {"question": "Which is an example of e-waste?", "options": ["Toothpaste", "Old computer", "Banana peel", "Old book"], "answer": "b"},
        {"question": "Newspapers come under which waste?", "options": ["Wet", "Dry", "E-waste", "Hazardous"], "answer": "b"},
        {"question": "Which bin color is used for wet waste?", "options": ["Blue", "Green", "Red", "Yellow"], "answer": "b"},
        {"question": "What type of waste should be recycled?", "options": ["Plastic", "Food", "Cloth", "Soap"], "answer": "a"},
    ],
    "sources of water and Water management": [
        {"question": "Which is a source of freshwater?", "options": ["Sea", "Ocean", "River", "Salt lake"], "answer": "c"},
        {"question": "Which source stores rainwater?", "options": ["Well", "Dam", "River", "Canal"], "answer": "b"},
        {"question": "What is rainwater harvesting?", "options": ["Wasting water", "Boiling water", "Storing rainwater", "Filtering sea water"], "answer": "c"},
        {"question": "Which of these is a man-made water source?", "options": ["Lake", "Pond", "Dam", "River"], "answer": "c"},
        {"question": "Which method is used to save water?", "options": ["Open tap", "Drip irrigation", "Flood irrigation", "Sprinklers"], "answer": "b"},
        {"question": "Which water is safe to drink?", "options": ["Pond water", "River water", "Tap water", "Filtered water"], "answer": "d"},
        {"question": "Boiling water helps in?", "options": ["Cooling", "Saving", "Purifying", "Evaporating"], "answer": "c"},
        {"question": "Which practice wastes water?", "options": ["Fixing leaks", "Open taps", "Watering plants with bucket", "Reusing water"], "answer": "b"},
        {"question": "What is groundwater?", "options": ["Water in oceans", "Water under the earth", "River water", "Rainwater"], "answer": "b"},
        {"question": "Which device measures rainfall?", "options": ["Barometer", "Rain gauge", "Thermometer", "Hydrometer"], "answer": "b"},
    ],
    "Life cycle of plants": [
        {"question": "What is the first stage of a plant's life cycle?", "options": ["Flower", "Seed", "Leaf", "Fruit"], "answer": "b"},
        {"question": "What comes after a seed in the life cycle?", "options": ["Fruit", "Flower", "Germination", "Leaf"], "answer": "c"},
        {"question": "Which part grows first during germination?", "options": ["Leaf", "Flower", "Root", "Stem"], "answer": "c"},
        {"question": "What helps the plant make food?", "options": ["Root", "Flower", "Leaf", "Stem"], "answer": "c"},
        {"question": "Which stage produces seeds?", "options": ["Leaf", "Root", "Flower", "Stem"], "answer": "c"},
        {"question": "What do seeds need to grow?", "options": ["Light, soil, water", "Fire", "Plastic", "Air"], "answer": "a"},
        {"question": "What is pollination?", "options": ["Seed making", "Watering", "Transfer of pollen", "Leaf growing"], "answer": "c"},
        {"question": "Fruits form from which part?", "options": ["Leaf", "Stem", "Root", "Flower"], "answer": "d"},
        {"question": "Which helps in seed dispersal?", "options": ["Wind", "Water", "Animals", "All of these"], "answer": "d"},
        {"question": "What does a seed contain?", "options": ["Nothing", "Soil", "Baby plant", "Flower"], "answer": "c"},
    ],
    "Atmosphere": [
        {"question": "What surrounds the Earth?", "options": ["Water", "Land", "Atmosphere", "Clouds"], "answer": "c"},
        {"question": "Which gas is needed for breathing?", "options": ["Carbon dioxide", "Oxygen", "Nitrogen", "Hydrogen"], "answer": "b"},
        {"question": "Which layer contains clouds?", "options": ["Troposphere", "Stratosphere", "Mesosphere", "Thermosphere"], "answer": "a"},
        {"question": "Which layer protects us from UV rays?", "options": ["Troposphere", "Ozone layer", "Thermosphere", "Exosphere"], "answer": "b"},
        {"question": "What is the main gas in the air?", "options": ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"], "answer": "c"},
        {"question": "Which gas do plants need?", "options": ["Oxygen", "Carbon dioxide", "Nitrogen", "Helium"], "answer": "b"},
        {"question": "Which layer is the hottest?", "options": ["Mesosphere", "Thermosphere", "Troposphere", "Exosphere"], "answer": "b"},
        {"question": "Air is a mixture of?", "options": ["Gases", "Liquids", "Solids", "Dust only"], "answer": "a"},
        {"question": "What causes air pollution?", "options": ["Plants", "Vehicles", "Rain", "Animals"], "answer": "b"},
        {"question": "Which layer do we live in?", "options": ["Stratosphere", "Troposphere", "Mesosphere", "Thermosphere"], "answer": "b"},
    ]
    # 🔁 Add 7 more topics: Geography, English, Computer, Physics, Chemistry, Biology, GK
}

# 📥 Start quiz: fetch questions by topic
@app.route("/start_quiz", methods=["POST"])
def start_quiz():
    data = request.get_json()
    name = data.get("name")
    student_class = data.get("class")
    topic = data.get("topic")

    if topic not in QUESTION_BANK:
        return jsonify({"status": "error", "message": "Invalid topic."}), 400

    quiz_id = str(uuid.uuid4())
    questions = QUESTION_BANK[topic]

    return jsonify({
        "quiz_id": quiz_id,
        "name": name,
        "class": student_class,
        "topic": topic,
        "questions": questions
    })

@app.route("/get_questions", methods=["POST"])
def get_questions():
    data = request.get_json()
    topic = data.get("topic")
    questions = QUESTION_BANK.get(topic, [])
    return jsonify({"questions": questions})

# 🧾 Save quiz results
@app.route("/submit_results", methods=["POST"])
def submit_results():
    data = request.get_json()
    quiz_id = data.get("quiz_id")
    name = data.get("name")
    student_class = data.get("class")
    topic = data.get("topic")
    psi = data.get("psi")
    ati = data.get("ati")

    with open(CSV_FILE, "a", newline="") as file:
        writer = csv.writer(file)
        writer.writerow([quiz_id, name, student_class, topic, psi, ati])

    return jsonify({"status": "success", "message": "Results saved successfully."})

# 🗃️ Setup CSV file if not present
if __name__ == "__main__":
    if not os.path.exists(CSV_FILE):
        with open(CSV_FILE, "w", newline="") as file:
            writer = csv.writer(file)
            writer.writerow(["quiz_id", "name", "class", "topic", "psi", "ati"])
    app.run(debug=True, port=5200)

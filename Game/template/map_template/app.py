from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import pymongo
import os
import requests

app = Flask(__name__)
CORS(app)

# MongoDB Connection
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["map_database"]
places_collection = db["places"]

# Path to the uploads directory
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure the uploads folder exists
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# OpenStreetMap's Nominatim API for Geocoding
GEOCODING_API_URL = "https://nominatim.openstreetmap.org/search"
HEADERS = {"User-Agent": "Flask-App"}

def get_coordinates(place_name):
    """Fetch coordinates for a place using OpenStreetMap's Nominatim API."""
    params = {
        "q": place_name,
        "format": "json",
        "limit": 1
    }
    try:
        response = requests.get(GEOCODING_API_URL, headers=HEADERS, params=params)
        if response.status_code == 200:
            data = response.json()
            if data:
                return [float(data[0]["lon"]), float(data[0]["lat"])]  # [longitude, latitude]
    except Exception as e:
        print(f"Error fetching coordinates: {e}")
    return None

# Serve the upload page
@app.route('/')
def upload_page():
    return render_template('upload.html')

# Serve the map render page
@app.route('/render_map')
def render_map_page():
    return render_template('render_map.html')

@app.route('/api/upload_places', methods=['POST'])
def upload_places():
    """Receives a list of places from the frontend, fetches their coordinates, and stores them in MongoDB."""
    data = request.json
    places = data.get("places", [])

    for place in places:
        coordinates = get_coordinates(place["name"])
        if coordinates:
            places_collection.insert_one({
                "name": place["name"],
                "description": place["description"],
                "coordinates": coordinates  # [longitude, latitude]
            })

    return jsonify({"message": "Places added successfully!"}), 200

@app.route('/api/get_places', methods=['GET'])
def get_places():
    """Fetch all stored places with coordinates."""
    places = list(places_collection.find({}, {"_id": 0}))
    return jsonify(places)

# Upload image and save it
@app.route('/upload_image', methods=['POST'])
def upload_image():
    """Uploads and saves the map image."""
    file = request.files['map_image']
    if file:
        filename = 'map_image.jpg'  # Save with a fixed name for simplicity
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        return jsonify({"message": "Image uploaded successfully!"}), 200
    return jsonify({"message": "No file uploaded."}), 400

# Serve uploaded images
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=8000)  # Changed port to 8000

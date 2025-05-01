from flask import Flask, render_template, request, jsonify
from pymongo import MongoClient
import pandas as pd
import plotly.graph_objects as go
import numpy as np
from werkzeug.utils import secure_filename
import os

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads/'
app.config['ALLOWED_EXTENSIONS'] = {'xlsx', 'xls'}
client = MongoClient('mongodb://localhost:27017/')
db = client['data_db']
collection = db['data_collection']

# Helper function to check file extension
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'message': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)

        # Read the Excel file into a DataFrame
        df = pd.read_excel(file_path)

        # Ensure there are exactly 3 columns
        if df.shape[1] != 3:
            return jsonify({'message': 'Excel sheet must have exactly 3 columns'}), 400
        
        # Ensure the first column is non-numeric (strings), and second/third columns are numeric
        if not df.iloc[:, 0].apply(lambda x: isinstance(x, str)).all():
            return jsonify({'message': 'First column must contain words'}), 400

        if not df.iloc[:, 1:].apply(pd.to_numeric, errors='coerce').notna().all().all():
            return jsonify({'message': 'Second and third columns must contain numbers'}), 400
        
        # Convert DataFrame to a dictionary and store in MongoDB
        data_dict = df.to_dict(orient='records')
        collection.insert_many(data_dict)

        return jsonify({'message': 'File uploaded and data stored successfully'}), 200
    else:
        return jsonify({'message': 'Invalid file type'}), 400

@app.route('/plot')
def plot():
    try:
        # Fetch data from MongoDB
        data = list(collection.find())
        
        # Dynamically extract the column names from the first document
        keys = list(data[0].keys())  # Assuming the keys are the same for all records
        
        # Extract the values for x, y, and z
        labels = [entry[keys[0]] for entry in data]  # First column (string labels)
        x = [entry[keys[1]] for entry in data]  # Second column (numeric)
        y = [entry[keys[2]] for entry in data]  # Third column (numeric)

        # Extract the fourth column for the z-axis
        z = [entry[keys[3]] for entry in data]  # Fourth column (numeric)

        # Create the 3D plot with lines joining the points
        fig = go.Figure(data=[go.Scatter3d(
            x=x,
            y=y,
            z=z,  # Use normalized values for the z-axis (fourth column)
            mode='lines+markers',  # 'lines+markers' to join the points with lines
            marker=dict(
                size=8,
                color=z,
                colorscale='Viridis',
                opacity=0.8
            ),
            line=dict(
                color='blue',
                width=2
            ),
            # Hover template for showing the column 1 (labels), 2 (x), and 3 (y) values
            hovertemplate=(
                '%{x}<br>'  # Show column 1 (label)
                '%{y}<br>'  # Show column 2 (x values)
                '%{z}<br>'  # Show column 3 (y values)
                '<extra></extra>'  # Hides the trace name from the hover info
            ),
            text=labels  # Set the labels from column 1 as the hover text
        )])

        # Enlarge the layout space and use dynamic labels for axes
        fig.update_layout(
            title="3D Plot of Data",
            scene=dict(
                xaxis_title=keys[1],  # Label for the x-axis (second column)
                yaxis_title=keys[2],  # Label for the y-axis (third column)
                zaxis_title=keys[3]  # Label for the z-axis (normalized values of fourth column)
            ),
            width=1200,  # Increase the plot's width
            height=600,  # Increase the plot's height
            margin=dict(l=0, r=0, t=50, b=0)  # Reduce margins to use more space
        )

        # Convert the plot to HTML
        plot_html = fig.to_html(full_html=False)
        return render_template('plot.html', plot_html=plot_html)

    except Exception as e:
        print("Error in /plot route:", str(e))
        return f"Error: {str(e)}", 500

@app.route('/plot2d')
def plot2d():
    try:
        # Fetch data from MongoDB
        data = list(collection.find())

        # Extract the first three columns dynamically (x, y, and z)
        labels = [entry[list(entry.keys())[0]] for entry in data]  # First column (words)
        x = [entry[list(entry.keys())[1]] for entry in data]  # Second column (numeric)
        y = [entry[list(entry.keys())[2]] for entry in data]  # Third column (numeric)
        
        # Create the 2D plot with lines connecting the points
        fig = go.Figure(data=[go.Scatter(
            x=x, 
            y=y,
            mode='lines+markers',  # 'lines+markers' will add both lines and markers to the plot
            line=dict(color='blue', width=2),  # Line styling
            marker=dict(size=8, color='red', opacity=0.8),  # Marker styling
        )])

        # Update layout for better styling
        fig.update_layout(
            title="2D Plot of Data with Lines",
            xaxis_title="Column 2",
            yaxis_title="Column 3",
            width=1200,  # Set width for better visibility
            height=600,  # Set height for better visibility
            margin=dict(l=0, r=0, t=50, b=0)  # Reduce margins to use more space
        )

        # Convert the plot to HTML
        plot_html = fig.to_html(full_html=False)
        return render_template('plot2d.html', plot_html=plot_html)

    except Exception as e:
        print("Error in /plot2d route:", str(e))
        return f"Error: {str(e)}", 500

if __name__ == '__main__':
    app.run(debug=True)

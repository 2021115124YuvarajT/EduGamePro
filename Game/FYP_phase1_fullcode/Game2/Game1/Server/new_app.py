from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import joblib
from dqn_agent import DQNAgent

app = Flask(__name__) 
CORS(app)  # Enable CORS

state_dim = 12  # This should match the state dimensions used during training
action_dim = 4  # Number of actions available

# Load the DQN agent model
try:
    agent = DQNAgent.load_model('../Client/model/dqn_model.pkl')
    print("DQN model loaded successfully")
except Exception as e:
    print(f"Error loading model: {e}")

try:
    model1 = joblib.load('../Client/model/new_4param_model.pkl')
    print("model 1 loaded successfully")
except Exception as e:
    print(e)
@app.route('/process_answer', methods=['POST'])
def process_answer():
    try:
        print("Received a request successfully")
        data = request.json
        print("Data received:", data)
        
        time_taken = data['timeTaken']
        correct = data['correct']
        operation = data['operation']
        
        # Prepare input data for the model
        input_data = np.array([[operation, time_taken, int(correct)]])  # Ensure correct is converted to an int (0 or 1)

        # Predict difficulty
        difficulty = model1.predict(input_data)[0]
        print("For the given input:")
        print("Time taken: ", time_taken)
        print("Correct status: ", correct)
        print("Operation performed:", operation)
        print("The predicted difficulty is:", difficulty, "\n")

        return jsonify({'difficulty': difficulty})
    except Exception as e:
        print(f"Error processing request: {e}")  # Log the error message
        return jsonify({'error': str(e)}), 500

@app.route('/getStonePositions', methods=['POST'])
def generate_stones():
    try:
        print("Received the stone request successfully")
        data = request.json
        print("Data received:", data)
        
        # Extract relevant data from the request
        time_to_catch_food = data['time_to_catch_food']
        print("time to catch food is ",time_to_catch_food)
        previous_obstacle_state = data['stone_state']
        print("obstacle state: ",previous_obstacle_state)
        
        # Prepare input data for the model
        
        state_index = hash((time_to_catch_food, previous_obstacle_state)) % state_dim
        state_vector = np.zeros(state_dim, dtype=np.float32)
        state_vector[state_index] = 1
        
        print("Input data for model:", state_vector)
        
        # Get the action from the agent
        action = agent.act(state_vector)
        if(action < previous_obstacle_state and time_to_catch_food < 30):
            print(action)
            action = min(11, previous_obstacle_state+1)
        else:
            action = max(1,previous_obstacle_state-action)
            print("Predicted action:", action)

        return jsonify({'stone_state': action})
    except Exception as e:
        print(f"Error processing request: {e}")  # Log the error message
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True,port=5301)

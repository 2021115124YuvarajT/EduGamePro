import random
import numpy as np
from gym import spaces
 
class SnakeGameEnv:
    def __init__(self, grid_size=10):
        self.grid_size = grid_size
        self.action_space = spaces.Discrete(4)
        self.observation_space = spaces.Box(low=0, high=1, shape=(12,), dtype=np.float32)
        self.reset()
 
    def reset(self):
        self.state = {
              # Initial snake position (multiple of 20)
              # Initial food position as tuple
            
            'time_taken':0,
            'state_vector': np.zeros(12, dtype=np.float32),
            'prevStateIndex':0,
            'difficulty':5
            
        }
        self.state_index = 0
        self.count = 0
        self.state['state_vector'][self.state_index] = 1
        return self.state

    def random_food_position(self):
        return (np.random.randint(0, self.grid_size) * 20, np.random.randint(0, self.grid_size) * 20)

    def index_to_vector(self, index):
        vector = np.zeros(12, dtype=np.float32)
        vector[index] = 1
        return vector

    def vector_to_index(self, vector):
        return np.argmax(vector)

    def difficulty_to_obstacle_positions(self, difficulty):
        if difficulty < 4:
            if self.state_index < 11:
                next_index = random.randint(self.state_index + 1, 11)
            else:
                next_index = self.state_index  # If already at the upper limit, stay the same
        else:
            if self.state_index > 0:
                next_index = random.randint(0, self.state_index - 1)
            else:
                next_index = self.state_index  # If already at the lower limit, stay the same
        return next_index

    def time_to_difficulty(self, time_taken):
        min_time = 10
        max_time = 50
        
        difficulty = (time_taken - min_time) / (max_time - min_time) * 5
        
        difficulty = np.clip(difficulty, 0, 5)
        
        return difficulty

    def step(self, action, time_taken):
        
        difficulty = self.time_to_difficulty(time_taken)
        self.difficulty = difficulty
        obstacles = self.difficulty_to_obstacle_positions(difficulty)
        self.state_index = obstacles
        state_vector = self.index_to_vector(self.state_index)
        print(state_vector)

        action = self.state_index
        self.count +=1
        



        next_state = {
            
            'time_taken' :time_taken,
            'prevStateIndex':self.state_index,
            'state_vector': state_vector,
            'difficulty':difficulty
        }

        # Reward calculation based on difficulty
        #reward = 1 if 3 <= difficulty <= 5 else 0
        
        # Define done condition if required
        done = True if self.count == 50 else False

        return next_state, difficulty,done,time_taken

if __name__ == "__main__":
    env = SnakeGameEnv(grid_size=10)
    print(env.state)

import numpy as np
import time
from snake_env import SnakeGameEnv
from dqn_agent import DQNAgent
import matplotlib.pyplot as plt
 
# Initialize the environment and agent
env = SnakeGameEnv(grid_size=10)
state_dim = 12  # Ensure this matches the length of state vectors
action_dim = env.action_space.n  # Number of actions available
agent = DQNAgent(state_dim, action_dim)
 
# Define the number of episodes
episodes = 500

# Define obstacle positions (12 sets)
obstacle_array = [
    [(1, 2), (3, 4), (5, 6), (7, 8)],
    [(2, 3), (4, 5), (6, 7), (8, 9), (1, 0)],
    [(0, 1), (2, 3), (4, 5), (6, 7), (8, 9), (1, 8)],
    [(1, 1), (2, 2), (3, 3), (4, 4), (5, 5), (6, 6), (7, 7)],
    [(0, 2), (1, 3), (2, 4), (3, 5)],
    [(1, 2), (2, 3), (3, 4), (4, 5), (5, 6)],
    [(2, 1), (3, 2), (4, 3), (5, 4), (6, 5), (7, 6)],
    [(1, 0), (2, 1), (3, 2), (4, 3), (5, 4), (6, 5), (7, 6)],
    [(3, 4), (4, 5), (5, 6), (6, 7)],
    [(2, 3), (3, 4), (4, 5), (5, 6), (6, 7)],
    [(1, 1), (2, 2), (3, 3), (4, 4), (5, 5), (6, 6)],
    [(0, 3), (1, 4), (2, 5), (3, 6), (4, 7), (5, 8), (6, 9)]
]

def state_to_index(state):
    
    timeTaken = state['time_taken']
    prevStateIndex = state['prevStateIndex']
    
    state_id = hash((timeTaken,prevStateIndex)) % state_dim
    return state_id


epsilons = []

for episode in range(episodes):
    state = env.reset()
    state_index = state_to_index(state)
    state_vector = np.zeros(state_dim, dtype=np.float32)
    state_vector[state_index] = 1
    
    done = False
    #total_reward = 0
    count = 0
    time_taken = 1
    
    while not done:
        action = agent.act(state_vector)
        next_state, difficulty,done,time_taken = env.step(action, time_taken=time_taken)
        
        next_state_index = state_to_index(next_state)
        next_state_vector = np.zeros(state_dim, dtype=np.float32)
        next_state_vector[next_state_index] = 1
        
        agent.remember(state_vector, action, next_state_vector, done)
        agent.replay()
        
        state_vector = next_state_vector
        
        count += 1
        
        # Print values to monitor
        print(f"Step: {count}, Action: {action},Done: {done}")
        print(f"difficulty:",{difficulty})
        print(f"timetaken:",{time_taken})
        print(f"State Index: {state_index}, Next State Index: {next_state_index}")
        print(f"State Vector: {state_vector}")
        print(f"Next State Vector: {next_state_vector}")
        
        #print(f"Total Reward: {total_reward}, Time Taken: {time_taken}")
        
        if count >= 100:
            break
        time_taken = min(time_taken + 3, 50)
        if(time_taken >= 50):
            break
        
    
    agent.update_target_net()
    agent.decay_epsilon()
    
    #total_rewards.append(total_reward)
    epsilons.append(agent.epsilon)
    
    print(f"Episode {episode + 1}/{episodes}, Epsilon: {agent.epsilon}")

# Save the trained model
agent.save_model('dqn_model.pkl')

# Plotting

# Plot Total Rewards
#plt.figure(figsize=(12, 5))
#plt.subplot(1, 2, 1)
#plt.plot(total_rewards, label='Total Reward per Episode')
# plt.xlabel('Episode')
# plt.title('Total Rewards per Episode')
# plt.legend()

# Plot Epsilon
#plt.subplot(1, 2, 2)
plt.plot(epsilons, label='Epsilon per Episode', color='orange')
plt.xlabel('Episode')
plt.ylabel('Epsilon')
plt.title('Epsilon per Episode')
plt.legend()

#plt.tight_layout()
plt.show()

import torch
import torch.nn as nn
import torch.optim as optim
import random
from collections import deque
import pickle
  
class ReplayMemory:
    def __init__(self, capacity):
        self.memory = deque(maxlen=capacity)

    def push(self, experience):
        self.memory.append(experience)

    def sample(self, batch_size):
        return random.sample(self.memory, batch_size)

    def __len__(self):
        return len(self.memory)

class DQN(nn.Module):
    def __init__(self, input_dim, output_dim):
        super(DQN, self).__init__()
        self.fc1 = nn.Linear(input_dim, 128)
        self.fc2 = nn.Linear(128, 128)
        self.out = nn.Linear(128, output_dim)
    
    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = torch.relu(self.fc2(x))
        return self.out(x)

class DQNAgent:
    def __init__(self, state_dim, action_dim, lr=0.001, gamma=0.99, epsilon=1.0, epsilon_decay=0.995, epsilon_min=0.01):
        self.state_dim = state_dim
        self.action_dim = action_dim
        self.gamma = gamma
        self.epsilon = epsilon
        self.epsilon_decay = epsilon_decay
        self.epsilon_min = epsilon_min
        
        self.policy_net = DQN(state_dim, action_dim)
        self.target_net = DQN(state_dim, action_dim)
        self.optimizer = optim.Adam(self.policy_net.parameters(), lr=lr)
        
        self.memory = ReplayMemory(10000)
        self.batch_size = 64
        
        self.update_target_net()

    def update_target_net(self):
        self.target_net.load_state_dict(self.policy_net.state_dict())

    def act(self, state):
        if random.random() < self.epsilon:
            return random.choice(range(self.action_dim))
        state = torch.FloatTensor(state).unsqueeze(0)
        with torch.no_grad():
            action_values = self.policy_net(state)
        return torch.argmax(action_values).item()

    def remember(self, state, action, next_state, done):
        self.memory.push((state, action, next_state, done))

    def replay(self):
        if len(self.memory) < self.batch_size:
            return
        batch = self.memory.sample(self.batch_size)
        states, actions,next_states, dones = zip(*batch)
    
        states = torch.FloatTensor(states)
        actions = torch.LongTensor(actions)
        #rewards = torch.FloatTensor(rewards)
        next_states = torch.FloatTensor(next_states)
        dones = torch.FloatTensor(dones).long()
    
        current_q_values = self.policy_net(states).gather(1, actions.unsqueeze(1)).squeeze(1)
        next_q_values = self.target_net(next_states).max(1)[0]
        next_q_values[dones] = 0.0
        expected_q_values =1 + (self.gamma * next_q_values)
    
        loss = nn.MSELoss()(current_q_values, expected_q_values)
    
        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()

    def save_model(self, filename):
        with open(filename, 'wb') as f:
            pickle.dump(self, f)
        print(f"Model saved to {filename}")

    @staticmethod
    def load_model(filename):
        with open(filename, 'rb') as f:
            return pickle.load(f)

    def decay_epsilon(self):
        self.epsilon = max(self.epsilon_min, self.epsilon * self.epsilon_decay)



if __name__ == "__main__":
    # Example usage
    state_dim = 12  # Dimension of state vector
    action_dim = 4  # Number of actions
    agent = DQNAgent(state_dim, action_dim)

    # Save and load model example
    agent.save_model('dqn_model.pkl')
    loaded_agent = DQNAgent.load_model('dqn_model.pkl')

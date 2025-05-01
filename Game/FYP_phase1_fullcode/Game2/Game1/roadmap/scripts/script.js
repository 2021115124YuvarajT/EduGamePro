let currentLevel = 1;

const avatar = document.getElementById('avatar');

// Function to move avatar to a level in a zig-zag path with intermediate movements
function moveToLevel(level) {
  const positions = {
    1: { left: '350px', top: '400px' },   // Avatar position for Level 1
    2: [
      { left: '550px', top: '420px' },   // Intermediate step
      { left: '700px', top: '440px' },   // Intermediate step
      { left: '850px', top: '480px' }    // Final position for Level 2
    ],
    3: [
      { left: '1000px', top: '480px' },   // Intermediate step
      { left: '1050px', top: '470px' },   // Intermediate step
      { left: '1100px', top: '460px' },
      { left: '1200px', top: '450px' },
      { left: '1200px', top: '400px' },
      { left: '1200px', top: '350px' },
      { left: '1200px', top: '300px' },
      { left: '1150px', top: '250px' },
      { left: '1100px', top: '200px' },
      { left: '1000px', top: '200px' }   // Final position for Level 3
    ],
    4: [
      { left: '850px', top: '250px' },   // Intermediate step
      { left: '800px', top: '240px' },   // Intermediate step
      { left: '700px', top: '230px' }    // Final position for Level 4
    ],
    5: [
      { left: '600px', top: '150px' },   // Intermediate step
      { left: '550px', top: '100px' },   // Intermediate step
      { left: '500px', top: '50px' }     // Final position for Level 5
    ],
    6: [
      { left: '700px', top: '30px' },    // Intermediate step
      { left: '800px', top: '20px' },    // Intermediate step
      { left: '900px', top: '10px' }     // Final position for Level 6
    ]
  };

  // Check if there are intermediate positions for the level
  const levelPositions = positions[level];
  if (Array.isArray(levelPositions)) {
    moveInSteps(levelPositions, level);
  } else {
    // Move directly to the final position if no intermediate steps are defined
    avatar.style.left = levelPositions.left;
    avatar.style.top = levelPositions.top;
    setTimeout(() => performOperation(level), 1000); // Perform operation after moving
  }
} 

// Function to move avatar through intermediate positions
function moveInSteps(steps, level) {
  let index = 0;
  
  function moveStep() {
    if (index < steps.length) {
      avatar.style.left = steps[index].left;
      avatar.style.top = steps[index].top;
      index++;
      setTimeout(moveStep, 500);  // Move to next step after 500ms
    } else {
      setTimeout(() => performOperation(level) , 1000);
    }
  }
  
  moveStep();
}

function performOperation(level) {
  // Show the custom alert
  customAlert(`Entering into Level ${level}`, function() {
    // Redirect to the new page after the user clicks OK
    window.location.href = `./levels/level${level}.html`;
  });
}

// Custom alert function with a callback for the OK button
function customAlert(message, callback) {
  const customAlert = document.getElementById('custom-alert');
  const alertMessage = document.getElementById('alert-message');
  const alertOkBtn = document.getElementById('alert-ok-btn');

  alertMessage.textContent = message;
  customAlert.style.display = 'flex'; // Show the alert box

  alertOkBtn.onclick = function() {
    customAlert.style.display = 'none'; // Hide the alert box
    if (typeof callback === 'function') {
      callback(); // Execute the callback after clicking OK
    }
  };
}


// Unlocks the next level and moves the avatar after performing the operation
function unlockNextLevel(current) {
  const nextLevel = current + 1;
  const nextLevelElement = document.getElementById(`level${nextLevel}`);
  if (nextLevelElement) {
    nextLevelElement.classList.add('unlocked');
  }
}

// Start the game and move the avatar from Level 1 to Level 5 in a zig-zag path
function startGame() {
  moveToLevel(1);
  unlockNextLevel(0);  // Start at Level 1
}
var current1 = 1;
const targetLevel = localStorage.getItem('targetLevel');
  if (targetLevel) {
    unlockNextLevel(Number(targetLevel)-1)
    localStorage.removeItem('targetLevel'); // Clear the stored level
    moveToLevel(Number(targetLevel));
  } else {
    startGame(); // Start the game normally if no target level is stored
  }

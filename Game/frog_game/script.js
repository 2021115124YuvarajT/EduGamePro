let topic = localStorage.getItem("topic");  // Retrieve topic from localStorage
let level = parseInt(localStorage.getItem("level")) || 1;  // Default to Level 1
let lives = 3;
let currentIndex = 0;
let questions = []; 
let isLevelCompleted = false; // Track if level is completed

const loadingElement = document.getElementById("loading");
const resultMessage = document.getElementById("resultMessage");

// ✅ Function to Navigate to Play Page
function goToPlay() {
    window.location.href = "play.html";
}

// ✅ Function to Start Game & Fetch Questions
function startGame() {
    if (!topic) {
        alert("⚠ No topic found! Please go back and generate questions first.");
        return;
    }

    fetch("http://127.0.0.1:5102/get_questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic })  // ✅ Fetch questions based on stored topic
    })
    .then(response => response.json())
    .then(data => {
        if (data.questions && data.questions.length > 0) {
            // Updated question counts per level
            let totalQuestions = [5, 7, 10, 13, 15];  // New level-based question count
            let requiredQuestions = totalQuestions[level - 1] || 5;

            questions = data.questions.slice(0, requiredQuestions);
            localStorage.setItem("questions", JSON.stringify(questions));
            localStorage.setItem("currentIndex", "0");
            localStorage.setItem("lives", "3");
            localStorage.setItem("level", level.toString()); // ✅ Store level for continuity
            localStorage.setItem("isLevelCompleted", "false"); // Reset level completion status

            window.location.href = "game.html";  // ✅ Navigate to game page
        } else {
            alert("⚠ No questions found. Please generate questions first!"); 
        }
    })
    .catch(error => console.error("❌ Error fetching questions:", error));
}

// ✅ Function to Load a Question
async function loadQuestion() {
    // Check if level is already completed from localStorage
    isLevelCompleted = localStorage.getItem("isLevelCompleted") === "true";
    if (isLevelCompleted) {
        return; // Don't load more questions if level is completed
    }

    if (questions.length === 0) {
        let storedQuestions = localStorage.getItem("questions");
        if (storedQuestions) {
            questions = JSON.parse(storedQuestions);
        }
    }

    currentIndex = parseInt(localStorage.getItem("currentIndex") || "0");
    let answeredInBatch = parseInt(localStorage.getItem("answeredInBatch") || "0");
    lives = parseInt(localStorage.getItem("lives") || "3");

    document.getElementById("lives").innerHTML = `<span style="color: white; font-weight: bold;">❤️ Lives: ${lives}</span>`;

    // Updated question counts per level
    let totalQuestionsPerLevel = [5, 7, 10, 13, 15]; // New level-based question count
    let requiredQuestions = totalQuestionsPerLevel[level - 1] || 5;

    console.log(`🟢 Level: ${level}, Current Index: ${currentIndex}, Answered In Batch: ${answeredInBatch}, Required: ${requiredQuestions}`);

    // Check if level is completed
    if (currentIndex >= requiredQuestions) {
        isLevelCompleted = true;
        localStorage.setItem("isLevelCompleted", "true");
        setTimeout(() => {
            alert(`🎉 Level ${level} Completed!`); 
            localStorage.clear(); // Reset game progress
            window.location.href = "index.html"; // Redirect to start page
        }, 600); // Small delay to allow final animation to complete
        return;
    }

    // ✅ Fetch More Questions if 10 Questions Are Answered in the Batch
    if (answeredInBatch >= 10 && currentIndex < requiredQuestions) {
        console.log("⚠ Fetching more questions...");
        await fetchMoreQuestions();
        return;
    }

    // ✅ If the question batch is exhausted, fetch more
    if (currentIndex >= questions.length && currentIndex < requiredQuestions) {
        console.log("⚠ No more questions in batch. Fetching new questions...");
        await fetchMoreQuestions();
        return;
    }

    // ✅ Display the Next Question
    if (currentIndex < questions.length) {
        let questionData = questions[currentIndex];
        document.getElementById("question").innerText = questionData.question;

        let optionsDiv = document.getElementById("options");
        optionsDiv.innerHTML = "";
        questionData.options.forEach(option => {
            let btn = document.createElement("button");
            btn.innerText = option;
            btn.onclick = () => checkAnswer(option, questionData.correct_answer);
            optionsDiv.appendChild(btn);
        });
    }
}

// ✅ Function to Fetch More Questions
async function fetchMoreQuestions() {
    console.log("🔄 Fetching more questions for Level:", level);

    try {
        const response = await fetch("http://127.0.0.1:5102/get_questions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ topic })
        });

        const result = await response.json();
        console.log("✅ New Questions Fetched:", result);

        if (response.ok && result.questions.length > 0) {
            // ✅ Append new questions to the existing question list
            questions = [...questions, ...result.questions];
            localStorage.setItem("questions", JSON.stringify(questions));

            // ✅ Reset batch count to track next 10 questions
            localStorage.setItem("answeredInBatch", "0");

            loadQuestion(); // Load next question
        } else {
            alert("❌ No new questions available!");
        }

    } catch (error) {
        console.error("❌ Fetch Error:", error);
    }
}

let frog = document.getElementById("frog");
let gameContainer = document.getElementById("game-container"); // Ensure game container exists
let initialFrogPosition = 10; // Initial frog position
let screenWidth = window.innerWidth; // Screen width
let jumpPositions = []; // Store obstacle-based jump positions

let currentJumpIndex = 0; // Track the frog's position in jumps
let isJumping = false;
const jumpHeight = 100; // Peak height of the jump
const jumpDuration = 600; // Duration of the full jump in ms

// Calculate optimal jump distance based on level and available width
function calculateJumpDistance() {
    // Updated question counts per level
    let questionCounts = [5, 7, 10, 13, 15];
    let numLeaves = questionCounts[level - 1] || 5;
    
    // Leave space at beginning and end (20% of width)
    let usableWidth = screenWidth * 0.8;
    // Calculate spacing between leaves
    return Math.floor(usableWidth / (numLeaves + 1));
}

function moveFrog() {
    if (isJumping || currentJumpIndex >= jumpPositions.length || isLevelCompleted) return; // Prevent extra jumps

    isJumping = true;

    let startX = parseInt(frog.style.left) || initialFrogPosition;
    let startY = parseInt(frog.style.bottom) || 80; // Initial position
    let nextX = jumpPositions[currentJumpIndex]; // Next horizontal position
    
    currentJumpIndex++; // Increment after getting the position

    let peakX = (startX + nextX) / 2; // Midpoint for peak
    let peakY = startY + jumpHeight; // Peak height

    let steps = 30; // Number of animation frames (higher = smoother)
    let step = 0; // Track current animation step

    function animateJump() {
        if (step > steps) {
            frog.style.left = nextX + "px";
            frog.style.bottom = startY + "px"; // Land at original bottom
            isJumping = false;
            return;
        }

        // Calculate smooth parabolic movement
        let t = step / steps; // Normalized time (0 to 1)
        let currentX = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * peakX + t * t * nextX;
        let currentY = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * peakY + t * t * startY;

        frog.style.left = currentX + "px";
        frog.style.bottom = currentY + "px";

        step++;
        requestAnimationFrame(animateJump); // Recursive animation
    }

    animateJump(); // Start animation

    // No need to scroll background or leaves - all elements stay fixed in position
}

// Call function on right arrow key press
document.addEventListener("keydown", function (event) {
    if (event.key === "ArrowRight") {
        moveFrog();
    }
});

// Modified generateObstacles to ensure all leaves stay within screen
function generateObstacles() {
    let level = parseInt(localStorage.getItem("level"), 10) || 1;
    // Updated question counts per level
    let questionCounts = [5, 7, 10, 13, 15];
    let numLeaves = questionCounts[level - 1] || 5;
    
    // Calculate spacing for leaves
    let jumpDistance = calculateJumpDistance();
    let startPosition = screenWidth * 0.1; // Start at 10% of screen width
    
    clearObstacles(); // Clear any existing obstacles
    jumpPositions = []; // Reset jump positions
    
    console.log(`Generating ${numLeaves} leaves for level ${level}`);
    
    // Position the frog before the first leaf
    initialFrogPosition = Math.max(10, startPosition - 100);
    if (frog) {
        frog.style.left = `${initialFrogPosition}px`;
        frog.style.bottom = "80px";
    }
    
    // Generate evenly-spaced obstacles
    for (let i = 0; i < numLeaves; i++) {
        let obstaclePos = startPosition + (i * jumpDistance);
        
        let obstacle = document.createElement("img");
        obstacle.src = "assets/leaf.png";
        obstacle.classList.add("obstacle");
        obstacle.style.left = `${obstaclePos}px`;
        obstacle.style.bottom = "50px"; // Ground level
        obstacle.style.position = "absolute"; // Ensure absolute positioning

        document.getElementById("game-container").appendChild(obstacle);
        jumpPositions.push(obstaclePos);
    }
    
    console.log("Jump positions:", jumpPositions);
}

// Clear existing obstacles before generating them
function clearObstacles() {
    const obstacles = document.querySelectorAll('.obstacle');
    obstacles.forEach(obstacle => obstacle.remove());
}

// Modified checkAnswer function to allow the final jump
function checkAnswer(selected, correct) {
    if (isLevelCompleted) return; // Don't process answers if level is complete
    
    if (selected.trim().toLowerCase() === correct.trim().toLowerCase()) {
        currentIndex++;

        // Updated question counts per level
        let totalQuestionsPerLevel = [5, 7, 10, 13, 15];
        let requiredQuestions = totalQuestionsPerLevel[level - 1] || 5;

        // ✅ Track answered questions in current batch
        let answeredInBatch = parseInt(localStorage.getItem("answeredInBatch") || "0") + 1;
        localStorage.setItem("answeredInBatch", answeredInBatch.toString());
        localStorage.setItem("currentIndex", currentIndex.toString());

        console.log(`✅ Answer Correct! Answered in Batch: ${answeredInBatch}, Current Index: ${currentIndex}`);
        
        // Check if this is the last question for the level
        if (currentIndex >= requiredQuestions) {
            // Make the final jump first, but don't set isLevelCompleted yet
            moveFrog();
            
            // Wait for the jump animation to complete, then show completion message
            setTimeout(() => {
                isLevelCompleted = true;
                localStorage.setItem("isLevelCompleted", "true");
                
                alert(`🎉 Level ${level} Completed!`);
                localStorage.clear(); // Reset game progress
                window.location.href = "index.html"; // Redirect to start page
            }, 800); // Increased delay to ensure jump animation completes
            
            return;
        }
        
        // Move the frog and then load the next question (not last question case)
        moveFrog();
        setTimeout(loadQuestion, 500);
    } else {
        lives--;
        document.getElementById("lives").innerText = `❤️ Lives: ${lives}`;
        localStorage.setItem("lives", lives.toString());

        if (lives === 0) {
            alert("💀 Game Over! Restarting...");
            window.location.href = "play.html";
        }
    }
}

// ✅ Load Questions When Game Page Opens
window.onload = function () {
    if (window.location.pathname.includes("game.html")) {
        // Check if level is already completed (for page refreshes)
        isLevelCompleted = localStorage.getItem("isLevelCompleted") === "true";
        
        // Generate obstacles after clearing any existing ones
        generateObstacles();
        
        // Load questions if we have them or redirect
        let storedQuestions = localStorage.getItem("questions");
        if (storedQuestions && !isLevelCompleted) {
            questions = JSON.parse(storedQuestions);
            loadQuestion();
        } else if (!storedQuestions) {
            alert("⚠ No questions found. Redirecting...");
            window.location.href = "play.html";
        }
    } else if (window.location.pathname.includes("play.html")) {
        console.log("✅ Play Page Loaded. Topic:", topic, "Level:", level);
    }
};

function back() {
    window.location.href = "index.html";
}

function backto() {
    window.location.href = "../template/games.html";
}
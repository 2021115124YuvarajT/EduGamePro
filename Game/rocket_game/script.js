let usedQuestions = new Set(); // Store used question IDs
let questions = []; // Store fetched questions
let currentQuestionIndex = 0; // Track current question index
let count = 0;
let startTime = Date.now(); // Track start time
let answeredQuestions = 0;
const totalQuestions = 10;

// Function to fetch new questions when needed
async function fetchQuestions() {
    try {
        let response = await fetch("http://127.0.0.1:5104/get_all_questions?count=10"); // Fetch 10 questions
        let data = await response.json();

        if (data.questions) {
            questions = data.questions;
            usedQuestions.clear(); // Reset used questions
            currentQuestionIndex = 0; // Reset index
            startTime = Date.now();
        } else {
            console.error("⚠ No questions received");
        }
    } catch (error) {
        console.error("❌ Error fetching questions:", error);
    }
}

// Function to calculate Speed (PSI) and Completion (ATI)
function calculateStats() {
    let totalTimeTaken = (Date.now() - startTime) / 1000; // in seconds
    let psi = totalTimeTaken > 0 ? (answeredQuestions / totalTimeTaken) : 0; // Prevent divide by zero
    let ati = (answeredQuestions / totalQuestions) * 100; // Dynamic completion

    console.log(`✅ Speed (PSI): ${psi.toFixed(2)} questions/sec`);
    console.log(`✅ Completion (ATI): ${ati.toFixed(2)}%`);

    // Display stats
    document.getElementById("psiDisplay").textContent = `Speed (PSI): ${psi.toFixed(2)} questions/sec`;
    document.getElementById("atiDisplay").textContent = `Completion (ATI): ${ati.toFixed(2)}%`;
}

// Function to get the next question
function getNextQuestion() {
    if (currentQuestionIndex >= questions.length) {
        fetchQuestions(); // Refetch new questions when all are used
        return;
    }

    let selectedQuestion = questions[currentQuestionIndex];
    currentQuestionIndex++;

    // Prevent duplicate questions
    while (usedQuestions.has(selectedQuestion._id)) {
        currentQuestionIndex++;
        if (currentQuestionIndex >= questions.length) {
            fetchQuestions();
            return;
        }
        selectedQuestion = questions[currentQuestionIndex];
    }

    usedQuestions.add(selectedQuestion._id); // Mark as used
    displayQuestion(selectedQuestion);
}

// Call fetchQuestions() to load data
fetchQuestions();

const gameState = {
    score: 0,
    gameRunning: true,
    questionActive: false,
    activeObjects: []
};
function scrollBackground() {
    function step() {
        if (!gameState.gameRunning || gameState.questionActive) {
            requestAnimationFrame(step); // Keep checking until the game resumes
            return;
        }

        // Move background down
        gameContainer.style.backgroundPositionY = `${parseInt(gameContainer.style.backgroundPositionY || 0) + 2}px`;

        requestAnimationFrame(step); // Continue scrolling
    }

    requestAnimationFrame(step); // Start movement
}

function checkAnswer(selectedOption, correctAnswer) {
    const popup = document.getElementById("questionPopup");
    const scoreDisplay = document.getElementById("score");
    const scoreboard = document.querySelector(".scoreboard");

    // Remove previous buttons
    popup.innerHTML = "";

    // Create feedback message
    const feedback = document.createElement("p");
    feedback.style.fontSize = "22px";
    feedback.style.fontWeight = "bold";

    if (selectedOption === correctAnswer) {
        gameState.score += 5;
        scoreDisplay.textContent = gameState.score;
        scoreboard.classList.add("animated");

        feedback.textContent = "✅ Correct!";
        feedback.style.color = "green";
        answeredQuestions++;
        count+=1;
        console.log(count);
        if (count == 10){
            alert("You have won !");
            window.location.href = "upload.html";
        }
    } else {
        feedback.textContent = "❌ Wrong!";
        feedback.style.color = "red";
    }

    popup.appendChild(feedback);
    calculateStats();

    // Ensure game resumes properly
    setTimeout(() => {
        scoreboard.classList.remove("animated");
        popup.style.display = "none"; // Hide question popup
        gameState.questionActive = false;
        gameState.gameRunning = true;
        requestAnimationFrame(scrollBackground); // ✅ Restart background movement
    }, 1000);
}

document.addEventListener("DOMContentLoaded", () => {
    const spaceship = document.querySelector(".spaceship");
    const gameContainer = document.querySelector(".game-container");
    const gameOverText = document.querySelector(".game-over");
    const scoreDisplay = document.getElementById("score");
    const questionPopup = document.getElementById("questionPopup");
    const statsContainer = document.createElement("div");
    statsContainer.innerHTML = `
        <div id="psiDisplay" style="color: white; font-size: 18px; margin-bottom: 5px;"></div>
        <div id="atiDisplay" style="color: white; font-size: 18px;"></div>
    `;
    document.body.appendChild(statsContainer);

    let lane = 1;
    const lanePositions = ["25%", "50%", "75%"];
    let bottomPosition = 50;

    spaceship.style.left = lanePositions[lane];

    document.addEventListener("keydown", (event) => {
        if (!gameState.gameRunning || gameState.questionActive) return;

        if (event.key === "ArrowLeft" && lane > 0) {
            lane--;
        } else if (event.key === "ArrowRight" && lane < 2) {
            lane++;
        } else if (event.key === "ArrowUp" && bottomPosition < window.innerHeight - 120) {
            bottomPosition += 30;
        } else if (event.key === "ArrowDown" && bottomPosition > 30) {
            bottomPosition -= 30;
        }

        requestAnimationFrame(() => {
            spaceship.style.left = lanePositions[lane];
            spaceship.style.bottom = bottomPosition + "px";
        });
    });

    scrollBackground();

    const lastSpawnTime = [0, 0, 0]; // Track last spawn time for each lane

    function createObject(type) {
        if (!gameState.gameRunning || gameState.questionActive) return;

        let now = Date.now(); // Get current time
        let possibleLanes = [0, 1, 2]; // All lanes initially available

        if (type === "obstacle") {
            // Ensure at least one lane is free
            let numObstacles = Math.random() < 0.5 ? 1 : 2; // 50% chance of 1 or 2 obstacles
            possibleLanes = possibleLanes.sort(() => Math.random() - 0.5).slice(0, numObstacles);
        } else {
            // Gifts and questions can be in any single lane
            possibleLanes = [Math.floor(Math.random() * 3)];
        }

        possibleLanes.forEach((laneIndex) => {
            if (now - lastSpawnTime[laneIndex] < 6000) return; // Ensure 3s delay before spawning

            const obj = document.createElement("div");
            obj.classList.add(type);
            obj.style.left = lanePositions[laneIndex];
            obj.style.top = "-100px"; // Start position

            gameContainer.appendChild(obj);
            gameState.activeObjects.push({ obj, type, y: -100 });

            moveObject(obj, type, -100);

            lastSpawnTime[laneIndex] = now; // Update spawn time for this lane
        });
    }

    function checkCollision(obj, spaceship) {
        const objRect = obj.getBoundingClientRect();
        const shipRect = spaceship.getBoundingClientRect();

        // Adjusted collision margin
        const collisionMargin = 20;

        return !(
            objRect.bottom < shipRect.top + collisionMargin ||
            objRect.top > shipRect.bottom - collisionMargin ||
            objRect.right < shipRect.left + collisionMargin ||
            objRect.left > shipRect.right - collisionMargin
        );
    }

    function handleCollision(type, obj) {
        const scoreDisplay = document.getElementById("score");

        if (!scoreDisplay) {
            console.error("⚠ Score display not found!");
            return;
        }

        if (type === "obstacle") {
            gameOver();
        } else if (type === "gift") {
            gameState.score += 5;
            scoreDisplay.textContent = gameState.score;
        } else if (type === "question-box") {
            if (gameState.questionActive) return; // 🛑 Prevent multiple questions

            gameState.questionActive = true;
            gameState.gameRunning = false;

            let randomIndex = Math.floor(Math.random() * questions.length);
            let selectedQuestion = questions[randomIndex];

            let buttonsContainer = document.getElementById("questionPopup");
            if (!buttonsContainer) {
                console.error("⚠ Question popup not found!");
                return;
            }

            buttonsContainer.innerHTML = `<p id="questionText">${selectedQuestion.question}</p>`;

            selectedQuestion.options.forEach(option => {
                let btn = document.createElement("button");
                btn.textContent = option;
                btn.onclick = () => checkAnswer(option, selectedQuestion.correctAnswer);
            
                // Apply inline CSS
                btn.style.background = "#3498db";
                btn.style.color = "white";
                btn.style.border = "none";
                btn.style.padding = "10px 15px";
                btn.style.borderRadius = "5px";
                btn.style.cursor = "pointer";
                btn.style.fontSize = "16px";
                btn.style.transition = "background 0.3s, transform 0.2s";
                btn.style.width = "100%";
                btn.style.maxWidth = "250px";
                btn.style.textAlign = "center";
                btn.style.margin = "5px auto";
                btn.style.display = "block";
            
                // Hover effect
                btn.onmouseover = () => btn.style.background = "#2980b9";
                btn.onmouseout = () => btn.style.background = "#3498db";
                btn.onmousedown = () => btn.style.transform = "scale(0.95)";
                btn.onmouseup = () => btn.style.transform = "scale(1)";
            
                buttonsContainer.appendChild(btn);
            });            

            buttonsContainer.style.display = "block";
        }

        obj.remove();
    }

    function gameOver() {
        gameState.gameRunning = false;
        gameOverText.style.display = "block";
        document.querySelectorAll(".obstacle, .gift, .question-box").forEach(obj => obj.remove());
        spaceship.style.display = "none";
        setTimeout(() => {
            window.location.href = "play.html";
        }, 1000);
    }
    function scrollBackground() {
        const gameContainer = document.querySelector(".game-container");
        let y = 0;

        function step() {
            if (!gameState.gameRunning || gameState.questionActive) {
                requestAnimationFrame(step); // Keep checking until the game resumes
                return;
            }

            y += 2; // Move background down
            gameContainer.style.backgroundPositionY = `${y}px`;

            requestAnimationFrame(step); // Continue scrolling
        }

        requestAnimationFrame(step); // Start movement
    }

    function moveObject(obj, type, y) {
        function step() {
            if (!gameState.gameRunning || gameState.questionActive) {
                requestAnimationFrame(step); // Keep checking if game has resumed
                return;
            }

            y += 2; // Move the object downward

            if (y > window.innerHeight - 100) {
                obj.remove(); // Remove object if it moves off-screen
            } else {
                obj.style.top = y + "px";
                requestAnimationFrame(step); // Continue movement
            }

            if (checkCollision(obj, spaceship)) {
                handleCollision(type, obj);
                obj.remove();
            }
        }

        requestAnimationFrame(step); // Start movement
    }

    setInterval(() => {
        if (gameState.gameRunning && !gameState.questionActive) {
            let rand = Math.random();
            if (rand < 0.5) {
                createObject("obstacle");
            } else if (rand < 0.75) {
                createObject("gift");
            } else {
                createObject("question-box");
            }
        }
    }, 1500);
});
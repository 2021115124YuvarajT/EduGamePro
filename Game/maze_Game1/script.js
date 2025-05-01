let startTime; // To store when the game starts
const maxTimePerLevel = { easy: 120, medium: 180, hard: 240 }; // Max allowed time (Tt)
let totalQuestions = 3;  // Track total questions attempted
let correctAnswers = 0;  // Track correct answers
// ✅ Define `level` at the top so it's accessible everywhere
const level = localStorage.getItem("mazeLevel") || "easy";
let currentScore = 0;
function showResults(psiScore, psScore) {
    setTimeout(() => {
        alert(`🎉 Congratulations! You completed the maze.
🚀 Processing Speed Index (PSI): ${(psiScore * 100).toFixed(2)}%
🧠 Processing Speed Score (PS): ${(psScore * 100).toFixed(2)}%`);
        window.location.href = "index.html";
    }, 100);
}

function calculatePSI() {
    let endTime = Date.now(); // Record when the player reaches the goal
    let totalTimeTaken = (endTime - startTime) / 1000; // Convert to seconds
    let maxTime = maxTimePerLevel[level]; // Get max time for selected difficulty

    let psi = (maxTime - totalTimeTaken) / maxTime; // PSI formula
    psi = Math.max(0, Math.min(psi, 1)); // Ensure PSI stays between 0 and 1
    let topic = localStorage.getItem("topic") || "Unknown Topic";
    let stmScore = getSTM();
    var a1 = 0.5;
    var a2 = 0.5;
    let ps = (a1 * stmScore) + (a2 * psi); 
    // Prepare CSV row
    let csvRow = `${topic},${level},${(psi * 100).toFixed(2)}%,${(stmScore * 100).toFixed(2)}%,${(ps * 100).toFixed(2)}%\n`;

    // Append data to CSV file
    saveToCSV(csvRow);
    // Display PSI result
    showResults(psi,ps);
}
function getSTM() {
    return totalQuestions > 0 ? (currentScore >0?currentScore:0) / totalQuestions : 0; // STM = Correct Answers / Total Questions
}

function saveToCSV(data) {
    fetch("http://127.0.0.1:5101/save_psi", { // Adjust backend URL
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entry: data })
    })
    .then(response => response.json())
    .then(data => console.log("✅ PSI data saved:", data))
    .catch(error => console.error("❌ Error saving PSI data:", error));
}

document.addEventListener("DOMContentLoaded", () => {

    const canvas = document.getElementById("mazeCanvas");
    const ctx = canvas.getContext("2d");

    const levels = { easy: { size: 10, obstacles: 3 }, medium: { size: 15, obstacles: 5 }, hard: { size: 20, obstacles: 7 } };

    const { size, obstacles } = levels[level];
    totalQuestions = obstacles;
    const cellSize = 40;
    canvas.width = size * cellSize;
    canvas.height = size * cellSize;

    const characterImg = new Image();
    characterImg.src = "images/character.png";

    const portalImg = new Image();
    portalImg.src = "images/portal.png";

    const obstacleImg = new Image();
    obstacleImg.src = "images/obstacle.png";

    let maze, playerPos, goalPos, obstaclePositions;

    characterImg.onload = () => initGame();

    document.addEventListener("keydown", movePlayer);

    function initGame() {
        maze = generateMaze(size, size);
        playerPos = { x: 0, y: 0 };
        goalPos = findFurthestCell(playerPos);
        obstaclePositions = placeObstacles(obstacles);
        if (!startTime) {
            startTime = Date.now(); // Ensure `startTime` is initialized
        }
        renderMaze();
    }

    function generateMaze(rows, cols) {
        const maze = Array.from({ length: rows }, () => Array(cols).fill(1));
        carvePassages(0, 0, maze);
        return maze;
    }

    function carvePassages(cx, cy, maze) {
        maze[cy][cx] = 0;
        const directions = ["N", "S", "E", "W"].sort(() => Math.random() - 0.5);

        for (const dir of directions) {
            const nx = cx + (dir === "E" ? 2 : dir === "W" ? -2 : 0);
            const ny = cy + (dir === "S" ? 2 : dir === "N" ? -2 : 0);

            if (ny >= 0 && ny < size && nx >= 0 && nx < size && maze[ny][nx] === 1) {
                maze[cy + (dir === "S" ? 1 : dir === "N" ? -1 : 0)][cx + (dir === "E" ? 1 : dir === "W" ? -1 : 0)] = 0;
                carvePassages(nx, ny, maze);
            }
        }
    }

    function findFurthestCell(start) {
        const queue = [start];
        const visited = Array.from({ length: size }, () => Array(size).fill(false));
        visited[start.y][start.x] = true;
        let furthest = start;

        while (queue.length) {
            const { x, y } = queue.shift();
            furthest = { x, y };

            [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].forEach(([nx, ny]) => {
                if (nx >= 0 && ny >= 0 && nx < size && ny < size && maze[ny][nx] === 0 && !visited[ny][nx]) {
                    visited[ny][nx] = true;
                    queue.push({ x: nx, y: ny });
                }
            });
        }

        return furthest;
    }

    function placeObstacles(count) {
        const positions = [];
        const pathCells = findPath(playerPos, goalPos);

        if (pathCells.length <= 2) return positions;

        const step = Math.floor(pathCells.length / (count + 1));

        for (let i = 1; i <= count; i++) {
            const obstaclePos = pathCells[i * step];
            if (obstaclePos && !positions.some(pos => pos.x === obstaclePos.x && pos.y === obstaclePos.y)) {
                positions.push(obstaclePos);
            }
        }

        return positions;
    }

    function findPath(start, end) {
        const queue = [[start]];
        const visited = Array.from({ length: size }, () => Array(size).fill(false));
        visited[start.y][start.x] = true;

        while (queue.length) {
            const path = queue.shift();
            const { x, y } = path[path.length - 1];

            if (x === end.x && y === end.y) return path;

            [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].forEach(([nx, ny]) => {
                if (nx >= 0 && ny >= 0 && nx < size && ny < size && maze[ny][nx] === 0 && !visited[ny][nx]) {
                    visited[ny][nx] = true;
                    queue.push([...path, { x: nx, y: ny }]);
                }
            });
        }

        return [];
    }

    function renderMaze() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                if (maze[y][x] === 1) drawWall(x, y);
            }
        }

        obstaclePositions.forEach(({ x, y }) => ctx.drawImage(obstacleImg, x * cellSize + 5, y * cellSize + 5, cellSize - 10, cellSize - 10));
        ctx.drawImage(portalImg, goalPos.x * cellSize + 5, goalPos.y * cellSize + 5, cellSize - 10, cellSize - 10);
        ctx.drawImage(characterImg, playerPos.x * cellSize + 5, playerPos.y * cellSize + 5, cellSize - 10, cellSize - 10);
    }

    function drawWall(x, y) {
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.rect(x * cellSize, y * cellSize, cellSize, cellSize);
        ctx.stroke();
    }

    let lives = 3; // Number of attempts before Game Over

    let usedQuestions = []; // Store already displayed questions
    let newQuestionsFetched = false; // Flag to check if new questions were fetched

    function askQuestion(obstacle, newX, newY) {
        fetchQuestion().then(({ question, options, correctAnswer }) => {
            // If all questions are used, fetch new questions
            if (usedQuestions.length > 0 && usedQuestions.includes(question)) {
                console.log("All questions displayed. Fetching new set...");
                fetchNewQuestions(newX, newY); // Fetch new questions & continue game
                return;
            }

            usedQuestions.push(question); // Store used question
            let attempts = 0;

            // Remove any existing question box before adding a new one
            const existingBox = document.getElementById("questionBox");
            if (existingBox) {
                document.body.removeChild(existingBox);
            }

            // Create the question box dynamically
            const questionBox = document.createElement("div");
            questionBox.id = "questionBox";
            questionBox.innerHTML = `
                <h3>${question}</h3>
                <div id="optionsContainer">
                    ${options.map(option =>
                `<button class="optionBtn" data-option="${option.split(")")[0]})">${option}</button>`
            ).join("")}
                </div>
                <p id="attemptsLeft">Attempts left: ${3 - attempts}</p>
            `;
            document.body.appendChild(questionBox);

            // Handle option click
            document.querySelectorAll(".optionBtn").forEach(button => {
                button.addEventListener("click", function () {
                    const selectedOption = this.getAttribute("data-option").trim();
                    const correctOption = correctAnswer.trim();

                    if (selectedOption === correctOption) {
                        currentScore++;
                        alert("✅ Correct! You can proceed.");
                        document.body.removeChild(questionBox);
                        obstaclePositions = obstaclePositions.filter(pos => !(pos.x === newX && pos.y === newY));
                        playerPos = { x: newX, y: newY };
                        renderMaze();
                    } else {
                        currentScore--;
                        attempts++;
                        lives--;
                        document.getElementById("attemptsLeft").textContent = `Attempts left: ${3 - attempts}`;
                        this.style.backgroundColor = "red";

                        if (attempts >= 3) {
                            document.body.removeChild(questionBox);
                            gameOver();
                        }
                    }
                });
            });
        });
    }

    function fetchNewQuestions(newX, newY) {
        const topic = localStorage.getItem("topic");
        fetch("http://127.0.0.1:5101/generate_question", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ topic: topic }) // Modify topic if needed
        })
            .then(response => response.json())
            .then(data => {
                console.log("✅ New questions received:", data);
                if (Array.isArray(data) && data.length > 0) {
                    usedQuestions = []; // Clear old questions
                    newQuestionsFetched = true; // Set flag
                    askQuestion(null, newX, newY); // Ask a new question and continue game
                } else {
                    alert("❌ Failed to fetch new questions. Try again.");
                }
            })
            .catch(error => console.error("❌ Error fetching new questions:", error));
    }

    // Function to fetch a question from your Flask backend
    function fetchQuestion() {
        return new Promise((resolve, reject) => {
            fetch("http://localhost:5101/get_question")  // Adjust URL if hosted remotely
                .then(response => {
                    if (!response.ok) {
                        throw new Error("Failed to fetch question");
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.error) {
                        reject(data.error);
                    } else {
                        resolve({
                            question: data.question,
                            options: data.options,
                            correctAnswer: data.correctAnswer
                        });
                    }
                })
                .catch(error => {
                    console.error("Error fetching question:", error);
                    reject("Error fetching question");
                });
        });
    }

    // Function to handle game over scenario
    function gameOver() {
        alert("💀 Game Over! You have exhausted all attempts.");
        window.location.href = "index.html";
    }

    // Modify movePlayer function to integrate question functionality
    function movePlayer(e) {
        const moves = {
            ArrowUp: { x: 0, y: -1 },
            ArrowDown: { x: 0, y: 1 },
            ArrowLeft: { x: -1, y: 0 },
            ArrowRight: { x: 1, y: 0 },
        };

        if (!moves[e.key]) return;

        const { x, y } = moves[e.key];
        const newX = playerPos.x + x;
        const newY = playerPos.y + y;

        if (newX >= 0 && newX < size && newY >= 0 && newY < size && maze[newY][newX] === 0) {
            const obstacle = obstaclePositions.find(pos => pos.x === newX && pos.y === newY);

            if (obstacle) {
                setTimeout(() => askQuestion(obstacle, newX, newY), 50);
            } else {
                playerPos = { x: newX, y: newY };
                renderMaze();

                if (newX === goalPos.x && newY === goalPos.y) {
                    calculatePSI();
                    setTimeout(() => {
                        alert("🎉 Congratulations! You completed the maze.");
                        window.location.href = "index.html";
                    }, 100);
                }
            }
        }
    }

    window.restartGame = function () {
        initGame();
    };
});

function back() {
    window.location.href = "index.html";
}

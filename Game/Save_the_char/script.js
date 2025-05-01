let lives = 3;
let usedQuestions = new Set();
let totalQuestions = parseInt(localStorage.getItem("qns")) || 5; // ✅ Fetch from localStorage
let questionCount = 0;
let startTime, endTime;
let correctAnswers = 0;
let memoryCheckAnswers = 0;
let memoryCheckQuestions = [];

let totalTimeTaken = 0;
let maxTimePerQuestion = 15; 
let questionStartTime;
let AVPIScores = [];
let PSI;
let AVPI;
let ATI;
let processingTimeScore;
let taskCompletion = 0;

console.log(`🔢 Total Questions Set: ${totalQuestions}`); // Debugging log

const questionText = document.getElementById("question-text");
const optionsContainer = document.getElementById("options");
const livesDisplay = document.getElementById("lives");
const kingImage = document.getElementById("king-img");
const soldierText = document.getElementById("soldier-text");
const gameOverScreen = document.getElementById("game-over");
const livesCount = document.getElementById("lives-count");
const livesBar = document.getElementById("lives-bar");
const livesContainer = document.getElementById("lives-container");
const livesBarContainer = document.getElementById("lives-bar-container");
const timeSpentDisplay = document.createElement("p");
const taskCompletionDisplay = document.createElement("p");
const ltmDisplay = document.createElement("p");

gameOverScreen.appendChild(timeSpentDisplay);
gameOverScreen.appendChild(taskCompletionDisplay);
gameOverScreen.appendChild(ltmDisplay);

let firstLoad = true;
let currentQuestion = null;
let gameEnded = false;

async function fetchQuestion() {
    if (gameEnded) return;

    if (questionCount >= totalQuestions) {
        console.log("✅ All questions answered! Transitioning to Memory Check...");
        startMemoryCheck();
        return;
    }

    if (questionCount === 0) {
        startTime = Date.now(); // Start time for entire game
    }

    try {
        const response = await fetch("http://127.0.0.1:5200/get_question");
        const data = await response.json();

        if (data.error) {
            console.error("❌ Error fetching question:", data.error);
            return;
        }

        if (usedQuestions.has(data.question)) {
            fetchQuestion();
            return;
        }

        usedQuestions.add(data.question);
        currentQuestion = data;
        questionCount++;
        memoryCheckQuestions.push(data);

        // ✅ Track start time for this question
        questionStartTime = Date.now();

        console.log(`🆕 New Question Loaded (${questionCount}/${totalQuestions}):`, data.question);
        loadQuestion();

    } catch (error) {
        console.error("❌ Fetch Error:", error);
    }
}

function loadQuestion() {
    if (lives <= 0) {
        console.log("❌ No lives remaining. Transitioning to Memory Check...");
        startMemoryCheck();
        return;
    }

    if (!currentQuestion) {
        fetchQuestion();
        return;
    }

    if (firstLoad) {
        soldierText.innerText = "Answer correctly to get water and put out the fire!";
        firstLoad = false;
    }

    soldierText.style.opacity = 0;
    soldierText.style.transform = "translateY(20px)";
    setTimeout(() => {
        soldierText.style.opacity = 1;
        soldierText.style.transform = "translateY(0)";
    }, 500);

    questionText.innerText = currentQuestion.question;
    optionsContainer.innerHTML = "";

    currentQuestion.options.forEach(option => {
        let button = document.createElement("button");
        button.innerText = option;
        button.onclick = () => checkAnswer(option.split(")")[0] + ")");
        optionsContainer.appendChild(button);
    });
}

function updateLives() {
    livesCount.innerText = lives;
    let percentage = (lives / 3) * 100;
    livesBar.style.width = `${percentage}%`;
    livesBar.style.backgroundColor = lives === 1 ? "red" : "green";
}

function checkAnswer(selected) {
    let correctAnswer = currentQuestion.correctAnswer;
    let fullCorrectAnswer = currentQuestion.options.find(opt => opt.startsWith(correctAnswer));

    let questionEndTime = Date.now();
    let timeTaken = (questionEndTime - questionStartTime) / 1000; // Convert to seconds
    totalTimeTaken += timeTaken;

    // ✅ Compute AVPI for this question
    AVPI = (maxTimePerQuestion - timeTaken) / maxTimePerQuestion;
    AVPI = Math.max(0, AVPI); // Ensure AVPI is not negative
    AVPIScores.push(AVPI); // Store for later averaging

    console.log(`📝 Answered: ${selected}, Correct: ${correctAnswer}, Time Taken: ${timeTaken}s, AVPI: ${AVPI}`);

    if (selected === correctAnswer) {
        correctAnswers++;
        soldierText.innerText = "Well done! Some fire was put out!";
        kingImage.src = "./assets/happy_king.jpeg";
    } else {
        soldierText.innerText = `Oh no! Fire is getting closer.. The correct answer was: ${fullCorrectAnswer}`;
        kingImage.src = "./assets/sad_king.jpeg";
        lives--;
        updateLives();
    }

    // Disable answer buttons
    const buttons = optionsContainer.getElementsByTagName("button");
    for (let btn of buttons) {
        btn.disabled = true;
    }

    setTimeout(() => {
        if (questionCount >= totalQuestions || lives === 0) {
            console.log("🛑 All questions attempted OR No lives left! Starting Memory Check...");
            startMemoryCheck();
        } else {
            fetchQuestion();
        }
    }, 2000);
}

function startMemoryCheck() {
    console.log(memoryCheckQuestions.length);
    if (memoryCheckQuestions.length === 0) {
        console.log("✅ Memory Check completed! Ending game...");
        gameOver();
        return;
    }

    // Hide soldier text and lives bar during memory check
    soldierText.style.display = "none";  
    livesContainer.style.display = "none";  

    let randomIndex = Math.floor(Math.random() * memoryCheckQuestions.length);
    currentQuestion = memoryCheckQuestions[randomIndex];
    memoryCheckQuestions.splice(randomIndex, 1);

    console.log(`🔄 Memory Check Question: ${currentQuestion.question}`);

    questionText.innerText = "Memory Check: " + currentQuestion.question;
    optionsContainer.innerHTML = "";

    currentQuestion.options.forEach(option => {
        let button = document.createElement("button");
        button.innerText = option;
        button.onclick = () => checkMemoryAnswer(option.split(")")[0] + ")");
        optionsContainer.appendChild(button);
    });
}

function checkMemoryAnswer(selected) {
    console.log('💭 Memory Check Answered: ${selected}, Correct: ${currentQuestion.correctAnswer}');
    
    if (selected === currentQuestion.correctAnswer) {
        memoryCheckAnswers++;
    }

    // ✅ Remove the answered question from memory check list
    memoryCheckQuestions = memoryCheckQuestions.filter(q => q !== currentQuestion);

    if (memoryCheckQuestions.length === 0) {
        console.log("✅ Memory Check completed! Showing final results...");
        alert("✅ Memory Check completed! Showing final results...");
        gameOver();// ✅ Ensure gameOver() is called after a small delay to avoid execution issues
    } else {
        setTimeout(startMemoryCheck, 1000); // ✅ Continue if more memory check questions remain
    }
}

function gameOver() {
    gameEnded = true;
    let gameEndTime = Date.now();
    let totalGameTime = (gameEndTime - startTime) / 1000; // Total time in seconds
    let STM = (correctAnswers / totalQuestions).toFixed(2);
    let LTM = correctAnswers > 0 ? (memoryCheckAnswers / correctAnswers).toFixed(2) : 0;

    // ✅ Assume IQ Score for WM Calculation (S_IQ)
    let S_IQ = 0.8; // This should ideally come from an external intelligence test.

    // ✅ WM Calculation (Weighted Average of STM & IQ Score)
    let x1 = 0.6, x2 = 0.4;
    let WM = ((x1 * STM) + (x2 * S_IQ)).toFixed(2);

    // ✅ Compute PSI
    let maxTotalTime = totalQuestions * maxTimePerQuestion;
    let PSI = (maxTotalTime - totalTimeTaken) / maxTotalTime;
    PSI = Math.max(0, PSI); // Ensure non-negative

    let AVPI_Avg = AVPIScores.length > 0 ? (AVPIScores.reduce((a, b) => a + b, 0) / AVPIScores.length) : 0;
    let AVP = 0.5 * STM + 0.5 * AVPI_Avg;

    let processingTimeScore = (AVPI_Avg + PSI) / 2;

    let taskCompletion = (lives > 0) ? 1 : 0.1;

    let beta = 0.7;
    let ATI = beta * processingTimeScore + (1 - beta) * taskCompletion;

    let ATN = 0.6 * STM + 0.4 * ATI;

    console.log(`📊 Final Results:`);
    console.log(`⏱️ Total Time: ${totalGameTime}s`);
    console.log(`🎯 STM (Short-Term Memory Score): ${STM * 100}%`);
    console.log(`📖 LTM (Long-Term Memory Score): ${LTM * 100}%`);
    console.log(`🧠 WM (Working Memory Score): ${WM * 100}%`);
    console.log(`⚡ PSI: ${PSI.toFixed(2)}`);
    console.log(`🧠 AVP: ${AVP.toFixed(2)}`);
    console.log(`👀 ATI: ${ATI.toFixed(2)}`);
    console.log(`🔎 ATN (Attention Score): ${ATN.toFixed(2)}`);

    // ✅ Send the extracted metrics to backend for CSV logging
    fetch("http://127.0.0.1:5200/save_metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            total_time: totalGameTime,
            STM: STM,
            LTM: LTM,
            WM: WM,
            PSI: PSI,
            AVP: AVP,
            ATI: ATI,
            ATN: ATN,
            task_completion: taskCompletion
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log("✅ Metrics saved:", data);
    
        // ✅ Hide the Memory Check UI
        questionText.innerText = "";
        optionsContainer.innerHTML = "";
    
        // ✅ Ensure lives-bar container is visible in Game Over
        livesContainer.style.display = "block";
        gameOverScreen.classList.remove("hidden");
    
        alert("Game Over!");
        localStorage.clear();
        window.location.href = "start.html";
    })
    .catch(error => {
        console.error("❌ Error saving metrics:", error);
        alert("Error saving your progress. Please try again.");
    });
    
}
 
fetchQuestion();

// Add CSS animation for shake effect
document.head.insertAdjacentHTML("beforeend", `
<style>
@keyframes shake {
  0% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  50% { transform: translateX(10px); }
  75% { transform: translateX(-10px); }
  100% { transform: translateX(0); }
}
</style>
`);


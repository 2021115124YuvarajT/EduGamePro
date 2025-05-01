document.addEventListener("DOMContentLoaded", function () {
    const quizContainer = document.getElementById("quiz-container");
    const resultContainer = document.getElementById("result-container");
    const nextBtn = document.getElementById("next-btn");
    const loadingIcon = document.getElementById("loading-icon");
    const gifContainer = document.getElementById("character"); // Element to display GIFs
    const progressBar = document.createElement('div');  
    let progressFill = document.createElement('div');
    let gameStatus  = document.getElementById("game-status");
    progressBar.id = "progress-bar";
    progressFill.id = "progress-fill";
    progressBar.appendChild(progressFill);
    document.querySelector(".quiz-wrapper").insertBefore(progressBar, quizContainer);

    let questionData = [];
    let currentQuestionIndex = 0;
    let overallQuestionIndex = 0;
    let score = 0;
    const rollNumber = localStorage.getItem("rollNumber"); // Get roll number from localStorage

    const kirbyGifs = {
        walking: "./kirbyGifs/kirbyWalking.gif",
        eating: ["kirbyEating1.gif", "kirbyEating2.gif", "kirbyEating3.gif", "kirbyEating4.gif", "kirbyEating5.gif"],
        crying: ["kirby_cry1.gif", "kirby_cry2.gif", "kirby_cry3.gif", "kirby_cry4.gif", "kirby_cry5.gif"],
    };

    // Preload all GIFs
    function preloadImages(paths, folder) {
        paths.forEach((path) => {
            const img = new Image();
            img.src = `./kirbyGifs/${folder}/${path}`;
        });
    }

    preloadImages(["kirbyEating1.gif", "kirbyEating2.gif", "kirbyEating3.gif", "kirbyEating4.gif", "kirbyEating5.gif"], "kirbyEating");
    preloadImages(["kirby_cry1.gif", "kirby_cry2.gif", "kirby_cry3.gif", "kirby_cry4.gif", "kirby_cry5.gif"], "kirbyCrying");

    // Set GIF based on the state (start, correct, or wrong answer)
    function setGif(state) {
        if (state === "start") {
            gifContainer.src = kirbyGifs.walking;

        } else if (state === "correct") {
            const randomEatGif = kirbyGifs.eating[Math.floor(Math.random() * kirbyGifs.eating.length)];
            gifContainer.src = "./KirbyGifs/kirbyEating/" + randomEatGif;
            gameStatus.innerHTML = "Kirby enjoys eating";

        } else if (state === "wrong") {
            const randomCryGif = kirbyGifs.crying[Math.floor(Math.random() * kirbyGifs.crying.length)];
            gifContainer.src = "./KirbyGifs/kirbyCrying/" + randomCryGif;
            gameStatus.innerHTML = "Kirby is crying";
        }
    }

    // Set walking GIF at the start
    setGif("start");

    // Fetch questions from the backend
    async function fetchQuestions() {
        try {
            showLoading(true);
            const response = await fetch('http://127.0.0.1:5000/get-questions');
            if (!response.ok) throw new Error('Failed to fetch questions');

            questionData = await response.json();
            showLoading(false);
            currentQuestionIndex = 0;
            displayQuestion(currentQuestionIndex);
        } catch (error) {
            console.error("Failed to fetch questions:", error);
            showLoading(false);
        }
    }

    function showLoading(isLoading) {
        loadingIcon.style.display = isLoading ? 'block' : 'none';
    }

    function displayQuestion(index) {
        if (index < questionData.length) {
            const question = questionData[index];
            quizContainer.innerHTML = `
                <h3>Q${overallQuestionIndex + 1}: ${question.question}</h3>
                <div class="options">
                    <label><input type="radio" name="question${index}" value="a"> ${question.options.a}</label>
                    <label><input type="radio" name="question${index}" value="b"> ${question.options.b}</label>
                    <label><input type="radio" name="question${index}" value="c"> ${question.options.c}</label>
                    <label><input type="radio" name="question${index}" value="d"> ${question.options.d}</label>
                </div>
                <p id="feedback"></p>
            `;
            quizContainer.classList.add('active');
            nextBtn.style.display = "none";
            updateProgressBar(index + 1);
        } else {
            showFinalScore();
        }
    }

    function handleAnswer() {
        const selectedOption = document.querySelector(`input[name="question${currentQuestionIndex}"]:checked`);
        if (selectedOption) {
            const answer = selectedOption.value;
            const correctAnswer = questionData[currentQuestionIndex].correct_answer;
            const feedback = document.getElementById("feedback");

            if (answer === correctAnswer) {
                score++;
                console.log("score is now ",score);
                if(score>=50 && localStorage.getItem('shownQ1') == 0){
                    console.log(localStorage.getItem('q1Flag'));
                    localStorage.setItem('q1Flag',1);
                }
                feedback.textContent = "Correct!";
                feedback.classList.add("correct");
                setGif("correct");
            } else {
                feedback.textContent = `Wrong! The correct answer is: ${correctAnswer}`;
                feedback.classList.add("wrong");
                setGif("wrong");
            }

            nextBtn.style.display = "block";
        }
    }

    function handleNext() {
        overallQuestionIndex++;
        currentQuestionIndex++;
        quizContainer.classList.remove('active');
        setTimeout(() => {
            if (currentQuestionIndex < questionData.length) {
                displayQuestion(currentQuestionIndex);
            } else {
                fetchQuestions();
            }
        }, 300);
    }

    function handleEnd() {
        nextBtn.style.display = "none";
        quizContainer.innerHTML = `<h2>You ended the quiz early.</h2><h3>Your score: ${score} out of ${overallQuestionIndex + 1}</h3>`;
        resultContainer.innerHTML = `<button id="retry-btn">Retry</button>`;

        const retryBtn = document.getElementById("retry-btn");
        retryBtn.style.display = "block";
        retryBtn.addEventListener("click", () => {
            overallQuestionIndex = 0;
            score = 0;
            fetchQuestions();
            setGif("start");
            retryBtn.style.display = "none";
        });

        progressFill.style.width = '0%';
        updateStudentEval(questionData, score); // Pass questionData and score to updateStudentEval when quiz ends early
    }

    function showFinalScore() {
        updateStudentEval(questionData, score); // Pass questionData and score to updateStudentEval when quiz finishes
        quizContainer.innerHTML = `<h2>Your final score: ${score} out of ${overallQuestionIndex + 1}</h2>`;
        resultContainer.innerHTML = `
            <button id="retry-btn">Retry</button>
            <button id="exit-btn">Exit</button>
        `;

        const retryBtn = document.getElementById("retry-btn");
        retryBtn.addEventListener("click", () => {
            overallQuestionIndex = 0;
            score = 0;
            fetchQuestions();
            setGif("start");
        });

        const exitBtn = document.getElementById("exit-btn");
        exitBtn.addEventListener("click", () => {
            quizContainer.innerHTML = `<h2>Thank you for playing!</h2>`;
            resultContainer.innerHTML = "";
            progressFill.style.width = '0%';
        });
    }

    function updateProgressBar(currentStep) {
        const totalQuestions = questionData.length;
        const progressPercent = (currentStep / totalQuestions) * 100;
        progressFill.style.width = `${progressPercent}%`;
    }

    quizContainer.addEventListener("change", handleAnswer);
    nextBtn.addEventListener("click", handleNext);
    document.getElementById("end-btn").addEventListener("click", handleEnd);

    fetchQuestions();
});

// Modify updateStudentEval to accept score as an argument
async function updateStudentEval(questionData, score) { // Accept questionData and score as parameters
    const totalQuestions = questionData.length; // Get totalQuestions from the passed parameter
    const answeredCorrectly = score; // Use the score passed as an argument

    const data = {
        roll_number: parseInt(rollNumber), // Fetch from localStorage
        total_questions: totalQuestions,
        answered_correctly: answeredCorrectly,
    };

    try {
        const response = await fetch('http://127.0.0.1:5000/api/students/eval-leaderboard', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to update student evaluation');
        }

        const result = await response.json();
        console.log("Student evaluation updated:", result);
    } catch (error) {
        console.error("Error updating student evaluation:", error);
    }
}

function exitTo() {
    window.location.href = '../../evaluation.html';
}
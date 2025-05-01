import { clearCanvas } from "../../Client/modules/clearCanvas.js";
import { drawSnake, drawFood, drawScore, drawQuestion, drawAnswerFeedback, drawStones } from "./drawing_objects.js";
import { showGameOver, gameOver } from "./gameOver.js";
import { randomFoodPosition } from "./food_position.js";
import { snakeCollision,checkStoneCollision } from "./snake_collide.js";
let canvas = document.getElementById("gameCanvas");
let ctx = canvas.getContext("2d");
console.log(canvas.height);
console.log(canvas.width);
const screen_width = canvas.width;
const screen_height = canvas.height;
const snake_block = 20; // Adjust the block size to match your images
const snake_speed = 8;

let quesno = 1;
let snake = [{ x: screen_width / 2, y: screen_height / 2 }];
let direction = { x: snake_block, y: 0 }; // Start with initial direction
let food = randomFoodPosition(screen_width, screen_height, snake_block);
let score = 0;
let showingQuestion = false;
let showingAnswer = false;
let question = {};
let selectedAnswer = null;
let gameRunning = false;
let gameLoop;
let currOperation = 0;
let startTime;
let endTime;
let difficulty = 5; // Start with an initial difficulty level
let difficulty_level = 1; //let's start with an initial difficulty of questionn as 1
let correct = 0;
let consecutive_correct = 0;
let consecutive_wrong=0;
let timeTaken = 0;
let time_to_catch_food =  0;
let food_start  = Date.now();
let totalQuestionsDisplayed = 0;
const rollNumber = localStorage.getItem('username');
console.log(rollNumber);

let sendevaldata = 0;
let stone_state = 5;
window.restartGame = restartGame;
window.quitGame = quitGame;
const snakeHeadImage = new Image();
snakeHeadImage.src = '../Client/assets/snake_green_head.png';
const snakeBodyImage = new Image();
snakeBodyImage.src = '../Client/assets/snake_green_blob.png';
const foodImage = new Image();
foodImage.src = '../Client/assets/apple_green_32.png';
const backgroundImage = new Image();
backgroundImage.src = '../Client/assets/grass_background.png';
const stoneImage = new Image();
stoneImage.src = '../Client/assets/stoneImage.png';
document.addEventListener("keydown", changeDirection);
let gameover = false;
// Check if snake head collides with any stone
let obstacle_array = [
    [[1, 1],[15,1],[15,15],[1,17]],
    [[2, 3], [10,12], [20, 7], [13, 4], [13, 17]],
    [[4,5], [16, 16], [20, 15], [15, 17], [25, 18]],
    [[5, 5], [15, 10], [20, 15], [2, 17], [18, 18], [1,8], [3, 15]],
    [[7, 8], [12, 16], [18, 24], [24, 19]],
    [[10,15], [4, 4], [15, 15], [8, 9], [24, 9]],
    [[2, 16], [15, 2], [17, 8], [12, 18], [20, 14], [10, 10]],
    [[4,5], [10, 7], [20, 15], [15, 1], [25, 3],[18, 0], [21, 11], [6, 4], [14, 19]],
    [[1, 15],[15,1],[16,8],[19,18],[13, 14], [24, 15], [5, 16], [25, 2]],
    [[7, 8], [12, 16], [18, 24], [24, 19],[12, 13], [21, 19], [24, 2], [1, 15], [20, 11]],
    [[5, 5], [1, 1], [20, 15], [2, 17], [18, 18], [1,8], [3, 15]],
    [[10,15], [4, 4], [15, 15], [8, 9], [24, 9], [ 14, 17], [25, 3], [6, 19]]
];
let stones=obstacle_array[0];

function main() {
    if (gameOver(snake, screen_width, screen_height,stones,totalQuestionsDisplayed)) {
        gameover = true;
        ctx = showGameOver(ctx, canvas, screen_width, screen_height, score);
        if (sendevaldata == 0){
            sendEvaluationData(totalQuestionsDisplayed,score);
            sendevaldata = 1;
        }
        gameRunning = false;
        return;
    }

    gameLoop = setTimeout(() => {
        ctx = clearCanvas(ctx, screen_width, screen_height);
        ctx.drawImage(backgroundImage, 0, 0, screen_width, screen_height);

        if (!showingQuestion && !showingAnswer) {
            moveSnake();
            if (gameOver(snake, screen_width, screen_height,stones,totalQuestionsDisplayed)) {
                console.log("Game over da !");
                gameover = true;
                ctx = showGameOver(ctx, canvas, screen_width, screen_height, score);
                if (sendevaldata == 0){
                    sendEvaluationData(totalQuestionsDisplayed,score);
                    sendevaldata = 1;
                }
                gameRunning = false;
                return;
            }
            for (let i = 0; i < stones.length; i++){
                if (food.x == stones[i][0] && food.y == stones[i][1]){
                    food = randomFoodPosition(screen_width, screen_height, snake_block);
                    break;
                }
                else{
                    food = food;
                }
            }
            ctx = drawFood(ctx, foodImage, food, snake_block);
            ctx = drawSnake(ctx, snake, snakeHeadImage, snakeBodyImage, snake_block);
            ctx = drawStones(ctx, stoneImage, stones, snake_block);
            ctx = drawScore(ctx, canvas, score);
        } else if (showingQuestion) {
            ctx = drawQuestion(ctx, canvas, question, screen_width, screen_height);
        } else if (showingAnswer) {
            ctx = drawAnswerFeedback(ctx, canvas, question, screen_width, screen_height, selectedAnswer, correct);
        }
        main();
    }, 1000 / snake_speed);
}

function startGame() {
    if (!gameRunning) {
        gameRunning = true;
        totalQuestionsDisplayed = 0;
        clearTimeout(gameLoop);
        main();
    }
}

function moveSnake() {
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // Check for wall collision
    if (head.x >= screen_width || head.x < 0 || head.y >= screen_height || head.y < 0) {
        gameover= true;
        ctx = showGameOver(ctx, canvas, screen_width, screen_height, score);
        if (sendevaldata == 0){
            sendEvaluationData(totalQuestionsDisplayed,score);
            sendevaldata = 1;
        }
        gameRunning = false;
        return;
    }
    //check for stone collision:
    if (checkStoneCollision(head, stones, snake_block)) {
        gameover = true;
        ctx = showGameOver(ctx, canvas, screen_width, screen_height, score);
        if (sendevaldata == 0){
            sendEvaluationData(totalQuestionsDisplayed,score);
            sendevaldata = 1;
        }
        gameRunning = false;
        return;
    }
    
    // Check for self collision
    if (snakeCollision(snake)) {
        gameover = true;
        ctx = showGameOver(ctx, canvas, screen_width, screen_height, score);
        if (sendevaldata == 0){
            sendEvaluationData(totalQuestionsDisplayed,score);
            sendevaldata = 1;
        }
        gameRunning = false;
        return;
    }
    //check for stone collision
    
    snake.unshift(head);
    if (snake[0].x === food.x && snake[0].y === food.y) {
        time_to_catch_food = (Date.now() - food_start)/1000;
        food = randomFoodPosition(screen_width, screen_height, snake_block);
        sendStoneGenerationData(time_to_catch_food,food,snake[0],stone_state);
        console.log("Received stone state:",stone_state);
        console.log("time to catch food "+time_to_catch_food);
        showingQuestion = true;
        question = generateQuestion(difficulty,timeTaken,correct);
        startTime = Date.now();
    } else {
        snake.pop();//dei if you answer wrongly then pop the head that you added to the 
    }
}

export function sendAnswerData(timeTaken, correct) {
    fetch('http://localhost:5003/process_answer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            timeTaken: timeTaken,
            correct: correct,
            operation:currOperation
        })
    })
    .then(response => response.json())
    .then(data => {
        difficulty = data.difficulty;
        console.log("The difficulty of previous question is ",difficulty);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}
export function sendStoneGenerationData(time_to_catch_food,food_position,snake_head,previous_stone_state){
    fetch('http://localhost:5003/getStonePositions',{
        method:'POST',
        headers:{
            'Content-type':'application/json'
        },
        body:JSON.stringify({
            time_to_catch_food:time_to_catch_food,
            stone_state:previous_stone_state,
            snake_head:snake_head,
            food_position:food_position
        })
    })
    .then(response =>response.json())
    .then(data=>{
        stone_state = data.stone_state;
        stones = obstacle_array[stone_state];
        console.log("new_stone_state"+stone_state);
    })
    .catch(error=>{
        console.error('Error:',error);
    });
    
}

async function sendEvaluationData(totalQuestionsDisplayed,score) {
    console.log("Score updated !");
    const evalData = {
        roll_number: rollNumber,
        total_questions: totalQuestionsDisplayed,
        answered_correctly: score // The score
    };
    console.log(evalData);

    try {
        const response = await fetch('http://localhost:5000/api/students/eval', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(evalData)
        });

        if (response.ok) {
            console.log("Evaluation data sent successfully.");
        } else {
            console.error("Error sending evaluation data:", response.status);
        }
    } catch (error) {
        console.error("Error sending evaluation data:", error);
    }
}

function changeDirection(event) {
    if(gameover ){
        return;
    }
    event.preventDefault();
    const keyPressed = event.keyCode;
    const goingUp = direction.y === -snake_block;
    const goingDown = direction.y === snake_block;
    const goingRight = direction.x === snake_block;
    const goingLeft = direction.x === -snake_block;

    if (showingQuestion) {
        if (keyPressed >= 49 && keyPressed <= 52) {
            selectedAnswer = question.options[keyPressed - 49];
            endTime = Date.now();
            timeTaken = (endTime - startTime) / 1000;
            correct = selectedAnswer === question.correctAnswer;
            if (correct) {
                score += 1;
                totalQuestionsDisplayed += 1;
                consecutive_correct += 1;
                consecutive_wrong = 0;
            } else {
                totalQuestionsDisplayed += 1;
                consecutive_correct = 0;
                consecutive_wrong += 1;
            }
            food_start = Date.now();
            sendAnswerData(timeTaken, correct);
            showingQuestion = false;
            showingAnswer = true;
            setTimeout(() => {
                showingAnswer = false;
            }, 3000); // Show the feedback for 2 seconds
        }
    } else {
        switch (keyPressed) {
            case 37:
                if (!goingRight) direction = { x: -snake_block, y: 0 };
                break;
            case 38:
                if (!goingDown) direction = { x: 0, y: -snake_block };
                break;
            case 39:
                if (!goingLeft) direction = { x: snake_block, y: 0 };
                break;
            case 40:
                if (!goingUp) direction = { x: 0, y: snake_block };
                break;
        }
    }
}

function generateQuestion(difficulty,timeTaken, correct) {
    let num1, num2, num3;
    let operations = ['+', '-', '*', '/'];
    let operation = operations[Math.floor(Math.random() * operations.length)];

    if(correct){
        if(difficulty<=2){
            if(consecutive_correct>=3){
                difficulty_level = Math.min(difficulty_level+2,5)
            }
        }
        else if(difficulty>2 && difficulty<=4){
            if(consecutive_correct >=3){
                difficulty_level = Math.min(difficulty_level+1,5);
            }
        }
        else{
            if(consecutive_correct>=3){
                print("Common it's an improvment")
            }
        }
    }
    else{ //answered wrongly
        if(difficulty>2 && difficulty<=4){//konja kastama
            if(consecutive_wrong>=3){
                difficulty_level = Math.max(1,difficulty_level-2);
            }
        }
        else if(difficulty>4 && difficulty<=5){//romba kastam
            if(consecutive_wrong>=2){
                difficulty_level = Math.max(1,difficulty_level-3);
            }
        }
        else{//predicted_difficulty ==1 to 2 
            if(consecutive_wrong>=4){
                difficulty_level = Math.max(1,difficulty_level-1);
            }
        }
    }
    console.log("New difficulty level" + difficulty_level);

    let questionText = "";
    let correctAnswer = 0;
    let options = [];
    let hint ;
    function generateOptions(operation, correctAnswer, range) {
        options = [];

        function generateFloatOption(min, max) {
            const wholePart = Math.floor(((Math.random() * (max - min + 1)) + min));
            const decimalPart = (Math.random() *0.99).toFixed(2);
            console.log("whole part"+wholePart);
            console.log(decimalPart);
            
            const optionVal = wholePart + decimalPart;
            console.log("concatenate option :" + optionVal);
            // Ensure two decimal digits
            return optionVal;
        }

        if (operation == '/') {
            options.push(correctAnswer.toFixed(2));

            // Determine a suitable range for generating options close to the correct answer
            const answerRange = {
                min: correctAnswer * 0.5,
                max: correctAnswer * 1.5
            };

            while (options.length < 4) {
                let option = generateFloatOption(answerRange.min, answerRange.max);
                if (!options.includes(option)) {
                    options.push(option);
                }
            }
        } else {
            options.push(correctAnswer.toString());
    
            while (options.length < 4) {
                // Generate an option within 15 to 20 more or less from the correct answer
                let option = correctAnswer + Math.floor((Math.random() * 36) - 18); // Generates a number between -18 and +17
                if (!options.includes(option.toString()) && option !== correctAnswer) { // Ensure the option is unique and not equal to the correct answer
                    options.push(option.toString());
                }
            }
        }

        options = options.sort(() => Math.random() - 0.5); // Shuffle options
    }
    
    if (difficulty_level == 1) { // very easy
        const range = { min: 0, max: 9 };
        operations = ['+', '-'];
         

        // Generate operands
        const num1 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
        const num2 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
        operation = operations[Math.floor(Math.random() * operations.length)];
        
        if (operation === '+') {
            hint ="Count on your fingers to add the numbers.";
            questionText = `What is ${num1} + ${num2} ?`;
            correctAnswer = num1 + num2;
        } else if (operation === '-') {
            hint ="Reduce on your fingers to subtract the numbers.";
            questionText = `What is ${num1} - ${num2} ?`;
            correctAnswer = num1 - num2;
        }
        generateOptions(operation, correctAnswer, range);
    } else if (difficulty_level == 2) {
        const range = { min: 0, max: 20 };
        operations = ['+', '-', '*', '/'];
        

        // Generate operands
        const num1 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
        let num2 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
        operation = operations[Math.floor(Math.random() * operations.length)];

        if (operation === '/' && num2 === 0) {
            num2 = 1; // Ensure denominator is not zero
        }

        if (operation === '+') {
            hint = "Break down the numbers into tens and ones, then add separately.";
            questionText = `What is ${num1} + ${num2} ?`;
            correctAnswer = num1 + num2;
        } else if (operation === '-') {
            hint = "Break down the numbers into tens and ones, then subtract separately.";
            questionText = `What is ${num1} - ${num2} ?`;
            correctAnswer = num1 - num2;
        } else if (operation === '*') {
            hint = "Think of multiplication as repeated addition. Use multiplication tables if needed.";
            questionText = `What is ${num1} * ${num2} ?`;
            correctAnswer = num1 * num2;
        } else if (operation === '/') {
            hint = "Think of division as sharing equally. Use multiplication tables to find the answer by reverse calculation.";
            questionText = `What is ${num1} / ${num2} ?`;
            correctAnswer = num1 / num2;
        }
        generateOptions(operation, correctAnswer, range);
    } else if (difficulty_level == 3) {
        const addSubRange = { min: 100, max: 999 };
        const mulDivRange = { min: 10, max: 99 };
        operations = ['+', '-', '*', '/'];

        operation = operations[Math.floor(Math.random() * operations.length)];

        if (operation === '+' || operation === '-') {
            const num1 = Math.floor(Math.random() * (addSubRange.max - addSubRange.min + 1)) + addSubRange.min;  // 3-digit
            const num2 = Math.floor(Math.random() * (mulDivRange.max - 10 + 1)) + 10; // Second operand is 2 digits

            if (operation === '+') {
                hint = "Add the numbers column by column, starting from the right. Remember to carry over any value more than";
                questionText = `What is ${num1} + ${num2} ?`;
                correctAnswer = num1 + num2;
                hint = "Subtract the numbers column by column, starting from the right. If the top digit is smaller, remember to borrow from the next column.";
            } else if (operation === '-') {
                hint = "Subtract the numbers column by column, starting from the right. If the top digit is smaller, remember to borrow from the next column.";
                questionText = `What is ${num1} - ${num2} ?`;
                correctAnswer = num1 - num2;
            }
        } else if (operation === '*') {
            hint = "Multiply the numbers column by column and then add the partial products. Use the long multiplication method.";
            const num1 = Math.floor(Math.random() * (mulDivRange.max - mulDivRange.min + 1)) + mulDivRange.min;
            const num2 = Math.floor(Math.random() * (mulDivRange.max - mulDivRange.min + 1)) + mulDivRange.min;
            questionText = `What is ${num1} * ${num2} ?`;
            correctAnswer = num1 * num2;
        } else if (operation === '/') {
            hint = "Divide step-by-step, starting from the leftmost digits. Use the long division method and remember to bring down the next digit when needed.";
            const num1 = Math.floor(Math.random() * (mulDivRange.max - mulDivRange.min + 1)) + mulDivRange.min;
            const num2 = Math.floor(Math.random() * 9) + 1; // Ensure denominator is 1 digit and not zero
            questionText = `What is ${num1} / ${num2} ?`;
            correctAnswer = num1 / num2;
        }
        generateOptions(operation, correctAnswer, addSubRange);
    } else if (difficulty_level == 4) {
        const addSubMulRange = { min: 999, max: 10000 };
        const divRangeNum = { min: 1, max: 999 };
        const divRangeDen = { min: 1, max: 99 };
        const operations = ['+', '-', '*', '/'];
        operation = operations[Math.floor(Math.random() * operations.length)];
        const hints = ['yes'];
        
        if (operation === '+' || operation === '-' || operation === '*') {
            const numOperands = Math.floor(Math.random() * 2) + 3; // 3 or 4 operands
            let operands = [];
            for (let i = 0; i < numOperands; i++) {
                operands.push(Math.floor(Math.random() * (addSubMulRange.max - addSubMulRange.min + 1)) + addSubMulRange.min);
            }
            if (operation === '+') {
                hint = "Break down large numbers into smaller parts and add them separately";
                questionText = `What is ${operands.join(' + ')} ?`;
                correctAnswer = operands.reduce((acc, val) => acc + val, 0);
            } else if (operation === '-') {
                hint ="Break down large numbers into smaller parts and subtract them separately";
                questionText = `What is ${operands.join(' - ')} ?`;
                correctAnswer = operands.reduce((acc, val) => acc - val);
            } else if (operation === '*') {
                hint = "Break down large numbers into smaller parts and multiply them separately.";
                questionText = `What is ${operands.join(' * ')} ?`;
                correctAnswer = operands.reduce((acc, val) => acc * val, 1);
            }
            generateOptions(operation, correctAnswer, addSubMulRange);
        } else if (operation === '/') {
            hint = "Break down large numbers into smaller parts and divide them separately. Use a calculator for verification if needed";
            const num1 = Math.floor(Math.random() * (divRangeNum.max - divRangeNum.min + 1)) + divRangeNum.min;
            const num2 = Math.floor(Math.random() * (divRangeDen.max - divRangeDen.min + 1)) + divRangeDen.min;
            questionText = `What is ${num1} / ${num2} ?`;
            correctAnswer = num1 / num2;
            generateOptions(operation, correctAnswer, divRangeNum);
        }
    } else { // very hard
        const addSubRange = { min: 10000, max: 50000 };
        const mulRange = { min: 100, max: 999 };
        const divRange = { min: 1, max: 50000 };
        operations = ['+', '-', '*', '/'];
        operation = operations[Math.floor(Math.random() * operations.length)];

        if (operation === '+' || operation === '-') {
            const numOperands = Math.floor(Math.random() * 2) + 4; // 4 or 5 operands
            let operands = [];
            for (let i = 0; i < numOperands; i++) {
                operands.push(Math.floor(Math.random() * (addSubRange.max - addSubRange.min + 1)) + addSubRange.min);
            }
            if (operation === '+') {
                hint = "Add multiple numbers column by column, starting from the right. Remember to carry over any value more than 9.";
                questionText = `What is ${operands.join(' + ')} ?`;
                correctAnswer = operands.reduce((acc, val) => acc + val, 0);
            } else if (operation === '-') {
                hint = "Subtract multiple numbers column by column, starting from the right. If the top digit is smaller, remember to borrow from the next column";
                questionText = `What is ${operands.join(' - ')} ?`;
                correctAnswer = operands.reduce((acc, val) => acc - val);
            }
            generateOptions(operation, correctAnswer, addSubRange);
        } else if (operation === '*') {
            hint = "Multiply each number column by column and then add the partial products. Use the long multiplication method";
            const numOperands = 3;
            let operands = [];
            for (let i = 0; i < numOperands; i++) {
                operands.push(Math.floor(Math.random() * (mulRange.max - mulRange.min + 1)) + mulRange.min);
            }
            questionText = `What is ${operands.join(' * ')} ?`;
            correctAnswer = operands.reduce((acc, val) => acc * val, 1);
            generateOptions(operation, correctAnswer, mulRange);
        } else if (operation === '/') {
            hint = "Divide step-by-step, starting from the leftmost digits. Use the long division method and remember to bring down the next digit when needed. Use a calculator for verification if needed.";
            const num1 = Math.floor(Math.random() * (divRange.max - divRange.min + 1)) + divRange.min;
            const num2 = Math.floor(Math.random() * 99) + 1; // Ensure denominator is 1 digit and not zero
            questionText = `What is ${num1} / ${num2} ?`;
            correctAnswer = num1 / num2;
            generateOptions(operation, correctAnswer, divRange);
        }
    }
    questionText = quesno + ") " + questionText;
    quesno++;
    return {
        question: questionText,
        correctAnswer: correctAnswer.toString(),
        options: options,
        operation: operation,
        hints:"Hint: "+ hint
    };
    
}

function restartGame() {
    snake = [{ x: screen_width / 2, y: screen_height / 2 }];
    direction = { x: snake_block, y: 0 };
    food = randomFoodPosition(screen_width, screen_height, snake_block);
    food_start = Date.now();
    score = 0;
    totalQuestionsDisplayed = 0;
    sendevaldata = 0;
    showingQuestion = false;
    question = {};
    gameover = false;
    selectedAnswer = null;
    startGame();
}

function quitGame() {
    alert("Quitting the game...");
    ctx = clearCanvas(ctx,screen_width, screen_height);
    clearTimeout(gameLoop);
    gameRunning = false;
}

// Ensure images are loaded before starting the game
let imagesLoaded = 0;
const totalImages = 4;

snakeHeadImage.onload = imageLoaded;
snakeBodyImage.onload = imageLoaded;
foodImage.onload = imageLoaded;
stoneImage.onload = imageLoaded;

function imageLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        startGame();
    }
}
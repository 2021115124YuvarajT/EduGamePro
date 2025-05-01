export function drawSnake(ctx, snake, snakeHeadImage, snakeBodyImage, snake_block) {
    snake.forEach((part, index) => {
        if (index === 0) {
            // Draw head
            ctx.drawImage(snakeHeadImage, part.x, part.y, snake_block, snake_block);
            return ctx;
        } else {
            // Draw body
            ctx.drawImage(snakeBodyImage, part.x, part.y, snake_block, snake_block);
            return ctx;
        }
    });
}
 
export function drawFood(ctx, foodImage, food, snake_block) {
    ctx.drawImage(foodImage, food.x, food.y, snake_block, snake_block);
    return ctx;
}
export function drawStones(ctx, stoneImage, stones, snake_block) {
    
    if(!ctx){
        let canvas = document.getElementById("gameCanvas");
        ctx = canvas.getContext("2d");
    }
    
    //console.log("Drawing stones with ctx:", ctx);
    stones.forEach(stone => {
      //  console.log(`Drawing stone at (${stone[0]}, ${stone[1]})`);
        if (ctx) {
            ctx.drawImage(stoneImage, stone[0]*20, stone[1]*20, snake_block, snake_block);
        } else {
        //    console.error("ctx is undefined");
        }
    });
    return ctx;
}


export function drawScore(ctx, canvas, score) {
    if (!ctx) {
        ctx = canvas.getContext("2d");
        canvas = document.getElementById("gameCanvas");
    }
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 10, 20);
    return ctx; 
}

export function drawQuestion(ctx, canvas, question, screen_width, screen_height) {
    if (!ctx) {
        ctx = canvas.getContext("2d");
        canvas = document.getElementById("gameCanvas");
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas before drawing
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";

    // Draw the question
    const questionX = screen_width / 6;
    const questionY = screen_height / 3;
    wrapText(ctx, question.question, questionX, questionY, screen_width - questionX * 2, 24);

    // Draw the options
    question.options.forEach((option, index) => {
        const optionY = questionY + 40 * (index + 1);
        ctx.fillText((index + 1) + ". " + option, questionX, optionY);
    });

    // Draw the hint
    ctx.font = "15px Bold Italic";
    const hintX = screen_width / 6;
    const hintY = screen_height - 50; // Position the hint at the bottom of the screen
    ctx.fillStyle = "purple";   
    wrapText(ctx, question.hints, hintX, hintY, screen_width - hintX * 2, 18);

    return ctx;
}

// Helper function to wrap text
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let testLine = '';
    let testWidth = 0;

    for (let n = 0; n < words.length; n++) {
        testLine = line + words[n] + ' ';
        testWidth = ctx.measureText(testLine).width;
        if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, y);
}

export function drawAnswerFeedback(ctx, canvas, question, screen_width, screen_height, selectedAnswer, correct) {
    if (!ctx) {
        ctx = canvas.getContext("2d");
    }
    // ctx.clearRect(0, 0, screen_width, screen_height); // Clear the canvas
    // ctx.fillStyle = "black";
    // ctx.font = "20px Arial";
    // const lines = question.question.split('\n'); // Use question.question instead of question.text
    // lines.forEach((line, index) => {
    //     ctx.fillText(line, 10, 50 + index * 25);
    // });
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas before drawing
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";

    // Draw the question
    const questionX = screen_width / 6;
    const questionY = screen_height / 3;
    wrapText(ctx, question.question, questionX, questionY, screen_width - questionX * 2, 24);

    question.options.forEach((option, index) => {
        const isSelected = selectedAnswer === option;
        const isCorrect = option === question.correctAnswer;
        ctx.fillStyle = "black"; // Default color
        const optionY = questionY + 40 * (index + 1);
        if (isSelected) {
            ctx.fillStyle = correct ? "green" : "red";
            ctx.fillText(`${index + 1}. ${option} ${correct ? '✅' : '❌'}`, questionX, optionY);
        } else {
            ctx.fillStyle = isCorrect ? "green" : "black";
            ctx.fillText(`${index + 1}. ${option} ${isCorrect ? '✅' : ''}`,questionX, optionY);
        }
    });
    
    ctx.font = "15px Bold Italic";
    ctx.fillStyle = "purple";
    const hintX = screen_width / 6;
    const hintY = screen_height - 50; // Position the hint at the bottom of the screen
    wrapText(ctx, question.hints, hintX, hintY, screen_width - hintX * 2, 18);

    return ctx;
}

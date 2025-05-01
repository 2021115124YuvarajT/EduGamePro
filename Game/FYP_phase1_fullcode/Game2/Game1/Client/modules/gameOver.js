export function showGameOver(ctx, canvas, screen_width, screen_height, score) {
    ctx.fillStyle = "red";
    ctx.font = "50px Arial";
    ctx.fillText("Game Over", screen_width / 3, screen_height / 2);
    ctx.fillStyle = "black";
    ctx.font = "30px Arial";
    ctx.fillText("Your Score: " + score, screen_width / 3, screen_height / 2 + 50);
    return ctx;
}
 
export function gameOver(snake, screen_width, screen_height,stones,totalQuestionsDisplayed) {
    const head = snake[0];

    // Check wall collision
    if (head.x >= screen_width || head.x < 0 || head.y >= screen_height || head.y < 0) {
        return true;
    }

    // Check self collision
    for (let i = 4; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
            return true;
        }
    }
    //check for stone collision
    for(let i = 0;i<stones.length;i++){
        if(snake[0].x == stones[i].x && snake[0].y == stones[i].y){
            return true;
        }
    }
    return false;
}
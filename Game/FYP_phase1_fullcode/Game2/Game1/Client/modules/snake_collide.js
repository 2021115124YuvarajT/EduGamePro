export function snakeCollision(snake) {
    for (let i = 1; i < snake.length; i++) {
        if (snake[0].x === snake[i].x && snake[0].y === snake[i].y) {
            return true;
        }
    }
    return false;
}

export function checkStoneCollision(snakeHead, stones, snakeBlock) {
    
    console.log("checking stone collision");
    console.log("snake head: "+snakeHead.x +" "+snakeHead.y+"\n");
    for (let stone of stones) {
        if (snakeHead.x === stone[0]*20 && snakeHead.y === stone[1]*20) {
            return true; // Collision detected
        }
    }
    return false; // No collision
}

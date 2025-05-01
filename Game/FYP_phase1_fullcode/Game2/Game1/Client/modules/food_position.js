export function randomFoodPosition(screen_width, screen_height, snake_block) {
    let x = Math.floor(Math.random() * screen_width / snake_block) * snake_block;
    let y = Math.floor(Math.random() * screen_height / snake_block) * snake_block;
    return { x, y };
}
 
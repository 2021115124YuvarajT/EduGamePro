export function clearCanvas(ctx,screen_width, screen_height) {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, screen_width, screen_height);
    return ctx;
}

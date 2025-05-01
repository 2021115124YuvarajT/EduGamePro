const WIDTH = 20;
const HEIGHT = 20;

const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0]
];

let maze = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(1));

function isValid(x, y) {
  if (x >= 0 && x < HEIGHT && y >= 0 && y < WIDTH && maze[x][y] === 1) {
    let neighbors = 0;
    for (const [dx, dy] of DIRECTIONS) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < HEIGHT && ny >= 0 && ny < WIDTH && maze[nx][ny] === 0) {
        neighbors++;
      }
    }
    return neighbors <= 1;
  }
  return false;
}

function generateMaze(x, y) {
  maze[x][y] = 0;
  const directions = [...DIRECTIONS].sort(() => Math.random() - 0.5);

  for (const [dx, dy] of directions) {
    const nx = x + dx;
    const ny = y + dy;

    if (isValid(nx, ny)) {
      maze[nx][ny] = 0;
      generateMaze(nx, ny);
    }
  }
}

generateMaze(0, 0);

function displayMaze() {
  console.clear();
  console.log(maze.map(row => row.map(cell => (cell ? "█" : " ")).join("")));
}

displayMaze();

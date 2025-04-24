document.addEventListener('DOMContentLoaded', () => {
    // Game canvas setup
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const startBtn = document.getElementById('startBtn');
    const resetBtn = document.getElementById('resetBtn');
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('highScore');
    
    // Device detection for touch controls
    const touchControls = document.querySelector('.touch-controls');
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
    
    // Show touch controls on all touch devices regardless of screen size
    if (isTouchDevice && touchControls) {
        touchControls.style.display = 'flex';
    }
    
    // Set canvas size based on its display size
    function resizeCanvas() {
        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;
        
        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
            canvas.width = displayWidth;
            canvas.height = displayHeight;
        }
    }
    
    // Call once to set initial size
    resizeCanvas();

    // Game settings
    const gridSize = 25;
    let tileCount = Math.floor(canvas.width / gridSize);
    let speed = 7;

    // Game state
    let gameRunning = false;
    let gameOver = false;
    let score = 0;
    let highScore = localStorage.getItem('snakeHighScore') || 0;
    highScoreElement.textContent = highScore;

    // Snake initial state
    let snake = [
        { x: 10, y: 10 }
    ];
    let velocityX = 0;
    let velocityY = 0;
    let nextVelocityX = 0;
    let nextVelocityY = 0;

    // Food initial position
    let food = generateFood();

    // Colors
    const snakeHeadColor = '#4ecca3';
    const snakeBodyColor = '#3aa789';
    const foodColor = '#e84545';
    const gridColor = '#2d3436';

    // Game loop
    let gameInterval;

    // Event listeners
    startBtn.addEventListener('click', startGame);
    resetBtn.addEventListener('click', resetGame);
    document.addEventListener('keydown', changeDirection);
    window.addEventListener('resize', function() {
        // Only reset the game if it's not currently running
        if (!gameRunning) {
            resetGame();
        }
    });
    
    // Mobile touch controls
    const upBtn = document.getElementById('upBtn');
    const downBtn = document.getElementById('downBtn');
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    
    // Add touch event listeners
    if (upBtn && downBtn && leftBtn && rightBtn) {
        // Helper function to prevent default behavior and stop propagation
        const addTouchEvents = (element, direction) => {
            const handleTouch = (e) => {
                e.preventDefault();
                handleDirectionChange(direction);
            };
            
            element.addEventListener('click', handleTouch);
            element.addEventListener('touchstart', handleTouch);
        };
        
        addTouchEvents(upBtn, 'ArrowUp');
        addTouchEvents(downBtn, 'ArrowDown');
        addTouchEvents(leftBtn, 'ArrowLeft');
        addTouchEvents(rightBtn, 'ArrowRight');
    }

    // Initialize game
    drawGame();

    // Start game function
    function startGame() {
        if (gameRunning) {
            // Pause the game
            clearInterval(gameInterval);
            gameRunning = false;
            startBtn.textContent = 'Resume';
        } else {
            // Start or resume the game
            if (gameOver) resetGame();
            
            gameRunning = true;
            gameOver = false;
            gameInterval = setInterval(drawGame, 1000 / speed);
            startBtn.textContent = 'Pause';
        }
    }

    // Reset game function
    function resetGame() {
        clearInterval(gameInterval);
        // Resize canvas and recalculate tile count
        resizeCanvas();
        tileCount = Math.floor(canvas.width / gridSize);
        
        // Position snake in the middle of the grid
        const middlePosition = Math.floor(tileCount / 2);
        snake = [{ x: middlePosition, y: middlePosition }];
        
        velocityX = 0;
        velocityY = 0;
        nextVelocityX = 0;
        nextVelocityY = 0;
        score = 0;
        scoreElement.textContent = score;
        food = generateFood();
        gameRunning = false;
        gameOver = false;
        startBtn.textContent = 'Start Game';
        drawGame();
    }

    // Handle direction change from any input source
    function handleDirectionChange(direction) {
        // Prevent reversing direction
        if (direction === 'ArrowUp' && velocityY !== 1) {
            nextVelocityX = 0;
            nextVelocityY = -1;
        } else if (direction === 'ArrowDown' && velocityY !== -1) {
            nextVelocityX = 0;
            nextVelocityY = 1;
        } else if (direction === 'ArrowLeft' && velocityX !== 1) {
            nextVelocityX = -1;
            nextVelocityY = 0;
        } else if (direction === 'ArrowRight' && velocityX !== -1) {
            nextVelocityX = 1;
            nextVelocityY = 0;
        }

        // Start game on first direction press
        if (!gameRunning && (direction === 'ArrowUp' || direction === 'ArrowDown' || direction === 'ArrowLeft' || direction === 'ArrowRight')) {
            startGame();
        }
    }
    
    // Change direction function for keyboard
    function changeDirection(event) {
        handleDirectionChange(event.key);
    }

    // Generate food at random position
    function generateFood() {
        let newFood;
        let foodOnSnake;
        
        do {
            foodOnSnake = false;
            newFood = {
                x: Math.floor(Math.random() * tileCount),
                y: Math.floor(Math.random() * tileCount)
            };
            
            // Check if food is on snake
            for (let i = 0; i < snake.length; i++) {
                if (snake[i].x === newFood.x && snake[i].y === newFood.y) {
                    foodOnSnake = true;
                    break;
                }
            }
        } while (foodOnSnake);
        
        return newFood;
    }

    // Main game drawing function
    function drawGame() {
        if (gameRunning) {
            moveSnake();
            checkCollision();
            if (gameOver) {
                endGame();
                return;
            }
        }

        // Clear canvas
        ctx.fillStyle = '#232931';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid
        drawGrid();

        // Draw food
        drawFood();

        // Draw snake
        drawSnake();

        // Draw game over message
        if (gameOver) {
            drawGameOver();
        }
    }

    // Draw grid
    function drawGrid() {
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 0.5;
        
        for (let i = 0; i <= tileCount; i++) {
            // Draw vertical lines
            ctx.beginPath();
            ctx.moveTo(i * gridSize, 0);
            ctx.lineTo(i * gridSize, canvas.height);
            ctx.stroke();
            
            // Draw horizontal lines
            ctx.beginPath();
            ctx.moveTo(0, i * gridSize);
            ctx.lineTo(canvas.width, i * gridSize);
            ctx.stroke();
        }
    }

    // Draw food
    function drawFood() {
        ctx.fillStyle = foodColor;
        ctx.beginPath();
        ctx.arc(
            food.x * gridSize + gridSize / 2,
            food.y * gridSize + gridSize / 2,
            gridSize / 2 - 2,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // Add glow effect
        ctx.shadowColor = foodColor;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    // Draw snake
    function drawSnake() {
        // Draw snake body
        for (let i = 1; i < snake.length; i++) {
            ctx.fillStyle = snakeBodyColor;
            ctx.fillRect(
                snake[i].x * gridSize + 1,
                snake[i].y * gridSize + 1,
                gridSize - 2,
                gridSize - 2
            );
        }

        // Draw snake head
        if (snake.length > 0) {
            ctx.fillStyle = snakeHeadColor;
            ctx.fillRect(
                snake[0].x * gridSize + 1,
                snake[0].y * gridSize + 1,
                gridSize - 2,
                gridSize - 2
            );

            // Add eyes to snake head
            ctx.fillStyle = '#232931';
            
            // Determine eye positions based on direction
            let eyeOffsetX1, eyeOffsetY1, eyeOffsetX2, eyeOffsetY2;
            
            if (velocityX === 1) { // Moving right
                eyeOffsetX1 = eyeOffsetX2 = 12;
                eyeOffsetY1 = 6;
                eyeOffsetY2 = 14;
            } else if (velocityX === -1) { // Moving left
                eyeOffsetX1 = eyeOffsetX2 = 6;
                eyeOffsetY1 = 6;
                eyeOffsetY2 = 14;
            } else if (velocityY === 1) { // Moving down
                eyeOffsetY1 = eyeOffsetY2 = 12;
                eyeOffsetX1 = 6;
                eyeOffsetX2 = 14;
            } else { // Moving up or stationary
                eyeOffsetY1 = eyeOffsetY2 = 6;
                eyeOffsetX1 = 6;
                eyeOffsetX2 = 14;
            }
            
            // Draw eyes
            ctx.beginPath();
            ctx.arc(
                snake[0].x * gridSize + eyeOffsetX1,
                snake[0].y * gridSize + eyeOffsetY1,
                2,
                0,
                Math.PI * 2
            );
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(
                snake[0].x * gridSize + eyeOffsetX2,
                snake[0].y * gridSize + eyeOffsetY2,
                2,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    }

    // Move snake
    function moveSnake() {
        // Update velocity
        velocityX = nextVelocityX;
        velocityY = nextVelocityY;

        // Don't move if no direction is set
        if (velocityX === 0 && velocityY === 0) return;

        // Create new head
        const head = { x: snake[0].x + velocityX, y: snake[0].y + velocityY };
        snake.unshift(head);

        // Check if snake ate food
        if (head.x === food.x && head.y === food.y) {
            // Increase score
            score += 10;
            scoreElement.textContent = score;
            
            // Update high score if needed
            if (score > highScore) {
                highScore = score;
                highScoreElement.textContent = highScore;
                localStorage.setItem('snakeHighScore', highScore);
            }
            
            // Generate new food
            food = generateFood();
            
            // Increase speed slightly
            if (speed < 15 && snake.length % 5 === 0) {
                speed += 0.5;
                clearInterval(gameInterval);
                gameInterval = setInterval(drawGame, 1000 / speed);
            }
        } else {
            // Remove tail if no food was eaten
            snake.pop();
        }
    }

    // Check for collisions
    function checkCollision() {
        const head = snake[0];
        
        // Check wall collision
        if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
            gameOver = true;
            return;
        }
        
        // Check self collision (start from index 1 to avoid checking head against itself)
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                gameOver = true;
                return;
            }
        }
    }

    // End game
    function endGame() {
        clearInterval(gameInterval);
        gameRunning = false;
        startBtn.textContent = 'Start Game';
    }

    // Draw game over message
    function drawGameOver() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = '30px Arial';
        ctx.fillStyle = '#e84545';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 30);
        
        ctx.font = '20px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
        
        ctx.font = '16px Arial';
        ctx.fillText('Press Start to play again', canvas.width / 2, canvas.height / 2 + 40);
    }
});

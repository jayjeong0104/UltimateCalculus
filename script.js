document.addEventListener('DOMContentLoaded', () => {
    const problemEl = document.getElementById('problem');
    const answerInput = document.getElementById('answer-input');
    const submitBtn = document.getElementById('submit-btn');
    const timeBar = document.getElementById('time-bar');
    const scoreDisplay = document.getElementById('score-display');
    const levelDisplay = document.getElementById('level-display');
    const canvas = document.getElementById('vfx-canvas');
    const ctx = canvas.getContext('2d');

    // Resize canvas
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Game variables
    let score = 0;
    let level = 1;
    let timeLeft = 60; // seconds
    let maxTime = 60;
    let currentProblemIndex = 0;
    let timerInterval;
    let particles = [];

    // Problems: array of {question, answer, difficulty}
    const problems = [
        { q: '\\frac{d}{dx} x^2', a: '2x', diff: 1 },
        { q: '\\frac{d}{dx} \\sin(x)', a: 'cos(x)', diff: 1 },
        { q: '\\int x \\, dx', a: '\\frac{1}{2}x^2 + C', diff: 2 },
        { q: '\\frac{d}{dx} e^x', a: 'e^x', diff: 2 },
        { q: '\\int e^x \\, dx', a: 'e^x + C', diff: 2 },
        { q: '\\frac{d}{dx} x^3', a: '3x^2', diff: 1 },
        { q: '\\frac{d}{dx} \\cos(x)', a: '-\\sin(x)', diff: 2 },
        { q: '\\int \\cos(x) \\, dx', a: '\\sin(x) + C', diff: 2 },
        { q: '\\frac{d}{dx} \\ln(x)', a: '\\frac{1}{x}', diff: 3 },
        { q: '\\int \\frac{1}{x} \\, dx', a: '\\ln|x| + C', diff: 3 },
        { q: '\\frac{d}{dx} (x^2 + 1)^3', a: '3(x^2 + 1)^2 \\cdot 2x', diff: 4 },
        { q: '\\int x^2 \\, dx', a: '\\frac{1}{3}x^3 + C', diff: 3 },
        { q: '\\frac{d}{dx} \\tan(x)', a: '\\sec^2(x)', diff: 4 },
        { q: '\\sum_{n=1}^\\infty \\frac{1}{n^2}', a: '\\frac{\\pi^2}{6}', diff: 5 },
        { q: '\\frac{d}{dx} \\arcsin(x)', a: '\\frac{1}{\\sqrt{1-x^2}}', diff: 5 },
        // Add more as needed
    ];

    // Shuffle problems or sort by difficulty
    problems.sort((a, b) => a.diff - b.diff);

    // Particle class
    class Particle {
        constructor(x, y, color, velocityX, velocityY, life) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.velocityX = velocityX;
            this.velocityY = velocityY;
            this.life = life;
            this.maxLife = life;
        }

        update() {
            this.x += this.velocityX;
            this.y += this.velocityY;
            this.life--;
        }

        draw() {
            const alpha = this.life / this.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Create particles
    function createParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            const velocityX = Math.cos(angle) * speed;
            const velocityY = Math.sin(angle) * speed;
            particles.push(new Particle(x, y, color, velocityX, velocityY, 60));
        }
    }

    // Update particles
    function updateParticles() {
        particles = particles.filter(p => p.life > 0);
        particles.forEach(p => p.update());
    }

    // Draw particles
    function drawParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => p.draw());
    }

    // Animation loop
    function animate() {
        updateParticles();
        drawParticles();
        requestAnimationFrame(animate);
    }
    animate();

    // Start game
    function startGame() {
        displayProblem();
        startTimer();
    }

    // Display problem
    function displayProblem() {
        const problem = problems[currentProblemIndex % problems.length];
        problemEl.innerHTML = `$$ ${problem.q} $$`;
        MathJax.typeset();
    }

    // Start timer
    function startTimer() {
        timerInterval = setInterval(() => {
            timeLeft -= 0.1;
            updateTimeBar();
            if (timeLeft <= 0) {
                gameOver();
            }
        }, 100);
    }

    // Update time bar
    function updateTimeBar() {
        const percentage = (timeLeft / maxTime) * 100;
        timeBar.style.width = `${percentage}%`;
        if (percentage < 20) {
            timeBar.style.background = 'linear-gradient(90deg, #ff4757, #ff3838)';
        } else {
            timeBar.style.background = 'linear-gradient(90deg, #4ecdc4, #44a08d)';
        }
    }

    // Submit answer
    submitBtn.addEventListener('click', () => {
        const userAnswer = answerInput.value.trim();
        const correctAnswer = problems[currentProblemIndex % problems.length].a;
        const rect = submitBtn.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        if (userAnswer === correctAnswer) {
            // Correct
            score++;
            timeLeft = Math.min(maxTime, timeLeft + 5);
            createParticles(centerX, centerY, '#4ecdc4', 50);
            document.body.classList.add('correct');
            setTimeout(() => document.body.classList.remove('correct'), 500);
        } else {
            // Wrong
            timeLeft = Math.max(0, timeLeft - 5);
            createParticles(centerX, centerY, '#ff4757', 30);
            document.body.classList.add('game-over');
            setTimeout(() => document.body.classList.remove('game-over'), 500);
        }

        answerInput.value = '';
        currentProblemIndex++;
        if (currentProblemIndex % 5 === 0) {
            level++;
        }
        updateDisplays();
        displayProblem();
    });

    // Update displays
    function updateDisplays() {
        scoreDisplay.textContent = `Score: ${score}`;
        levelDisplay.textContent = `Level: ${level}`;
    }

    // Game over
    function gameOver() {
        clearInterval(timerInterval);
        problemEl.innerHTML = 'Game Over!';
        answerInput.style.display = 'none';
        submitBtn.style.display = 'none';
        // Add restart button
        const restartBtn = document.createElement('button');
        restartBtn.textContent = 'Restart';
        restartBtn.style.padding = '15px 30px';
        restartBtn.style.fontSize = '1.2em';
        restartBtn.style.background = 'linear-gradient(45deg, #ff6b6b, #ffa500)';
        restartBtn.style.color = 'white';
        restartBtn.style.border = 'none';
        restartBtn.style.borderRadius = '10px';
        restartBtn.style.cursor = 'pointer';
        restartBtn.addEventListener('click', () => location.reload());
        document.getElementById('game-container').appendChild(restartBtn);
    }

    // Initialize
    updateDisplays();
    startGame();
});
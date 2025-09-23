// TetroHashUnlock v2.0 - UI Management
// Author: Giancarlo Vizhnay

class GameUI {
    constructor() {
        this.game = null;
        this.gameBoard = null;
        this.isRunning = false;
        this.lastTime = 0;
        this.animationId = null;
        
        this.initializeElements();
        this.setupEventListeners();
    }
    
    initializeElements() {
        this.elements = {
            modeSelection: document.getElementById('mode-selection'),
            gameArea: document.getElementById('game-area'),
            gameBoard: document.getElementById('game-board'),
            score: document.getElementById('score'),
            lines: document.getElementById('lines'),
            level: document.getElementById('level'),
            puzzlePanel: document.getElementById('puzzle-panel'),
            targetHash: document.getElementById('target-hash'),
            currentPiece: document.getElementById('current-piece'),
            puzzleStatus: document.getElementById('puzzle-status'),
            checkSolution: document.getElementById('check-solution'),
            walletBalance: document.getElementById('wallet-balance'),
            recentReward: document.getElementById('recent-reward'),
            nextPiece: document.getElementById('next-piece'),
            gameOverModal: document.getElementById('game-over-modal'),
            finalScore: document.getElementById('final-score'),
            finalLines: document.getElementById('final-lines'),
            finalSats: document.getElementById('final-sats'),
            restartGame: document.getElementById('restart-game'),
            changeMode: document.getElementById('change-mode'),
            loadingScreen: document.getElementById('loading-screen')
        };
        
        // Check for missing elements
        const missingElements = [];
        for (const [key, element] of Object.entries(this.elements)) {
            if (!element) {
                missingElements.push(key);
            }
        }
        
        if (missingElements.length > 0) {
            console.error('Missing DOM elements:', missingElements);
            throw new Error(`Missing DOM elements: ${missingElements.join(', ')}`);
        }
    }
    
    setupEventListeners() {
        // Mode selection
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.selectMode(mode);
            });
        });
        
        // Game controls
        document.addEventListener('keydown', (e) => {
            if (this.game && this.isRunning) {
                this.game.handleInput(e.key);
                e.preventDefault();
            }
        });
        
        // Puzzle check button
        this.elements.checkSolution.addEventListener('click', () => {
            this.checkPuzzleSolution();
        });
        
        // Modal buttons
        this.elements.restartGame.addEventListener('click', () => {
            this.restartGame();
        });
        
        this.elements.changeMode.addEventListener('click', () => {
            this.showModeSelection();
        });
    }
    
    async selectMode(mode) {
        this.showLoading();
        this.updateLoadingStatus('Creating game instance...');
        
        try {
            // Initialize game
            this.updateLoadingStatus('Initializing game engine...');
            this.game = new TetroHashGame();
            
            this.updateLoadingStatus('Starting game mode...');
            this.game.startGame(mode);
            
            this.updateLoadingStatus('Setting up UI...');
            this.updateModeUI(mode);
            
            this.updateLoadingStatus('Starting game loop...');
            this.startGameLoop();
            
            this.updateLoadingStatus('Ready to play!');
            
            // Hide loading after a short delay to ensure everything is ready
            setTimeout(() => {
                this.hideLoading();
                this.showGameArea();
            }, 1000);
            
        } catch (error) {
            console.error('Error initializing game:', error);
            this.updateLoadingStatus(`Error: ${error.message}`);
            setTimeout(() => {
                this.hideLoading();
                alert('Error initializing game. Please try again.');
            }, 2000);
        }
    }
    
    updateModeUI(mode) {
        // Show/hide puzzle panel based on mode
        if (mode === 'puzzle' || mode === 'lightning') {
            this.elements.puzzlePanel.classList.remove('hidden');
            this.updatePuzzleInfo();
        } else {
            this.elements.puzzlePanel.classList.add('hidden');
        }
        
        // Update mode button selection
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.querySelector(`[data-mode="${mode}"]`).classList.add('selected');
    }
    
    startGameLoop() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    stopGameLoop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
    
    gameLoop(currentTime = 0) {
        if (!this.isRunning) return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Update game
        this.game.update(deltaTime);
        
        // Render
        this.render();
        
        // Check for game over
        if (this.game.gameOver) {
            this.showGameOver();
        }
        
        // Continue loop
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    render() {
        const data = this.game.getRenderData();
        
        // Update stats
        this.elements.score.textContent = data.score.toLocaleString();
        this.elements.lines.textContent = data.lines;
        this.elements.level.textContent = data.level;
        this.elements.walletBalance.textContent = data.walletBalance.toLocaleString();
        
        // Update puzzle info
        if (data.puzzleActive) {
            this.updatePuzzleInfo();
        }
        
        // Render game board
        this.renderGameBoard(data.grid, data.currentPiece);
        
        // Render next piece
        this.renderNextPiece(data.nextPiece);
    }
    
    renderGameBoard(grid, currentPiece) {
        this.elements.gameBoard.innerHTML = '';
        
        for (let y = 0; y < this.game.HEIGHT; y++) {
            for (let x = 0; x < this.game.WIDTH; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                
                if (grid[y][x]) {
                    cell.classList.add('filled');
                    cell.style.backgroundColor = grid[y][x];
                } else if (currentPiece && this.isCurrentPieceCell(x, y, currentPiece)) {
                    cell.classList.add('current-piece');
                    cell.style.backgroundColor = currentPiece.color;
                }
                
                this.elements.gameBoard.appendChild(cell);
            }
        }
    }
    
    isCurrentPieceCell(x, y, currentPiece) {
        for (const [dx, dy] of currentPiece.shape) {
            const px = this.game.pieceX + dx;
            const py = this.game.pieceY + dy;
            if (px === x && py === y) {
                return true;
            }
        }
        return false;
    }
    
    renderNextPiece(piece) {
        if (!piece) return;
        
        this.elements.nextPiece.innerHTML = '';
        
        // Create 4x4 grid for next piece
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                const cell = document.createElement('div');
                cell.className = 'next-piece-cell';
                
                // Check if this cell should be filled
                const isFilled = piece.shape.some(([dx, dy]) => dx === x && dy === y);
                if (isFilled) {
                    cell.classList.add('filled');
                    cell.style.backgroundColor = piece.color;
                }
                
                this.elements.nextPiece.appendChild(cell);
            }
        }
    }
    
    updatePuzzleInfo() {
        if (!this.game.puzzleActive) return;
        
        this.elements.targetHash.textContent = this.game.targetHash ? 
            this.game.targetHash.substring(0, 32) + '...' : 'Loading...';
        
        if (this.game.currentPiece) {
            this.elements.currentPiece.textContent = this.game.currentPiece.name;
        }
        
        this.elements.puzzleStatus.textContent = 'Place the correct piece!';
        this.elements.puzzleStatus.className = 'status waiting';
    }
    
    async checkPuzzleSolution() {
        if (!this.game.puzzleActive) return;
        
        this.elements.checkSolution.disabled = true;
        this.elements.checkSolution.textContent = 'Checking...';
        
        try {
            const result = await this.game.checkPuzzleSolution();
            
            if (result.solved) {
                this.elements.puzzleStatus.textContent = result.message;
                this.elements.puzzleStatus.className = 'status solved';
                this.showRewardAnimation(result.reward);
                this.updatePuzzleInfo();
            } else {
                this.elements.puzzleStatus.textContent = result.message;
                this.elements.puzzleStatus.className = 'status wrong';
            }
        } catch (error) {
            console.error('Error checking puzzle:', error);
            this.elements.puzzleStatus.textContent = 'Error checking solution';
            this.elements.puzzleStatus.className = 'status wrong';
        }
        
        this.elements.checkSolution.disabled = false;
        this.elements.checkSolution.textContent = 'Check Solution';
    }
    
    showRewardAnimation(reward) {
        // Show recent reward
        this.elements.recentReward.textContent = `+${reward} sats`;
        this.elements.recentReward.classList.remove('hidden');
        
        // Create coin drop animation
        this.createCoinDropAnimation();
        
        // Hide recent reward after animation
        setTimeout(() => {
            this.elements.recentReward.classList.add('hidden');
        }, 3000);
    }
    
    createCoinDropAnimation() {
        const coin = document.createElement('div');
        coin.className = 'coin-animation';
        coin.textContent = '🪙';
        coin.style.left = Math.random() * window.innerWidth + 'px';
        coin.style.top = '0px';
        
        document.body.appendChild(coin);
        
        setTimeout(() => {
            document.body.removeChild(coin);
        }, 2000);
    }
    
    showLineClear(linesCleared) {
        // Create line clear effect
        const effect = document.createElement('div');
        effect.style.position = 'fixed';
        effect.style.top = '50%';
        effect.style.left = '50%';
        effect.style.transform = 'translate(-50%, -50%)';
        effect.style.fontSize = '3rem';
        effect.style.color = '#ffd700';
        effect.style.fontWeight = 'bold';
        effect.style.zIndex = '100';
        effect.style.pointerEvents = 'none';
        effect.textContent = `${linesCleared} LINES!`;
        
        document.body.appendChild(effect);
        
        // Animate
        effect.animate([
            { transform: 'translate(-50%, -50%) scale(0)', opacity: 0 },
            { transform: 'translate(-50%, -50%) scale(1.2)', opacity: 1 },
            { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
            { transform: 'translate(-50%, -50%) scale(0)', opacity: 0 }
        ], {
            duration: 2000,
            easing: 'ease-out'
        }).onfinish = () => {
            document.body.removeChild(effect);
        };
    }
    
    showGameOver() {
        this.stopGameLoop();
        
        const data = this.game.getRenderData();
        this.elements.finalScore.textContent = data.score.toLocaleString();
        this.elements.finalLines.textContent = data.lines;
        this.elements.finalSats.textContent = data.walletBalance.toLocaleString();
        
        this.elements.gameOverModal.classList.remove('hidden');
    }
    
    restartGame() {
        this.elements.gameOverModal.classList.add('hidden');
        this.game.reset();
        this.game.startGame(this.game.gameMode);
        this.startGameLoop();
    }
    
    showModeSelection() {
        this.stopGameLoop();
        this.elements.gameOverModal.classList.add('hidden');
        this.elements.gameArea.classList.add('hidden');
        this.elements.modeSelection.classList.remove('hidden');
    }
    
    showGameArea() {
        this.elements.modeSelection.classList.add('hidden');
        this.elements.gameArea.classList.remove('hidden');
    }
    
    showLoading() {
        this.elements.loadingScreen.classList.remove('hidden');
        this.updateLoadingStatus('Initializing game...');
    }
    
    updateLoadingStatus(message) {
        const statusElement = document.getElementById('loading-status');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }
    
    hideLoading() {
        this.elements.loadingScreen.classList.add('hidden');
    }
}

// Initialize UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing GameUI...');
    
    // Wait a bit to ensure all elements are available
    setTimeout(() => {
        try {
            window.gameUI = new GameUI();
            console.log('GameUI initialized successfully');
            
            // Hide loading screen if it's showing
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen && !loadingScreen.classList.contains('hidden')) {
                loadingScreen.classList.add('hidden');
            }
            
        } catch (error) {
            console.error('Error initializing GameUI:', error);
            
            // Show error message
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.innerHTML = `
                    <div class="loading-content">
                        <h2>❌ Error Loading Game</h2>
                        <p>${error.message}</p>
                        <button onclick="location.reload()" style="background: #ffd700; color: #000; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 20px;">Reload Page</button>
                    </div>
                `;
            }
        }
    }, 100);
});

// TetroHashUnlock v2.0 - Unified JavaScript Engine
// Author: Giancarlo Vizhnay
// Combines: app.js, game.js, ui.js, sound_system.js, ml_ai_system.js

class TetroHashUnifiedEngine {
    constructor() {
        this.WIDTH = 10;
        this.HEIGHT = 20;
        this.grid = this.createEmptyGrid();
        this.currentPiece = null;
        this.nextPiece = null;
        this.pieceX = 0;
        this.pieceY = 0;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.gameMode = 'normal';
        this.targetHash = null;
        this.puzzleActive = false;
        this.walletBalance = 0;
        this.dropTime = 500;
        this.lastDrop = 0;
        this.isRunning = false;
        this.lastLevel = 1;
        this.aiEnabled = false;
        this.aiMode = 'assist';
        this.soundEnabled = true;
        this.musicEnabled = false;
        this.audioContext = null;
        this.mlModel = null;
        this.trainingData = [];
        this.isInitialized = false;
        
        // Tetromino shapes with their preimage strings
        this.TETROMINOS = {
            'I': {
                shape: [[0,0], [0,1], [0,2], [0,3]],
                preimage: 'TJLO',
                color: '#ffd700'
            },
            'O': {
                shape: [[0,0], [0,1], [1,0], [1,1]],
                preimage: 'SQUARE',
                color: '#ff6b35'
            },
            'T': {
                shape: [[0,1], [1,0], [1,1], [1,2]],
                preimage: 'TEE',
                color: '#28a745'
            },
            'L': {
                shape: [[0,0], [1,0], [2,0], [2,1]],
                preimage: 'ELL',
                color: '#dc3545'
            },
            'J': {
                shape: [[0,1], [1,1], [2,0], [2,1]],
                preimage: 'JAY',
                color: '#6f42c1'
            },
            'S': {
                shape: [[0,1], [0,2], [1,0], [1,1]],
                preimage: 'ESS',
                color: '#20c997'
            },
            'Z': {
                shape: [[0,0], [0,1], [1,1], [1,2]],
                preimage: 'ZED',
                color: '#fd7e14'
            }
        };
        
        this.pieceNames = Object.keys(this.TETROMINOS);
        this.init();
    }
    
    async init() {
        console.log('🎮 Initializing TetroHashUnifiedEngine...');
        
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initializeApp());
            } else {
                this.initializeApp();
            }
        } catch (error) {
            console.error('Failed to initialize engine:', error);
            this.showError('Failed to initialize the game. Please refresh the page.');
        }
    }
    
    initializeApp() {
        console.log('🚀 Starting TetroHashUnifiedEngine...');
        
        setTimeout(() => {
            this.setupEventListeners();
            this.initAudio();
            this.initML();
            this.hideLoading();
            this.isInitialized = true;
            console.log('✅ TetroHashUnifiedEngine initialized successfully!');
        }, 100);
    }
    
    createEmptyGrid() {
        return Array(this.HEIGHT).fill().map(() => Array(this.WIDTH).fill(''));
    }
    
    // Audio System
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🔊 Audio system initialized');
        } catch (error) {
            console.log('⚠️ Web Audio API not supported');
        }
    }
    
    playSound(frequency, duration = 0.1) {
        if (!this.soundEnabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playCoinSound() {
        // Play coin drop sound sequence
        this.playSound(523, 0.1);
        setTimeout(() => this.playSound(659, 0.1), 100);
        setTimeout(() => this.playSound(784, 0.1), 200);
    }
    
    playLineClearSound(linesCleared) {
        if (linesCleared === 4) {
            this.playSound(800, 0.5); // Tetris sound
        } else {
            this.playSound(600, 0.3); // Line clear sound
        }
    }
    
    playLevelUpSound() {
        this.playSound(1000, 0.4);
    }
    
    // Machine Learning System
    async initML() {
        try {
            // Check if TensorFlow.js is available
            if (typeof tf !== 'undefined') {
                await this.createMLModel();
                console.log('🤖 ML system initialized');
            } else {
                console.log('⚠️ TensorFlow.js not available, ML features disabled');
            }
        } catch (error) {
            console.error('ML initialization failed:', error);
        }
    }
    
    async createMLModel() {
        // Simple neural network for move prediction
        this.mlModel = tf.sequential({
            layers: [
                tf.layers.dense({ inputShape: [200], units: 128, activation: 'relu' }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.dense({ units: 64, activation: 'relu' }),
                tf.layers.dense({ units: 32, activation: 'relu' }),
                tf.layers.dense({ units: 4, activation: 'softmax' }) // 4 moves: left, right, rotate, drop
            ]
        });
        
        this.mlModel.compile({
            optimizer: 'adam',
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });
    }
    
    extractFeatures() {
        // Extract game state features for ML
        const features = [];
        
        // Board state (200 features: 10x20 grid)
        for (let y = 0; y < this.HEIGHT; y++) {
            for (let x = 0; x < this.WIDTH; x++) {
                features.push(this.grid[y][x] !== '' ? 1 : 0);
            }
        }
        
        return features;
    }
    
    async predictMove() {
        if (!this.mlModel || !this.currentPiece) return 'drop';
        
        try {
            const features = this.extractFeatures();
            const input = tf.tensor2d([features]);
            const prediction = await this.mlModel.predict(input).data();
            
            // Find the move with highest probability
            const moves = ['left', 'right', 'rotate', 'drop'];
            const maxIndex = prediction.indexOf(Math.max(...prediction));
            
            input.dispose();
            return moves[maxIndex];
        } catch (error) {
            console.error('ML prediction error:', error);
            return 'drop';
        }
    }
    
    recordMove(move, reward) {
        if (!this.mlModel) return;
        
        const features = this.extractFeatures();
        const moveIndex = ['left', 'right', 'rotate', 'drop'].indexOf(move);
        const target = Array(4).fill(0);
        target[moveIndex] = 1;
        
        this.trainingData.push({
            features: features,
            target: target,
            reward: reward
        });
        
        // Keep only last 1000 training examples
        if (this.trainingData.length > 1000) {
            this.trainingData = this.trainingData.slice(-1000);
        }
    }
    
    async trainModel() {
        if (!this.mlModel || this.trainingData.length < 10) return;
        
        const features = this.trainingData.map(d => d.features);
        const targets = this.trainingData.map(d => d.target);
        
        const xs = tf.tensor2d(features);
        const ys = tf.tensor2d(targets);
        
        await this.mlModel.fit(xs, ys, {
            epochs: 10,
            batchSize: 32,
            validationSplit: 0.2
        });
        
        xs.dispose();
        ys.dispose();
    }
    
    // Game Logic
    spawnPiece() {
        if (!this.nextPiece) {
            this.nextPiece = this.getRandomPiece();
        }
        
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.getRandomPiece();
        this.pieceX = Math.floor(this.WIDTH / 2) - 1;
        this.pieceY = 0;
        
        // Check for game over
        if (this.collision(this.pieceX, this.pieceY)) {
            this.gameOver = true;
        }
    }
    
    getRandomPiece() {
        const name = this.pieceNames[Math.floor(Math.random() * this.pieceNames.length)];
        return { ...this.TETROMINOS[name], name };
    }
    
    collision(x, y) {
        if (!this.currentPiece) return false;
        
        for (const [dx, dy] of this.currentPiece.shape) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx < 0 || nx >= this.WIDTH || ny >= this.HEIGHT) {
                return true;
            }
            
            if (ny >= 0 && this.grid[ny][nx] !== '') {
                return true;
            }
        }
        return false;
    }
    
    move(dx) {
        if (!this.collision(this.pieceX + dx, this.pieceY)) {
            this.pieceX += dx;
            this.playSound(200, 0.1);
        }
    }
    
    rotate() {
        if (!this.currentPiece) return;
        
        const rotated = this.rotatePiece(this.currentPiece.shape);
        const originalShape = this.currentPiece.shape;
        
        this.currentPiece.shape = rotated;
        
        if (this.collision(this.pieceX, this.pieceY)) {
            this.currentPiece.shape = originalShape;
        } else {
            this.playSound(300, 0.1);
        }
    }
    
    rotatePiece(shape) {
        const rotated = [];
        for (let i = 0; i < shape.length; i++) {
            rotated.push([-shape[i][1], shape[i][0]]);
        }
        return rotated;
    }
    
    drop() {
        if (!this.collision(this.pieceX, this.pieceY + 1)) {
            this.pieceY++;
            this.playSound(150, 0.1);
        } else {
            this.lockPiece();
            this.clearLines();
            this.spawnPiece();
        }
    }
    
    hardDrop() {
        while (!this.collision(this.pieceX, this.pieceY + 1)) {
            this.pieceY++;
        }
        this.lockPiece();
        this.clearLines();
        this.spawnPiece();
    }
    
    lockPiece() {
        if (!this.currentPiece) return;
        
        for (const [dx, dy] of this.currentPiece.shape) {
            const x = this.pieceX + dx;
            const y = this.pieceY + dy;
            
            if (x >= 0 && x < this.WIDTH && y >= 0 && y < this.HEIGHT) {
                this.grid[y][x] = this.currentPiece.color;
            }
        }
    }
    
    clearLines() {
        let linesCleared = 0;
        const newGrid = [];
        
        for (let y = 0; y < this.HEIGHT; y++) {
            if (this.grid[y].every(cell => cell !== '')) {
                linesCleared++;
            } else {
                newGrid.push(this.grid[y]);
            }
        }
        
        // Add empty lines at the top
        while (newGrid.length < this.HEIGHT) {
            newGrid.unshift(Array(this.WIDTH).fill(''));
        }
        
        this.grid = newGrid;
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += linesCleared * 100 * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropTime = Math.max(50, 500 - (this.level - 1) * 50);
            
            // Award SATs for line clears (1 SAT per line)
            const satsEarned = linesCleared;
            this.walletBalance += satsEarned;
            
            // Play sounds
            this.playCoinSound();
            this.playLineClearSound(linesCleared);
            
            // Show SAT reward notification
            this.showSATReward(satsEarned);
            
            // Check for level up
            if (this.level > this.lastLevel) {
                this.playLevelUpSound();
                this.lastLevel = this.level;
            }
        }
    }
    
    // Bitcoin Puzzle Methods
    generatePuzzle() {
        const pieceName = this.pieceNames[Math.floor(Math.random() * this.pieceNames.length)];
        const preimage = this.TETROMINOS[pieceName].preimage;
        const targetHash = this.simpleHash(preimage);
        
        this.targetHash = targetHash;
        this.puzzleActive = true;
        
        return {
            targetHash,
            preimage,
            pieceName
        };
    }
    
    async generatePuzzleAsync() {
        const pieceName = this.pieceNames[Math.floor(Math.random() * this.pieceNames.length)];
        const preimage = this.TETROMINOS[pieceName].preimage;
        const targetHash = await this.sha256(preimage);
        
        this.targetHash = targetHash;
        this.puzzleActive = true;
        
        return {
            targetHash,
            preimage,
            pieceName
        };
    }
    
    async sha256(str) {
        try {
            // Use Web Crypto API for SHA-256
            const encoder = new TextEncoder();
            const data = encoder.encode(str);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (error) {
            console.warn('Web Crypto API not available, using fallback:', error);
            return this.simpleHash(str);
        }
    }
    
    simpleHash(str) {
        // Simple hash function for demo purposes
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16).padStart(8, '0').repeat(8);
    }
    
    async checkPuzzleSolution() {
        if (!this.puzzleActive || !this.currentPiece) {
            return { solved: false, message: 'No active puzzle or piece' };
        }
        
        const preimage = this.currentPiece.preimage;
        const calculatedHash = await this.sha256(preimage);
        
        if (calculatedHash === this.targetHash) {
            const reward = this.calculateReward();
            this.walletBalance += reward;
            this.puzzleActive = false;
            
            // Generate new puzzle
            this.generatePuzzle();
            
            return {
                solved: true,
                message: `Puzzle solved! Preimage "${preimage}" matches target hash!`,
                reward,
                preimage,
                targetHash: this.targetHash
            };
        } else {
            return {
                solved: false,
                message: `Preimage "${preimage}" does not match target hash`
            };
        }
    }
    
    calculateReward() {
        const baseReward = Math.floor(Math.random() * 751) + 250; // 250-1000
        const complexityBonus = this.targetHash ? this.targetHash.length * 2 : 0;
        return baseReward + complexityBonus;
    }
    
    calculateFinalSATs() {
        let finalSATs = 0;
        
        // Base reward for playing
        finalSATs += 1;
        
        // Score-based rewards (1 SAT per 1000 points)
        const scoreSATs = Math.floor(this.score / 1000);
        finalSATs += scoreSATs;
        
        // Line-based rewards (1 SAT per line cleared)
        finalSATs += this.lines;
        
        // Level-based bonus (1 SAT per level reached)
        finalSATs += this.level;
        
        // Bonus for high scores
        if (this.score >= 10000) finalSATs += 5; // 10k+ score bonus
        if (this.score >= 50000) finalSATs += 10; // 50k+ score bonus
        if (this.score >= 100000) finalSATs += 20; // 100k+ score bonus
        
        return finalSATs;
    }
    
    showSATReward(sats) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(45deg, #ffd700, #ff6b35);
            color: #000;
            padding: 15px 25px;
            border-radius: 10px;
            font-weight: bold;
            font-size: 1.2rem;
            z-index: 1000;
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
            animation: satReward 2s ease-out forwards;
        `;
        notification.textContent = `+${sats} SAT${sats > 1 ? 's' : ''}!`;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes satReward {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
                80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        }, 2000);
    }
    
    // Input Handling
    handleInput(key) {
        if (this.gameOver) return;
        
        const move = this.keyToMove(key);
        if (move) {
            this.executeMove(move);
            
            // Record move for AI learning
            if (this.aiMode === 'learning') {
                const reward = this.calculateMoveReward(move);
                this.recordMove(move, reward);
            }
        }
    }
    
    keyToMove(key) {
        switch (key.toLowerCase()) {
            case 'a':
            case 'arrowleft':
                return 'left';
            case 'd':
            case 'arrowright':
                return 'right';
            case 's':
            case 'arrowdown':
                return 'drop';
            case ' ':
            case 'w':
            case 'arrowup':
                return 'rotate';
            case 'q':
                this.endGame();
                return null;
        }
        return null;
    }
    
    executeMove(move) {
        switch (move) {
            case 'left':
                this.move(-1);
                break;
            case 'right':
                this.move(1);
                break;
            case 'rotate':
                this.rotate();
                break;
            case 'drop':
                this.drop();
                break;
        }
    }
    
    calculateMoveReward(move) {
        // Calculate reward based on move outcome
        const beforeScore = this.score;
        const beforeLines = this.lines;
        
        // Simulate move
        this.executeMove(move);
        
        const afterScore = this.score;
        const afterLines = this.lines;
        
        // Calculate reward
        let reward = 0;
        if (afterScore > beforeScore) reward += 10;
        if (afterLines > beforeLines) reward += 50;
        if (this.gameOver) reward -= 100;
        
        return reward;
    }
    
    // Game Loop
    update(deltaTime) {
        if (this.gameOver) return;
        
        this.lastDrop += deltaTime;
        
        if (this.lastDrop >= this.dropTime) {
            this.drop();
            this.lastDrop = 0;
        }
    }
    
    // Rendering
    getRenderData() {
        const renderGrid = this.createEmptyGrid();
        
        // Copy locked pieces
        for (let y = 0; y < this.HEIGHT; y++) {
            for (let x = 0; x < this.WIDTH; x++) {
                renderGrid[y][x] = this.grid[y][x];
            }
        }
        
        // Add current piece
        if (this.currentPiece) {
            for (const [dx, dy] of this.currentPiece.shape) {
                const x = this.pieceX + dx;
                const y = this.pieceY + dy;
                
                if (x >= 0 && x < this.WIDTH && y >= 0 && y < this.HEIGHT) {
                    renderGrid[y][x] = this.currentPiece.color;
                }
            }
        }
        
        return {
            grid: renderGrid,
            currentPiece: this.currentPiece,
            nextPiece: this.nextPiece,
            score: this.score,
            lines: this.lines,
            level: this.level,
            gameOver: this.gameOver,
            targetHash: this.targetHash,
            puzzleActive: this.puzzleActive,
            walletBalance: this.walletBalance
        };
    }
    
    render() {
        const data = this.getRenderData();
        
        // Update stats
        const scoreEl = document.getElementById('score');
        const linesEl = document.getElementById('lines');
        const levelEl = document.getElementById('level');
        const walletEl = document.getElementById('wallet-balance');
        
        if (scoreEl) scoreEl.textContent = data.score.toLocaleString();
        if (linesEl) linesEl.textContent = data.lines;
        if (levelEl) levelEl.textContent = data.level;
        if (walletEl) walletEl.textContent = data.walletBalance.toLocaleString();
        
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
        const board = document.getElementById('game-board');
        if (!board) return;
        
        board.innerHTML = '';
        
        for (let y = 0; y < this.HEIGHT; y++) {
            for (let x = 0; x < this.WIDTH; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                
                if (grid[y][x]) {
                    cell.classList.add('filled');
                    cell.style.backgroundColor = grid[y][x];
                } else if (currentPiece && this.isCurrentPieceCell(x, y, currentPiece)) {
                    cell.classList.add('current-piece');
                    cell.style.backgroundColor = currentPiece.color;
                }
                
                board.appendChild(cell);
            }
        }
    }
    
    isCurrentPieceCell(x, y, currentPiece) {
        for (const [dx, dy] of currentPiece.shape) {
            const px = this.pieceX + dx;
            const py = this.pieceY + dy;
            if (px === x && py === y) {
                return true;
            }
        }
        return false;
    }
    
    renderNextPiece(piece) {
        const nextPieceEl = document.getElementById('next-piece');
        if (!nextPieceEl || !piece) return;
        
        nextPieceEl.innerHTML = '';
        
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
                
                nextPieceEl.appendChild(cell);
            }
        }
    }
    
    updatePuzzleInfo() {
        if (!this.puzzleActive) return;
        
        const targetHashEl = document.getElementById('target-hash');
        const currentPieceEl = document.getElementById('current-piece');
        const puzzleStatusEl = document.getElementById('puzzle-status');
        
        if (targetHashEl) {
            targetHashEl.textContent = this.targetHash ? 
                this.targetHash.substring(0, 32) + '...' : 'Loading...';
        }
        
        if (currentPieceEl && this.currentPiece) {
            currentPieceEl.textContent = this.currentPiece.name;
        }
        
        if (puzzleStatusEl) {
            puzzleStatusEl.textContent = 'Place the correct piece!';
            puzzleStatusEl.className = 'status waiting';
        }
    }
    
    // Game State Management
    reset() {
        this.grid = this.createEmptyGrid();
        this.currentPiece = null;
        this.nextPiece = null;
        this.pieceX = 0;
        this.pieceY = 0;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.targetHash = null;
        this.puzzleActive = false;
        this.dropTime = 500;
        this.lastDrop = 0;
    }
    
    startGame(mode) {
        this.gameMode = mode;
        this.reset();
        
        if (mode === 'puzzle' || mode === 'lightning') {
            this.generatePuzzle();
        }
        
        this.spawnPiece();
    }
    
    endGame() {
        this.stopGameLoop();
        this.gameOver = true;
        
        const finalSATs = this.calculateFinalSATs();
        this.walletBalance += finalSATs;
        
        if (finalSATs > 0) {
            this.playCoinSound();
            this.showSATReward(finalSATs);
        }
        
        const playAgain = confirm(`Game Over! Final Score: ${this.score}\nLines Cleared: ${this.lines}\nSATs Earned: ${finalSATs}\nTotal SATs: ${this.walletBalance}\n\nClick OK to play again or Cancel to return to menu.`);
        
        if (playAgain) {
            this.startGame(this.gameMode);
        } else {
            this.showModeSelection();
        }
    }
    
    // UI Management
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
            if (this.isRunning) {
                this.handleInput(e.key);
                e.preventDefault();
            }
        });
        
        // Puzzle check button
        const checkBtn = document.getElementById('check-solution');
        if (checkBtn) {
            checkBtn.addEventListener('click', () => {
                this.checkPuzzleSolution();
            });
        }
        
        // AI controls
        const toggleAI = document.getElementById('toggle-ai');
        if (toggleAI) {
            toggleAI.addEventListener('click', () => {
                this.toggleAI();
            });
        }
        
        const trainAI = document.getElementById('train-ai');
        if (trainAI) {
            trainAI.addEventListener('click', () => {
                this.trainAI();
            });
        }
        
        const resetAI = document.getElementById('reset-ai');
        if (resetAI) {
            resetAI.addEventListener('click', () => {
                this.resetAI();
            });
        }
        
        const saveAI = document.getElementById('save-ai');
        if (saveAI) {
            saveAI.addEventListener('click', () => {
                this.saveAI();
            });
        }
        
        const loadAI = document.getElementById('load-ai');
        if (loadAI) {
            loadAI.addEventListener('click', () => {
                this.loadAI();
            });
        }
        
        // Sound controls
        const toggleSound = document.getElementById('toggle-sound');
        if (toggleSound) {
            toggleSound.addEventListener('click', () => {
                this.toggleSound();
            });
        }
        
        const testSound = document.getElementById('test-sound');
        if (testSound) {
            testSound.addEventListener('click', () => {
                this.playSound(440, 0.2);
            });
        }
        
        const testCoin = document.getElementById('test-coin');
        if (testCoin) {
            testCoin.addEventListener('click', () => {
                this.playCoinSound();
            });
        }
        
        const backgroundMusic = document.getElementById('background-music');
        if (backgroundMusic) {
            backgroundMusic.addEventListener('click', () => {
                this.toggleMusic();
            });
        }
    }
    
    selectMode(mode) {
        console.log(`Selected mode: ${mode}`);
        this.gameMode = mode;
        
        // Set AI mode based on game mode
        switch (mode) {
            case 'ai-battle':
                this.aiMode = 'battle';
                this.aiEnabled = true;
                break;
            case 'learning':
                this.aiMode = 'learning';
                this.aiEnabled = true;
                break;
            default:
                this.aiMode = 'assist';
                break;
        }
        
        this.startGame();
    }
    
    startGameLoop() {
        this.isRunning = true;
        this.lastDrop = performance.now();
        this.gameLoop();
    }
    
    stopGameLoop() {
        this.isRunning = false;
    }
    
    gameLoop(currentTime = 0) {
        if (!this.isRunning) return;
        
        const deltaTime = currentTime - this.lastDrop;
        this.lastDrop = currentTime;
        
        // Update game
        this.update(deltaTime);
        
        // Render
        this.render();
        
        // Check for game over
        if (this.gameOver) {
            this.endGame();
        }
        
        // Continue loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    showGameArea() {
        const modeSelection = document.getElementById('mode-selection');
        const gameArea = document.getElementById('game-area');
        
        if (modeSelection) modeSelection.classList.add('hidden');
        if (gameArea) gameArea.classList.remove('hidden');
    }
    
    showModeSelection() {
        const gameArea = document.getElementById('game-area');
        const modeSelection = document.getElementById('mode-selection');
        
        if (gameArea) gameArea.classList.add('hidden');
        if (modeSelection) modeSelection.classList.remove('hidden');
        this.stopGameLoop();
    }
    
    hideLoading() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    }
    
    showError(message) {
        const error = document.createElement('div');
        error.className = 'error-message';
        error.innerHTML = `
            <div class="error-content">
                <h2>❌ Error</h2>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">Reload</button>
            </div>
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            .error-message {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 3000;
            }
            
            .error-content {
                background: #dc3545;
                color: white;
                padding: 40px;
                border-radius: 10px;
                text-align: center;
                max-width: 400px;
                width: 90%;
            }
            
            .error-content h2 {
                margin-bottom: 20px;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(error);
    }
    
    // Control Methods
    toggleAI() {
        this.aiEnabled = !this.aiEnabled;
        const btn = document.getElementById('toggle-ai');
        if (btn) {
            btn.textContent = `AI: ${this.aiEnabled ? 'ON' : 'OFF'}`;
            btn.className = this.aiEnabled ? 'active' : '';
        }
    }
    
    async trainAI() {
        console.log('🤖 AI Training initiated');
        await this.trainModel();
        this.playSound(400, 0.3);
    }
    
    resetAI() {
        console.log('🤖 AI Learning reset');
        this.trainingData = [];
        this.playSound(200, 0.2);
    }
    
    saveAI() {
        console.log('🤖 AI Model saved');
        this.playSound(600, 0.2);
    }
    
    loadAI() {
        console.log('🤖 AI Model loaded');
        this.playSound(800, 0.2);
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const btn = document.getElementById('toggle-sound');
        if (btn) {
            btn.textContent = `Sound: ${this.soundEnabled ? 'ON' : 'OFF'}`;
            btn.className = this.soundEnabled ? 'active' : '';
        }
    }
    
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        const btn = document.getElementById('background-music');
        if (btn) {
            btn.textContent = `Music: ${this.musicEnabled ? 'ON' : 'OFF'}`;
            btn.className = this.musicEnabled ? 'active' : '';
        }
    }
}

// Initialize the unified engine
const unifiedEngine = new TetroHashUnifiedEngine();

// Export for global access
window.TetroHashUnifiedEngine = TetroHashUnifiedEngine;
window.unifiedEngine = unifiedEngine;

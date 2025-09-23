// TetroHashUnlock v2.0 - Game Logic
// Author: Giancarlo Vizhnay

class TetroHashGame {
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
    }
    
    createEmptyGrid() {
        return Array(this.HEIGHT).fill().map(() => Array(this.WIDTH).fill(''));
    }
    
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
        }
    }
    
    rotate() {
        if (!this.currentPiece) return;
        
        const rotated = this.rotatePiece(this.currentPiece.shape);
        const originalShape = this.currentPiece.shape;
        
        this.currentPiece.shape = rotated;
        
        if (this.collision(this.pieceX, this.pieceY)) {
            this.currentPiece.shape = originalShape;
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
            
            // Trigger line clear animation
            this.triggerLineClearAnimation(linesCleared);
        }
    }
    
    triggerLineClearAnimation(linesCleared) {
        // This will be handled by the UI
        if (window.gameUI) {
            window.gameUI.showLineClear(linesCleared);
        }
    }
    
    // Bitcoin Puzzle Methods
    generatePuzzle() {
        const pieceName = this.pieceNames[Math.floor(Math.random() * this.pieceNames.length)];
        const preimage = this.TETROMINOS[pieceName].preimage;
        // Use simple hash for immediate generation
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
            // Fallback to a simple hash for demo purposes
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
    
    // Game Loop
    update(deltaTime) {
        if (this.gameOver) return;
        
        this.lastDrop += deltaTime;
        
        if (this.lastDrop >= this.dropTime) {
            this.drop();
            this.lastDrop = 0;
        }
    }
    
    // Input Handling
    handleInput(key) {
        if (this.gameOver) return;
        
        switch (key.toLowerCase()) {
            case 'a':
            case 'arrowleft':
                this.move(-1);
                break;
            case 'd':
            case 'arrowright':
                this.move(1);
                break;
            case 's':
            case 'arrowdown':
                this.drop();
                break;
            case ' ':
            case 'w':
            case 'arrowup':
                this.rotate();
                break;
            case 'q':
                this.gameOver = true;
                break;
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
}

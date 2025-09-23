// TetroHashUnlock v2.0 — ML Training Data Collector
// Author: Giancarlo Vizhnay

class MLTrainingCollector {
    constructor() {
        this.trainingData = [];
        this.gameStates = [];
        this.playerMoves = [];
        this.rewards = [];
        this.isCollecting = false;
        this.currentGame = null;
        this.gameStartTime = null;
        this.moveCount = 0;
        this.maxDataPoints = 10000;
        
        this.init();
    }
    
    init() {
        console.log('📊 ML Training Data Collector initialized');
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Listen for game events
        document.addEventListener('tetris-game-start', (e) => {
            this.startCollection(e.detail);
        });
        
        document.addEventListener('tetris-game-end', (e) => {
            this.stopCollection(e.detail);
        });
        
        document.addEventListener('tetris-move', (e) => {
            this.recordMove(e.detail);
        });
        
        document.addEventListener('tetris-line-clear', (e) => {
            this.recordReward(e.detail);
        });
    }
    
    startCollection(gameInstance) {
        this.currentGame = gameInstance;
        this.isCollecting = true;
        this.gameStartTime = Date.now();
        this.moveCount = 0;
        
        console.log('🎯 Started collecting training data');
    }
    
    stopCollection(finalStats) {
        if (!this.isCollecting) return;
        
        this.isCollecting = false;
        this.currentGame = null;
        
        // Calculate final rewards
        this.calculateFinalRewards(finalStats);
        
        console.log(`📈 Collected ${this.trainingData.length} data points`);
        console.log(`🎮 Game stats: Score: ${finalStats.score}, Lines: ${finalStats.lines}, Level: ${finalStats.level}`);
    }
    
    recordMove(moveData) {
        if (!this.isCollecting || !this.currentGame) return;
        
        const gameState = this.extractGameState(this.currentGame);
        const move = moveData.move;
        const timestamp = Date.now();
        
        // Store game state and move
        this.gameStates.push({
            ...gameState,
            timestamp: timestamp,
            moveCount: this.moveCount
        });
        
        this.playerMoves.push({
            move: move,
            timestamp: timestamp,
            moveCount: this.moveCount
        });
        
        this.moveCount++;
        
        // Create training data point
        const dataPoint = {
            features: this.extractFeatures(gameState),
            move: this.moveToIndex(move),
            reward: 0, // Will be calculated later
            timestamp: timestamp,
            gameId: this.gameStartTime,
            moveCount: this.moveCount
        };
        
        this.trainingData.push(dataPoint);
        
        // Limit data size
        if (this.trainingData.length > this.maxDataPoints) {
            this.trainingData = this.trainingData.slice(-this.maxDataPoints);
        }
    }
    
    recordReward(rewardData) {
        if (!this.isCollecting) return;
        
        const reward = this.calculateReward(rewardData);
        
        // Update recent moves with reward
        const recentMoves = this.trainingData.slice(-10);
        recentMoves.forEach(dataPoint => {
            dataPoint.reward += reward;
        });
        
        this.rewards.push({
            type: rewardData.type,
            amount: reward,
            timestamp: Date.now(),
            moveCount: this.moveCount
        });
    }
    
    extractGameState(game) {
        return {
            grid: game.grid.map(row => [...row]),
            currentPiece: game.currentPiece ? {
                name: game.currentPiece.name,
                shape: game.currentPiece.shape,
                color: game.currentPiece.color
            } : null,
            pieceX: game.pieceX,
            pieceY: game.pieceY,
            score: game.score,
            lines: game.lines,
            level: game.level,
            gameMode: game.gameMode,
            puzzleActive: game.puzzleActive
        };
    }
    
    extractFeatures(gameState) {
        const features = [];
        
        // Board state (200 features)
        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 10; x++) {
                features.push(gameState.grid[y][x] !== '' ? 1 : 0);
            }
        }
        
        // Current piece features
        if (gameState.currentPiece) {
            // Piece type (one-hot encoded)
            const pieceTypes = ['I', 'O', 'T', 'L', 'J', 'S', 'Z'];
            const pieceIndex = pieceTypes.indexOf(gameState.currentPiece.name);
            for (let i = 0; i < 7; i++) {
                features.push(i === pieceIndex ? 1 : 0);
            }
            
            // Piece position
            features.push(gameState.pieceX / 10);
            features.push(gameState.pieceY / 20);
            
            // Piece rotation (simplified)
            features.push(0);
        } else {
            // No piece - fill with zeros
            for (let i = 0; i < 10; i++) {
                features.push(0);
            }
        }
        
        // Game state features
        features.push(gameState.score / 10000);
        features.push(gameState.lines / 100);
        features.push(gameState.level / 20);
        
        // Board statistics
        const boardStats = this.calculateBoardStats(gameState.grid);
        features.push(boardStats.holes / 200);
        features.push(boardStats.height / 20);
        features.push(boardStats.bumpiness / 10);
        
        // Pad to 200 features
        while (features.length < 200) {
            features.push(0);
        }
        
        return features.slice(0, 200);
    }
    
    calculateBoardStats(grid) {
        let holes = 0;
        let height = 0;
        let bumpiness = 0;
        const columnHeights = [];
        
        // Calculate column heights
        for (let x = 0; x < 10; x++) {
            let colHeight = 0;
            for (let y = 0; y < 20; y++) {
                if (grid[y][x] !== '') {
                    colHeight = 20 - y;
                    break;
                }
            }
            columnHeights.push(colHeight);
            height = Math.max(height, colHeight);
        }
        
        // Calculate holes
        for (let x = 0; x < 10; x++) {
            let foundBlock = false;
            for (let y = 0; y < 20; y++) {
                if (grid[y][x] !== '') {
                    foundBlock = true;
                } else if (foundBlock) {
                    holes++;
                }
            }
        }
        
        // Calculate bumpiness
        for (let x = 1; x < 10; x++) {
            bumpiness += Math.abs(columnHeights[x] - columnHeights[x - 1]);
        }
        
        return { holes, height, bumpiness };
    }
    
    moveToIndex(move) {
        const moves = ['left', 'right', 'rotate', 'drop'];
        return moves.indexOf(move);
    }
    
    calculateReward(rewardData) {
        let reward = 0;
        
        switch (rewardData.type) {
            case 'line_clear':
                reward = rewardData.lines * 100;
                break;
            case 'tetris':
                reward = 1000;
                break;
            case 'puzzle_solve':
                reward = 500;
                break;
            case 'level_up':
                reward = 200;
                break;
            case 'game_over':
                reward = -1000;
                break;
            default:
                reward = 0;
        }
        
        return reward;
    }
    
    calculateFinalRewards(finalStats) {
        // Calculate final rewards based on game outcome
        const finalReward = this.calculateFinalReward(finalStats);
        
        // Apply final reward to recent moves
        const recentMoves = this.trainingData.slice(-20);
        recentMoves.forEach(dataPoint => {
            dataPoint.reward += finalReward;
        });
    }
    
    calculateFinalReward(finalStats) {
        let reward = 0;
        
        // Score-based reward
        reward += finalStats.score / 1000;
        
        // Lines-based reward
        reward += finalStats.lines * 10;
        
        // Level-based reward
        reward += finalStats.level * 5;
        
        // Game over penalty
        if (finalStats.gameOver) {
            reward -= 100;
        }
        
        return Math.round(reward);
    }
    
    // Export training data
    exportTrainingData() {
        const data = {
            trainingData: this.trainingData,
            gameStates: this.gameStates,
            playerMoves: this.playerMoves,
            rewards: this.rewards,
            metadata: {
                totalDataPoints: this.trainingData.length,
                totalGames: this.gameStates.length > 0 ? 1 : 0,
                dataRange: {
                    start: this.trainingData[0]?.timestamp || 0,
                    end: this.trainingData[this.trainingData.length - 1]?.timestamp || 0
                }
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `tetris_training_data_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('📁 Training data exported');
    }
    
    // Import training data
    importTrainingData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                this.trainingData = data.trainingData || [];
                this.gameStates = data.gameStates || [];
                this.playerMoves = data.playerMoves || [];
                this.rewards = data.rewards || [];
                
                console.log(`📥 Imported ${this.trainingData.length} training data points`);
            } catch (error) {
                console.error('❌ Error importing training data:', error);
            }
        };
        reader.readAsText(file);
    }
    
    // Get training statistics
    getTrainingStats() {
        return {
            totalDataPoints: this.trainingData.length,
            totalGames: this.gameStates.length,
            averageReward: this.calculateAverageReward(),
            dataQuality: this.assessDataQuality(),
            isCollecting: this.isCollecting
        };
    }
    
    calculateAverageReward() {
        if (this.trainingData.length === 0) return 0;
        
        const totalReward = this.trainingData.reduce((sum, dataPoint) => sum + dataPoint.reward, 0);
        return totalReward / this.trainingData.length;
    }
    
    assessDataQuality() {
        if (this.trainingData.length === 0) return 'No Data';
        
        const avgReward = this.calculateAverageReward();
        const dataPoints = this.trainingData.length;
        
        if (dataPoints < 100) return 'Low';
        if (dataPoints < 500) return 'Medium';
        if (dataPoints < 1000) return 'Good';
        return 'Excellent';
    }
    
    // Clear all data
    clearData() {
        this.trainingData = [];
        this.gameStates = [];
        this.playerMoves = [];
        this.rewards = [];
        this.moveCount = 0;
        
        console.log('🗑️ Training data cleared');
    }
    
    // Get data for ML training
    getMLTrainingData() {
        if (this.trainingData.length === 0) return null;
        
        const features = this.trainingData.map(d => d.features);
        const moves = this.trainingData.map(d => d.move);
        const rewards = this.trainingData.map(d => d.reward);
        
        return {
            features: features,
            moves: moves,
            rewards: rewards,
            metadata: {
                totalDataPoints: this.trainingData.length,
                averageReward: this.calculateAverageReward(),
                dataQuality: this.assessDataQuality()
            }
        };
    }
}

// Global training collector
window.trainingCollector = new MLTrainingCollector();

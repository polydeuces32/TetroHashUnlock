// TetroHashUnlock v2.0 — Complete Machine Learning AI System
// Author: Giancarlo Vizhnay

class MLTetrisAI {
    constructor() {
        this.model = null;
        this.isTraining = false;
        this.trainingData = [];
        this.gameStates = [];
        this.playerMoves = [];
        this.performance = {
            gamesPlayed: 0,
            averageScore: 0,
            bestScore: 0,
            learningRate: 0.01,
            accuracy: 0
        };
        
        this.features = {
            boardHeight: 20,
            boardWidth: 10,
            pieceTypes: 7,
            maxFeatures: 200 // Simplified feature vector size
        };
        
        this.init();
    }
    
    async init() {
        console.log('🤖 Initializing ML Tetris AI...');
        
        try {
            // Initialize TensorFlow.js
            if (typeof tf === 'undefined') {
                await this.loadTensorFlow();
            }
            
            // Create neural network model
            this.model = this.createModel();
            
            // Load pre-trained weights if available
            await this.loadModel();
            
            console.log('✅ ML AI System initialized successfully!');
        } catch (error) {
            console.error('❌ Error initializing ML AI:', error);
            this.fallbackToRuleBased();
        }
    }
    
    async loadTensorFlow() {
        // Load TensorFlow.js from CDN
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js';
            script.onload = () => {
                console.log('📦 TensorFlow.js loaded');
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    createModel() {
        // Create a neural network for Tetris decision making
        const model = tf.sequential({
            layers: [
                // Input layer - board state + piece info
                tf.layers.dense({
                    inputShape: [this.features.maxFeatures],
                    units: 128,
                    activation: 'relu',
                    name: 'input_layer'
                }),
                
                // Hidden layers
                tf.layers.dense({
                    units: 64,
                    activation: 'relu',
                    name: 'hidden1'
                }),
                
                tf.layers.dense({
                    units: 32,
                    activation: 'relu',
                    name: 'hidden2'
                }),
                
                tf.layers.dropout({
                    rate: 0.2,
                    name: 'dropout'
                }),
                
                // Output layer - move probabilities
                tf.layers.dense({
                    units: 4, // left, right, rotate, drop
                    activation: 'softmax',
                    name: 'output_layer'
                })
            ]
        });
        
        // Compile model
        model.compile({
            optimizer: tf.train.adam(this.performance.learningRate),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });
        
        return model;
    }
    
    // Extract features from game state
    extractFeatures(game) {
        const features = [];
        
        // Board state features (200 features)
        for (let y = 0; y < this.features.boardHeight; y++) {
            for (let x = 0; x < this.features.boardWidth; x++) {
                features.push(game.grid[y][x] !== '' ? 1 : 0);
            }
        }
        
        // Current piece features
        if (game.currentPiece) {
            // Piece type (one-hot encoded)
            const pieceTypes = ['I', 'O', 'T', 'L', 'J', 'S', 'Z'];
            const pieceIndex = pieceTypes.indexOf(game.currentPiece.name);
            for (let i = 0; i < 7; i++) {
                features.push(i === pieceIndex ? 1 : 0);
            }
            
            // Piece position
            features.push(game.pieceX / this.features.boardWidth);
            features.push(game.pieceY / this.features.boardHeight);
            
            // Piece rotation (0-3)
            features.push(0); // Simplified for now
        } else {
            // No piece - fill with zeros
            for (let i = 0; i < 10; i++) {
                features.push(0);
            }
        }
        
        // Game state features
        features.push(game.score / 10000); // Normalized score
        features.push(game.lines / 100); // Normalized lines
        features.push(game.level / 20); // Normalized level
        
        // Board statistics
        const boardStats = this.calculateBoardStats(game.grid);
        features.push(boardStats.holes / 200);
        features.push(boardStats.height / 20);
        features.push(boardStats.bumpiness / 10);
        
        // Pad to maxFeatures
        while (features.length < this.features.maxFeatures) {
            features.push(0);
        }
        
        return features.slice(0, this.features.maxFeatures);
    }
    
    calculateBoardStats(grid) {
        let holes = 0;
        let height = 0;
        let bumpiness = 0;
        const columnHeights = [];
        
        // Calculate column heights
        for (let x = 0; x < this.features.boardWidth; x++) {
            let colHeight = 0;
            for (let y = 0; y < this.features.boardHeight; y++) {
                if (grid[y][x] !== '') {
                    colHeight = this.features.boardHeight - y;
                    break;
                }
            }
            columnHeights.push(colHeight);
            height = Math.max(height, colHeight);
        }
        
        // Calculate holes (empty spaces below filled blocks)
        for (let x = 0; x < this.features.boardWidth; x++) {
            let foundBlock = false;
            for (let y = 0; y < this.features.boardHeight; y++) {
                if (grid[y][x] !== '') {
                    foundBlock = true;
                } else if (foundBlock) {
                    holes++;
                }
            }
        }
        
        // Calculate bumpiness (height differences between columns)
        for (let x = 1; x < this.features.boardWidth; x++) {
            bumpiness += Math.abs(columnHeights[x] - columnHeights[x - 1]);
        }
        
        return { holes, height, bumpiness };
    }
    
    // Predict the best move
    async predictMove(game) {
        if (!this.model) {
            return this.fallbackMove(game);
        }
        
        try {
            const features = this.extractFeatures(game);
            const input = tf.tensor2d([features]);
            
            const prediction = await this.model.predict(input).data();
            const moveIndex = this.argmax(prediction);
            
            input.dispose();
            
            const moves = ['left', 'right', 'rotate', 'drop'];
            return moves[moveIndex];
        } catch (error) {
            console.error('Prediction error:', error);
            return this.fallbackMove(game);
        }
    }
    
    argmax(array) {
        let maxIndex = 0;
        let maxValue = array[0];
        
        for (let i = 1; i < array.length; i++) {
            if (array[i] > maxValue) {
                maxValue = array[i];
                maxIndex = i;
            }
        }
        
        return maxIndex;
    }
    
    // Fallback to rule-based AI
    fallbackMove(game) {
        const moves = ['left', 'right', 'rotate', 'drop'];
        return moves[Math.floor(Math.random() * moves.length)];
    }
    
    // Fallback to rule-based AI
    fallbackToRuleBased() {
        console.log('🔄 Falling back to rule-based AI');
        this.model = null;
    }
    
    // Record player move for learning
    recordPlayerMove(game, move, reward) {
        const features = this.extractFeatures(game);
        const moveIndex = ['left', 'right', 'rotate', 'drop'].indexOf(move);
        
        this.trainingData.push({
            features: features,
            move: moveIndex,
            reward: reward,
            timestamp: Date.now()
        });
        
        // Keep only recent data
        if (this.trainingData.length > 1000) {
            this.trainingData = this.trainingData.slice(-500);
        }
    }
    
    // Train the model
    async trainModel() {
        if (!this.model || this.trainingData.length < 10) {
            return;
        }
        
        console.log('🎓 Training ML model...');
        this.isTraining = true;
        
        try {
            // Prepare training data
            const features = this.trainingData.map(d => d.features);
            const moves = this.trainingData.map(d => d.move);
            const rewards = this.trainingData.map(d => d.reward);
            
            // Convert to tensors
            const xTrain = tf.tensor2d(features);
            const yTrain = tf.oneHot(tf.tensor1d(moves, 'int32'), 4);
            
            // Train the model
            const history = await this.model.fit(xTrain, yTrain, {
                epochs: 10,
                batchSize: 32,
                validationSplit: 0.2,
                verbose: 0
            });
            
            // Update performance metrics
            this.performance.accuracy = history.history.accuracy[history.history.accuracy.length - 1];
            this.performance.gamesPlayed++;
            
            // Clean up tensors
            xTrain.dispose();
            yTrain.dispose();
            
            console.log(`✅ Training complete! Accuracy: ${(this.performance.accuracy * 100).toFixed(2)}%`);
            
        } catch (error) {
            console.error('❌ Training error:', error);
        } finally {
            this.isTraining = false;
        }
    }
    
    // Save model to localStorage
    async saveModel() {
        if (!this.model) return;
        
        try {
            const modelData = await this.model.save('indexeddb://tetris-ai-model');
            console.log('💾 Model saved successfully');
        } catch (error) {
            console.error('❌ Error saving model:', error);
        }
    }
    
    // Load model from localStorage
    async loadModel() {
        try {
            this.model = await tf.loadLayersModel('indexeddb://tetris-ai-model');
            console.log('📂 Model loaded successfully');
        } catch (error) {
            console.log('ℹ️ No saved model found, using new model');
        }
    }
    
    // Get AI performance stats
    getPerformanceStats() {
        return {
            ...this.performance,
            trainingDataSize: this.trainingData.length,
            isTraining: this.isTraining,
            modelLoaded: this.model !== null
        };
    }
    
    // Reset AI learning
    resetLearning() {
        this.trainingData = [];
        this.performance = {
            gamesPlayed: 0,
            averageScore: 0,
            bestScore: 0,
            learningRate: 0.01,
            accuracy: 0
        };
        console.log('🔄 AI learning reset');
    }
    
    // Advanced move evaluation
    evaluateMove(game, move) {
        // Simulate the move and evaluate the resulting board state
        const simulatedGame = this.simulateMove(game, move);
        const stats = this.calculateBoardStats(simulatedGame.grid);
        
        // Scoring function (higher is better)
        let score = 0;
        
        // Prefer lower board height
        score += (20 - stats.height) * 10;
        
        // Penalize holes
        score -= stats.holes * 50;
        
        // Prefer smoother boards
        score -= stats.bumpiness * 5;
        
        // Bonus for clearing lines
        const linesCleared = this.countLinesCleared(simulatedGame.grid);
        score += linesCleared * 1000;
        
        return score;
    }
    
    simulateMove(game, move) {
        // Create a copy of the game state
        const simulated = {
            ...game,
            grid: game.grid.map(row => [...row]),
            pieceX: game.pieceX,
            pieceY: game.pieceY,
            currentPiece: game.currentPiece ? { ...game.currentPiece } : null
        };
        
        // Apply the move
        switch (move) {
            case 'left':
                simulated.pieceX = Math.max(0, simulated.pieceX - 1);
                break;
            case 'right':
                simulated.pieceX = Math.min(9, simulated.pieceX + 1);
                break;
            case 'rotate':
                if (simulated.currentPiece) {
                    const rotated = this.rotatePiece(simulated.currentPiece.shape);
                    simulated.currentPiece.shape = rotated;
                }
                break;
            case 'drop':
                simulated.pieceY = Math.min(19, simulated.pieceY + 1);
                break;
        }
        
        return simulated;
    }
    
    rotatePiece(shape) {
        const rotated = [];
        for (let i = 0; i < shape.length; i++) {
            rotated.push([-shape[i][1], shape[i][0]]);
        }
        return rotated;
    }
    
    countLinesCleared(grid) {
        let linesCleared = 0;
        for (let y = 0; y < this.features.boardHeight; y++) {
            if (grid[y].every(cell => cell !== '')) {
                linesCleared++;
            }
        }
        return linesCleared;
    }
}

// Global AI instance
window.mlAI = new MLTetrisAI();

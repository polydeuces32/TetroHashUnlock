// TetroHashUnlock v3.0 - Modern Engine
// Advanced JavaScript with ES6+, Web APIs, and Modern Features

class ModernTetroHashEngine {
    constructor() {
        // Core Game Properties
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
        this.isPaused = false;
        this.isRunning = false;
        
        // Modern Features
        this.theme = this.getStoredTheme() || 'dark';
        this.settings = this.getStoredSettings();
        this.gameStats = this.getStoredStats();
        this.notifications = [];
        this.animationFrame = null;
        this.gameStartTime = 0;
        this.lastUpdate = 0;
        
        // Audio System
        this.audioContext = null;
        this.soundEnabled = this.settings.soundEnabled;
        this.musicEnabled = this.settings.musicEnabled;
        this.soundVolume = this.settings.soundVolume;
        this.musicVolume = this.settings.musicVolume;
        
        // AI System
        this.aiEnabled = false;
        this.aiModel = null;
        this.aiPredictions = { left: 0, right: 0, rotate: 0, drop: 0 };
        
        // Bitcoin & SAT System
        this.walletBalance = this.getStoredWalletBalance();
        this.targetHash = null;
        this.puzzleActive = false;
        
        // Tetromino Definitions
        this.TETROMINOS = {
            'I': { 
                shape: [[0,0], [0,1], [0,2], [0,3]], 
                preimage: 'TJLO', 
                color: '#ffd700',
                name: 'I-Piece'
            },
            'O': { 
                shape: [[0,0], [0,1], [1,0], [1,1]], 
                preimage: 'SQUARE', 
                color: '#ff6b35',
                name: 'O-Piece'
            },
            'T': { 
                shape: [[0,1], [1,0], [1,1], [1,2]], 
                preimage: 'TEE', 
                color: '#28a745',
                name: 'T-Piece'
            },
            'L': { 
                shape: [[0,0], [1,0], [2,0], [2,1]], 
                preimage: 'ELL', 
                color: '#dc3545',
                name: 'L-Piece'
            },
            'J': { 
                shape: [[0,1], [1,1], [2,0], [2,1]], 
                preimage: 'JAY', 
                color: '#6f42c1',
                name: 'J-Piece'
            },
            'S': { 
                shape: [[0,1], [0,2], [1,0], [1,1]], 
                preimage: 'ESS', 
                color: '#20c997',
                name: 'S-Piece'
            },
            'Z': { 
                shape: [[0,0], [0,1], [1,1], [1,2]], 
                preimage: 'ZED', 
                color: '#fd7e14',
                name: 'Z-Piece'
            }
        };
        
        this.pieceNames = Object.keys(this.TETROMINOS);
        
        // UI Elements Cache
        this.elements = {};
        
        // Performance Monitoring
        this.performanceMetrics = {
            fps: 0,
            frameTime: 0,
            memoryUsage: 0,
            renderTime: 0
        };
        
        this.init();
    }
    
    async init() {
        console.log('🚀 Initializing TetroHashUnlock Modern Engine...');
        
        try {
            await this.initializeElements();
            await this.setupEventListeners();
            await this.initializeAudio();
            await this.initializeTheme();
            await this.initializeAI();
            await this.loadGameData();
            
            this.hideLoading();
            this.showHeroSection();
            this.startBackgroundAnimations();
            
            console.log('✅ Modern Engine initialized successfully!');
            this.showToast('Welcome to TetroHashUnlock v3.0!', 'success');
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this.showToast('Initialization failed. Please refresh the page.', 'error');
        }
    }
    
    async initializeElements() {
        // Cache DOM elements for better performance
        this.elements = {
            // Loading
            loadingScreen: document.getElementById('loading-screen'),
            loadingStatus: document.getElementById('loading-status'),
            progressBar: document.getElementById('progress-bar'),
            
            // Navigation
            themeToggle: document.getElementById('theme-toggle'),
            settingsToggle: document.getElementById('settings-toggle'),
            fullscreenToggle: document.getElementById('fullscreen-toggle'),
            
            // Hero Section
            heroSection: document.getElementById('hero-section'),
            startGameBtn: document.getElementById('start-game-btn'),
            learnMoreBtn: document.getElementById('learn-more-btn'),
            tetrisPreview: document.getElementById('tetris-preview'),
            
            // Mode Selection
            modeSelection: document.getElementById('mode-selection'),
            modeCards: document.querySelectorAll('.mode-card'),
            
            // Game Area
            gameArea: document.getElementById('game-area'),
            gameBoard: document.getElementById('game-board'),
            nextPiece: document.getElementById('next-piece'),
            
            // Info Panels
            score: document.getElementById('score'),
            lines: document.getElementById('lines'),
            level: document.getElementById('level'),
            gameTime: document.getElementById('game-time'),
            walletBalance: document.getElementById('wallet-balance'),
            earnedThisGame: document.getElementById('earned-this-game'),
            totalEarned: document.getElementById('total-earned'),
            
            // AI Panel
            aiToggle: document.getElementById('ai-toggle'),
            aiContent: document.getElementById('ai-content'),
            predLeft: document.getElementById('pred-left'),
            predRight: document.getElementById('pred-right'),
            predRotate: document.getElementById('pred-rotate'),
            predDrop: document.getElementById('pred-drop'),
            predLeftValue: document.getElementById('pred-left-value'),
            predRightValue: document.getElementById('pred-right-value'),
            predRotateValue: document.getElementById('pred-rotate-value'),
            predDropValue: document.getElementById('pred-drop-value'),
            
            // Puzzle Panel
            puzzlePanel: document.getElementById('puzzle-panel'),
            targetHash: document.getElementById('target-hash'),
            currentPiece: document.getElementById('current-piece'),
            puzzleStatus: document.getElementById('puzzle-status'),
            checkSolution: document.getElementById('check-solution'),
            
            // Controls
            pauseBtn: document.getElementById('pause-btn'),
            restartBtn: document.getElementById('restart-btn'),
            
            // Modals
            settingsModal: document.getElementById('settings-modal'),
            gameOverModal: document.getElementById('game-over-modal'),
            settingsClose: document.getElementById('settings-close'),
            
            // Toast Container
            toastContainer: document.getElementById('toast-container')
        };
        
        // Update loading progress
        this.updateLoadingProgress(20);
    }
    
    async setupEventListeners() {
        // Navigation Events
        this.elements.themeToggle?.addEventListener('click', () => this.toggleTheme());
        this.elements.settingsToggle?.addEventListener('click', () => this.showSettings());
        this.elements.fullscreenToggle?.addEventListener('click', () => this.toggleFullscreen());
        
        // Hero Section Events
        this.elements.startGameBtn?.addEventListener('click', () => this.showModeSelection());
        this.elements.learnMoreBtn?.addEventListener('click', () => this.showLearnMore());
        
        // Mode Selection Events
        this.elements.modeCards?.forEach(card => {
            card.addEventListener('click', () => {
                const mode = card.dataset.mode;
                this.selectMode(mode);
            });
        });
        
        // Game Controls
        this.elements.pauseBtn?.addEventListener('click', () => this.togglePause());
        this.elements.restartBtn?.addEventListener('click', () => this.restartGame());
        
        // AI Controls
        this.elements.aiToggle?.addEventListener('click', () => this.toggleAI());
        
        // Puzzle Controls
        this.elements.checkSolution?.addEventListener('click', () => this.checkPuzzleSolution());
        
        // Modal Events
        this.elements.settingsClose?.addEventListener('click', () => this.hideSettings());
        
        // Keyboard Events
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Touch Events for Mobile
        this.setupTouchControls();
        
        // Window Events
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('beforeunload', () => this.saveGameData());
        
        // Visibility API for pause when tab is hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isRunning) {
                this.pauseGame();
            }
        });
        
        this.updateLoadingProgress(40);
    }
    
    async initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create audio nodes
            this.masterGain = this.audioContext.createGain();
            this.soundGain = this.audioContext.createGain();
            this.musicGain = this.audioContext.createGain();
            
            this.masterGain.connect(this.audioContext.destination);
            this.soundGain.connect(this.masterGain);
            this.musicGain.connect(this.masterGain);
            
            // Set initial volumes
            this.updateAudioVolumes();
            
            console.log('🔊 Audio system initialized');
            this.updateLoadingProgress(60);
            
        } catch (error) {
            console.warn('⚠️ Audio initialization failed:', error);
            this.soundEnabled = false;
            this.musicEnabled = false;
        }
    }
    
    async initializeTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        this.updateThemeIcon();
        this.updateLoadingProgress(80);
    }
    
    async initializeAI() {
        // Placeholder for TensorFlow.js initialization
        if (typeof tf !== 'undefined') {
            try {
                this.aiModel = await this.buildAIModel();
                console.log('🤖 AI system initialized');
            } catch (error) {
                console.warn('⚠️ AI initialization failed:', error);
            }
        } else {
            console.warn('⚠️ TensorFlow.js not available');
        }
        this.updateLoadingProgress(90);
    }
    
    async loadGameData() {
        try {
            // Load saved game data
            const savedData = localStorage.getItem('tetrohash-save');
            if (savedData) {
                const data = JSON.parse(savedData);
                this.gameStats = { ...this.gameStats, ...data.stats };
                this.walletBalance = data.walletBalance || 0;
            }
            
            this.updateGameStats();
            this.updateLoadingProgress(100);
            
        } catch (error) {
            console.warn('⚠️ Failed to load game data:', error);
        }
    }
    
    // Loading System
    updateLoadingProgress(percent) {
        if (this.elements.progressBar) {
            this.elements.progressBar.style.width = `${percent}%`;
        }
        
        const messages = [
            'Initializing...',
            'Loading assets...',
            'Setting up audio...',
            'Initializing AI...',
            'Loading game data...',
            'Ready!'
        ];
        
        const messageIndex = Math.floor(percent / 20);
        if (this.elements.loadingStatus && messages[messageIndex]) {
            this.elements.loadingStatus.textContent = messages[messageIndex];
        }
    }
    
    hideLoading() {
        if (this.elements.loadingScreen) {
            this.elements.loadingScreen.classList.add('hidden');
            setTimeout(() => {
                this.elements.loadingScreen.style.display = 'none';
            }, 500);
        }
    }
    
    // Theme System
    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', this.theme);
        this.updateThemeIcon();
        this.storeTheme();
        this.showToast(`Switched to ${this.theme} theme`, 'info');
    }
    
    updateThemeIcon() {
        const icon = this.elements.themeToggle?.querySelector('.theme-icon');
        if (icon) {
            icon.style.transform = this.theme === 'dark' ? 'rotate(180deg)' : 'rotate(0deg)';
        }
    }
    
    getStoredTheme() {
        return localStorage.getItem('tetrohash-theme');
    }
    
    storeTheme() {
        localStorage.setItem('tetrohash-theme', this.theme);
    }
    
    // Settings System
    getStoredSettings() {
        const defaultSettings = {
            soundEnabled: true,
            musicEnabled: false,
            soundVolume: 80,
            musicVolume: 50,
            gameSpeed: 5,
            aiDifficulty: 5,
            animations: true
        };
        
        try {
            const stored = localStorage.getItem('tetrohash-settings');
            return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
        } catch {
            return defaultSettings;
        }
    }
    
    storeSettings() {
        localStorage.setItem('tetrohash-settings', JSON.stringify(this.settings));
    }
    
    showSettings() {
        if (this.elements.settingsModal) {
            this.elements.settingsModal.classList.add('active');
            this.populateSettingsForm();
        }
    }
    
    hideSettings() {
        if (this.elements.settingsModal) {
            this.elements.settingsModal.classList.remove('active');
        }
    }
    
    populateSettingsForm() {
        // Populate settings form with current values
        const soundVolume = document.getElementById('sound-volume');
        const musicVolume = document.getElementById('music-volume');
        const gameSpeed = document.getElementById('game-speed');
        const aiDifficulty = document.getElementById('ai-difficulty');
        const themeSelect = document.getElementById('theme-select');
        const animationsToggle = document.getElementById('animations-toggle');
        
        if (soundVolume) {
            soundVolume.value = this.settings.soundVolume;
            soundVolume.addEventListener('input', (e) => {
                this.settings.soundVolume = e.target.value;
                this.updateAudioVolumes();
                document.getElementById('sound-volume-value').textContent = `${e.target.value}%`;
            });
        }
        
        if (musicVolume) {
            musicVolume.value = this.settings.musicVolume;
            musicVolume.addEventListener('input', (e) => {
                this.settings.musicVolume = e.target.value;
                this.updateAudioVolumes();
                document.getElementById('music-volume-value').textContent = `${e.target.value}%`;
            });
        }
        
        if (gameSpeed) {
            gameSpeed.value = this.settings.gameSpeed;
            gameSpeed.addEventListener('input', (e) => {
                this.settings.gameSpeed = e.target.value;
                document.getElementById('game-speed-value').textContent = e.target.value;
            });
        }
        
        if (aiDifficulty) {
            aiDifficulty.value = this.settings.aiDifficulty;
            aiDifficulty.addEventListener('input', (e) => {
                this.settings.aiDifficulty = e.target.value;
                document.getElementById('ai-difficulty-value').textContent = e.target.value;
            });
        }
        
        if (themeSelect) {
            themeSelect.value = this.theme;
            themeSelect.addEventListener('change', (e) => {
                this.theme = e.target.value;
                document.documentElement.setAttribute('data-theme', this.theme);
                this.storeTheme();
            });
        }
        
        if (animationsToggle) {
            animationsToggle.checked = this.settings.animations;
            animationsToggle.addEventListener('change', (e) => {
                this.settings.animations = e.target.checked;
                document.body.style.animationPlayState = e.target.checked ? 'running' : 'paused';
            });
        }
    }
    
    // Audio System
    updateAudioVolumes() {
        if (this.audioContext) {
            this.soundGain.gain.value = (this.soundVolume / 100) * (this.soundEnabled ? 1 : 0);
            this.musicGain.gain.value = (this.musicVolume / 100) * (this.musicEnabled ? 1 : 0);
        }
    }
    
    playSound(frequency, duration = 0.1, type = 'sine') {
        if (!this.audioContext || !this.soundEnabled) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.soundGain);
            
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
            
        } catch (error) {
            console.warn('Audio playback failed:', error);
        }
    }
    
    // Game Stats System
    getStoredStats() {
        const defaultStats = {
            totalGames: 0,
            totalSats: 0,
            highScore: 0,
            totalPlayTime: 0,
            linesCleared: 0,
            puzzlesSolved: 0
        };
        
        try {
            const stored = localStorage.getItem('tetrohash-stats');
            return stored ? { ...defaultStats, ...JSON.parse(stored) } : defaultStats;
        } catch {
            return defaultStats;
        }
    }
    
    storeStats() {
        localStorage.setItem('tetrohash-stats', JSON.stringify(this.gameStats));
    }
    
    updateGameStats() {
        // Update hero section stats
        const totalGames = document.getElementById('total-games');
        const totalSats = document.getElementById('total-sats');
        const highScore = document.getElementById('high-score');
        
        if (totalGames) totalGames.textContent = this.gameStats.totalGames.toLocaleString();
        if (totalSats) totalSats.textContent = this.gameStats.totalSats.toLocaleString();
        if (highScore) highScore.textContent = this.gameStats.highScore.toLocaleString();
    }
    
    // Wallet System
    getStoredWalletBalance() {
        try {
            return parseInt(localStorage.getItem('tetrohash-wallet') || '0');
        } catch {
            return 0;
        }
    }
    
    storeWalletBalance() {
        localStorage.setItem('tetrohash-wallet', this.walletBalance.toString());
    }
    
    addSats(amount) {
        this.walletBalance += amount;
        this.gameStats.totalSats += amount;
        this.updateWalletDisplay();
        this.storeWalletBalance();
        this.storeStats();
        this.showSATReward(amount);
    }
    
    updateWalletDisplay() {
        if (this.elements.walletBalance) {
            this.elements.walletBalance.textContent = this.walletBalance.toLocaleString();
        }
        if (this.elements.totalEarned) {
            this.elements.totalEarned.textContent = this.gameStats.totalSats.toLocaleString();
        }
    }
    
    // UI Management
    showHeroSection() {
        if (this.elements.heroSection) {
            this.elements.heroSection.style.display = 'block';
        }
        if (this.elements.modeSelection) {
            this.elements.modeSelection.style.display = 'none';
        }
        if (this.elements.gameArea) {
            this.elements.gameArea.style.display = 'none';
        }
    }
    
    showModeSelection() {
        if (this.elements.heroSection) {
            this.elements.heroSection.style.display = 'none';
        }
        if (this.elements.modeSelection) {
            this.elements.modeSelection.style.display = 'block';
        }
        if (this.elements.gameArea) {
            this.elements.gameArea.style.display = 'none';
        }
    }
    
    showGameArea() {
        if (this.elements.heroSection) {
            this.elements.heroSection.style.display = 'none';
        }
        if (this.elements.modeSelection) {
            this.elements.modeSelection.style.display = 'none';
        }
        if (this.elements.gameArea) {
            this.elements.gameArea.style.display = 'block';
            this.elements.gameArea.classList.add('active');
        }
    }
    
    selectMode(mode) {
        this.gameMode = mode;
        this.showGameArea();
        this.startGame();
        this.showToast(`Starting ${mode} mode`, 'info');
    }
    
    // Game Logic (Simplified for demo)
    createEmptyGrid() {
        return Array(this.HEIGHT).fill().map(() => Array(this.WIDTH).fill(0));
    }
    
    startGame() {
        this.gameOver = false;
        this.isPaused = false;
        this.isRunning = true;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameStartTime = Date.now();
        
        this.spawnPiece();
        this.updateDisplay();
        this.startGameLoop();
        
        this.gameStats.totalGames++;
        this.storeStats();
        this.updateGameStats();
    }
    
    spawnPiece() {
        this.currentPiece = this.getRandomPiece();
        this.nextPiece = this.getRandomPiece();
        this.pieceX = Math.floor(this.WIDTH / 2) - 1;
        this.pieceY = 0;
        
        // Check if game over
        if (this.collision(0, 0)) {
            this.gameOver = true;
            this.endGame();
            return;
        }
        
        // Reset drop timer for new piece
        this.lastDropTime = 0;
    }
    
    getRandomPiece() {
        const name = this.pieceNames[Math.floor(Math.random() * this.pieceNames.length)];
        return { ...this.TETROMINOS[name], name };
    }
    
    collision(dx, dy) {
        for (let i = 0; i < this.currentPiece.shape.length; i++) {
            const [x, y] = this.currentPiece.shape[i];
            const newX = this.pieceX + x + dx;
            const newY = this.pieceY + y + dy;
            
            if (newX < 0 || newX >= this.WIDTH || newY >= this.HEIGHT) {
                return true;
            }
            
            if (newY >= 0 && this.grid[newY][newX]) {
                return true;
            }
        }
        return false;
    }
    
    move(dx) {
        if (!this.collision(dx, 0)) {
            this.pieceX += dx;
            this.playSound(200, 0.05);
            return true;
        }
        return false;
    }
    
    rotate() {
        const rotated = this.rotatePiece(this.currentPiece.shape);
        if (!this.collision(0, 0, rotated)) {
            this.currentPiece.shape = rotated;
            this.playSound(300, 0.1);
            return true;
        }
        return false;
    }
    
    rotatePiece(shape) {
        return shape.map(([x, y]) => [-y, x]);
    }
    
    drop() {
        if (!this.collision(0, 1)) {
            this.pieceY++;
            return true;
        } else {
            this.lockPiece();
            return false;
        }
    }
    
    hardDrop() {
        while (!this.collision(0, 1)) {
            this.pieceY++;
        }
        this.lockPiece();
    }
    
    lockPiece() {
        for (let i = 0; i < this.currentPiece.shape.length; i++) {
            const [x, y] = this.currentPiece.shape[i];
            const gridX = this.pieceX + x;
            const gridY = this.pieceY + y;
            
            if (gridY >= 0) {
                this.grid[gridY][gridX] = this.currentPiece.color;
            }
        }
        
        this.clearLines();
        this.spawnPiece();
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.HEIGHT - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell !== 0)) {
                this.grid.splice(y, 1);
                this.grid.unshift(Array(this.WIDTH).fill(0));
                linesCleared++;
                y++; // Check the same line again
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += linesCleared * 100 * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
            
            // Award SATs
            const satsEarned = linesCleared * 10 * this.level;
            this.addSats(satsEarned);
            
            this.playSound(400, 0.2);
            this.showToast(`+${satsEarned} SATs for ${linesCleared} lines!`, 'success');
        }
    }
    
    // Game Loop
    startGameLoop() {
        this.lastUpdate = performance.now();
        this.lastDropTime = 0;
        this.gameLoop();
    }
    
    gameLoop(currentTime = 0) {
        if (!this.isRunning || this.gameOver) {
            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
                this.animationFrame = null;
            }
            return;
        }
        
        const deltaTime = currentTime - this.lastUpdate;
        this.lastUpdate = currentTime;
        
        if (!this.isPaused) {
            this.update(deltaTime);
            this.render();
        }
        
        this.animationFrame = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        // Update game time
        const gameTime = Math.floor((Date.now() - this.gameStartTime) / 1000);
        if (this.elements.gameTime) {
            const minutes = Math.floor(gameTime / 60);
            const seconds = gameTime % 60;
            this.elements.gameTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // Auto-drop pieces - accumulate time for proper timing
        if (!this.lastDropTime) this.lastDropTime = 0;
        this.lastDropTime += deltaTime;
        
        const dropInterval = Math.max(500, 1000 - (this.level * 50)); // Start at 1 second, decrease with level
        if (this.lastDropTime >= dropInterval) {
            this.drop();
            this.lastDropTime = 0; // Reset timer
        }
        
        // Update AI predictions
        if (this.aiEnabled && this.aiModel) {
            this.updateAIPredictions();
        }
    }
    
    render() {
        this.renderGameBoard();
        this.renderNextPiece();
        this.updateDisplay();
    }
    
    renderGameBoard() {
        if (!this.elements.gameBoard) return;
        
        // Clear board
        this.elements.gameBoard.innerHTML = '';
        
        // Create cells
        for (let y = 0; y < this.HEIGHT; y++) {
            for (let x = 0; x < this.WIDTH; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                
                // Check if cell is filled
                if (this.grid[y][x]) {
                    cell.classList.add('filled');
                    cell.style.backgroundColor = this.grid[y][x];
                }
                
                // Check if cell is part of current piece
                if (this.currentPiece && this.isCurrentPieceCell(x, y)) {
                    cell.classList.add('current-piece');
                    cell.style.backgroundColor = this.currentPiece.color;
                }
                
                this.elements.gameBoard.appendChild(cell);
            }
        }
    }
    
    isCurrentPieceCell(x, y) {
        if (!this.currentPiece) return false;
        
        for (let i = 0; i < this.currentPiece.shape.length; i++) {
            const [px, py] = this.currentPiece.shape[i];
            if (this.pieceX + px === x && this.pieceY + py === y) {
                return true;
            }
        }
        return false;
    }
    
    renderNextPiece() {
        if (!this.elements.nextPiece || !this.nextPiece) return;
        
        this.elements.nextPiece.innerHTML = '';
        
        // Create a 4x4 grid for next piece preview
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                const cell = document.createElement('div');
                cell.className = 'next-piece-cell';
                
                // Check if this cell should be filled
                const isFilled = this.nextPiece.shape.some(([px, py]) => px === x && py === y);
                if (isFilled) {
                    cell.classList.add('filled');
                    cell.style.backgroundColor = this.nextPiece.color;
                }
                
                this.elements.nextPiece.appendChild(cell);
            }
        }
    }
    
    updateDisplay() {
        if (this.elements.score) this.elements.score.textContent = this.score.toLocaleString();
        if (this.elements.lines) this.elements.lines.textContent = this.lines;
        if (this.elements.level) this.elements.level.textContent = this.level;
        if (this.elements.earnedThisGame) {
            this.elements.earnedThisGame.textContent = (this.walletBalance - this.getStoredWalletBalance()).toLocaleString();
        }
    }
    
    // Input Handling
    handleKeyPress(event) {
        if (!this.isRunning || this.gameOver) return;
        
        switch (event.code) {
            case 'ArrowLeft':
                event.preventDefault();
                this.move(-1);
                break;
            case 'ArrowRight':
                event.preventDefault();
                this.move(1);
                break;
            case 'ArrowDown':
                event.preventDefault();
                this.drop();
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.rotate();
                break;
            case 'Space':
                event.preventDefault();
                this.hardDrop();
                break;
            case 'KeyP':
                event.preventDefault();
                this.togglePause();
                break;
            case 'KeyR':
                event.preventDefault();
                this.restartGame();
                break;
        }
    }
    
    setupTouchControls() {
        // Add touch controls for mobile devices
        let touchStartX = 0;
        let touchStartY = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (deltaX > 50) {
                    this.move(1); // Right
                } else if (deltaX < -50) {
                    this.move(-1); // Left
                }
            } else {
                // Vertical swipe
                if (deltaY > 50) {
                    this.drop(); // Down
                } else if (deltaY < -50) {
                    this.rotate(); // Up
                }
            }
        });
    }
    
    // Game Control Methods
    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseBtn = this.elements.pauseBtn;
        if (pauseBtn) {
            const icon = pauseBtn.querySelector('svg');
            if (icon) {
                if (this.isPaused) {
                    icon.innerHTML = '<path d="M8 5v14l11-7z"/>';
                } else {
                    icon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
                }
            }
        }
        
        this.showToast(this.isPaused ? 'Game Paused' : 'Game Resumed', 'info');
    }
    
    restartGame() {
        this.isRunning = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        this.grid = this.createEmptyGrid();
        this.startGame();
        this.showToast('Game Restarted', 'info');
    }
    
    endGame() {
        this.isRunning = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        // Update high score
        if (this.score > this.gameStats.highScore) {
            this.gameStats.highScore = this.score;
            this.showToast('New High Score!', 'success');
        }
        
        this.showGameOverModal();
        this.storeStats();
    }
    
    showGameOverModal() {
        if (this.elements.gameOverModal) {
            // Update final stats
            const finalScore = document.getElementById('final-score');
            const finalLines = document.getElementById('final-lines');
            const finalSats = document.getElementById('final-sats');
            const finalTime = document.getElementById('final-time');
            
            if (finalScore) finalScore.textContent = this.score.toLocaleString();
            if (finalLines) finalLines.textContent = this.lines;
            if (finalSats) finalSats.textContent = (this.walletBalance - this.getStoredWalletBalance()).toLocaleString();
            if (finalTime) {
                const gameTime = Math.floor((Date.now() - this.gameStartTime) / 1000);
                const minutes = Math.floor(gameTime / 60);
                const seconds = gameTime % 60;
                finalTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
            
            this.elements.gameOverModal.classList.add('active');
        }
    }
    
    // AI System (Simplified)
    async buildAIModel() {
        // Placeholder for TensorFlow.js model
        return {
            predict: () => ({ left: 0.25, right: 0.25, rotate: 0.25, drop: 0.25 })
        };
    }
    
    updateAIPredictions() {
        if (!this.aiModel) return;
        
        const predictions = this.aiModel.predict();
        this.aiPredictions = predictions;
        
        // Update UI
        this.updatePredictionBar('pred-left', predictions.left);
        this.updatePredictionBar('pred-right', predictions.right);
        this.updatePredictionBar('pred-rotate', predictions.rotate);
        this.updatePredictionBar('pred-drop', predictions.drop);
    }
    
    updatePredictionBar(id, value) {
        const bar = document.getElementById(id);
        const valueText = document.getElementById(`${id}-value`);
        
        if (bar) {
            bar.style.width = `${value * 100}%`;
        }
        if (valueText) {
            valueText.textContent = `${Math.round(value * 100)}%`;
        }
    }
    
    toggleAI() {
        this.aiEnabled = !this.aiEnabled;
        const toggle = this.elements.aiToggle;
        if (toggle) {
            toggle.classList.toggle('active', this.aiEnabled);
        }
        
        this.showToast(`AI ${this.aiEnabled ? 'Enabled' : 'Disabled'}`, 'info');
    }
    
    // Bitcoin Puzzle System (Simplified)
    checkPuzzleSolution() {
        if (!this.puzzleActive) return;
        
        // Simplified puzzle check
        const isCorrect = Math.random() > 0.5; // Placeholder logic
        
        if (isCorrect) {
            const reward = 100;
            this.addSats(reward);
            this.showToast(`Puzzle solved! +${reward} SATs`, 'success');
            this.generateNewPuzzle();
        } else {
            this.showToast('Incorrect solution', 'error');
        }
    }
    
    generateNewPuzzle() {
        // Generate a new puzzle
        this.targetHash = this.generateRandomHash();
        if (this.elements.targetHash) {
            this.elements.targetHash.textContent = this.targetHash;
        }
    }
    
    generateRandomHash() {
        const chars = '0123456789abcdef';
        let hash = '';
        for (let i = 0; i < 64; i++) {
            hash += chars[Math.floor(Math.random() * chars.length)];
        }
        return hash;
    }
    
    // Utility Methods
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        if (this.elements.toastContainer) {
            this.elements.toastContainer.appendChild(toast);
            
            // Show toast
            setTimeout(() => toast.classList.add('show'), 100);
            
            // Remove toast after 3 seconds
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }, 3000);
        }
    }
    
    showSATReward(amount) {
        // Create floating SAT reward animation
        const reward = document.createElement('div');
        reward.className = 'sat-reward';
        reward.textContent = `+${amount} SATs`;
        reward.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(45deg, #ffd700, #ff6b35);
            color: #000;
            padding: 10px 20px;
            border-radius: 25px;
            font-weight: bold;
            font-size: 1.2rem;
            z-index: 10000;
            animation: bounce 1s ease-out forwards;
        `;
        
        document.body.appendChild(reward);
        
        setTimeout(() => {
            reward.remove();
        }, 2000);
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
    
    handleResize() {
        // Handle window resize
        this.render();
    }
    
    startBackgroundAnimations() {
        // Start background particle animations
        this.createParticles();
    }
    
    createParticles() {
        const particlesContainer = document.getElementById('particles');
        if (!particlesContainer) return;
        
        // Create floating particles
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: 2px;
                height: 2px;
                background: rgba(255, 215, 0, 0.5);
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: float ${10 + Math.random() * 20}s linear infinite;
            `;
            particlesContainer.appendChild(particle);
        }
    }
    
    showLearnMore() {
        this.showToast('Learn more feature coming soon!', 'info');
    }
    
    // Data Persistence
    saveGameData() {
        const saveData = {
            stats: this.gameStats,
            walletBalance: this.walletBalance,
            settings: this.settings,
            theme: this.theme
        };
        
        localStorage.setItem('tetrohash-save', JSON.stringify(saveData));
    }
}

// Initialize the modern engine when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.modernGame = new ModernTetroHashEngine();
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

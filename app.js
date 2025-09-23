// TetroHashUnlock v2.0 - Main Application
// Author: Giancarlo Vizhnay

class TetroHashApp {
    constructor() {
        this.gameUI = null;
        this.isInitialized = false;
        
        this.init();
    }
    
    async init() {
        console.log('🎮 Initializing TetroHashUnlock v2.0...');
        
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initializeApp());
            } else {
                this.initializeApp();
            }
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to initialize the game. Please refresh the page.');
        }
    }
    
    initializeApp() {
        console.log('🚀 Starting TetroHashUnlock application...');
        
        // Wait a bit for DOM to be fully ready
        setTimeout(() => {
            // Initialize UI
            this.gameUI = window.gameUI;
            
            if (!this.gameUI) {
                console.error('GameUI not found!');
                return;
            }
            
            // Add app-specific features
            this.setupAppFeatures();
            
            // Show welcome message
            this.showWelcomeMessage();
            
            this.isInitialized = true;
            console.log('✅ TetroHashUnlock initialized successfully!');
        }, 100);
    }
    
    setupAppFeatures() {
        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Global shortcuts
            if (e.key === 'Escape' && this.gameUI.elements.gameOverModal.classList.contains('hidden')) {
                this.gameUI.showModeSelection();
            }
        });
        
        // Add touch controls for mobile
        this.setupTouchControls();
        
        // Add sound effects (if available)
        this.setupSoundEffects();
        
        // Add performance monitoring
        this.setupPerformanceMonitoring();
    }
    
    setupTouchControls() {
        // Add touch controls for mobile devices
        if ('ontouchstart' in window) {
            this.addTouchControls();
        }
    }
    
    addTouchControls() {
        const touchControls = document.createElement('div');
        touchControls.className = 'touch-controls';
        touchControls.innerHTML = `
            <div class="touch-controls-panel">
                <button class="touch-btn" data-action="left">←</button>
                <button class="touch-btn" data-action="rotate">↻</button>
                <button class="touch-btn" data-action="right">→</button>
                <button class="touch-btn" data-action="drop">↓</button>
            </div>
        `;
        
        // Add styles for touch controls
        const style = document.createElement('style');
        style.textContent = `
            .touch-controls {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 100;
                display: none;
            }
            
            .touch-controls-panel {
                display: flex;
                gap: 10px;
                background: rgba(0, 0, 0, 0.8);
                padding: 15px;
                border-radius: 10px;
                backdrop-filter: blur(10px);
            }
            
            .touch-btn {
                width: 50px;
                height: 50px;
                border: none;
                border-radius: 50%;
                background: #ffd700;
                color: #000;
                font-size: 1.5rem;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .touch-btn:active {
                transform: scale(0.9);
                background: #ffed4e;
            }
            
            @media (max-width: 768px) {
                .touch-controls {
                    display: block;
                }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(touchControls);
        
        // Add event listeners for touch controls
        touchControls.addEventListener('click', (e) => {
            if (e.target.classList.contains('touch-btn')) {
                const action = e.target.dataset.action;
                this.handleTouchAction(action);
            }
        });
    }
    
    handleTouchAction(action) {
        if (!this.gameUI.game || !this.gameUI.isRunning) return;
        
        switch (action) {
            case 'left':
                this.gameUI.game.move(-1);
                break;
            case 'right':
                this.gameUI.game.move(1);
                break;
            case 'rotate':
                this.gameUI.game.rotate();
                break;
            case 'drop':
                this.gameUI.game.hardDrop();
                break;
        }
    }
    
    setupSoundEffects() {
        // Simple sound effects using Web Audio API
        this.audioContext = null;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.log('Web Audio API not supported');
        }
    }
    
    playSound(frequency, duration) {
        if (!this.audioContext) return;
        
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
    
    setupPerformanceMonitoring() {
        // Monitor performance and adjust game speed if needed
        let frameCount = 0;
        let lastTime = performance.now();
        
        const monitor = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                
                if (fps < 30) {
                    console.warn(`Low FPS detected: ${fps}`);
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(monitor);
        };
        
        requestAnimationFrame(monitor);
    }
    
    showWelcomeMessage() {
        // Show a welcome message with game info
        const welcome = document.createElement('div');
        welcome.className = 'welcome-message';
        welcome.innerHTML = `
            <div class="welcome-content">
                <h2>🎉 Welcome to TetroHashUnlock!</h2>
                <p>Experience the world's first Bitcoin Tetris game!</p>
                <ul>
                    <li>🧱 Classic Tetris gameplay</li>
                    <li>🔐 Solve SHA-256 puzzles</li>
                    <li>💰 Earn real SAT rewards</li>
                    <li>⚡ Lightning Network integration</li>
                </ul>
                <button class="btn btn-primary" onclick="this.parentElement.parentElement.remove()">Let's Play!</button>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .welcome-message {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 2000;
                backdrop-filter: blur(5px);
            }
            
            .welcome-content {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 2px solid #ffd700;
                border-radius: 15px;
                padding: 40px;
                text-align: center;
                max-width: 500px;
                width: 90%;
            }
            
            .welcome-content h2 {
                color: #ffd700;
                margin-bottom: 20px;
                font-family: 'Orbitron', monospace;
            }
            
            .welcome-content p {
                color: #ccc;
                margin-bottom: 20px;
                font-size: 1.1rem;
            }
            
            .welcome-content ul {
                text-align: left;
                color: #ccc;
                margin-bottom: 30px;
            }
            
            .welcome-content li {
                margin-bottom: 10px;
                padding-left: 10px;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(welcome);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (welcome.parentElement) {
                welcome.remove();
            }
        }, 5000);
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
        
        // Add styles
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
}

// Initialize the application
const app = new TetroHashApp();

// Export for global access
window.TetroHashApp = TetroHashApp;

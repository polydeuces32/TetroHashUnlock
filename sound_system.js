// TetroHashUnlock v2.0 — Sound Effects System
// Author: Giancarlo Vizhnay

class SoundSystem {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.masterVolume = 0.3;
        this.enabled = true;
        
        this.init();
    }
    
    init() {
        try {
            // Initialize Web Audio API
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🔊 Sound system initialized');
        } catch (error) {
            console.warn('Audio not supported:', error);
            this.enabled = false;
        }
    }
    
    // Generate sound using Web Audio API
    createSound(frequency, duration, type = 'sine', volume = 0.1) {
        if (!this.enabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume * this.masterVolume, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    // Tetris-specific sound effects
    playPieceMove() {
        this.createSound(220, 0.1, 'square', 0.1);
    }
    
    playPieceRotate() {
        this.createSound(330, 0.15, 'sawtooth', 0.12);
    }
    
    playPieceDrop() {
        this.createSound(110, 0.2, 'triangle', 0.15);
    }
    
    playLineClear(lines) {
        // Ascending chord for line clear
        const frequencies = [261.63, 329.63, 392.00, 523.25]; // C, E, G, C
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.createSound(freq, 0.3, 'sine', 0.2);
            }, index * 50);
        });
    }
    
    playTetris() {
        // Special sound for 4-line clear (Tetris)
        const tetrisMelody = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, C (octave)
        tetrisMelody.forEach((freq, index) => {
            setTimeout(() => {
                this.createSound(freq, 0.4, 'sine', 0.25);
            }, index * 100);
        });
    }
    
    playPuzzleSolved() {
        // Victory sound for puzzle solving
        const victoryMelody = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C, E, G, C, E
        victoryMelody.forEach((freq, index) => {
            setTimeout(() => {
                this.createSound(freq, 0.3, 'sine', 0.2);
            }, index * 80);
        });
    }
    
    playCoinReward() {
        // Coin collection sound
        this.createSound(800, 0.2, 'sine', 0.15);
        setTimeout(() => this.createSound(1000, 0.2, 'sine', 0.15), 100);
        setTimeout(() => this.createSound(1200, 0.3, 'sine', 0.15), 200);
    }
    
    playCoinDrop() {
        // Single coin drop sound for line clears
        this.createSound(600, 0.15, 'sine', 0.12);
        setTimeout(() => this.createSound(800, 0.15, 'sine', 0.12), 50);
    }
    
    playCoinCascade(lines) {
        // Multiple coin sounds for multiple line clears
        for (let i = 0; i < lines; i++) {
            setTimeout(() => {
                this.playCoinDrop();
            }, i * 100);
        }
    }
    
    playSATEarned(sats) {
        // Special sound for SAT rewards
        if (sats === 1) {
            this.playCoinDrop();
        } else if (sats <= 3) {
            this.playCoinCascade(sats);
        } else {
            // Big reward sound
            this.playCoinReward();
        }
    }
    
    playGameOver() {
        // Descending sound for game over
        const gameOverMelody = [523.25, 466.16, 415.30, 369.99, 329.63]; // C, A#, G#, F#, E
        gameOverMelody.forEach((freq, index) => {
            setTimeout(() => {
                this.createSound(freq, 0.4, 'sawtooth', 0.2);
            }, index * 150);
        });
    }
    
    playLevelUp() {
        // Level up fanfare
        const levelUpMelody = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C, E, G, C, E, G
        levelUpMelody.forEach((freq, index) => {
            setTimeout(() => {
                this.createSound(freq, 0.2, 'sine', 0.15);
            }, index * 60);
        });
    }
    
    playError() {
        // Error sound
        this.createSound(150, 0.3, 'sawtooth', 0.1);
        setTimeout(() => this.createSound(100, 0.3, 'sawtooth', 0.1), 150);
    }
    
    playSuccess() {
        // Success sound
        this.createSound(440, 0.2, 'sine', 0.15);
        setTimeout(() => this.createSound(554.37, 0.2, 'sine', 0.15), 100);
        setTimeout(() => this.createSound(659.25, 0.3, 'sine', 0.15), 200);
    }
    
    // Background music (simple loop)
    playBackgroundMusic() {
        if (!this.enabled || !this.audioContext) return;
        
        const melody = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25]; // C major scale
        let noteIndex = 0;
        
        const playNote = () => {
            if (this.backgroundMusicPlaying) {
                this.createSound(melody[noteIndex], 0.5, 'sine', 0.05);
                noteIndex = (noteIndex + 1) % melody.length;
                setTimeout(playNote, 600);
            }
        };
        
        this.backgroundMusicPlaying = true;
        playNote();
    }
    
    stopBackgroundMusic() {
        this.backgroundMusicPlaying = false;
    }
    
    // Volume control
    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }
    
    toggleSound() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
    
    // Get sound status
    isEnabled() {
        return this.enabled;
    }
}

// Global sound system
window.soundSystem = new SoundSystem();

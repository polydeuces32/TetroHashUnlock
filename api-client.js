/**
 * TetroHashUnlock API Client
 * Handles communication with the backend API server
 */

class TetroHashAPI {
    constructor(baseURL = 'http://localhost:5000/api') {
        this.baseURL = baseURL;
        this.playerId = null;
        this.username = null;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Player Management
    async registerPlayer(username, walletAddress = '') {
        const data = await this.request('/player/register', {
            method: 'POST',
            body: JSON.stringify({ username, wallet_address: walletAddress })
        });
        
        this.playerId = data.player_id;
        this.username = data.username;
        
        // Store in localStorage
        localStorage.setItem('tetrohash_player_id', data.player_id);
        localStorage.setItem('tetrohash_username', data.username);
        
        return data;
    }

    async getPlayer(playerId = null) {
        const id = playerId || this.playerId;
        if (!id) throw new Error('No player ID available');
        
        return await this.request(`/player/${id}`);
    }

    // Game Management
    async submitGame(gameData) {
        if (!this.playerId) {
            throw new Error('Player not registered');
        }

        const data = await this.request('/game/submit', {
            method: 'POST',
            body: JSON.stringify({
                player_id: this.playerId,
                ...gameData
            })
        });

        return data;
    }

    // Leaderboards
    async getLeaderboard(gameMode) {
        return await this.request(`/leaderboard/${gameMode}`);
    }

    // Bitcoin Puzzles
    async generatePuzzle(difficulty = 1) {
        const data = await this.request('/bitcoin/puzzle/generate', {
            method: 'POST',
            body: JSON.stringify({ difficulty })
        });
        return data;
    }

    async solvePuzzle(puzzleId, preimage) {
        if (!this.playerId) {
            throw new Error('Player not registered');
        }

        const data = await this.request('/bitcoin/puzzle/solve', {
            method: 'POST',
            body: JSON.stringify({
                puzzle_id: puzzleId,
                preimage,
                player_id: this.playerId
            })
        });

        return data;
    }

    // Statistics
    async getGlobalStats() {
        return await this.request('/stats/global');
    }

    // Health Check
    async healthCheck() {
        return await this.request('/health');
    }

    // Initialize player from localStorage
    initializePlayer() {
        const playerId = localStorage.getItem('tetrohash_player_id');
        const username = localStorage.getItem('tetrohash_username');
        
        if (playerId && username) {
            this.playerId = parseInt(playerId);
            this.username = username;
            return true;
        }
        
        return false;
    }

    // Clear player data
    clearPlayer() {
        this.playerId = null;
        this.username = null;
        localStorage.removeItem('tetrohash_player_id');
        localStorage.removeItem('tetrohash_username');
    }
}

// Global API instance
window.tetroHashAPI = new TetroHashAPI();

// Auto-initialize if player data exists
if (window.tetroHashAPI.initializePlayer()) {
    console.log('🎮 Player initialized from localStorage:', window.tetroHashAPI.username);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TetroHashAPI;
}

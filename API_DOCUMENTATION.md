# 🚀 TetroHashUnlock API Documentation

## Overview

The TetroHashUnlock API provides a complete backend service for the Bitcoin Tetris game, including player management, game tracking, leaderboards, and Bitcoin puzzle integration.

**Base URL:** `http://localhost:5000/api`  
**Version:** 3.0.0

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm run api-install
```

### 2. Start API Server
```bash
npm run api
```

### 3. Test API
```bash
npm run test-api
```

### 4. Access Game with API
Visit: `http://localhost:5000/`

---

## 📋 API Endpoints

### Health Check
```http
GET /api/health
```
**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "3.0.0",
  "game_modes": ["normal", "puzzle", "ai-battle", "learning"]
}
```

### Player Management

#### Register Player
```http
POST /api/player/register
```
**Request Body:**
```json
{
  "username": "player123",
  "wallet_address": "bc1q..." // optional
}
```
**Response:**
```json
{
  "player_id": 1,
  "username": "player123",
  "wallet_address": "bc1q...",
  "total_sats": 0,
  "games_played": 0,
  "high_score": 0
}
```

#### Get Player Info
```http
GET /api/player/{player_id}
```
**Response:**
```json
{
  "player_id": 1,
  "username": "player123",
  "wallet_address": "bc1q...",
  "total_sats": 1500,
  "games_played": 25,
  "high_score": 50000,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Game Management

#### Submit Game Results
```http
POST /api/game/submit
```
**Request Body:**
```json
{
  "player_id": 1,
  "game_mode": "normal",
  "score": 25000,
  "lines_cleared": 15,
  "level_reached": 3,
  "sats_earned": 18,
  "duration_seconds": 300,
  "ai_enabled": false
}
```
**Response:**
```json
{
  "message": "Game submitted successfully",
  "sats_earned": 18,
  "new_total_sats": 1518
}
```

### Leaderboards

#### Get Leaderboard
```http
GET /api/leaderboard/{game_mode}
```
**Parameters:**
- `game_mode`: `normal`, `puzzle`, `ai-battle`, or `learning`

**Response:**
```json
{
  "game_mode": "normal",
  "leaderboard": [
    {
      "rank": 1,
      "username": "pro_player",
      "score": 100000,
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Bitcoin Puzzles

#### Generate Puzzle
```http
POST /api/bitcoin/puzzle/generate
```
**Request Body:**
```json
{
  "difficulty": 3
}
```
**Response:**
```json
{
  "puzzle_id": 1,
  "puzzle_hash": "a1b2c3d4e5f6...",
  "difficulty": 3,
  "sats_reward": 550
}
```

#### Solve Puzzle
```http
POST /api/bitcoin/puzzle/solve
```
**Request Body:**
```json
{
  "puzzle_id": 1,
  "preimage": "ABC123",
  "player_id": 1
}
```
**Response:**
```json
{
  "message": "Puzzle solved successfully!",
  "sats_reward": 550,
  "preimage": "ABC123"
}
```

### Statistics

#### Global Stats
```http
GET /api/stats/global
```
**Response:**
```json
{
  "total_players": 150,
  "total_games": 2500,
  "total_sats_earned": 50000,
  "puzzles_solved": 75,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 🎮 Frontend Integration

### Using the API Client

Include the API client in your HTML:
```html
<script src="api-client.js"></script>
```

### Basic Usage

```javascript
// Initialize API
const api = window.tetroHashAPI;

// Register a new player
const player = await api.registerPlayer('myusername');

// Submit game results
await api.submitGame({
  game_mode: 'normal',
  score: 25000,
  lines_cleared: 15,
  level_reached: 3,
  sats_earned: 18,
  duration_seconds: 300,
  ai_enabled: false
});

// Get leaderboard
const leaderboard = await api.getLeaderboard('normal');

// Generate Bitcoin puzzle
const puzzle = await api.generatePuzzle(2);

// Solve puzzle
const result = await api.solvePuzzle(puzzle.puzzle_id, 'ABC123');
```

### Error Handling

```javascript
try {
  const result = await api.submitGame(gameData);
  console.log('Game submitted:', result);
} catch (error) {
  console.error('API Error:', error.message);
  // Handle error appropriately
}
```

---

## 🗄️ Database Schema

### Players Table
- `id` - Primary key
- `username` - Unique player name
- `wallet_address` - Bitcoin wallet (optional)
- `total_sats` - Total SATs earned
- `games_played` - Number of games played
- `high_score` - Highest score achieved
- `created_at` - Registration timestamp

### Games Table
- `id` - Primary key
- `player_id` - Foreign key to players
- `game_mode` - Game mode played
- `score` - Final score
- `lines_cleared` - Lines cleared
- `level_reached` - Highest level reached
- `sats_earned` - SATs earned in this game
- `duration_seconds` - Game duration
- `ai_enabled` - Whether AI was enabled
- `created_at` - Game timestamp

### Leaderboards Table
- `id` - Primary key
- `game_mode` - Game mode
- `player_id` - Foreign key to players
- `score` - Score for ranking
- `rank` - Current rank
- `updated_at` - Last update timestamp

### Bitcoin Puzzles Table
- `id` - Primary key
- `puzzle_hash` - SHA-256 hash
- `preimage` - Solution string
- `difficulty` - Puzzle difficulty (1-10)
- `sats_reward` - SATs reward
- `solved_by` - Player who solved it
- `solved_at` - Solution timestamp
- `created_at` - Creation timestamp

---

## 🔧 Configuration

### Environment Variables
- `FLASK_ENV` - Set to `production` for production
- `DATABASE_URL` - Custom database URL (default: `tetrohash.db`)

### CORS Settings
The API is configured with CORS enabled for all origins. For production, configure specific origins in `server.py`.

---

## 🚀 Deployment

### Local Development
```bash
npm run api-start
```

### Production Deployment
1. Install dependencies: `pip install -r requirements.txt`
2. Set environment: `export FLASK_ENV=production`
3. Run server: `python server.py`

### Docker Deployment
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "server.py"]
```

---

## 📊 Monitoring

### Health Check
Monitor API health with: `GET /api/health`

### Database Monitoring
- SQLite database file: `tetrohash.db`
- Use SQLite browser tools for inspection
- Regular backups recommended

### Logs
- Flask debug logs to console
- Database operations logged
- Error tracking via Flask error handlers

---

## 🎯 Features

### ✅ Implemented
- Player registration and management
- Game result tracking
- Real-time leaderboards
- Bitcoin puzzle generation and solving
- Global statistics
- SQLite database backend
- RESTful API design
- CORS support
- Error handling

### 🔄 Future Enhancements
- Real-time multiplayer support
- WebSocket connections
- Advanced analytics
- Social features
- Tournament system
- Mobile app API
- Blockchain integration

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add API endpoints
4. Update documentation
5. Submit pull request

---

*API Documentation for TetroHashUnlock v3.0.0*

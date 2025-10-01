#!/usr/bin/env python3
"""
TetroHashUnlock API Server
Provides REST API endpoints for game data, leaderboards, and Bitcoin integration
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import os
import hashlib
import time
from datetime import datetime
import sqlite3
from typing import Dict, List, Optional

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Database setup
DB_FILE = 'tetrohash.db'

def init_db():
    """Initialize SQLite database with required tables"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Players table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            wallet_address TEXT,
            total_sats INTEGER DEFAULT 0,
            games_played INTEGER DEFAULT 0,
            high_score INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Games table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS games (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER,
            game_mode TEXT NOT NULL,
            score INTEGER DEFAULT 0,
            lines_cleared INTEGER DEFAULT 0,
            level_reached INTEGER DEFAULT 0,
            sats_earned INTEGER DEFAULT 0,
            duration_seconds INTEGER DEFAULT 0,
            ai_enabled BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (player_id) REFERENCES players (id)
        )
    ''')
    
    # Leaderboards table (cached for performance)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS leaderboards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            game_mode TEXT NOT NULL,
            player_id INTEGER,
            score INTEGER NOT NULL,
            rank INTEGER NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (player_id) REFERENCES players (id)
        )
    ''')
    
    # Bitcoin puzzles table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bitcoin_puzzles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            puzzle_hash TEXT UNIQUE NOT NULL,
            preimage TEXT NOT NULL,
            difficulty INTEGER DEFAULT 1,
            sats_reward INTEGER DEFAULT 250,
            solved_by INTEGER,
            solved_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (solved_by) REFERENCES players (id)
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

@app.route('/')
def index():
    """Serve the main game page"""
    return send_from_directory('.', 'tetrohash_unified.html')

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '3.0.0',
        'game_modes': ['normal', 'puzzle', 'ai-battle', 'learning']
    })

@app.route('/api/player/register', methods=['POST'])
def register_player():
    """Register a new player"""
    data = request.get_json()
    username = data.get('username')
    wallet_address = data.get('wallet_address', '')
    
    if not username:
        return jsonify({'error': 'Username is required'}), 400
    
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        cursor.execute(
            'INSERT INTO players (username, wallet_address) VALUES (?, ?)',
            (username, wallet_address)
        )
        player_id = cursor.lastrowid
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'player_id': player_id,
            'username': username,
            'wallet_address': wallet_address,
            'total_sats': 0,
            'games_played': 0,
            'high_score': 0
        }), 201
        
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Username already exists'}), 409
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/player/<int:player_id>')
def get_player(player_id):
    """Get player information"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, username, wallet_address, total_sats, games_played, high_score, created_at
        FROM players WHERE id = ?
    ''', (player_id,))
    
    player = cursor.fetchone()
    conn.close()
    
    if not player:
        return jsonify({'error': 'Player not found'}), 404
    
    return jsonify({
        'player_id': player[0],
        'username': player[1],
        'wallet_address': player[2],
        'total_sats': player[3],
        'games_played': player[4],
        'high_score': player[5],
        'created_at': player[6]
    })

@app.route('/api/game/submit', methods=['POST'])
def submit_game():
    """Submit game results"""
    data = request.get_json()
    
    required_fields = ['player_id', 'game_mode', 'score', 'lines_cleared', 'level_reached', 'sats_earned']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        # Insert game record
        cursor.execute('''
            INSERT INTO games (player_id, game_mode, score, lines_cleared, level_reached, sats_earned, duration_seconds, ai_enabled)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['player_id'],
            data['game_mode'],
            data['score'],
            data['lines_cleared'],
            data['level_reached'],
            data['sats_earned'],
            data.get('duration_seconds', 0),
            data.get('ai_enabled', False)
        ))
        
        # Update player stats
        cursor.execute('''
            UPDATE players 
            SET total_sats = total_sats + ?,
                games_played = games_played + 1,
                high_score = MAX(high_score, ?)
            WHERE id = ?
        ''', (data['sats_earned'], data['score'], data['player_id']))
        
        # Update leaderboard
        update_leaderboard(data['game_mode'], data['player_id'], data['score'])
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'message': 'Game submitted successfully',
            'sats_earned': data['sats_earned'],
            'new_total_sats': data.get('total_sats', 0) + data['sats_earned']
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/leaderboard/<game_mode>')
def get_leaderboard(game_mode):
    """Get leaderboard for specific game mode"""
    valid_modes = ['normal', 'puzzle', 'ai-battle', 'learning']
    if game_mode not in valid_modes:
        return jsonify({'error': 'Invalid game mode'}), 400
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT p.username, l.score, l.rank, l.updated_at
        FROM leaderboards l
        JOIN players p ON l.player_id = p.id
        WHERE l.game_mode = ?
        ORDER BY l.rank
        LIMIT 100
    ''', (game_mode,))
    
    leaderboard = cursor.fetchall()
    conn.close()
    
    return jsonify({
        'game_mode': game_mode,
        'leaderboard': [
            {
                'rank': row[2],
                'username': row[0],
                'score': row[1],
                'updated_at': row[3]
            }
            for row in leaderboard
        ]
    })

@app.route('/api/bitcoin/puzzle/generate', methods=['POST'])
def generate_puzzle():
    """Generate a new Bitcoin puzzle"""
    data = request.get_json()
    difficulty = data.get('difficulty', 1)
    
    # Generate puzzle based on difficulty
    preimage = generate_preimage(difficulty)
    puzzle_hash = hashlib.sha256(preimage.encode()).hexdigest()
    
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO bitcoin_puzzles (puzzle_hash, preimage, difficulty, sats_reward)
            VALUES (?, ?, ?, ?)
        ''', (puzzle_hash, preimage, difficulty, 250 + (difficulty * 100)))
        
        puzzle_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'puzzle_id': puzzle_id,
            'puzzle_hash': puzzle_hash,
            'difficulty': difficulty,
            'sats_reward': 250 + (difficulty * 100)
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/bitcoin/puzzle/solve', methods=['POST'])
def solve_puzzle():
    """Solve a Bitcoin puzzle"""
    data = request.get_json()
    puzzle_id = data.get('puzzle_id')
    preimage = data.get('preimage')
    player_id = data.get('player_id')
    
    if not all([puzzle_id, preimage, player_id]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        # Get puzzle details
        cursor.execute('''
            SELECT puzzle_hash, preimage, sats_reward, solved_by
            FROM bitcoin_puzzles WHERE id = ?
        ''', (puzzle_id,))
        
        puzzle = cursor.fetchone()
        if not puzzle:
            return jsonify({'error': 'Puzzle not found'}), 404
        
        if puzzle[3]:  # Already solved
            return jsonify({'error': 'Puzzle already solved'}), 409
        
        # Verify solution
        provided_hash = hashlib.sha256(preimage.encode()).hexdigest()
        if provided_hash != puzzle[0]:
            return jsonify({'error': 'Invalid preimage'}), 400
        
        # Mark as solved and award SATs
        cursor.execute('''
            UPDATE bitcoin_puzzles 
            SET solved_by = ?, solved_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (player_id, puzzle_id))
        
        cursor.execute('''
            UPDATE players 
            SET total_sats = total_sats + ?
            WHERE id = ?
        ''', (puzzle[2], player_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'message': 'Puzzle solved successfully!',
            'sats_reward': puzzle[2],
            'preimage': preimage
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats/global')
def get_global_stats():
    """Get global game statistics"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Total players
    cursor.execute('SELECT COUNT(*) FROM players')
    total_players = cursor.fetchone()[0]
    
    # Total games played
    cursor.execute('SELECT COUNT(*) FROM games')
    total_games = cursor.fetchone()[0]
    
    # Total SATs earned
    cursor.execute('SELECT SUM(sats_earned) FROM games')
    total_sats = cursor.fetchone()[0] or 0
    
    # Puzzles solved
    cursor.execute('SELECT COUNT(*) FROM bitcoin_puzzles WHERE solved_by IS NOT NULL')
    puzzles_solved = cursor.fetchone()[0]
    
    conn.close()
    
    return jsonify({
        'total_players': total_players,
        'total_games': total_games,
        'total_sats_earned': total_sats,
        'puzzles_solved': puzzles_solved,
        'timestamp': datetime.now().isoformat()
    })

def update_leaderboard(game_mode: str, player_id: int, score: int):
    """Update leaderboard for a game mode"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Get current top scores
    cursor.execute('''
        SELECT player_id, score FROM games 
        WHERE game_mode = ? 
        ORDER BY score DESC 
        LIMIT 100
    ''', (game_mode,))
    
    scores = cursor.fetchall()
    
    # Clear current leaderboard
    cursor.execute('DELETE FROM leaderboards WHERE game_mode = ?', (game_mode,))
    
    # Insert new leaderboard
    for rank, (pid, s) in enumerate(scores, 1):
        cursor.execute('''
            INSERT INTO leaderboards (game_mode, player_id, score, rank)
            VALUES (?, ?, ?, ?)
        ''', (game_mode, pid, s, rank))
    
    conn.commit()
    conn.close()

def generate_preimage(difficulty: int) -> str:
    """Generate a preimage string based on difficulty"""
    import random
    import string
    
    base_length = 5 + difficulty
    characters = string.ascii_uppercase + string.digits
    return ''.join(random.choices(characters, k=base_length))

if __name__ == '__main__':
    print("🎮 Starting TetroHashUnlock API Server...")
    
    # Get port from environment variable (for deployment) or use 5000
    port = int(os.environ.get('PORT', 5000))
    
    print(f"🌐 Server will be available at: http://localhost:{port}")
    print(f"📊 API Documentation: http://localhost:{port}/api/health")
    print(f"🎯 Game URL: http://localhost:{port}/")
    
    # Use 0.0.0.0 for deployment, localhost for development
    host = '0.0.0.0' if os.environ.get('PORT') else '127.0.0.1'
    debug = not os.environ.get('PORT')
    
    app.run(debug=debug, host=host, port=port)
else:
    # For gunicorn
    print("🎮 TetroHashUnlock API Server ready for gunicorn...")

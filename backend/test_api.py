#!/usr/bin/env python3
"""
Test script for TetroHashUnlock API
"""

import requests
import json
import time

API_BASE = 'http://localhost:5000/api'

def test_api():
    print("🧪 Testing TetroHashUnlock API...")
    
    # Wait for server to start
    print("⏳ Waiting for server to start...")
    time.sleep(2)
    
    try:
        # Test health check
        print("\n1. Testing health check...")
        response = requests.get(f"{API_BASE}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
        
        # Test player registration
        print("\n2. Testing player registration...")
        player_data = {
            "username": "test_player",
            "wallet_address": "bc1qtest123"
        }
        response = requests.post(f"{API_BASE}/player/register", json=player_data, timeout=5)
        if response.status_code == 201:
            print("✅ Player registration passed")
            player_id = response.json()['player_id']
            print(f"   Player ID: {player_id}")
        else:
            print(f"❌ Player registration failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
        
        # Test game submission
        print("\n3. Testing game submission...")
        game_data = {
            "player_id": player_id,
            "game_mode": "normal",
            "score": 25000,
            "lines_cleared": 15,
            "level_reached": 3,
            "sats_earned": 18,
            "duration_seconds": 300,
            "ai_enabled": False
        }
        response = requests.post(f"{API_BASE}/game/submit", json=game_data, timeout=5)
        if response.status_code == 200:
            print("✅ Game submission passed")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Game submission failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
        
        # Test leaderboard
        print("\n4. Testing leaderboard...")
        response = requests.get(f"{API_BASE}/leaderboard/normal", timeout=5)
        if response.status_code == 200:
            print("✅ Leaderboard retrieval passed")
            leaderboard = response.json()
            print(f"   Players in leaderboard: {len(leaderboard['leaderboard'])}")
        else:
            print(f"❌ Leaderboard retrieval failed: {response.status_code}")
            return False
        
        # Test Bitcoin puzzle generation
        print("\n5. Testing Bitcoin puzzle generation...")
        puzzle_data = {"difficulty": 2}
        response = requests.post(f"{API_BASE}/bitcoin/puzzle/generate", json=puzzle_data, timeout=5)
        if response.status_code == 201:
            print("✅ Puzzle generation passed")
            puzzle = response.json()
            puzzle_id = puzzle['puzzle_id']
            print(f"   Puzzle ID: {puzzle_id}")
            print(f"   Hash: {puzzle['puzzle_hash'][:16]}...")
        else:
            print(f"❌ Puzzle generation failed: {response.status_code}")
            return False
        
        # Test global stats
        print("\n6. Testing global stats...")
        response = requests.get(f"{API_BASE}/stats/global", timeout=5)
        if response.status_code == 200:
            print("✅ Global stats retrieval passed")
            stats = response.json()
            print(f"   Total players: {stats['total_players']}")
            print(f"   Total games: {stats['total_games']}")
            print(f"   Total SATs: {stats['total_sats_earned']}")
        else:
            print(f"❌ Global stats retrieval failed: {response.status_code}")
            return False
        
        print("\n🎉 All API tests passed!")
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to API server")
        print("   Make sure the server is running: npm run api")
        return False
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        return False

if __name__ == "__main__":
    success = test_api()
    exit(0 if success else 1)

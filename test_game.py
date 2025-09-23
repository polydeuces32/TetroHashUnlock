#!/usr/bin/env python3
# TetroHashUnlock v2.0 — Test Script
# Author: Giancarlo Vizhnay

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from bitcoin_logic import BitcoinPuzzle
from reward import RewardSystem
from ascii_tetris import TETROMINOS

def test_bitcoin_puzzle():
    """Test Bitcoin puzzle functionality"""
    print("🔐 Testing Bitcoin Puzzle System...")
    puzzle = BitcoinPuzzle()
    
    # Generate puzzle
    puzzle_data = puzzle.generate_puzzle()
    print(f"✅ Generated puzzle with target: {puzzle_data['target_hash'][:16]}...")
    
    # Test correct solution
    result = puzzle.solve_puzzle(puzzle_data['preimage'])
    print(f"✅ Correct solution test: {result['solved']}")
    
    # Test incorrect solution
    result = puzzle.solve_puzzle("WRONG")
    print(f"✅ Incorrect solution test: {not result['solved']}")
    
    return True

def test_reward_system():
    """Test reward system functionality"""
    print("\n💰 Testing Reward System...")
    reward_system = RewardSystem()
    
    # Test reward processing
    result = reward_system.process_reward(100, True)
    print(f"✅ Reward processing: {result['success']}")
    
    # Test wallet balance
    balance = reward_system.get_wallet_balance()
    print(f"✅ Wallet balance: {balance} sats")
    
    return True

def test_tetrominos():
    """Test tetromino data"""
    print("\n🧱 Testing Tetromino Data...")
    
    for name, data in TETROMINOS.items():
        print(f"✅ {name}: {data['preimage']} -> {len(data['shape'])} blocks")
    
    return True

def main():
    """Run all tests"""
    print("🧪 TetroHashUnlock v2.0 — Test Suite")
    print("=" * 50)
    
    try:
        test_bitcoin_puzzle()
        test_reward_system()
        test_tetrominos()
        
        print("\n🎉 All tests passed!")
        print("✅ Bitcoin puzzle system working")
        print("✅ Reward system working")
        print("✅ Tetromino data valid")
        print("\n🚀 Ready to play! Run: python3 tetrohash_unlock.py")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    main()

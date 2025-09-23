#!/usr/bin/env python3
# TetroHashUnlock v2.0 — Demo Script
# Author: Giancarlo Vizhnay

import time
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from bitcoin_logic import BitcoinPuzzle
from reward import RewardSystem

def demo_puzzle_solving():
    """Demonstrate puzzle solving mechanics"""
    print("🎮 TetroHashUnlock v2.0 — Demo Mode")
    print("=" * 50)
    print("This demo shows how the Bitcoin puzzle system works.")
    print("In the real game, you control falling tetromino pieces")
    print("to solve SHA-256 hash puzzles and earn SAT rewards!")
    print("=" * 50)
    
    puzzle = BitcoinPuzzle()
    reward_system = RewardSystem()
    
    # Generate a puzzle
    puzzle_data = puzzle.generate_puzzle()
    print(f"\n🔐 New Puzzle Generated!")
    print(f"Target Hash: {puzzle_data['target_hash']}")
    print(f"Hidden Preimage: {puzzle_data['preimage']}")
    print("\nIn the game, you would need to place the correct")
    print("tetromino piece to solve this puzzle!")
    
    print("\nSolving the puzzle automatically...")
    time.sleep(2)
    
    # Solve the puzzle
    result = puzzle.solve_puzzle(puzzle_data['preimage'])
    
    if result['solved']:
        print(f"\n{result['message']}")
        print(f"🎊 Reward: {result['reward']} sats!")
        
        # Process reward with animation
        reward_result = reward_system.process_reward(result['reward'], True)
        
        print(f"\n💰 Total Wallet Balance: {reward_system.get_wallet_balance()} sats")
        print("\n🎉 This is how you earn SATs in TetroHashUnlock!")
    
    print("\n" + "=" * 50)
    print("🚀 Ready to play the full game?")
    print("Run: python3 tetrohash_unlock.py")
    print("=" * 50)

if __name__ == "__main__":
    demo_puzzle_solving()

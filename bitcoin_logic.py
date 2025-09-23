#!/usr/bin/env python3
# TetroHashUnlock v2.0 — Bitcoin Script Logic
# Author: Giancarlo Vizhnay

import hashlib
import random
from typing import Optional, Dict, Any

class BitcoinPuzzle:
    """Handles Bitcoin Script-style SHA256 puzzles"""
    
    def __init__(self):
        self.target_hash = None
        self.current_preimage = None
        self.puzzle_active = False
        
    def generate_puzzle(self) -> Dict[str, Any]:
        """Generate a new SHA256 puzzle with target hash"""
        # Select a random tetromino preimage
        preimages = ['TJLO', 'SQUARE', 'TEE', 'ELL', 'JAY', 'ESS', 'ZED']
        self.current_preimage = random.choice(preimages)
        
        # Create the target hash
        self.target_hash = self.sha256_hash(self.current_preimage)
        self.puzzle_active = True
        
        return {
            'target_hash': self.target_hash,
            'preimage': self.current_preimage,
            'puzzle_active': self.puzzle_active
        }
    
    def sha256_hash(self, preimage: str) -> str:
        """Calculate SHA256 hash of the preimage"""
        return hashlib.sha256(preimage.encode('utf-8')).hexdigest()
    
    def verify_puzzle(self, preimage: str) -> bool:
        """Verify if the preimage matches the target hash (Bitcoin Script style)"""
        if not self.puzzle_active or not self.target_hash:
            return False
            
        # OP_SHA256 <preimage> OP_EQUAL OP_VERIFY
        calculated_hash = self.sha256_hash(preimage)
        return calculated_hash == self.target_hash
    
    def solve_puzzle(self, preimage: str) -> Dict[str, Any]:
        """Attempt to solve the puzzle and return result"""
        if not self.puzzle_active:
            return {
                'solved': False,
                'message': 'No active puzzle',
                'reward': 0
            }
        
        if self.verify_puzzle(preimage):
            # Puzzle solved! Calculate reward
            reward = self.calculate_reward()
            self.puzzle_active = False
            
            return {
                'solved': True,
                'message': f'🎉 Puzzle solved! Preimage "{preimage}" matches target hash!',
                'reward': reward,
                'preimage': preimage,
                'target_hash': self.target_hash
            }
        else:
            return {
                'solved': False,
                'message': f'❌ Preimage "{preimage}" does not match target hash',
                'reward': 0
            }
    
    def calculate_reward(self) -> int:
        """Calculate SAT reward based on puzzle difficulty"""
        # Base reward + bonus for hash complexity
        base_reward = random.randint(250, 1000)
        hash_complexity_bonus = len(self.target_hash) * 2
        return base_reward + hash_complexity_bonus
    
    def get_puzzle_info(self) -> Dict[str, Any]:
        """Get current puzzle information"""
        return {
            'target_hash': self.target_hash,
            'puzzle_active': self.puzzle_active,
            'hash_length': len(self.target_hash) if self.target_hash else 0
        }
    
    def reset_puzzle(self):
        """Reset the current puzzle"""
        self.target_hash = None
        self.current_preimage = None
        self.puzzle_active = False

class BitcoinScript:
    """Simulates Bitcoin Script operations"""
    
    @staticmethod
    def op_sha256(data: str) -> str:
        """OP_SHA256 operation"""
        return hashlib.sha256(data.encode('utf-8')).hexdigest()
    
    @staticmethod
    def op_equal(hash1: str, hash2: str) -> bool:
        """OP_EQUAL operation"""
        return hash1 == hash2
    
    @staticmethod
    def op_verify(condition: bool) -> bool:
        """OP_VERIFY operation"""
        return condition
    
    @staticmethod
    def execute_script(preimage: str, target_hash: str) -> bool:
        """Execute the full Bitcoin Script: <preimage> OP_SHA256 <target_hash> OP_EQUAL OP_VERIFY"""
        # Step 1: OP_SHA256 on preimage
        calculated_hash = BitcoinScript.op_sha256(preimage)
        
        # Step 2: OP_EQUAL to compare hashes
        hashes_equal = BitcoinScript.op_equal(calculated_hash, target_hash)
        
        # Step 3: OP_VERIFY to validate
        return BitcoinScript.op_verify(hashes_equal)

def main():
    """Test the Bitcoin logic"""
    puzzle = BitcoinPuzzle()
    
    # Generate a puzzle
    puzzle_data = puzzle.generate_puzzle()
    print(f"Generated puzzle:")
    print(f"Target Hash: {puzzle_data['target_hash']}")
    print(f"Preimage: {puzzle_data['preimage']}")
    
    # Test solving with correct preimage
    result = puzzle.solve_puzzle(puzzle_data['preimage'])
    print(f"\nSolving with correct preimage:")
    print(f"Solved: {result['solved']}")
    print(f"Message: {result['message']}")
    print(f"Reward: {result['reward']} sats")
    
    # Test solving with incorrect preimage
    result = puzzle.solve_puzzle("WRONG")
    print(f"\nSolving with incorrect preimage:")
    print(f"Solved: {result['solved']}")
    print(f"Message: {result['message']}")

if __name__ == "__main__":
    main()

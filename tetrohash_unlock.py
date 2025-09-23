#!/usr/bin/env python3
# TetroHashUnlock v2.0 — Complete Integrated Game
# Author: Giancarlo Vizhnay

import os
import time
import threading
import termios
import tty
import sys
from ascii_tetris import TetroHashGame, TETROMINOS
from bitcoin_logic import BitcoinPuzzle
from reward import RewardSystem

class TetroHashUnlock:
    """Main game class that integrates all phases"""
    
    def __init__(self):
        self.tetris_game = TetroHashGame()
        self.bitcoin_puzzle = BitcoinPuzzle()
        self.reward_system = RewardSystem()
        self.game_mode = "normal"  # normal, puzzle, or lightning
        self.puzzle_active = False
        self.current_puzzle = None
        
    def start_puzzle_mode(self):
        """Start Bitcoin puzzle mode"""
        self.game_mode = "puzzle"
        self.puzzle_active = True
        self.current_puzzle = self.bitcoin_puzzle.generate_puzzle()
        self.tetris_game.target_hash = self.current_puzzle['target_hash']
        print(f"\n🔐 PUZZLE MODE ACTIVATED!")
        print(f"Target Hash: {self.current_puzzle['target_hash']}")
        print(f"Find the tetromino with preimage: {self.current_puzzle['preimage']}")
        print("Press 'p' to check if current piece solves the puzzle!")
        input("Press Enter to continue...")
    
    def check_puzzle_solution(self, piece_name: str) -> bool:
        """Check if the current piece solves the Bitcoin puzzle"""
        if not self.puzzle_active or not self.current_puzzle:
            return False
        
        # Get the preimage for the current piece
        piece_preimage = TETROMINOS[piece_name]['preimage']
        
        # Check if it matches the puzzle
        result = self.bitcoin_puzzle.solve_puzzle(piece_preimage)
        
        if result['solved']:
            print(f"\n{result['message']}")
            print(f"🎊 Reward: {result['reward']} sats!")
            
            # Process the reward
            reward_result = self.reward_system.process_reward(
                result['reward'], 
                True
            )
            
            # Generate new puzzle
            self.current_puzzle = self.bitcoin_puzzle.generate_puzzle()
            self.tetris_game.target_hash = self.current_puzzle['target_hash']
            
            return True
        else:
            print(f"\n{result['message']}")
            return False
    
    def get_piece_name_from_shape(self, shape):
        """Get piece name from shape coordinates"""
        for name, data in TETROMINOS.items():
            if data['shape'] == shape:
                return name
        return None
    
    def enhanced_key_handler(self):
        """Enhanced key handler with puzzle mode support"""
        while not self.tetris_game.game_over:
            fd = sys.stdin.fileno()
            old = termios.tcgetattr(fd)
            try:
                tty.setraw(fd)
                ch = sys.stdin.read(1)
                self.tetris_game.last_key = ch
            finally:
                termios.tcsetattr(fd, termios.TCSADRAIN, old)
    
    def run(self):
        """Main game loop with integrated features"""
        print("🧱 TetroHashUnlock v2.0 — Complete Game")
        print("=" * 50)
        print("Game Modes:")
        print("1. Normal Tetris (n)")
        print("2. Bitcoin Puzzle Mode (b)")
        print("3. Lightning Mode (l)")
        print("=" * 50)
        
        # Mode selection
        while True:
            mode = input("Select mode (n/b/l): ").lower().strip()
            if mode == 'n':
                self.game_mode = "normal"
                break
            elif mode == 'b':
                self.start_puzzle_mode()
                break
            elif mode == 'l':
                self.game_mode = "lightning"
                print("⚡ Lightning Mode - Real SAT payouts enabled!")
                break
            else:
                print("Invalid mode. Please choose n, b, or l.")
        
        # Start the game
        self.tetris_game.spawn_piece()
        
        # Start key listener thread
        key_thread = threading.Thread(target=self.enhanced_key_handler, daemon=True)
        key_thread.start()
        
        try:
            while not self.tetris_game.game_over:
                self.tetris_game.print_grid()
                
                # Display additional info based on mode
                if self.game_mode == "puzzle" and self.puzzle_active:
                    print(f"\n🔐 PUZZLE MODE")
                    print(f"Target: {self.current_puzzle['target_hash'][:16]}...")
                    print(f"Current piece: {self.get_piece_name_from_shape(self.tetris_game.current_piece['shape'])}")
                    print("Press 'p' to check solution, 'q' to quit")
                elif self.game_mode == "lightning":
                    balance = self.reward_system.get_wallet_balance()
                    print(f"\n⚡ Lightning Mode - Balance: {balance} sats")
                
                # Handle input
                if self.tetris_game.last_key == 'a':
                    self.tetris_game.move(-1)
                elif self.tetris_game.last_key == 'd':
                    self.tetris_game.move(1)
                elif self.tetris_game.last_key == 's':
                    self.tetris_game.drop_piece()
                elif self.tetris_game.last_key == 'p' and self.game_mode == "puzzle":
                    # Check puzzle solution
                    if self.tetris_game.current_piece:
                        piece_name = self.get_piece_name_from_shape(
                            self.tetris_game.current_piece['shape']
                        )
                        if piece_name:
                            self.check_puzzle_solution(piece_name)
                elif self.tetris_game.last_key == 'q':
                    print("\n👋 Exiting TetroHashUnlock...\n")
                    break
                
                self.tetris_game.last_key = None
                time.sleep(0.3)
                self.tetris_game.drop_piece()
                
        except KeyboardInterrupt:
            print("\n⛔ Interrupted. Goodbye!\n")
        finally:
            # Final stats
            print(f"\n🎮 Final Score: {self.tetris_game.score}")
            if self.game_mode in ["puzzle", "lightning"]:
                balance = self.reward_system.get_wallet_balance()
                print(f"💰 Total SATs Earned: {balance}")
            
            # Save wallet
            if self.game_mode in ["puzzle", "lightning"]:
                self.reward_system.wallet.save_wallet()
                print(f"💾 Wallet saved to wallet.txt")

def main():
    """Entry point for the complete game"""
    game = TetroHashUnlock()
    game.run()

if __name__ == "__main__":
    main()

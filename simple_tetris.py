#!/usr/bin/env python3
# TetroHashUnlock v2.0 — Simple Terminal Tetris
# Author: Giancarlo Vizhnay

import os
import time
import threading
import termios
import tty
import sys
import random
from ascii_tetris import TetroHashGame, TETROMINOS, WIDTH, HEIGHT

class SimpleTetris:
    """Simplified Tetris with better terminal compatibility"""
    
    def __init__(self):
        self.game = TetroHashGame()
        self.running = True
        
    def clear_and_display(self):
        """Clear screen and display grid with better formatting"""
        # Clear screen
        os.system('clear' if os.name == 'posix' else 'cls')
        
        # Header
        print("🧱 TetroHashUnlock v2.0 — Simple Mode")
        print("Controls: [a] left  [d] right  [s] drop  [q] quit")
        print(f"Score: {self.game.score}")
        print("-" * 50)
        
        # Create display grid
        display_grid = []
        for y in range(HEIGHT):
            row = [' ' for _ in range(WIDTH)]
            display_grid.append(row)
        
        # Add locked pieces
        for y in range(HEIGHT):
            for x in range(WIDTH):
                if y < len(self.game.grid) and x < len(self.game.grid[y]):
                    if self.game.grid[y][x] != ' ':
                        display_grid[y][x] = '█'
        
        # Add current piece
        if self.game.current_piece:
            for dx, dy in self.game.current_piece['shape']:
                x, y = self.game.piece_x + dx, self.game.piece_y + dy
                if 0 <= x < WIDTH and 0 <= y < HEIGHT:
                    display_grid[y][x] = '█'
        
        # Display grid
        for row in display_grid:
            print('|' + ''.join(row) + '|')
        print('+' + '-' * WIDTH + '+')
        print()
    
    def get_key(self):
        """Key input handler"""
        while self.running:
            try:
                fd = sys.stdin.fileno()
                old = termios.tcgetattr(fd)
                try:
                    tty.setraw(fd)
                    ch = sys.stdin.read(1)
                    self.game.last_key = ch
                finally:
                    termios.tcsetattr(fd, termios.TCSADRAIN, old)
            except:
                break
    
    def run(self):
        """Main game loop"""
        print("🎮 Starting Simple Tetris...")
        print("Press any key to start...")
        input()
        
        self.game.spawn_piece()
        
        # Start key listener
        key_thread = threading.Thread(target=self.get_key, daemon=True)
        key_thread.start()
        
        try:
            while self.running and not self.game.game_over:
                self.clear_and_display()
                
                # Handle input
                if self.game.last_key == 'a':
                    self.game.move(-1)
                elif self.game.last_key == 'd':
                    self.game.move(1)
                elif self.game.last_key == 's':
                    self.game.drop_piece()
                elif self.game.last_key == 'q':
                    print("👋 Exiting...")
                    break
                
                self.game.last_key = None
                time.sleep(0.5)
                self.game.drop_piece()
                
        except KeyboardInterrupt:
            print("\n⛔ Interrupted. Goodbye!")
        finally:
            self.running = False
            print(f"\n🎊 Final Score: {self.game.score}")
            print("Thanks for playing TetroHashUnlock!")

def main():
    """Entry point"""
    game = SimpleTetris()
    game.run()

if __name__ == "__main__":
    main()

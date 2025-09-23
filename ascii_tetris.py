#!/usr/bin/env python3
# TetroHashUnlock v2.0 — ASCII Tetris Grid Engine
# Author: Giancarlo Vizhnay

import os, time, threading, termios, tty, sys, random
from typing import List, Tuple, Optional

WIDTH, HEIGHT = 10, 20

# Tetromino shapes with their preimage strings
TETROMINOS = {
    'I': {
        'shape': [(0,0), (0,1), (0,2), (0,3)],
        'preimage': 'TJLO',
        'color': '█'
    },
    'O': {
        'shape': [(0,0), (0,1), (1,0), (1,1)],
        'preimage': 'SQUARE',
        'color': '█'
    },
    'T': {
        'shape': [(0,1), (1,0), (1,1), (1,2)],
        'preimage': 'TEE',
        'color': '█'
    },
    'L': {
        'shape': [(0,0), (1,0), (2,0), (2,1)],
        'preimage': 'ELL',
        'color': '█'
    },
    'J': {
        'shape': [(0,1), (1,1), (2,0), (2,1)],
        'preimage': 'JAY',
        'color': '█'
    },
    'S': {
        'shape': [(0,1), (0,2), (1,0), (1,1)],
        'preimage': 'ESS',
        'color': '█'
    },
    'Z': {
        'shape': [(0,0), (0,1), (1,1), (1,2)],
        'preimage': 'ZED',
        'color': '█'
    }
}

class TetroHashGame:
    def __init__(self):
        self.grid = self.create_empty_grid()
        self.current_piece = None
        self.piece_x = 0
        self.piece_y = 0
        self.last_key = None
        self.score = 0
        self.target_hash = None
        self.game_over = False
        
    def create_empty_grid(self):
        """Create a stable empty grid"""
        return [[' ' for _ in range(WIDTH)] for _ in range(HEIGHT)]
    
    def reset_grid(self):
        """Reset the grid to empty state"""
        self.grid = self.create_empty_grid()
        self.score = 0
        self.game_over = False
    
    def validate_grid(self):
        """Validate grid integrity and fix if corrupted"""
        if len(self.grid) != HEIGHT:
            print("⚠️ Grid height mismatch, fixing...")
            self.grid = self.create_empty_grid()
            return False
        
        for i, row in enumerate(self.grid):
            if len(row) != WIDTH:
                print(f"⚠️ Row {i} width mismatch, fixing...")
                self.grid[i] = [' ' for _ in range(WIDTH)]
        
        return True
        
    def spawn_piece(self):
        """Spawn a random tetromino piece"""
        piece_name = random.choice(list(TETROMINOS.keys()))
        self.current_piece = TETROMINOS[piece_name]
        self.piece_x = WIDTH // 2 - 1
        self.piece_y = 0
        
        # Check for game over
        if self.collision(self.piece_x, self.piece_y):
            self.game_over = True

    def clear_screen(self):
        """Clear screen with better compatibility"""
        os.system('clear' if os.name == 'posix' else 'cls')
        # Add extra newlines to ensure clean display
        print("\n" * 2)

    def print_grid(self):
        """Display the game grid with current piece and stability checks"""
        # Validate grid before displaying
        if not self.validate_grid():
            print("⚠️ Grid was corrupted, continuing with fixed grid...")
        
        # Create a safe copy of the grid
        temp = []
        for row in self.grid:
            if len(row) == WIDTH:
                temp.append(row[:])  # Safe copy
            else:
                temp.append([' ' for _ in range(WIDTH)])  # Fix corrupted row
        
        # Draw current piece with bounds checking
        if self.current_piece:
            for dx, dy in self.current_piece['shape']:
                x, y = self.piece_x + dx, self.piece_y + dy
                if 0 <= x < WIDTH and 0 <= y < HEIGHT and y < len(temp):
                    temp[y][x] = self.current_piece['color']
        
        # Clear screen and display
        self.clear_screen()
        
        # Header
        print("🧱 TetroHashUnlock v2.0 — ASCII Grid Engine")
        print("Controls: [a] left  [d] right  [s] drop  [q] quit")
        print(f"Score: {self.score}")
        if self.target_hash:
            print(f"Target Hash: {self.target_hash[:16]}...")
        print()
        
        # Display grid with proper formatting
        for i in range(HEIGHT):
            if i < len(temp):
                row = temp[i]
                # Ensure row is exactly WIDTH characters
                if len(row) != WIDTH:
                    row = [' ' for _ in range(WIDTH)]
                print('|' + ''.join(row) + '|')
            else:
                # Fill missing rows with empty spaces
                print('|' + ' ' * WIDTH + '|')
        
        # Bottom border
        print('+' + '-' * WIDTH + '+')
        print()  # Extra newline for spacing

    def drop_piece(self):
        """Drop the current piece down one position"""
        if not self.collision(self.piece_x, self.piece_y + 1):
            self.piece_y += 1
        else:
            self.lock_piece()
            self.clear_lines()
            self.spawn_piece()

    def move(self, dx):
        """Move the current piece horizontally"""
        if not self.collision(self.piece_x + dx, self.piece_y):
            self.piece_x += dx

    def collision(self, x, y):
        """Check if the piece would collide at the given position with stable bounds checking"""
        if not self.current_piece:
            return False
        
        # Ensure grid bounds are valid
        if not (0 <= y < HEIGHT and 0 <= x < WIDTH):
            return True
            
        for dx, dy in self.current_piece['shape']:
            nx, ny = x + dx, y + dy
            # Check bounds
            if nx < 0 or nx >= WIDTH or ny >= HEIGHT:
                return True
            # Check collision with existing blocks
            if ny >= 0 and ny < HEIGHT and nx >= 0 and nx < WIDTH:
                if self.grid[ny][nx] != ' ':
                    return True
        return False

    def lock_piece(self):
        """Lock the current piece into the grid with stable bounds checking"""
        if not self.current_piece:
            return
        
        # Ensure grid is stable before locking
        if len(self.grid) != HEIGHT or any(len(row) != WIDTH for row in self.grid):
            print("⚠️ Grid corruption detected, resetting...")
            self.reset_grid()
            return
            
        for dx, dy in self.current_piece['shape']:
            x, y = self.piece_x + dx, self.piece_y + dy
            # Double-check bounds before locking
            if 0 <= x < WIDTH and 0 <= y < HEIGHT:
                self.grid[y][x] = self.current_piece['color']
            else:
                print(f"⚠️ Attempted to lock piece outside bounds: ({x}, {y})")

    def clear_lines(self):
        """Clear completed lines and update score with stable grid management"""
        lines_cleared = 0
        new_grid = []
        
        # Process grid from bottom to top for stability
        for y in range(HEIGHT):
            if all(cell != ' ' for cell in self.grid[y]):
                # This line is complete, don't add it to new_grid
                lines_cleared += 1
            else:
                # This line is not complete, keep it
                new_grid.append(self.grid[y])
        
        # Add empty lines at the top to maintain grid height
        while len(new_grid) < HEIGHT:
            new_grid.insert(0, [' ' for _ in range(WIDTH)])
        
        # Update the grid with the stable new grid
        self.grid = new_grid
        
        if lines_cleared > 0:
            self.score += lines_cleared * 100
            print(f"🎉 Cleared {lines_cleared} line(s)! +{lines_cleared * 100} points")

    def get_key(self):
        """Key input handler running in separate thread"""
        while not self.game_over:
            fd = sys.stdin.fileno()
            old = termios.tcgetattr(fd)
            try:
                tty.setraw(fd)
                ch = sys.stdin.read(1)
                self.last_key = ch
            finally:
                termios.tcsetattr(fd, termios.TCSADRAIN, old)

    def run(self):
        """Main game loop with improved display stability"""
        self.spawn_piece()
        
        # Start key listener thread
        key_thread = threading.Thread(target=self.get_key, daemon=True)
        key_thread.start()
        
        try:
            while not self.game_over:
                try:
                    self.print_grid()
                except Exception as e:
                    print(f"Display error: {e}")
                    # Fallback display
                    self.simple_display()
                
                # Handle input
                if self.last_key == 'a':
                    self.move(-1)
                elif self.last_key == 'd':
                    self.move(1)
                elif self.last_key == 's':
                    self.drop_piece()
                elif self.last_key == 'q':
                    print("\n👋 Exiting TetroHashUnlock...\n")
                    break
                
                self.last_key = None
                time.sleep(0.3)
                self.drop_piece()
                
        except KeyboardInterrupt:
            print("\n⛔ Interrupted. Goodbye!\n")
        finally:
            print(f"Final Score: {self.score}")
    
    def simple_display(self):
        """Simple fallback display for terminal issues"""
        print("\n" + "="*50)
        print("🧱 TetroHashUnlock v2.0 — Simple Display")
        print(f"Score: {self.score}")
        print("="*50)
        
        # Simple grid display
        for y in range(HEIGHT):
            row = ""
            for x in range(WIDTH):
                if y < len(self.grid) and x < len(self.grid[y]):
                    row += self.grid[y][x]
                else:
                    row += " "
            print(f"|{row}|")
        print("+" + "-" * WIDTH + "+")
        print()

def main():
    """Entry point for the game"""
    game = TetroHashGame()
    game.run()

if __name__ == "__main__":
    main()


#!/usr/bin/env python3
# TetroHashUnlock v2.0 — Demo Tetris Display
# Author: Giancarlo Vizhnay

import os
import time
from ascii_tetris import TetroHashGame, TETROMINOS, WIDTH, HEIGHT

def demo_tetris_display():
    """Demonstrate the Tetris display without interactive input"""
    print("🎮 TetroHashUnlock v2.0 — Display Demo")
    print("=" * 50)
    
    game = TetroHashGame()
    
    # Fill some blocks to show the display
    print("Creating a sample game state...")
    
    # Add some locked blocks
    for y in range(15, 20):
        for x in range(WIDTH):
            game.grid[y][x] = '█'
    
    # Add some scattered blocks
    game.grid[10][2] = '█'
    game.grid[10][3] = '█'
    game.grid[11][2] = '█'
    game.grid[11][3] = '█'
    
    # Add some more blocks
    game.grid[8][5] = '█'
    game.grid[8][6] = '█'
    game.grid[9][5] = '█'
    game.grid[9][6] = '█'
    
    # Spawn a piece
    game.spawn_piece()
    game.piece_x = 3
    game.piece_y = 5
    
    print("\n🧱 TetroHashUnlock v2.0 — ASCII Grid Engine")
    print("Controls: [a] left  [d] right  [s] drop  [q] quit")
    print(f"Score: {game.score}")
    print()
    
    # Display the grid
    for y in range(HEIGHT):
        row = [' ' for _ in range(WIDTH)]
        
        # Add locked pieces
        if y < len(game.grid):
            for x in range(WIDTH):
                if x < len(game.grid[y]) and game.grid[y][x] != ' ':
                    row[x] = '█'
        
        # Add current piece
        if game.current_piece:
            for dx, dy in game.current_piece['shape']:
                px, py = game.piece_x + dx, game.piece_y + dy
                if 0 <= px < WIDTH and 0 <= py < HEIGHT and py == y:
                    row[px] = '█'
        
        print('|' + ''.join(row) + '|')
    
    print('+' + '-' * WIDTH + '+')
    print()
    
    print("🎯 This is how the game should look!")
    print("The grid shows:")
    print("- Empty spaces (spaces)")
    print("- Locked pieces (█)")
    print("- Current falling piece (█)")
    print()
    
    # Show different tetromino shapes
    print("🧱 Available Tetromino Shapes:")
    for name, data in TETROMINOS.items():
        print(f"  {name}: {data['preimage']} -> {len(data['shape'])} blocks")
    
    print("\n🎮 To play the full game:")
    print("  python3 tetrohash_unlock.py")
    print("  python3 simple_tetris.py")

if __name__ == "__main__":
    demo_tetris_display()

#!/usr/bin/env python3
# TetroHashUnlock v2.0 — Display Test
# Author: Giancarlo Vizhnay

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ascii_tetris import TetroHashGame, TETROMINOS, WIDTH, HEIGHT

def test_display():
    """Test the display system"""
    print("🧪 Testing Display System...")
    print("=" * 50)
    
    game = TetroHashGame()
    
    # Fill some blocks to test display
    print("Creating test grid with some blocks...")
    
    # Add some blocks to the grid
    for y in range(15, 20):
        for x in range(WIDTH):
            game.grid[y][x] = '█'
    
    # Add a few scattered blocks
    game.grid[10][2] = '█'
    game.grid[10][3] = '█'
    game.grid[11][2] = '█'
    game.grid[11][3] = '█'
    
    # Spawn a piece
    game.spawn_piece()
    game.piece_x = 5
    game.piece_y = 5
    
    print("\nTesting normal display...")
    try:
        game.print_grid()
        print("✅ Normal display working")
    except Exception as e:
        print(f"❌ Normal display failed: {e}")
        print("Testing fallback display...")
        game.simple_display()
        print("✅ Fallback display working")
    
    print("\nTesting simple display...")
    game.simple_display()
    print("✅ Simple display working")
    
    print("\n🎉 Display test complete!")

if __name__ == "__main__":
    test_display()

#!/usr/bin/env python3
# TetroHashUnlock v2.0 — Grid Stability Test
# Author: Giancarlo Vizhnay

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ascii_tetris import TetroHashGame, WIDTH, HEIGHT

def test_grid_stability():
    """Test grid stability and corruption handling"""
    print("🧪 Testing Grid Stability...")
    print("=" * 50)
    
    game = TetroHashGame()
    
    # Test 1: Initial grid creation
    print("✅ Test 1: Initial grid creation")
    assert len(game.grid) == HEIGHT, f"Grid height should be {HEIGHT}, got {len(game.grid)}"
    assert all(len(row) == WIDTH for row in game.grid), "All rows should have correct width"
    print("   ✓ Grid dimensions correct")
    
    # Test 2: Grid validation
    print("✅ Test 2: Grid validation")
    assert game.validate_grid(), "Initial grid should be valid"
    print("   ✓ Initial grid validation passed")
    
    # Test 3: Simulate line clearing
    print("✅ Test 3: Line clearing stability")
    
    # Fill some rows to test line clearing
    for y in range(HEIGHT - 3, HEIGHT):
        for x in range(WIDTH):
            game.grid[y][x] = '█'
    
    # Clear lines
    game.clear_lines()
    
    # Verify grid is still stable
    assert len(game.grid) == HEIGHT, "Grid height should remain stable after line clearing"
    assert all(len(row) == WIDTH for row in game.grid), "All rows should maintain correct width"
    print("   ✓ Line clearing maintains grid stability")
    
    # Test 4: Grid corruption recovery
    print("✅ Test 4: Grid corruption recovery")
    
    # Simulate corruption
    game.grid.append(['█'] * WIDTH)  # Add extra row
    game.grid[0] = ['█'] * (WIDTH + 1)  # Make first row too wide
    
    # Validate should fix corruption
    game.validate_grid()
    
    assert len(game.grid) == HEIGHT, "Grid should be fixed to correct height"
    assert all(len(row) == WIDTH for row in game.grid), "All rows should be fixed to correct width"
    print("   ✓ Grid corruption recovery working")
    
    # Test 5: Piece collision with stable grid
    print("✅ Test 5: Piece collision with stable grid")
    
    # Spawn a piece
    game.spawn_piece()
    assert game.current_piece is not None, "Piece should spawn successfully"
    
    # Test collision detection
    collision_result = game.collision(game.piece_x, game.piece_y)
    assert isinstance(collision_result, bool), "Collision detection should return boolean"
    print("   ✓ Collision detection working with stable grid")
    
    # Test 6: Piece locking with bounds checking
    print("✅ Test 6: Piece locking with bounds checking")
    
    # Move piece to a safe position
    game.piece_x = WIDTH // 2
    game.piece_y = HEIGHT - 2
    
    # Lock the piece
    game.lock_piece()
    
    # Verify piece was locked correctly
    assert len(game.grid) == HEIGHT, "Grid should remain stable after piece locking"
    assert all(len(row) == WIDTH for row in game.grid), "All rows should maintain correct width"
    print("   ✓ Piece locking maintains grid stability")
    
    print("\n🎉 All grid stability tests passed!")
    print("✅ Grid creation and validation working")
    print("✅ Line clearing maintains stability")
    print("✅ Corruption recovery working")
    print("✅ Collision detection stable")
    print("✅ Piece locking stable")
    
    return True

def test_stress_clearing():
    """Test multiple line clearings in sequence"""
    print("\n🔥 Stress Test: Multiple Line Clearings")
    print("=" * 50)
    
    game = TetroHashGame()
    
    # Fill multiple rows
    for y in range(HEIGHT - 5, HEIGHT):
        for x in range(WIDTH):
            game.grid[y][x] = '█'
    
    print(f"   Filled {5} rows for clearing")
    
    # Clear lines multiple times
    for i in range(3):
        initial_height = len(game.grid)
        game.clear_lines()
        final_height = len(game.grid)
        
        assert len(game.grid) == HEIGHT, f"Grid height should be {HEIGHT} after clearing {i+1}"
        assert all(len(row) == WIDTH for row in game.grid), f"All rows should have width {WIDTH} after clearing {i+1}"
        
        print(f"   ✓ Clearing {i+1}: {initial_height} -> {final_height} rows")
    
    print("   ✅ Stress test passed - grid remains stable through multiple clearings")
    return True

def main():
    """Run all stability tests"""
    print("🧱 TetroHashUnlock v2.0 — Grid Stability Test Suite")
    print("=" * 60)
    
    try:
        test_grid_stability()
        test_stress_clearing()
        
        print("\n🎊 ALL STABILITY TESTS PASSED! 🎊")
        print("The grid is now stable and robust against corruption!")
        print("\n🚀 Ready for stable gameplay!")
        
    except Exception as e:
        print(f"\n❌ Stability test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

if __name__ == "__main__":
    main()

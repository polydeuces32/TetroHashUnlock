#!/usr/bin/env python3
# TetroHashUnlock v2.0 — Web Launcher
# Author: Giancarlo Vizhnay

import os
import sys
import webbrowser
import time
import subprocess
from pathlib import Path

def check_requirements():
    """Check if all required files exist"""
    required_files = [
        'index.html',
        'styles.css', 
        'game.js',
        'ui.js',
        'app.js',
        'server.py'
    ]
    
    missing_files = []
    for file in required_files:
        if not os.path.exists(file):
            missing_files.append(file)
    
    if missing_files:
        print("❌ Missing required files:")
        for file in missing_files:
            print(f"   - {file}")
        return False
    
    return True

def launch_web_game():
    """Launch the web version of TetroHashUnlock"""
    print("🧱 TetroHashUnlock v2.0 — Web Launcher")
    print("=" * 50)
    
    # Check requirements
    if not check_requirements():
        print("\n❌ Cannot launch web game. Missing required files.")
        return False
    
    print("✅ All required files found!")
    print("🚀 Starting web server...")
    
    try:
        # Start the server
        print("\n🌐 Web server starting...")
        print("📡 Server will be available at: http://localhost:8000")
        print("🎮 Your browser will open automatically!")
        print("⏹️  Press Ctrl+C to stop the server")
        print("-" * 50)
        
        # Run the server
        subprocess.run([sys.executable, 'server.py'])
        
    except KeyboardInterrupt:
        print("\n👋 Web server stopped. Thanks for playing!")
    except Exception as e:
        print(f"\n❌ Error starting web server: {e}")
        return False
    
    return True

def show_help():
    """Show help information"""
    print("TetroHashUnlock v2.0 — Web Launcher")
    print("=" * 40)
    print("Usage: python3 launch_web.py [options]")
    print("\nOptions:")
    print("  --help, -h     Show this help message")
    print("  --check        Check if all files are present")
    print("\nExamples:")
    print("  python3 launch_web.py          # Launch the web game")
    print("  python3 launch_web.py --check  # Check requirements")
    print("\nFor more information, see WEB_FRONTEND_README.md")

def main():
    """Main entry point"""
    if len(sys.argv) > 1:
        if sys.argv[1] in ['--help', '-h']:
            show_help()
            return
        elif sys.argv[1] == '--check':
            if check_requirements():
                print("✅ All requirements satisfied!")
            else:
                print("❌ Some requirements are missing.")
            return
    
    # Launch the web game
    launch_web_game()

if __name__ == "__main__":
    main()

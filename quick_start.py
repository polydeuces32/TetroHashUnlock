#!/usr/bin/env python3
# TetroHashUnlock v2.0 — Quick Start
# Author: Giancarlo Vizhnay

import webbrowser
import time
import subprocess
import sys
import os

def main():
    print("🧱 TetroHashUnlock v2.0 — Quick Start")
    print("=" * 50)
    
    # Check if server is running
    try:
        import requests
        response = requests.get('http://localhost:8000', timeout=2)
        if response.status_code == 200:
            print("✅ Web server is already running!")
            print("🌐 Opening game in browser...")
            webbrowser.open('http://localhost:8000')
            print("🎮 Game should open in your browser!")
            print("\nIf the game doesn't load properly:")
            print("1. Try refreshing the page (F5)")
            print("2. Check browser console for errors (F12)")
            print("3. Try the debug page: http://localhost:8000/debug.html")
            return
    except:
        pass
    
    print("🚀 Starting web server...")
    
    # Start the server
    try:
        subprocess.Popen([sys.executable, 'server.py'])
        print("⏳ Waiting for server to start...")
        time.sleep(3)
        
        print("🌐 Opening game in browser...")
        webbrowser.open('http://localhost:8000')
        
        print("🎮 Game should open in your browser!")
        print("\nIf you see a loading screen that doesn't go away:")
        print("1. Try refreshing the page (F5)")
        print("2. Check browser console for errors (F12)")
        print("3. Try the debug page: http://localhost:8000/debug.html")
        print("4. Try a different browser")
        
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        print("\nManual start:")
        print("1. Run: python3 server.py")
        print("2. Open: http://localhost:8000")

if __name__ == "__main__":
    main()

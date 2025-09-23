#!/usr/bin/env python3
# TetroHashUnlock v2.0 — Web Server
# Author: Giancarlo Vizhnay

import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

class TetroHashHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.dirname(os.path.abspath(__file__)), **kwargs)
    
    def end_headers(self):
        # Add CORS headers for development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_GET(self):
        # Serve index.html for root path
        if self.path == '/':
            self.path = '/index.html'
        
        # Serve specific ML files
        if self.path == '/ml':
            self.path = '/tetrohash_ml.html'
        elif self.path == '/dashboard':
            self.path = '/ml_dashboard.html'
        elif self.path == '/sound':
            self.path = '/working_with_sound.html'
        elif self.path == '/working':
            self.path = '/working.html'
        elif self.path == '/test':
            self.path = '/test_sat_rewards.html'
        elif self.path == '/debug':
            self.path = '/debug_sat_rewards.html'
        elif self.path == '/calc':
            self.path = '/test_sat_calculation.html'
        
        return super().do_GET()

def start_server(port=8000):
    """Start the web server"""
    try:
        with socketserver.TCPServer(("", port), TetroHashHandler) as httpd:
            print(f"🌐 TetroHashUnlock Web Server")
            print(f"📡 Server running at http://localhost:{port}")
            print(f"🎮 Open your browser and start playing!")
            print(f"⏹️  Press Ctrl+C to stop the server")
            print("-" * 50)
            
            # Try to open browser automatically
            try:
                webbrowser.open(f'http://localhost:{port}')
                print("🚀 Browser opened automatically!")
            except:
                print("💡 Please open your browser manually")
            
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n👋 Server stopped. Thanks for playing TetroHashUnlock!")
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Port {port} is already in use. Trying port {port + 1}...")
            start_server(port + 1)
        else:
            print(f"❌ Error starting server: {e}")

def main():
    """Main entry point"""
    print("🧱 TetroHashUnlock v2.0 — Web Frontend")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not os.path.exists('index.html'):
        print("❌ index.html not found. Please run from the TetroHashUnlock directory.")
        sys.exit(1)
    
    # Start server
    start_server()

if __name__ == "__main__":
    main()

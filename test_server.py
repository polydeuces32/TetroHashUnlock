#!/usr/bin/env python3
"""
Minimal test server for Railway deployment
"""

from flask import Flask, jsonify
import os

app = Flask(__name__)

@app.route('/')
def home():
    return '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>TetroHashUnlock Test</title>
    </head>
    <body>
        <h1>🎮 TetroHashUnlock Test Server</h1>
        <p>Server is running!</p>
        <p>Port: ''' + str(os.environ.get('PORT', '8080')) + '''</p>
    </body>
    </html>
    '''

@app.route('/api/health')
def health():
    return jsonify({
        'status': 'healthy',
        'port': os.environ.get('PORT', '8080'),
        'message': 'Test server is working!'
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)
else:
    print("Test server ready for gunicorn...")

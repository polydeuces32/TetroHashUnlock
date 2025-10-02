#!/bin/bash

echo "🎮 Starting TetroHashUnlock on Railway..."
echo "🔍 PORT environment variable: $PORT"
echo "🔍 Working directory: $(pwd)"
echo "🔍 Files in directory: $(ls -la)"

# Initialize database
python3 -c "import sqlite3; import os; print('📊 Initializing database...'); conn = sqlite3.connect('tetrohash.db'); print('✅ Database connection successful'); conn.close(); print('✅ Database initialized')"

# Start the server
echo "🚀 Starting Gunicorn server..."
exec gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 --keep-alive 2 server:app

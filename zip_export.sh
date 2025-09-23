#!/bin/bash
# TetroHashUnlock v2.0 — Export Script
# Author: Giancarlo Vizhnay

echo "📦 Creating TetroHashUnlock distribution package..."

# Create timestamp for unique filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
PACKAGE_NAME="TetroHashUnlock_v2.0_${TIMESTAMP}"

# Create temporary directory
mkdir -p "/tmp/${PACKAGE_NAME}"

# Copy all project files
cp ascii_tetris.py "/tmp/${PACKAGE_NAME}/"
cp bitcoin_logic.py "/tmp/${PACKAGE_NAME}/"
cp reward.py "/tmp/${PACKAGE_NAME}/"
cp tetrohash_unlock.py "/tmp/${PACKAGE_NAME}/"
cp README.md "/tmp/${PACKAGE_NAME}/"

# Copy assets directory
cp -r assets "/tmp/${PACKAGE_NAME}/"

# Create requirements.txt
cat > "/tmp/${PACKAGE_NAME}/requirements.txt" << EOF
requests>=2.25.0
EOF

# Create run script
cat > "/tmp/${PACKAGE_NAME}/run.sh" << 'EOF'
#!/bin/bash
echo "🧱 Starting TetroHashUnlock v2.0..."
python3 tetrohash_unlock.py
EOF

chmod +x "/tmp/${PACKAGE_NAME}/run.sh"

# Create Windows batch file
cat > "/tmp/${PACKAGE_NAME}/run.bat" << 'EOF'
@echo off
echo 🧱 Starting TetroHashUnlock v2.0...
python tetrohash_unlock.py
pause
EOF

# Create installation script
cat > "/tmp/${PACKAGE_NAME}/install.sh" << 'EOF'
#!/bin/bash
echo "🔧 Installing TetroHashUnlock dependencies..."

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    echo "Please install Python 3.7+ and try again."
    exit 1
fi

# Install requirements
echo "📦 Installing Python packages..."
pip3 install -r requirements.txt

echo "✅ Installation complete!"
echo "Run './run.sh' to start the game"
EOF

chmod +x "/tmp/${PACKAGE_NAME}/install.sh"

# Create zip package
cd /tmp
zip -r "${PACKAGE_NAME}.zip" "${PACKAGE_NAME}/"

# Move to current directory
mv "${PACKAGE_NAME}.zip" "$(pwd)/"

# Cleanup
rm -rf "/tmp/${PACKAGE_NAME}"

echo "✅ Package created: ${PACKAGE_NAME}.zip"
echo "📁 Contents:"
echo "  - ascii_tetris.py (Core Tetris engine)"
echo "  - bitcoin_logic.py (SHA-256 puzzle logic)"
echo "  - reward.py (SAT rewards & Lightning)"
echo "  - tetrohash_unlock.py (Main game)"
echo "  - assets/ (Coin animations)"
echo "  - README.md (Documentation)"
echo "  - requirements.txt (Dependencies)"
echo "  - run.sh / run.bat (Launch scripts)"
echo "  - install.sh (Installation script)"
echo ""
echo "🚀 To distribute:"
echo "  1. Share the zip file"
echo "  2. Recipients extract and run './install.sh'"
echo "  3. Then run './run.sh' to play!"

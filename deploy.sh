#!/bin/bash

# TetroHashUnlock Deployment Script
echo "🚀 TetroHashUnlock Deployment Script"
echo "===================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit: TetroHashUnlock game with API"
fi

# Check if remote exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "🔗 Please add a GitHub remote:"
    echo "   git remote add origin https://github.com/yourusername/TetroHashUnlock.git"
    echo "   git push -u origin main"
    exit 1
fi

# Push to GitHub
echo "📤 Pushing to GitHub..."
git add .
git commit -m "Deploy TetroHashUnlock with API server"
git push origin main

echo ""
echo "✅ Code pushed to GitHub!"
echo ""
echo "🌐 Now deploy to Railway:"
echo "1. Go to: https://railway.app"
echo "2. Sign up with GitHub"
echo "3. Click 'New Project' → 'Deploy from GitHub repo'"
echo "4. Select 'TetroHashUnlock'"
echo "5. Click 'Deploy'"
echo ""
echo "🎮 Your game will be live at the Railway URL!"
echo ""
echo "📊 Current GitHub Pages (static): https://polydeuces32.github.io/TetroHashUnlock/"
echo "🚀 Railway (with API): Will be available after deployment"

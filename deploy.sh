#!/bin/bash
# TetroHashUnlock v2.0 - Deployment Script
# Author: Giancarlo Vizhnay

echo "🚀 TetroHashUnlock v2.0 - Deployment Script"
echo "=============================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

# Add remote origin if not exists
if ! git remote | grep -q "origin"; then
    echo "🔗 Adding remote origin..."
    git remote add origin https://github.com/polydeuces32/TetroHashUnlock.git
    echo "✅ Remote origin added"
else
    echo "✅ Remote origin already exists"
fi

# Add all files
echo "📁 Adding files to Git..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "ℹ️  No changes to commit"
else
    # Commit changes
    echo "💾 Committing changes..."
    git commit -m "Deploy TetroHashUnlock v2.0 - Bitcoin Tetris with ML AI"
    echo "✅ Changes committed"
fi

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment Successful!"
    echo "========================="
    echo "🌐 Live Site: https://polydeuces32.github.io/TetroHashUnlock/"
    echo "📚 Repository: https://github.com/polydeuces32/TetroHashUnlock"
    echo ""
    echo "🎮 Game Modes Available:"
    echo "  • Normal Tetris: https://polydeuces32.github.io/TetroHashUnlock/working.html"
    echo "  • Sound Edition: https://polydeuces32.github.io/TetroHashUnlock/working_with_sound.html"
    echo "  • ML AI Edition: https://polydeuces32.github.io/TetroHashUnlock/tetrohash_ml.html"
    echo "  • AI Dashboard: https://polydeuces32.github.io/TetroHashUnlock/ml_dashboard.html"
    echo ""
    echo "📖 Next Steps:"
    echo "  1. Enable GitHub Pages in repository settings"
    echo "  2. Select 'Deploy from a branch'"
    echo "  3. Choose 'main' branch and '/ (root)' folder"
    echo "  4. Your site will be live in a few minutes!"
    echo ""
else
    echo "❌ Deployment failed. Please check your Git configuration and try again."
    echo ""
    echo "🔧 Troubleshooting:"
    echo "  1. Make sure you have GitHub access configured"
    echo "  2. Check if the repository exists: https://github.com/polydeuces32/TetroHashUnlock"
    echo "  3. Verify your Git credentials"
    echo ""
fi

#!/bin/bash

# TetroHashUnlock Railway Deployment Script
echo "🚀 Deploying TetroHashUnlock to Railway..."
echo "=========================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔐 Logging into Railway..."
railway login

# Link to existing project
echo "🔗 Linking to Railway project..."
railway link

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your game should be live at the Railway URL"
echo "📊 Check the Railway dashboard for the live URL"

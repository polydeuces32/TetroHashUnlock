# 🚀 FREE Deployment Guide for TetroHashUnlock

## 🆓 **100% FREE Options (No Credit Card Required)**

---

## 1. 🌟 **Railway** (Recommended - Best for API)

### Why Railway?
- ✅ **100% FREE** (no credit card needed)
- ✅ **Automatic deployments** from GitHub
- ✅ **Built-in database** (PostgreSQL)
- ✅ **Custom domains** included
- ✅ **HTTPS** automatically enabled
- ✅ **Easy setup** (5 minutes)

### Deploy to Railway:

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Add API server and deployment config"
   git push origin main
   ```

2. **Go to Railway**:
   - Visit: https://railway.app
   - Sign up with GitHub
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your TetroHashUnlock repository

3. **Configure Environment**:
   - Railway will auto-detect Python
   - Add environment variable: `RAILWAY_ENVIRONMENT=true`
   - Deploy!

4. **Get Your URL**:
   - Railway gives you a URL like: `https://tetrohashunlock-production.up.railway.app`
   - Your game will be live at this URL!

---

## 2. 🌐 **GitHub Pages** (Already Working!)

### Current Status:
✅ **Already deployed** at: https://polydeuces32.github.io/TetroHashUnlock/

### For API Version:
1. Create a separate branch for API
2. Deploy static files to GitHub Pages
3. Use Railway for API backend

---

## 3. 🔥 **Render** (Alternative Free Option)

### Why Render?
- ✅ **100% FREE** tier
- ✅ **Automatic deployments**
- ✅ **Custom domains**
- ✅ **HTTPS** included

### Deploy to Render:

1. **Create render.yaml**:
   ```yaml
   services:
     - type: web
       name: tetrohashunlock
       env: python
       buildCommand: pip install -r requirements.txt
       startCommand: python3 server.py
   ```

2. **Deploy**:
   - Go to https://render.com
   - Connect GitHub
   - Select repository
   - Deploy!

---

## 4. 🐳 **Vercel** (For Static + API)

### Deploy to Vercel:

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

3. **Configure**:
   - Add `vercel.json` for Python support
   - Deploy!

---

## 🎯 **Recommended: Railway (Easiest)**

### Step-by-Step Railway Deployment:

1. **Prepare Repository**:
   ```bash
   # Make sure all files are committed
   git add .
   git commit -m "Ready for Railway deployment"
   git push origin main
   ```

2. **Deploy on Railway**:
   - Go to https://railway.app
   - Sign up with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select "TetroHashUnlock"
   - Click "Deploy"

3. **Configure**:
   - Railway auto-detects Python
   - Add environment variable: `RAILWAY_ENVIRONMENT=true`
   - Wait for deployment (2-3 minutes)

4. **Access Your Game**:
   - Railway provides a URL like: `https://tetrohashunlock-production.up.railway.app`
   - Your game is now live!

---

## 🔧 **Local Testing (Fixed Port Issue)**

### Start Local Server:
```bash
# Use different port to avoid AirPlay conflict
PORT=3000 python3 server.py

# Or kill AirPlay and use port 5000
sudo lsof -ti:5000 | xargs kill -9
python3 server.py
```

### Test Locally:
```bash
# Test API
curl http://localhost:3000/api/health

# Open game
open http://localhost:3000/
```

---

## 📊 **Cost Comparison**

| Platform | Cost | Database | Custom Domain | HTTPS | Setup Time |
|----------|------|----------|---------------|-------|------------|
| **Railway** | FREE | ✅ | ✅ | ✅ | 5 min |
| **Render** | FREE | ✅ | ✅ | ✅ | 10 min |
| **Vercel** | FREE | ❌ | ✅ | ✅ | 15 min |
| **GitHub Pages** | FREE | ❌ | ✅ | ✅ | 0 min |
| **Heroku** | $7/month | ✅ | ✅ | ✅ | 20 min |

---

## 🎉 **Quick Start (Railway)**

### 1. Push to GitHub:
```bash
git add .
git commit -m "Add API server for Railway deployment"
git push origin main
```

### 2. Deploy on Railway:
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Click "Deploy"

### 3. Get Your Live URL:
- Railway gives you a URL like: `https://tetrohashunlock-production.up.railway.app`
- Share this URL with players!

---

## 🌟 **Why Railway is Best for You**

✅ **Completely FREE** - No credit card required  
✅ **5-minute setup** - Just connect GitHub and deploy  
✅ **Automatic updates** - Push to GitHub, auto-deploy  
✅ **Built-in database** - SQLite works, PostgreSQL available  
✅ **Custom domain** - Add your own domain later  
✅ **HTTPS included** - Secure by default  
✅ **24/7 uptime** - Always available  

---

## 🚀 **Next Steps After Deployment**

1. **Test your live game** at the Railway URL
2. **Share the URL** with friends and players
3. **Monitor usage** in Railway dashboard
4. **Add custom domain** (optional)
5. **Scale up** if needed (Railway has paid tiers)

---

**Your TetroHashUnlock game will be live and playable by anyone with the URL!** 🎮✨

*No credit card required, completely free deployment!*

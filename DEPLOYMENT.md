# 🚀 Deployment Guide - TetroHashUnlock

## GitHub Pages Deployment

### Automatic Deployment (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit: TetroHashUnlock v2.0"
   git push origin main
   ```

2. **Enable GitHub Pages**:
   - Go to your repository settings
   - Navigate to "Pages" section
   - Select "Deploy from a branch"
   - Choose "main" branch
   - Select "/ (root)" folder
   - Click "Save"

3. **Access Your Site**:
   - Your site will be available at: `https://polydeuces32.github.io/TetroHashUnlock/`
   - GitHub Actions will automatically deploy on every push

### Manual Deployment

1. **Clone Repository**:
   ```bash
   git clone https://github.com/polydeuces32/TetroHashUnlock.git
   cd TetroHashUnlock
   ```

2. **Install Dependencies**:
   ```bash
   # Python dependencies (if any)
   pip install -r requirements.txt
   
   # Node.js dependencies (if any)
   npm install
   ```

3. **Test Locally**:
   ```bash
   python3 server.py
   # Visit http://localhost:8000
   ```

4. **Deploy to GitHub Pages**:
   ```bash
   # Install gh-pages tool
   npm install -g gh-pages
   
   # Deploy to GitHub Pages
   gh-pages -d . -b gh-pages
   ```

## Repository Setup

### 1. Create GitHub Repository

1. Go to [GitHub](https://github.com)
2. Click "New repository"
3. Name: `TetroHashUnlock`
4. Description: `Bitcoin Tetris with SHA-256 Puzzles + Machine Learning AI + Sound Effects`
5. Set to Public
6. Initialize with README: No (we have our own)
7. Click "Create repository"

### 2. Initialize Local Repository

```bash
# Initialize git repository
git init

# Add remote origin
git remote add origin https://github.com/polydeuces32/TetroHashUnlock.git

# Add all files
git add .

# Initial commit
git commit -m "Initial commit: TetroHashUnlock v2.0 - Bitcoin Tetris with ML AI"

# Push to GitHub
git push -u origin main
```

### 3. Configure GitHub Pages

1. Go to repository settings
2. Scroll to "Pages" section
3. Source: "Deploy from a branch"
4. Branch: "main"
5. Folder: "/ (root)"
6. Save settings

## File Structure for Deployment

```
TetroHashUnlock/
├── index.html                 # Main landing page
├── working.html              # Basic Tetris game
├── working_with_sound.html   # Sound effects version
├── tetrohash_ml.html         # ML AI version
├── ml_dashboard.html         # AI training dashboard
├── sound_system.js           # Audio system
├── ml_ai_system.js           # Machine learning AI
├── ml_training_collector.js  # Data collection
├── ascii_tetris.py           # Python backend
├── bitcoin_logic.py          # Bitcoin puzzle system
├── reward.py                 # SAT rewards system
├── server.py                 # HTTP server
├── README.md                 # Project documentation
├── ML_README.md              # AI system docs
├── .gitignore               # Git ignore rules
├── .github/workflows/       # GitHub Actions
├── requirements.txt         # Python dependencies
├── package.json             # Node.js dependencies
└── LICENSE                  # MIT License
```

## GitHub Actions Workflow

The project includes an automatic deployment workflow:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
```

## Custom Domain (Optional)

1. **Add CNAME file**:
   ```bash
   echo "your-domain.com" > CNAME
   git add CNAME
   git commit -m "Add custom domain"
   git push
   ```

2. **Configure DNS**:
   - Add CNAME record pointing to `polydeuces32.github.io`
   - Wait for DNS propagation (up to 24 hours)

## Testing Deployment

### Local Testing
```bash
# Start local server
python3 server.py

# Test all game modes
curl http://localhost:8000/working
curl http://localhost:8000/sound
curl http://localhost:8000/ml
curl http://localhost:8000/dashboard
```

### Production Testing
```bash
# Test deployed site
curl https://polydeuces32.github.io/TetroHashUnlock/
curl https://polydeuces32.github.io/TetroHashUnlock/working.html
curl https://polydeuces32.github.io/TetroHashUnlock/tetrohash_ml.html
```

## Troubleshooting

### Common Issues

1. **404 Errors**:
   - Check file paths are correct
   - Ensure files are committed and pushed
   - Verify GitHub Pages is enabled

2. **JavaScript Errors**:
   - Check browser console for errors
   - Verify all JS files are loading
   - Test with different browsers

3. **Python Server Issues**:
   - Ensure Python 3.8+ is installed
   - Check all dependencies are available
   - Verify file permissions

4. **GitHub Actions Failures**:
   - Check workflow logs in Actions tab
   - Verify repository permissions
   - Ensure all required files exist

### Debug Commands

```bash
# Check git status
git status

# Check remote origin
git remote -v

# Check branch
git branch

# Check last commit
git log --oneline -5

# Test Python files
python3 -m py_compile *.py

# Test HTML files
python3 -m http.server 8000
```

## Performance Optimization

### For GitHub Pages

1. **Minimize file sizes**:
   - Compress images
   - Minify CSS/JS (optional)
   - Remove unused files

2. **Optimize loading**:
   - Use CDN for external libraries
   - Implement lazy loading
   - Cache static assets

3. **Mobile optimization**:
   - Responsive design
   - Touch controls
   - Mobile-friendly UI

## Security Considerations

1. **No sensitive data** in client-side code
2. **HTTPS only** for production
3. **Input validation** for user data
4. **Rate limiting** for API calls (if any)

## Monitoring

1. **GitHub Pages analytics** (if enabled)
2. **Browser console** for errors
3. **User feedback** via GitHub Issues
4. **Performance monitoring** with browser dev tools

## Updates and Maintenance

### Regular Updates
```bash
# Pull latest changes
git pull origin main

# Make updates
# ... edit files ...

# Commit and push
git add .
git commit -m "Update: [description]"
git push origin main
```

### Version Management
- Use semantic versioning (v2.0.0)
- Tag releases: `git tag v2.0.0`
- Push tags: `git push origin v2.0.0`

---

**🎮 Your TetroHashUnlock game is now ready for the world!**

**Live Site**: https://polydeuces32.github.io/TetroHashUnlock/

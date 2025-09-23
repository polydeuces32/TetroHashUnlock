# TetroHashUnlock v2.0 — Web Frontend

## 🎮 Modern Web-Based Bitcoin Tetris Game

A beautiful, interactive web frontend for TetroHashUnlock that brings the terminal game to the browser with modern UI/UX design.

## ✨ Features

### 🎨 **Modern UI Design**
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Dark Theme** - Bitcoin-inspired color scheme with gold accents
- **Smooth Animations** - Coin drop effects, line clear animations
- **Interactive Controls** - Keyboard and touch controls

### 🧱 **Game Modes**
- **Normal Tetris** - Classic falling block gameplay
- **Bitcoin Puzzle Mode** - Solve SHA-256 puzzles for SAT rewards
- **Lightning Mode** - Real Lightning Network payouts (coming soon)

### 🎯 **Game Features**
- **Real-time Gameplay** - Smooth 60fps rendering
- **Visual Effects** - Particle effects, animations, sound
- **SAT Wallet** - Track your earnings
- **Puzzle System** - Interactive Bitcoin hash puzzles
- **Touch Controls** - Mobile-friendly touch interface

## 🚀 Quick Start

### **Option 1: Python Server (Recommended)**
```bash
# Start the web server
python3 server.py

# Open your browser to http://localhost:8000
```

### **Option 2: Any Web Server**
```bash
# Serve the files with any web server
# Examples:
python3 -m http.server 8000
# or
npx serve .
# or
php -S localhost:8000
```

## 🎮 How to Play

### **Game Controls**
- **A / ←** - Move piece left
- **D / →** - Move piece right
- **S / ↓** - Drop piece faster
- **Space / W / ↑** - Rotate piece
- **P** - Check puzzle solution (Puzzle Mode)
- **Q** - Quit game
- **Escape** - Return to mode selection

### **Touch Controls (Mobile)**
- **←** - Move left
- **→** - Move right
- **↻** - Rotate
- **↓** - Hard drop

### **Game Modes**

#### **Normal Tetris**
- Classic Tetris gameplay
- Clear lines to score points
- Level progression increases speed

#### **Bitcoin Puzzle Mode**
- Each tetromino has a hidden preimage string
- Target SHA-256 hash is displayed
- Place the correct piece to solve the puzzle
- Earn SAT rewards for successful solutions

#### **Lightning Mode**
- Same as Puzzle Mode
- Real Lightning Network payouts
- Requires API configuration

## 🏗️ Technical Architecture

### **Frontend Stack**
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with Grid/Flexbox
- **Vanilla JavaScript** - No frameworks, pure performance
- **Web Audio API** - Sound effects
- **Canvas API** - Game rendering

### **File Structure**
```
TetroHashUnlock/
├── index.html          # Main HTML file
├── styles.css          # CSS styles
├── game.js             # Game logic
├── ui.js               # UI management
├── app.js              # Main application
├── server.py           # Python web server
└── WEB_FRONTEND_README.md
```

### **Key Classes**
- **`TetroHashGame`** - Core game logic
- **`GameUI`** - UI management and rendering
- **`TetroHashApp`** - Main application controller

## 🎨 UI Components

### **Game Board**
- 10x20 grid with smooth animations
- Real-time piece rendering
- Visual feedback for piece placement

### **Info Panels**
- **Stats Panel** - Score, lines, level
- **Puzzle Panel** - Bitcoin hash puzzles
- **Wallet Panel** - SAT balance tracking
- **Next Piece** - Preview of upcoming piece
- **Controls** - Keyboard shortcuts

### **Animations**
- **Coin Drop** - SAT reward animations
- **Line Clear** - Explosive line clearing effects
- **Piece Movement** - Smooth piece transitions
- **UI Transitions** - Fade in/out effects

## 🔧 Customization

### **Colors and Themes**
Edit `styles.css` to customize:
- Color scheme
- Animations
- Layout
- Typography

### **Game Settings**
Modify `game.js` for:
- Grid size
- Piece shapes
- Scoring system
- Difficulty levels

### **UI Layout**
Update `index.html` and `styles.css` for:
- Layout changes
- New components
- Responsive breakpoints

## 📱 Mobile Support

### **Touch Controls**
- Automatic touch control detection
- Responsive button layout
- Gesture support

### **Responsive Design**
- Mobile-first approach
- Flexible grid layouts
- Optimized for small screens

## 🎵 Sound Effects

### **Audio Features**
- Web Audio API integration
- Sound effect triggers
- Volume control
- Performance optimized

### **Sound Events**
- Piece placement
- Line clearing
- Puzzle solving
- Game over

## 🚀 Performance

### **Optimizations**
- 60fps game loop
- Efficient rendering
- Memory management
- Smooth animations

### **Browser Support**
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Web Audio API support
- Canvas API support
- ES6+ JavaScript features

## 🐛 Troubleshooting

### **Common Issues**

1. **Game not loading**
   - Check browser console for errors
   - Ensure all files are served correctly
   - Try refreshing the page

2. **Controls not working**
   - Click on the game area first
   - Check if browser has focus
   - Try different keyboard keys

3. **Mobile touch not working**
   - Ensure touch controls are enabled
   - Check device compatibility
   - Try different browsers

### **Debug Mode**
Open browser console (F12) to see:
- Game state information
- Performance metrics
- Error messages
- Debug logs

## 🔮 Future Features

### **Planned Updates**
- **Multiplayer Mode** - Real-time multiplayer
- **Leaderboards** - Global high scores
- **Achievements** - Unlockable rewards
- **Themes** - Multiple visual themes
- **Sound Packs** - Custom sound effects
- **Save System** - Local game saves

### **Lightning Integration**
- Real Lightning Network payouts
- Invoice generation
- Payment verification
- Wallet integration

## 📄 License

MIT License - Feel free to modify and distribute!

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the browser console for errors
- Review this README
- Open an issue on GitHub

---

**Enjoy playing TetroHashUnlock! 🧱⚡**

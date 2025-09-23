# 🧱 TetroHashUnlock v2.0

**Bitcoin Tetris with SHA-256 Puzzles + Machine Learning AI + Sound Effects!**

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://polydeuces32.github.io/TetroHashUnlock/)
[![Python](https://img.shields.io/badge/Python-3.8+-blue)](https://python.org)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-ML-orange)](https://tensorflow.org/js)

## 🎮 Play Now!

**🌐 [Live Demo](https://polydeuces32.github.io/TetroHashUnlock/)**

### Game Modes:
- **🧱 [Normal Tetris](https://polydeuces32.github.io/TetroHashUnlock/working.html)** - Classic Tetris with SAT rewards
- **🔐 [Bitcoin Puzzle](https://polydeuces32.github.io/TetroHashUnlock/working.html)** - Solve SHA-256 puzzles for SATs
- **🤖 [ML AI Edition](https://polydeuces32.github.io/TetroHashUnlock/tetrohash_ml.html)** - Machine Learning AI assistant
- **🔊 [Sound Edition](https://polydeuces32.github.io/TetroHashUnlock/working_with_sound.html)** - Full sound effects
- **📊 [ML Dashboard](https://polydeuces32.github.io/TetroHashUnlock/ml_dashboard.html)** - AI training monitor

## 🚀 Features

### 🎯 Core Gameplay
- **Classic Tetris mechanics** with falling tetromino pieces
- **Real-time line clearing** with satisfying animations
- **Multiple difficulty levels** that increase with performance
- **Intuitive controls** (Arrow keys + Space for rotation)

### ₿ Bitcoin Integration
- **SHA-256 hash puzzles** using real Bitcoin Script logic
- **Hidden preimages** for each tetromino piece
- **Cryptographic verification** with `OP_SHA256`, `OP_EQUAL`, `OP_VERIFY`
- **SAT rewards** for solving puzzles and clearing lines

### 🤖 Machine Learning AI
- **Neural network** for intelligent move prediction
- **Real-time learning** from player behavior
- **Multiple AI modes**: Assist, Battle, Learning
- **Performance monitoring** with live metrics

### 🔊 Sound Effects
- **Coin drop sounds** for every line cleared
- **SAT reward notifications** with audio feedback
- **Background music** and ambient sounds
- **Volume controls** and mute options

### 💰 SAT Rewards System
- **1 SAT per line cleared** during gameplay
- **Final score bonuses** based on performance
- **Level-based rewards** for progression
- **High score bonuses** for exceptional play

## 🎮 How to Play

### Controls
- **← →** Move piece left/right
- **↓** Drop piece faster
- **↑** or **Space** Rotate piece
- **P** Check puzzle solution (in puzzle mode)
- **Q** Quit game

### Game Modes

#### 🧱 Normal Tetris
- Classic falling blocks gameplay
- Earn 1 SAT per line cleared
- Score-based final rewards
- Level progression system

#### 🔐 Bitcoin Puzzle Mode
- Each piece has a hidden preimage string
- Solve SHA-256 puzzles to earn SATs
- Real cryptographic verification
- Bitcoin Script simulation

#### 🤖 ML AI Mode
- AI assistant provides move suggestions
- Real-time confidence scores
- Learning from your gameplay
- Performance analytics

## 🛠️ Technical Stack

### Frontend
- **HTML5** - Game structure and UI
- **CSS3** - Modern styling with gradients and animations
- **JavaScript ES6+** - Game logic and interactions
- **TensorFlow.js** - Machine learning framework
- **Web Audio API** - Sound effects and music

### Backend
- **Python 3.8+** - Server and game logic
- **Bitcoin Script** - Cryptographic puzzle system
- **SHA-256** - Hash verification
- **HTTP Server** - Local development server

### AI/ML
- **Neural Networks** - Move prediction
- **Feature Extraction** - Board state analysis
- **Reinforcement Learning** - Adaptive gameplay
- **Real-time Training** - Continuous improvement

## 🚀 Quick Start

### Local Development
```bash
# Clone the repository
git clone https://github.com/polydeuces32/TetroHashUnlock.git
cd TetroHashUnlock

# Start the server
python3 server.py

# Open in browser
open http://localhost:8000
```

### GitHub Pages Deployment
The project is automatically deployed to GitHub Pages:
- **Main site**: `https://polydeuces32.github.io/TetroHashUnlock/`
- **Individual games**: `https://polydeuces32.github.io/TetroHashUnlock/[game].html`

## 📁 Project Structure

```
TetroHashUnlock/
├── 🎮 Game Files
│   ├── working.html              # Basic Tetris game
│   ├── working_with_sound.html   # Sound effects version
│   ├── tetrohash_ml.html         # ML AI version
│   └── ml_dashboard.html         # AI training dashboard
├── 🐍 Python Backend
│   ├── ascii_tetris.py          # Core Tetris engine
│   ├── bitcoin_logic.py         # Bitcoin puzzle system
│   ├── reward.py                # SAT rewards system
│   └── server.py                # HTTP server
├── 🤖 AI System
│   ├── ml_ai_system.js          # Machine learning AI
│   ├── ml_training_collector.js # Data collection
│   └── sound_system.js          # Audio system
├── 📚 Documentation
│   ├── README.md                # This file
│   ├── ML_README.md             # AI system docs
│   └── WEB_FRONTEND_README.md   # Frontend docs
└── 🧪 Testing
    ├── test_game.py             # Game tests
    ├── test_sat_calculation.html # SAT calculator
    └── debug_sat_rewards.html   # Debug tools
```

## 🎯 Game Modes Explained

### 🧱 Normal Tetris
The classic Tetris experience with Bitcoin rewards:
- Clear lines to earn SATs
- Score-based final rewards
- Level progression
- High score tracking

### 🔐 Bitcoin Puzzle Mode
Cryptographic puzzle solving:
- Each tetromino has a hidden preimage
- Target SHA-256 hash is displayed
- Place the correct piece to solve
- Earn bonus SATs for solving puzzles

### 🤖 ML AI Mode
Machine learning integration:
- AI provides move suggestions
- Real-time confidence scores
- Learning from player behavior
- Performance analytics dashboard

## 💰 SAT Rewards System

### During Gameplay
- **1 SAT per line cleared** (real-time)
- **Coin drop sounds** for each reward
- **Floating notifications** showing earned SATs

### Final Score Rewards
- **Base reward**: 1 SAT for playing
- **Score-based**: 1 SAT per 1,000 points
- **Line-based**: 1 SAT per line cleared
- **Level-based**: 1 SAT per level reached
- **High score bonuses**: 5-20 extra SATs

### Example Calculation
```
Score: 5,000
Lines: 10
Level: 2

Rewards:
- Base: 1 SAT
- Score: 5 SATs (5,000 ÷ 1,000)
- Lines: 10 SATs
- Level: 2 SATs
- Total: 18 SATs
```

## 🤖 AI System

### Neural Network Architecture
- **Input Layer**: 200 features (board state + piece info)
- **Hidden Layers**: 128 → 64 → 32 units (ReLU)
- **Output Layer**: 4 units (move probabilities)
- **Dropout**: 0.2 for regularization

### Training Process
- **Data Collection**: Real-time gameplay recording
- **Feature Extraction**: Board state analysis
- **Model Training**: TensorFlow.js optimization
- **Performance Monitoring**: Live accuracy metrics

## 🔊 Sound System

### Audio Features
- **Coin drop sounds** for line clears
- **SAT reward notifications** with audio
- **Background music** (optional)
- **Volume controls** and mute options
- **Web Audio API** for high-quality sound

### Sound Effects
- **Piece movement** - Satisfying click sounds
- **Line clearing** - Ascending chord progressions
- **Tetris (4 lines)** - Special victory melody
- **Puzzle solving** - Victory fanfare
- **Coin rewards** - Cascading coin drops

## 🧪 Testing & Debugging

### Test Pages
- **SAT Calculator**: `/calc` - Test reward calculations
- **Debug Tools**: `/debug` - Debug SAT rewards
- **Sound Test**: `/test` - Test audio system

### Debug Features
- **Console logging** for all game events
- **Real-time metrics** in ML dashboard
- **Performance monitoring** with live stats
- **Error handling** with user-friendly messages

## 🚀 Deployment

### GitHub Pages
The project is automatically deployed to GitHub Pages:
1. Push changes to `main` branch
2. GitHub Pages automatically builds and deploys
3. Site available at `https://polydeuces32.github.io/TetroHashUnlock/`

### Local Development
```bash
# Start development server
python3 server.py

# Access different game modes
http://localhost:8000/working          # Basic game
http://localhost:8000/sound            # Sound version
http://localhost:8000/ml               # ML AI version
http://localhost:8000/dashboard        # AI dashboard
```

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Clone your fork locally
3. Make changes and test
4. Submit a pull request

### Code Style
- **Python**: PEP 8 compliance
- **JavaScript**: ES6+ with modern syntax
- **HTML/CSS**: Semantic markup and modern CSS

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Tetris** creators for the classic game mechanics
- **Bitcoin** community for cryptographic inspiration
- **TensorFlow.js** team for the ML framework
- **Web Audio API** for sound capabilities

## 🔗 Links

- **🌐 Live Demo**: [https://polydeuces32.github.io/TetroHashUnlock/](https://polydeuces32.github.io/TetroHashUnlock/)
- **📚 Documentation**: [ML_README.md](ML_README.md)
- **🐛 Issues**: [GitHub Issues](https://github.com/polydeuces32/TetroHashUnlock/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/polydeuces32/TetroHashUnlock/discussions)

---

**🎮 Ready to play the future of Tetris with Bitcoin rewards and AI assistance!**

[![Play Now](https://img.shields.io/badge/Play%20Now-Start%20Game-brightgreen)](https://polydeuces32.github.io/TetroHashUnlock/)
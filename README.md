# Harry Potter: Wizarding Defense 🧙‍♂️⚡

A thrilling wizard action game built with React, TypeScript, and Phaser 3, where players defend Hogwarts against dark forces using magical spells and strategic character switching.

![Game Preview](public/images/background.png)

## 🎮 Game Description

**Harry Potter: Wizarding Defense** is an action-packed survival shooter where players take control of iconic Harry Potter characters to defend against waves of dark wizards and magical creatures. Experience the wizarding world through intense spell combat, character-specific abilities, and strategic resource management.

### ✨ Key Features

- **🧙‍♂️ Multiple Playable Characters**: Play as Harry Potter, Hermione Granger, or Ron Weasley
- **⚔️ Dynamic Combat System**: Cast spells, use special abilities, and manage mana resources
- **👹 Diverse Enemies**: Face Death Eaters, Lucius Malfoy, Bellatrix Lestrange, Trolls, and Dementors
- **🔮 Character-Specific Abilities**:
  - Harry: Patronus Charm (anti-Dementor)
  - Hermione: Stupefy (stunning spell)
  - Ron: Wingardium Leviosa (floating spell)
- **🍗 Ron's Invincible Mode**: Activate by eating chicken drumsticks for 15 seconds of invulnerability
- **💙 Mana Management**: Strategic spell casting with auto-regenerating mana system
- **🏆 Firebase Integration**: User authentication and global leaderboards
- **🎵 Immersive Audio**: Character voices, background music, and sound effects
- **📱 Responsive Design**: Optimized for various screen sizes

### 🎯 Game Objectives

- Survive waves of increasingly difficult enemies
- Strategically switch between characters to utilize their unique abilities
- Manage mana resources for sustained combat
- Defeat powerful bosses including Lucius, Bellatrix, Trolls, and Dementors
- Achieve high scores and compete on global leaderboards

## 🎮 Controls

### Movement
- **Arrow Keys** (↑↓←→) or **WASD**: Move character in all directions

### Combat
- **Spacebar**: Cast basic spells (consumes 1 mana)
- **P Key**: Use character-specific special abilities

### Character Switching
- **1 Key**: Switch to Harry Potter
- **2 Key**: Switch to Hermione Granger  
- **3 Key**: Switch to Ron Weasley
- **15-second cooldown** applies to all character switches

### Game Management
- **Mouse**: Navigate menus and UI elements
- **ESC**: Access pause menu (when implemented)

## 🚀 Installation Instructions

### Prerequisites
- **Node.js** (version 16 or higher)
- **npm** or **yarn** package manager
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Step-by-Step Installation

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd HP
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Firebase Configuration** (Optional - for leaderboards)
   - Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Enable Authentication and Firestore Database
   - Update `firebase.config.ts` with your Firebase credentials

4. **Start Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open in Browser**
   - Navigate to `http://localhost:5173` (or the port shown in terminal)
   - Create an account or play as guest

### Production Build
```bash
npm run build
# or
yarn build
```

## ⚠️ Known Issues

### Current Limitations
- **Browser Compatibility**: Some older browsers may experience performance issues
- **Audio Autoplay**: Some browsers block autoplay - user interaction may be required for audio
- **Mobile Controls**: Touch controls not fully optimized for mobile devices
- **Save System**: No local progress saving - scores only saved when logged in

### Performance Considerations
- **Memory Usage**: Extended gameplay sessions may cause memory buildup
- **Large Textures**: Some image assets could be optimized for better loading times
- **Network Dependency**: Requires internet connection for Firebase features

### Minor Bugs
- Occasional texture loading delays on slower connections
- Character switching animation may overlap with combat animations
- Leaderboard sorting may require page refresh to update

## 🔮 Future Improvements

### Planned Features
- **🏰 Multiple Levels**: Hogwarts locations (Great Hall, Forbidden Forest, Diagon Alley)
- **📱 Mobile Support**: Touch controls and responsive mobile UI
- **👥 Multiplayer Mode**: Cooperative and competitive multiplayer gameplay
- **🎒 Inventory System**: Collectible items, potions, and spell upgrades
- **📖 Story Mode**: Campaign with cutscenes and progressive difficulty
- **🌟 Achievement System**: Unlockable achievements and rewards

### Technical Enhancements
- **🔧 Performance Optimization**: Better memory management and texture compression
- **💾 Local Storage**: Offline progress saving and settings persistence
- **🎮 Controller Support**: Gamepad integration for enhanced gameplay
- **🔊 Audio Manager**: Dynamic audio mixing and accessibility options
- **📊 Analytics**: Gameplay analytics for balance improvements

### Quality of Life Improvements
- **⚙️ Settings Menu**: Volume controls, key remapping, and display options
- **🏆 Extended Leaderboards**: Weekly/monthly leaderboards and stats tracking
- **🎨 Character Customization**: Unlockable skins and visual effects
- **📚 Tutorial System**: Interactive tutorial for new players
- **🌐 Localization**: Multiple language support

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript
- **Game Engine**: Phaser 3
- **Styling**: CSS3 with custom animations
- **Backend**: Firebase (Authentication, Firestore)
- **Build Tool**: Vite
- **Package Manager**: npm/yarn

## 📄 License

This project is for educational purposes. Harry Potter characters and universe are property of J.K. Rowling and Warner Bros.

## 🤝 Contributing

This is an educational project. For suggestions or bug reports, please create an issue in the repository.

---

**Made with ⚡ magic and ❤️ for the wizarding world** 
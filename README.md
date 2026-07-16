# IronMan: Sandbox Experience 🦾

A free-to-play sandbox game inspired by Roblox's Ironman games where you can test different Tony Stark armors in an open-world city environment.

![IronMan Sandbox](https://img.shields.io/badge/IronMan-Sandbox-red?style=for-the-badge&logo=marvel)
![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-blue?style=for-the-badge&logo=github)
![HTML5](https://img.shields.io/badge/HTML5-Game-orange?style=for-the-badge&logo=html5)

## 🎮 Features

### Multiple Armors
- **Mark III** - Classic balanced armor with iconic red and gold design
- **Mark XLII** - High-speed variant with enhanced maneuverability
- **Hulkbuster** - Heavy-duty armor with maximum power and defense
- **Bleeding Edge** - Advanced nanotech suit with superior performance
- **Stealth Suit** - Covert operations armor with enhanced agility

### Gameplay Mechanics
- **Free Flight System** - Soar through the city with realistic physics
- **Repulsor Blasts** - Fire energy projectiles from your palms
- **Unibeam** - Devastating chest beam attack
- **Boost Jets** - Quick vertical acceleration
- **Energy Management** - Strategic use of arc reactor power

### Environment
- Procedurally generated cityscape with 50+ buildings
- Dynamic lighting and particle effects
- Day/night skybox with atmospheric effects
- 3D depth-sorted rendering for immersive experience

## 🎯 Controls

| Key | Action |
|-----|--------|
| W / ↑ | Move Forward |
| S / ↓ | Move Backward |
| A / ← | Strafe Left |
| D / → | Strafe Right |
| SPACE | Fly Up |
| SHIFT | Fly Down |
| Mouse | Aim Direction |
| Click | Repulsor Blast |
| E | Unibeam Attack |
| R | Reset Position |

## 🚀 Quick Start

### Play Online
The game is automatically deployed to GitHub Pages. Visit:
```
https://<your-username>.github.io/<repo-name>/
```

### Local Development
1. Clone the repository:
```bash
git clone <repository-url>
cd <repository-directory>
```

2. Open `index.html` in any modern web browser, or use a local server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve
```

3. Navigate to `http://localhost:8000`

## 🏗️ Technical Details

- **Engine**: Pure JavaScript with Canvas 2D API
- **Rendering**: Custom 3D projection engine with depth sorting
- **Physics**: Velocity-based movement with gravity and air resistance
- **Particle System**: Dynamic effects for jets, blasts, and trails
- **Responsive Design**: Adapts to any screen size

## 📁 Project Structure

```
├── index.html          # Main HTML file with UI overlay
├── game.js            # Core game logic and rendering engine
├── README.md          # This file
└── .github/workflows/ # GitHub Actions for auto-deployment
```

## 🔧 Customization

### Adding New Armors
Edit the `armors` object in `game.js`:

```javascript
const armors = {
    newArmor: new Armor('Name', { 
        speed: 90, 
        power: 85, 
        defense: 95 
    }, {
        primary: '#color',
        secondary: '#color',
        accent: '#color'
    })
};
```

### Modifying City Generation
Adjust parameters in the `generateCity()` method:
- Building count
- Size ranges
- Color schemes

## 🎨 Inspired By

This game draws inspiration from:
- **Iron Man: Reimagined** (Roblox) - Armor selection and flight mechanics
- **Iron Man: Playground** (Roblox) - Sandbox freedom and ability testing
- Marvel's Iron Man comics and MCU films

## 📄 License

This project is open source and available for educational purposes.

## 🙏 Acknowledgments

- Marvel Comics for the Iron Man character
- Roblox community for inspiration
- Three.js documentation for 3D math references

---

**Suit up and take flight!** 🚀

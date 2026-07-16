// IronMan Sandbox Game - Main Game Logic
// Inspired by Roblox Ironman games

class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    add(v) {
        return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
    }

    multiply(scalar) {
        return new Vector3(this.x * scalar, this.y * scalar, this.z * scalar);
    }
}

class Particle {
    constructor(x, y, z, vx, vy, vz, color, life) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.vx = vx;
        this.vy = vy;
        this.vz = vz;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.size = Math.random() * 5 + 2;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.z += this.vz * dt;
        this.vy -= 9.8 * dt * 0.1; // gravity
        this.life -= dt;
        this.size *= 0.98;
    }

    isDead() {
        return this.life <= 0;
    }
}

class Projectile {
    constructor(x, y, z, vx, vy, vz, type = 'repulsor') {
        this.x = x;
        this.y = y;
        this.z = z;
        this.vx = vx;
        this.vy = vy;
        this.vz = vz;
        this.type = type;
        this.life = 2;
        this.size = type === 'unibeam' ? 15 : 8;
        this.color = type === 'unibeam' ? '#00ffff' : '#ffd700';
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.z += this.vz * dt;
        this.life -= dt;
    }

    isDead() {
        return this.life <= 0;
    }
}

class Armor {
    constructor(name, stats, colors) {
        this.name = name;
        this.stats = stats; // { speed, power, defense }
        this.colors = colors; // { primary, secondary, accent }
    }
}

const armors = {
    mark3: new Armor('Mark III', { speed: 85, power: 95, defense: 90 }, {
        primary: '#c41e3a',
        secondary: '#ffd700',
        accent: '#8b0000'
    }),
    mark42: new Armor('Mark XLII', { speed: 95, power: 90, defense: 85 }, {
        primary: '#c41e3a',
        secondary: '#ffd700',
        accent: '#ff6b6b'
    }),
    hulkbuster: new Armor('Hulkbuster', { speed: 50, power: 100, defense: 100 }, {
        primary: '#8b0000',
        secondary: '#ffd700',
        accent: '#4a0000'
    }),
    bleeding: new Armor('Bleeding Edge', { speed: 98, power: 98, defense: 92 }, {
        primary: '#c41e3a',
        secondary: '#ff4500',
        accent: '#8b0000'
    }),
    stealth: new Armor('Stealth Suit', { speed: 92, power: 85, defense: 88 }, {
        primary: '#2c3e50',
        secondary: '#34495e',
        accent: '#1a252f'
    })
};

class Game {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();

        this.player = {
            x: 0,
            y: 0,
            z: 0,
            vx: 0,
            vy: 0,
            vz: 0,
            rotation: 0,
            pitch: 0,
            currentArmor: 'mark3',
            energy: 100,
            isFlying: false
        };

        this.camera = {
            x: 0,
            y: 5,
            z: -15,
            distance: 20,
            angleY: 0,
            angleX: 0.2
        };

        this.particles = [];
        this.projectiles = [];
        this.buildings = [];
        this.keys = {};
        this.mouse = { x: 0, y: 0, down: false };

        this.generateCity();
        this.setupInput();
        this.lastTime = 0;

        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    generateCity() {
        for (let i = 0; i < 50; i++) {
            this.buildings.push({
                x: (Math.random() - 0.5) * 400,
                y: 0,
                z: (Math.random() - 0.5) * 400,
                width: Math.random() * 20 + 10,
                height: Math.random() * 80 + 20,
                depth: Math.random() * 20 + 10,
                color: `hsl(${Math.random() * 60 + 200}, 30%, ${Math.random() * 30 + 20}%)`
            });
        }
    }

    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') e.preventDefault();
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        document.addEventListener('mousedown', () => {
            this.mouse.down = true;
            this.fireRepulsor();
        });

        document.addEventListener('mouseup', () => {
            this.mouse.down = false;
        });

        // Armor selection
        document.querySelectorAll('.armor-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.armor-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.player.currentArmor = btn.dataset.armor;
                this.updateStats();
            });
        });
    }

    updateStats() {
        const armor = armors[this.player.currentArmor];
        document.getElementById('speed-stat').textContent = armor.stats.speed + '%';
        document.getElementById('power-stat').textContent = armor.stats.power + '%';
        document.getElementById('defense-stat').textContent = armor.stats.defense + '%';
    }

    fireRepulsor() {
        if (this.player.energy < 5) return;

        const armor = armors[this.player.currentArmor];
        this.player.energy -= 5;

        const dirX = Math.sin(this.player.rotation) * Math.cos(this.player.pitch);
        const dirZ = Math.cos(this.player.rotation) * Math.cos(this.player.pitch);
        const dirY = Math.sin(this.player.pitch);

        this.projectiles.push(new Projectile(
            this.player.x,
            this.player.y,
            this.player.z,
            dirX * 100,
            dirY * 100,
            dirZ * 100,
            'repulsor'
        ));

        // Add particles
        for (let i = 0; i < 10; i++) {
            this.particles.push(new Particle(
                this.player.x,
                this.player.y,
                this.player.z,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20,
                '#ffd700',
                0.5
            ));
        }
    }

    fireUnibeam() {
        if (this.player.energy < 30) return;

        this.player.energy -= 30;

        const dirX = Math.sin(this.player.rotation) * Math.cos(this.player.pitch);
        const dirZ = Math.cos(this.player.rotation) * Math.cos(this.player.pitch);
        const dirY = Math.sin(this.player.pitch);

        this.projectiles.push(new Projectile(
            this.player.x,
            this.player.y,
            this.player.z,
            dirX * 150,
            dirY * 150,
            dirZ * 150,
            'unibeam'
        ));

        // Add more particles
        for (let i = 0; i < 30; i++) {
            this.particles.push(new Particle(
                this.player.x,
                this.player.y,
                this.player.z,
                (Math.random() - 0.5) * 30,
                (Math.random() - 0.5) * 30,
                (Math.random() - 0.5) * 30,
                '#00ffff',
                0.8
            ));
        }
    }

    boost() {
        if (this.player.energy < 10) return;

        this.player.energy -= 10;
        const armor = armors[this.player.currentArmor];
        const boostPower = armor.stats.speed / 50;

        this.player.vy += boostPower * 20;

        // Add boost particles
        for (let i = 0; i < 20; i++) {
            this.particles.push(new Particle(
                this.player.x,
                this.player.y - 2,
                this.player.z,
                (Math.random() - 0.5) * 10,
                -Math.random() * 30,
                (Math.random() - 0.5) * 10,
                '#ff6b00',
                0.6
            ));
        }
    }

    resetPosition() {
        this.player.x = 0;
        this.player.y = 50;
        this.player.z = 0;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.vz = 0;
        this.player.energy = 100;
    }

    update(dt) {
        const armor = armors[this.player.currentArmor];
        const speedMultiplier = armor.stats.speed / 100;

        // Movement input
        const moveSpeed = 50 * speedMultiplier;
        const flyForce = 80 * speedMultiplier;

        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            this.player.vx += Math.sin(this.player.rotation) * moveSpeed * dt;
            this.player.vz += Math.cos(this.player.rotation) * moveSpeed * dt;
        }
        if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            this.player.vx -= Math.sin(this.player.rotation) * moveSpeed * dt;
            this.player.vz -= Math.cos(this.player.rotation) * moveSpeed * dt;
        }
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            this.player.vx += Math.cos(this.player.rotation) * moveSpeed * dt;
            this.player.vz -= Math.sin(this.player.rotation) * moveSpeed * dt;
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            this.player.vx -= Math.cos(this.player.rotation) * moveSpeed * dt;
            this.player.vz += Math.sin(this.player.rotation) * moveSpeed * dt;
        }
        if (this.keys['Space']) {
            this.player.vy += flyForce * dt;
            this.player.isFlying = true;
        }
        if (this.keys['ShiftLeft'] || this.keys['ShiftRight']) {
            this.player.vy -= flyForce * dt;
            this.player.isFlying = true;
        }
        if (this.keys['KeyE']) {
            this.fireUnibeam();
            this.keys['KeyE'] = false; // Prevent spam
        }
        if (this.keys['KeyR']) {
            this.resetPosition();
            this.keys['KeyR'] = false;
        }

        // Physics
        this.player.vy -= 9.8 * dt; // Gravity
        this.player.vx *= 0.98; // Air resistance
        this.player.vy *= 0.98;
        this.player.vz *= 0.98;

        // Apply velocity
        this.player.x += this.player.vx * dt;
        this.player.y += this.player.vy * dt;
        this.player.z += this.player.vz * dt;

        // Ground collision
        if (this.player.y < 2) {
            this.player.y = 2;
            this.player.vy = 0;
            this.player.isFlying = false;
        }

        // Energy regeneration
        if (this.player.energy < 100) {
            this.player.energy += 10 * dt;
        }

        // Update camera to follow player
        this.camera.x = this.player.x + Math.sin(this.camera.angleY) * this.camera.distance;
        this.camera.y = this.player.y + 5 + Math.sin(this.camera.angleX) * this.camera.distance;
        this.camera.z = this.player.z + Math.cos(this.camera.angleY) * this.camera.distance;

        // Mouse look
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        this.player.rotation = (this.mouse.x - centerX) * 0.002;
        this.player.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, (this.mouse.y - centerY) * 0.002));

        // Update particles
        this.particles.forEach(p => p.update(dt));
        this.particles = this.particles.filter(p => !p.isDead());

        // Update projectiles
        this.projectiles.forEach(p => p.update(dt));
        this.projectiles = this.projectiles.filter(p => !p.isDead());

        // Update UI
        document.getElementById('energy-fill').style.width = this.player.energy + '%';
    }

    project(x, y, z) {
        const dx = x - this.camera.x;
        const dy = y - this.camera.y;
        const dz = z - this.camera.z;

        // Rotate around Y axis
        const rx = dx * Math.cos(-this.camera.angleY) - dz * Math.sin(-this.camera.angleY);
        const rz = dx * Math.sin(-this.camera.angleY) + dz * Math.cos(-this.camera.angleY);

        // Rotate around X axis
        const ry = dy * Math.cos(-this.camera.angleX) - rz * Math.sin(-this.camera.angleX);
        const rz2 = dy * Math.sin(-this.camera.angleX) + rz * Math.cos(-this.camera.angleX);

        if (rz2 <= 0) return null;

        const fov = 800;
        const scale = fov / rz2;
        const sx = this.canvas.width / 2 + rx * scale;
        const sy = this.canvas.height / 2 - ry * scale;

        return { x: sx, y: sy, scale: scale, z: rz2 };
    }

    drawIronMan() {
        const armor = armors[this.player.currentArmor];
        const proj = this.project(this.player.x, this.player.y, this.player.z);

        if (!proj || proj.scale < 0) return;

        const size = 30 * proj.scale;

        this.ctx.save();
        this.ctx.translate(proj.x, proj.y);
        this.ctx.rotate(this.player.rotation);

        // Draw arc reactor glow
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
        gradient.addColorStop(1, 'transparent');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size, 0, Math.PI * 2);
        this.ctx.fill();

        // Body
        this.ctx.fillStyle = armor.colors.primary;
        this.ctx.fillRect(-size * 0.3, -size * 0.5, size * 0.6, size);

        // Helmet
        this.ctx.fillStyle = armor.colors.secondary;
        this.ctx.beginPath();
        this.ctx.arc(0, -size * 0.6, size * 0.25, 0, Math.PI * 2);
        this.ctx.fill();

        // Face plate
        this.ctx.fillStyle = armor.colors.primary;
        this.ctx.fillRect(-size * 0.15, -size * 0.7, size * 0.3, size * 0.2);

        // Arc reactor
        this.ctx.fillStyle = '#00ffff';
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 20;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size * 0.1, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Repulsors on hands
        this.ctx.fillStyle = '#00ffff';
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.arc(-size * 0.5, size * 0.3, size * 0.08, 0, Math.PI * 2);
        this.ctx.arc(size * 0.5, size * 0.3, size * 0.08, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Jet flames when flying
        if (this.player.isFlying || this.player.vy > 0) {
            this.ctx.fillStyle = '#ff6b00';
            this.ctx.shadowColor = '#ff6b00';
            this.ctx.shadowBlur = 30;
            this.ctx.beginPath();
            this.ctx.moveTo(-size * 0.2, size * 0.5);
            this.ctx.lineTo(-size * 0.1, size * 0.8 + Math.random() * size * 0.3);
            this.ctx.lineTo(0, size * 0.5);
            this.ctx.lineTo(size * 0.1, size * 0.8 + Math.random() * size * 0.3);
            this.ctx.lineTo(size * 0.2, size * 0.5);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }

        this.ctx.restore();
    }

    drawBuilding(building) {
        const proj = this.project(building.x, building.y, building.z);
        if (!proj || proj.scale < 0) return;

        const w = building.width * proj.scale;
        const h = building.height * proj.scale;
        const d = building.depth * proj.scale;

        // Front face
        this.ctx.fillStyle = building.color;
        this.ctx.fillRect(proj.x - w / 2, proj.y - h, w, h);

        // Windows
        this.ctx.fillStyle = 'rgba(255, 255, 200, 0.3)';
        const windowRows = Math.floor(h / (10 * proj.scale));
        const windowCols = Math.floor(w / (8 * proj.scale));
        for (let row = 0; row < windowRows; row++) {
            for (let col = 0; col < windowCols; col++) {
                if (Math.random() > 0.3) {
                    this.ctx.fillRect(
                        proj.x - w / 2 + 5 * proj.scale + col * 8 * proj.scale,
                        proj.y - h + 5 * proj.scale + row * 10 * proj.scale,
                        4 * proj.scale,
                        6 * proj.scale
                    );
                }
            }
        }
    }

    drawProjectile(proj) {
        const p = this.project(proj.x, proj.y, proj.z);
        if (!p || p.scale < 0) return;

        const size = proj.size * p.scale;

        this.ctx.fillStyle = proj.color;
        this.ctx.shadowColor = proj.color;
        this.ctx.shadowBlur = 20;

        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        this.ctx.fill();

        // Trail
        this.ctx.strokeStyle = proj.color;
        this.ctx.lineWidth = size * 0.5;
        this.ctx.globalAlpha = 0.5;
        this.ctx.beginPath();
        this.ctx.moveTo(p.x, p.y);
        this.ctx.lineTo(p.x - proj.vx * 0.01 * p.scale, p.y - proj.vy * 0.01 * p.scale);
        this.ctx.stroke();
        this.ctx.globalAlpha = 1;
        this.ctx.shadowBlur = 0;
    }

    drawParticle(particle) {
        const p = this.project(particle.x, particle.y, particle.z);
        if (!p || p.scale < 0) return;

        const alpha = particle.life / particle.maxLife;
        this.ctx.fillStyle = particle.color;
        this.ctx.globalAlpha = alpha;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, particle.size * p.scale, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0f1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw sky gradient
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        skyGradient.addColorStop(0, '#0a0f1a');
        skyGradient.addColorStop(1, '#1a1a2e');
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw sun/moon
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowColor = '#ffffff';
        this.ctx.shadowBlur = 30;
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width - 100, 100, 40, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Sort objects by depth
        const renderList = [];

        this.buildings.forEach(b => {
            const proj = this.project(b.x, b.y, b.z);
            if (proj) {
                renderList.push({ type: 'building', obj: b, z: proj.z });
            }
        });

        renderList.push({ type: 'player', obj: this.player, z: this.project(this.player.x, this.player.y, this.player.z)?.z || 0 });

        this.projectiles.forEach(p => {
            const proj = this.project(p.x, p.y, p.z);
            if (proj) {
                renderList.push({ type: 'projectile', obj: p, z: proj.z });
            }
        });

        this.particles.forEach(p => {
            const proj = this.project(p.x, p.y, p.z);
            if (proj) {
                renderList.push({ type: 'particle', obj: p, z: proj.z });
            }
        });

        renderList.sort((a, b) => b.z - a.z);

        // Render in order
        renderList.forEach(item => {
            switch (item.type) {
                case 'building':
                    this.drawBuilding(item.obj);
                    break;
                case 'player':
                    this.drawIronMan();
                    break;
                case 'projectile':
                    this.drawProjectile(item.obj);
                    break;
                case 'particle':
                    this.drawParticle(item.obj);
                    break;
            }
        });

        // Crosshair
        this.ctx.strokeStyle = '#ffd700';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, 20, 0, Math.PI * 2);
        this.ctx.moveTo(this.canvas.width / 2 - 30, this.canvas.height / 2);
        this.ctx.lineTo(this.canvas.width / 2 + 30, this.canvas.height / 2);
        this.ctx.moveTo(this.canvas.width / 2, this.canvas.height / 2 - 30);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height / 2 + 30);
        this.ctx.stroke();
    }

    gameLoop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    start() {
        requestAnimationFrame((t) => this.gameLoop(t));
    }
}

// Global functions for HTML buttons
let gameInstance = null;

function startGame() {
    document.getElementById('title-screen').classList.add('hidden');
    document.getElementById('loading-screen').classList.remove('hidden');

    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
        gameInstance = new Game();
        gameInstance.start();
    }, 2000);
}

function fireRepulsor() {
    if (gameInstance) gameInstance.fireRepulsor();
}

function fireUnibeam() {
    if (gameInstance) gameInstance.fireUnibeam();
}

function boost() {
    if (gameInstance) gameInstance.boost();
}

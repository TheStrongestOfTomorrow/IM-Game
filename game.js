// IronMan Sandbox - Full 3D Experience with Three.js
// Inspired by Roblox Ironman games

let scene, camera, renderer, player;
let cityBuildings = [];
let projectiles = [];
let particles = [];
let currentArmor = 'mark3';
let energy = 100;
let velocity;
let isFlying = false;

const ARMORS = {
    mark3: { name: 'Mark III', speed: 0.8, power: 1.0, defense: 0.8, color: 0xAA0000, accent: 0xFFD700 },
    mark42: { name: 'Mark XLII', speed: 1.2, power: 0.9, defense: 0.7, color: 0xCC6600, accent: 0xFFD700 },
    hulkbuster: { name: 'Hulkbuster', speed: 0.5, power: 1.5, defense: 1.5, color: 0x8B0000, accent: 0x444444 },
    bleedingedge: { name: 'Bleeding Edge', speed: 1.1, power: 1.3, defense: 0.9, color: 0xC41E3A, accent: 0x1a1a1a },
    stealth: { name: 'Stealth', speed: 1.0, power: 0.8, defense: 0.6, color: 0x2C3539, accent: 0x4A5D63 }
};

const keys = {};
let mouse;

// Wait for THREE to be loaded before initializing
if (typeof THREE === 'undefined') {
    console.error('Three.js not loaded! Check your internet connection or script order.');
} else {
    velocity = new THREE.Vector3();
    mouse = new THREE.Vector2();
    init();
    animate();
}

// Expose startGame function globally
window.startGame = function() {
    document.getElementById('title-screen').classList.add('hidden');
    document.getElementById('loading-screen').classList.remove('hidden');
    
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
        if (typeof init === 'function' && typeof THREE !== 'undefined') {
            init();
            animate();
        }
    }, 1500);
};

window.fireRepulsor = function() {
    if (!player || energy < 5) return;
    energy -= 5;
    updateEnergyUI();
    
    const projectileGeo = new THREE.SphereGeometry(0.5, 16, 16);
    const projectileMat = new THREE.MeshBasicMaterial({ 
        color: 0xff0000,
        transparent: true,
        opacity: 0.9
    });
    
    const projectile = new THREE.Mesh(projectileGeo, projectileMat);
    projectile.position.copy(player.position);
    projectile.position.y -= 1;
    
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    
    projectile.userData.velocity = direction.multiplyScalar(2);
    projectile.userData.life = 60;
    
    scene.add(projectile);
    projectiles.push(projectile);
    
    const light = new THREE.PointLight(0xff0000, 3, 10);
    projectile.add(light);
};

window.fireUnibeam = function() {
    if (!player || energy < 20) return;
    energy -= 20;
    updateEnergyUI();
    
    const beamGeo = new THREE.CylinderGeometry(0.5, 2, 50, 16);
    const beamMat = new THREE.MeshBasicMaterial({ 
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8
    });
    
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.copy(player.position);
    beam.position.z += 2;
    
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    
    beam.lookAt(player.position.clone().add(direction));
    beam.userData.life = 10;
    beam.userData.isBeam = true;
    
    scene.add(beam);
    projectiles.push(beam);
    
    const flash = new THREE.PointLight(0x00ffff, 10, 100);
    flash.position.copy(player.position);
    scene.add(flash);
    setTimeout(() => scene.remove(flash), 100);
};

window.boost = function() {
    if (player) {
        velocity.y += 2;
        createParticle(player.position.clone(), 0x00ffff, 20);
    }
};

function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 100, 500);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 30);

    // Renderer with bloom
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    document.body.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(100, 200, 100);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    scene.add(sunLight);

    // Create player (Iron Man)
    createPlayer();

    // Generate city
    generateCity();

    // Ground
    const groundGeo = new THREE.PlaneGeometry(1000, 1000);
    const groundMat = new THREE.MeshStandardMaterial({ 
        color: 0x333333,
        roughness: 0.8,
        metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Event listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', (e) => keys[e.code] = true);
    document.addEventListener('keyup', (e) => keys[e.code] = false);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    
    // UI Setup
    setupUI();
}

function createPlayer() {
    player = new THREE.Group();
    
    const armorData = ARMORS[currentArmor];
    const primaryMat = new THREE.MeshStandardMaterial({
        color: armorData.color,
        metalness: 0.9,
        roughness: 0.2,
        emissive: armorData.color,
        emissiveIntensity: 0.1
    });
    
    const accentMat = new THREE.MeshStandardMaterial({
        color: armorData.accent,
        metalness: 0.95,
        roughness: 0.1,
        emissive: armorData.accent,
        emissiveIntensity: 0.2
    });

    // Torso
    const torsoGeo = new THREE.BoxGeometry(2, 3, 1.5);
    const torso = new THREE.Mesh(torsoGeo, primaryMat);
    torso.castShadow = true;
    player.add(torso);

    // Head
    const headGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const head = new THREE.Mesh(headGeo, accentMat);
    head.position.y = 2.2;
    head.castShadow = true;
    player.add(head);

    // Arc Reactor (glowing)
    const reactorGeo = new THREE.CircleGeometry(0.4, 32);
    const reactorMat = new THREE.MeshBasicMaterial({ 
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 2
    });
    const reactor = new THREE.Mesh(reactorGeo, reactorMat);
    reactor.position.set(0, 0.5, 0.76);
    player.add(reactor);

    // Reactor light
    const reactorLight = new THREE.PointLight(0x00ffff, 2, 10);
    reactorLight.position.set(0, 0.5, 1);
    player.add(reactorLight);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.8, 2.5, 0.8);
    const leftArm = new THREE.Mesh(armGeo, primaryMat);
    leftArm.position.set(-1.8, 0, 0);
    leftArm.castShadow = true;
    player.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, primaryMat);
    rightArm.position.set(1.8, 0, 0);
    rightArm.castShadow = true;
    player.add(rightArm);

    // Repulsors (hands)
    const repulsorGeo = new THREE.CylinderGeometry(0.4, 0.3, 0.5, 16);
    const repulsorMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    
    const leftRepulsor = new THREE.Mesh(repulsorGeo, repulsorMat);
    leftRepulsor.rotation.x = Math.PI / 2;
    leftRepulsor.position.set(-1.8, -1.5, 0);
    player.add(leftRepulsor);

    const rightRepulsor = new THREE.Mesh(repulsorGeo, repulsorMat);
    rightRepulsor.rotation.x = Math.PI / 2;
    rightRepulsor.position.set(1.8, -1.5, 0);
    player.add(rightRepulsor);

    // Legs
    const legGeo = new THREE.BoxGeometry(1, 3, 1);
    const leftLeg = new THREE.Mesh(legGeo, primaryMat);
    leftLeg.position.set(-0.7, -2.5, 0);
    leftLeg.castShadow = true;
    player.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, primaryMat);
    rightLeg.position.set(0.7, -2.5, 0);
    rightLeg.castShadow = true;
    player.add(rightLeg);

    // Jet boots
    const bootGeo = new THREE.BoxGeometry(1.2, 0.8, 1.2);
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8 });
    
    const leftBoot = new THREE.Mesh(bootGeo, bootMat);
    leftBoot.position.set(-0.7, -4.2, 0);
    player.add(leftBoot);

    const rightBoot = new THREE.Mesh(bootGeo, bootMat);
    rightBoot.position.set(0.7, -4.2, 0);
    player.add(rightBoot);

    // Jet flames (particles will be added here)
    player.userData.jetLeft = leftBoot.position.clone();
    player.userData.jetRight = rightBoot.position.clone();

    player.position.y = 5;
    scene.add(player);
}

function generateCity() {
    const buildingGeo = new THREE.BoxGeometry(1, 1, 1);
    
    for (let i = 0; i < 80; i++) {
        const height = Math.random() * 40 + 10;
        const width = Math.random() * 8 + 4;
        const depth = Math.random() * 8 + 4;
        
        const buildingMat = new THREE.MeshStandardMaterial({
            color: Math.random() > 0.5 ? 0x444444 : 0x666666,
            metalness: 0.7,
            roughness: 0.3
        });
        
        const building = new THREE.Mesh(buildingGeo, buildingMat);
        building.scale.set(width, height, depth);
        building.position.x = (Math.random() - 0.5) * 400;
        building.position.z = (Math.random() - 0.5) * 400;
        building.position.y = height / 2;
        
        // Avoid spawn area
        if (Math.abs(building.position.x) < 20 && Math.abs(building.position.z) < 20) continue;
        
        building.castShadow = true;
        building.receiveShadow = true;
        scene.add(building);
        cityBuildings.push(building);
        
        // Add windows (emissive strips)
        if (Math.random() > 0.3) {
            const windowMat = new THREE.MeshBasicMaterial({ color: 0xffffaa, emissive: 0xffffaa });
            for (let w = 0; w < 5; w++) {
                const windowGeo = new THREE.PlaneGeometry(width * 0.8, 1);
                const windowMesh = new THREE.Mesh(windowGeo, windowMat);
                windowMesh.position.copy(building.position);
                windowMesh.position.y = Math.random() * height;
                windowMesh.position.z = building.position.z + depth/2 + 0.1;
                scene.add(windowMesh);
            }
        }
    }
}

function setupUI() {
    const armorButtons = document.querySelectorAll('.armor-btn');
    armorButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            armorButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentArmor = e.target.dataset.armor;
            updatePlayerArmor();
        });
    });
}

function updatePlayerArmor() {
    if (!player || !ARMORS[currentArmor]) return;
    
    const armorData = ARMORS[currentArmor];
    
    // Update stats display
    document.getElementById('speed-stat').textContent = Math.round(armorData.speed * 100) + '%';
    document.getElementById('power-stat').textContent = Math.round(armorData.power * 100) + '%';
    document.getElementById('defense-stat').textContent = Math.round(armorData.defense * 100) + '%';
    
    // Update player colors
    player.children.forEach(child => {
        if (child.material) {
            if (child.userData.isPrimary) {
                child.material.color.setHex(armorData.color);
            } else if (child.userData.isAccent) {
                child.material.color.setHex(armorData.accent);
            }
        }
    });
}

function onMouseMove(e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
}

function onMouseDown(e) {
    if (e.button === 0 && energy >= 5) { // Left click - Repulsor
        fireRepulsor();
    }
}

function fireRepulsor() {
    energy -= 5;
    updateEnergyUI();
    
    const projectileGeo = new THREE.SphereGeometry(0.5, 16, 16);
    const projectileMat = new THREE.MeshBasicMaterial({ 
        color: 0x00ffff,
        transparent: true,
        opacity: 0.9
    });
    
    const projectile = new THREE.Mesh(projectileGeo, projectileMat);
    
    // Start at player position
    projectile.position.copy(player.position);
    projectile.position.y -= 1;
    
    // Direction based on camera
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    
    projectile.userData.velocity = direction.multiplyScalar(2);
    projectile.userData.life = 60;
    
    scene.add(projectile);
    projectiles.push(projectile);
    
    // Add point light to projectile
    const light = new THREE.PointLight(0x00ffff, 3, 10);
    projectile.add(light);
}

function fireUnibeam() {
    if (energy < 20) return;
    energy -= 20;
    updateEnergyUI();
    
    const beamGeo = new THREE.CylinderGeometry(0.5, 2, 50, 16);
    const beamMat = new THREE.MeshBasicMaterial({ 
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8
    });
    
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.copy(player.position);
    beam.position.z += 2;
    
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    
    beam.lookAt(player.position.clone().add(direction));
    beam.userData.life = 10;
    beam.userData.isBeam = true;
    
    scene.add(beam);
    projectiles.push(beam);
    
    // Bright flash
    const flash = new THREE.PointLight(0x00ffff, 10, 100);
    flash.position.copy(player.position);
    scene.add(flash);
    setTimeout(() => scene.remove(flash), 100);
}

function createParticle(pos, color, count = 5) {
    for (let i = 0; i < count; i++) {
        const geo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const mat = new THREE.MeshBasicMaterial({ color: color });
        const particle = new THREE.Mesh(geo, mat);
        particle.position.copy(pos);
        particle.position.x += (Math.random() - 0.5) * 2;
        particle.position.y += (Math.random() - 0.5) * 2;
        particle.position.z += (Math.random() - 0.5) * 2;
        
        particle.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5
        );
        particle.userData.life = 30 + Math.random() * 20;
        
        scene.add(particle);
        particles.push(particle);
    }
}

function updatePhysics() {
    const armorData = ARMORS[currentArmor];
    const speed = armorData.speed * 0.5;
    
    // Movement
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    
    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));
    
    if (keys['KeyW'] || keys['ArrowUp']) {
        velocity.add(forward.multiplyScalar(speed * 0.1));
    }
    if (keys['KeyS'] || keys['ArrowDown']) {
        velocity.add(forward.multiplyScalar(-speed * 0.1));
    }
    if (keys['KeyA'] || keys['ArrowLeft']) {
        velocity.add(right.multiplyScalar(-speed * 0.1));
    }
    if (keys['KeyD'] || keys['ArrowRight']) {
        velocity.add(right.multiplyScalar(speed * 0.1));
    }
    if (keys['Space']) {
        velocity.y += speed * 0.15;
        isFlying = true;
        // Jet particles
        if (Math.random() > 0.5) {
            createParticle(player.position.clone().add(new THREE.Vector3(-0.7, -4.5, 0)), 0xff6600, 2);
            createParticle(player.position.clone().add(new THREE.Vector3(0.7, -4.5, 0)), 0xff6600, 2);
        }
    }
    if (keys['ShiftLeft']) {
        velocity.y -= speed * 0.15;
    }
    
    // Apply velocity
    player.position.add(velocity);
    
    // Damping
    velocity.multiplyScalar(0.95);
    
    // Gravity (if not flying much)
    if (!isFlying && player.position.y > 2) {
        velocity.y -= 0.01;
    }
    
    // Floor collision
    if (player.position.y < 2) {
        player.position.y = 2;
        velocity.y = 0;
        isFlying = false;
    }
    
    // Energy regeneration
    if (energy < 100) {
        energy += 0.1;
        updateEnergyUI();
    }
    
    // Camera follow
    const targetPos = player.position.clone();
    targetPos.y += 8;
    targetPos.z += 25;
    camera.position.lerp(targetPos, 0.1);
    camera.lookAt(player.position);
    
    // Player rotation towards movement
    if (velocity.length() > 0.1) {
        const angle = Math.atan2(velocity.x, velocity.z);
        player.rotation.y = angle;
        
        // Tilt when moving
        player.rotation.z = -velocity.x * 0.5;
        player.rotation.x = velocity.z * 0.3;
    }
}

function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        
        if (p.userData.isBeam) {
            p.userData.life--;
            if (p.userData.life <= 0) {
                scene.remove(p);
                projectiles.splice(i, 1);
            }
            continue;
        }
        
        p.position.add(p.userData.velocity);
        p.userData.life--;
        
        if (p.userData.life <= 0 || p.position.y < 0) {
            // Explosion particles
            createParticle(p.position, 0x00ffff, 8);
            scene.remove(p);
            projectiles.splice(i, 1);
        }
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.position.add(p.userData.velocity);
        p.userData.life--;
        p.scale.multiplyScalar(0.95);
        
        if (p.userData.life <= 0) {
            scene.remove(p);
            particles.splice(i, 1);
        }
    }
}

function updateEnergyUI() {
    const fill = document.getElementById('energy-fill');
    if (fill) {
        fill.style.width = energy + '%';
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    updatePhysics();
    updateProjectiles();
    updateParticles();
    
    // Handle Unibeam
    if (keys['KeyE']) {
        fireUnibeam();
        keys['KeyE'] = false; // Prevent spam
    }
    
    // Reset
    if (keys['KeyR']) {
        player.position.set(0, 5, 0);
        velocity.set(0, 0, 0);
        energy = 100;
        updateEnergyUI();
    }
    
    renderer.render(scene, camera);
}

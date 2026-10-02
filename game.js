// IronMan: Modular Hero Sandbox Experience
// Built with Three.js WebGL

// --- GLOBAL ENGINE STATE ---
let scene, camera, renderer;
let audioCtx = null;

// Game Objects
let player; // Master player group
let cityBuildings = [];
let cityRoads = [];
let pedestrians = [];
let enemies = [];
let standingSuits = [];
let ironLegionSquad = [];
let happyCar = null;
let projectiles = [];
let particles = [];
let floatingTexts = [];
let activeAssemblyAnimation = null; // Animation handle for suit deployment

// Game Systems & Stats
let playerHealth = 100;
let suitIntegrity = 100;
let energy = 100;
let heroScore = 0;

let currentForm = 'tony'; // 'tony' or armor key e.g. 'mark3'
let isFlying = false;
let isSprinting = false;
let velocity = new THREE.Vector3();

// Settings
let settings = {
    jarvisAssist: true,
    babyMode: false,
    speechEnabled: true,
    sfxEnabled: true
};

// Controls
const keys = {};
let mouse = new THREE.Vector2();

// Armor Definitions
const ARMORS = {
    mark3: { name: 'Mark III', speed: 1.0, power: 1.0, defense: 1.0, color: 0xaa0000, accent: 0xffd700, type: 'classic' },
    mark42: { name: 'Mark XLII', speed: 1.3, power: 1.1, defense: 0.9, color: 0xcc6600, accent: 0xffd700, type: 'autonomous' },
    mark5: { name: 'Mark V', speed: 1.1, power: 0.9, defense: 0.8, color: 0xc0c0c0, accent: 0xcc0000, type: 'suitcase' },
    hulkbuster: { name: 'Hulkbuster', speed: 0.7, power: 1.8, defense: 2.0, color: 0x8b0000, accent: 0x555555, scale: 1.6, type: 'drop' },
    bleeding: { name: 'Bleeding Edge', speed: 1.4, power: 1.4, defense: 1.2, color: 0xc41e3a, accent: 0x00f0ff, type: 'nanotech' },
    stealth: { name: 'Stealth Suit', speed: 1.2, power: 0.9, defense: 0.9, color: 0x1f2421, accent: 0x227093, type: 'classic' },
    warmachine: { name: 'War Machine', speed: 1.0, power: 1.5, defense: 1.4, color: 0x2c3a47, accent: 0xcad3c8, type: 'classic', hasGatling: true },
    mark1: { name: 'Mark I', speed: 0.6, power: 0.8, defense: 1.1, color: 0x7f8c8d, accent: 0x34495e, type: 'classic' }
};

// --- WEBAUDIO SFX SYNTHESIZER ---
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playSound(type) {
    if (!settings.sfxEnabled || !audioCtx) return;
    try {
        const now = audioCtx.currentTime;
        if (type === 'repulsor') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(150, now + 0.25);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.25);
        } else if (type === 'unibeam') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.linearRampToValueAtTime(1200, now + 0.5);
            gain.gain.setValueAtTime(0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.6);
        } else if (type === 'missile') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === 'explosion') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.exponentialRampToValueAtTime(20, now + 0.4);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.4);
        } else if (type === 'click') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.frequency.setValueAtTime(600, now);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.08);
        } else if (type === 'assemble') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.linearRampToValueAtTime(900, now + 0.3);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.35);
        } else if (type === 'car') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.linearRampToValueAtTime(350, now + 0.5);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.5);
        }
    } catch(e) { console.error(e); }
}

// --- JARVIS SPEECH SYSTEM ---
function jarvisSpeak(text) {
    const subtitle = document.getElementById('jarvis-subtitle');
    if (subtitle) {
        subtitle.textContent = `JARVIS: ${text}`;
        subtitle.style.opacity = '1';
    }
    if (settings.speechEnabled && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 0.95;
        window.speechSynthesis.speak(utterance);
    }
}

// --- INITIALIZATION ---
window.startGame = function() {
    initAudio();
    document.getElementById('title-screen').classList.add('hidden');
    document.getElementById('loading-screen').classList.remove('hidden');
    
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
        if (typeof initEngine === 'function' && typeof THREE !== 'undefined') {
            initEngine();
            animate();
            jarvisSpeak("Welcome back, Mr. Stark. Press G to open Armory or call your suit.");
        }
    }, 1200);
};

function initEngine() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x70a1ff);
    scene.fog = new THREE.FogExp2(0x70a1ff, 0.002);

    // Camera
    camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1500);
    camera.position.set(0, 10, 25);

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    sunLight.position.set(150, 250, 150);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 600;
    sunLight.shadow.camera.left = -200;
    sunLight.shadow.camera.right = 200;
    sunLight.shadow.camera.top = 200;
    sunLight.shadow.camera.bottom = -200;
    scene.add(sunLight);

    // Build World
    createGroundAndRoads();
    generateCity();
    spawnCivilians();

    // Create Player Group
    player = new THREE.Group();
    player.position.set(0, 2, 0);
    scene.add(player);

    // Initial Form: Tony Stark
    setPlayerForm('tony');

    // Spawn Initial Rogue Drone Crime Event
    spawnDroneWave();

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
}

// --- WORLD GENERATION: ROADS, BUILDINGS & STARK TOWER ---
function createGroundAndRoads() {
    // Main Grass/Ground
    const groundGeo = new THREE.PlaneGeometry(1200, 1200);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x2e4053, roughness: 0.9, metalness: 0.1 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Paved Roads Grid
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x1c2833, roughness: 0.7 });
    for (let r = -500; r <= 500; r += 100) {
        // Horizontal road
        const hRoad = new THREE.Mesh(new THREE.PlaneGeometry(1200, 14), roadMat);
        hRoad.rotation.x = -Math.PI / 2;
        hRoad.position.set(0, 0.1, r);
        hRoad.receiveShadow = true;
        scene.add(hRoad);
        cityRoads.push(hRoad);

        // Vertical road
        const vRoad = new THREE.Mesh(new THREE.PlaneGeometry(14, 1200), roadMat);
        vRoad.rotation.x = -Math.PI / 2;
        vRoad.position.set(r, 0.1, 0);
        vRoad.receiveShadow = true;
        scene.add(vRoad);
        cityRoads.push(vRoad);
    }
}

function generateCity() {
    // 1. Central Landmark: STARK TOWER
    const towerGroup = new THREE.Group();
    towerGroup.position.set(0, 0, -100);

    const mainTower = new THREE.Mesh(
        new THREE.BoxGeometry(30, 180, 30),
        new THREE.MeshStandardMaterial({ color: 0x0f2027, metalness: 0.9, roughness: 0.1, transparent: true, opacity: 0.95 })
    );
    mainTower.position.y = 90;
    mainTower.castShadow = true;
    mainTower.receiveShadow = true;
    towerGroup.add(mainTower);

    // Curved Upper Deck
    const deck = new THREE.Mesh(
        new THREE.CylinderGeometry(25, 20, 15, 32),
        new THREE.MeshStandardMaterial({ color: 0x203a43, metalness: 0.8 })
    );
    deck.position.y = 160;
    towerGroup.add(deck);

    // Glowing STARK 'A' Logo
    const logoMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const logoMesh = new THREE.Mesh(new THREE.BoxGeometry(12, 12, 2), logoMat);
    logoMesh.position.set(0, 165, 16);
    towerGroup.add(logoMesh);

    scene.add(towerGroup);
    cityBuildings.push(mainTower);

    // 2. Surrounding Procedural Skyscrapers
    const bldgColors = [0x1e272c, 0x2c3e50, 0x34495e, 0x1f2421, 0x222f3e];
    for (let i = 0; i < 70; i++) {
        const height = Math.random() * 60 + 20;
        const width = Math.random() * 12 + 8;
        const depth = Math.random() * 12 + 8;

        const x = (Math.floor((Math.random() * 10 - 5)) * 100) + (Math.random() * 40 - 20);
        const z = (Math.floor((Math.random() * 10 - 5)) * 100) + (Math.random() * 40 - 20);

        // Don't overlap spawn or Stark Tower
        if (Math.abs(x) < 40 && Math.abs(z) < 40) continue;
        if (Math.abs(x) < 40 && Math.abs(z + 100) < 40) continue;

        const mat = new THREE.MeshStandardMaterial({
            color: bldgColors[Math.floor(Math.random() * bldgColors.length)],
            metalness: 0.7,
            roughness: 0.3
        });

        const bldg = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat);
        bldg.position.set(x, height / 2, z);
        bldg.castShadow = true;
        bldg.receiveShadow = true;
        scene.add(bldg);
        cityBuildings.push(bldg);

        // Windows
        if (Math.random() > 0.3) {
            const winMat = new THREE.MeshBasicMaterial({ color: 0xfff2a3 });
            const winMesh = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.7, height * 0.6), winMat);
            winMesh.position.set(x, height / 2, z + depth / 2 + 0.1);
            scene.add(winMesh);
        }
    }
}

function spawnCivilians() {
    const skinColors = [0xffdbac, 0xf1c27d, 0xe0ac69, 0x8d5524];
    const shirtColors = [0xe74c3c, 0x3498db, 0x2ecc71, 0x9b59b6, 0xf1c40f];

    for (let i = 0; i < 25; i++) {
        const ped = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({ color: shirtColors[Math.floor(Math.random() * shirtColors.length)] });
        const headMat = new THREE.MeshStandardMaterial({ color: skinColors[Math.floor(Math.random() * skinColors.length)] });

        const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 0.6), bodyMat);
        body.position.y = 0.7;
        ped.add(body);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), headMat);
        head.position.y = 1.65;
        ped.add(head);

        const x = (Math.random() - 0.5) * 300;
        const z = (Math.random() - 0.5) * 300;
        ped.position.set(x, 0, z);

        ped.userData.vx = (Math.random() - 0.5) * 0.08;
        ped.userData.vz = (Math.random() - 0.5) * 0.08;

        scene.add(ped);
        pedestrians.push(ped);
    }
}

// --- MODULAR 3D CHARACTER MESH BUILDER ---
function createModularCharacterMesh(formKey) {
    const group = new THREE.Group();
    group.userData.formKey = formKey;
    group.userData.pieces = {};

    if (formKey === 'tony') {
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.6 });
        const suitMat = new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 0.5 });
        const hairMat = new THREE.MeshStandardMaterial({ color: 0x221100, roughness: 0.9 });

        const headGroup = new THREE.Group();
        const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.8), skinMat);
        headMesh.position.y = 2.0;
        headGroup.add(headMesh);

        const hairMesh = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.3, 0.84), hairMat);
        hairMesh.position.y = 2.45;
        headGroup.add(hairMesh);
        group.add(headGroup);
        group.userData.pieces.helmet = headGroup;

        const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.0, 0.9), suitMat);
        torsoMesh.position.y = 0.8;
        group.add(torsoMesh);
        group.userData.pieces.torso = torsoMesh;

        const reactorMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        const reactorMesh = new THREE.Mesh(new THREE.CircleGeometry(0.2, 16), reactorMat);
        reactorMesh.position.set(0, 1.1, 0.46);
        group.add(reactorMesh);

        const armGeo = new THREE.BoxGeometry(0.5, 1.8, 0.5);
        const leftArm = new THREE.Mesh(armGeo, suitMat);
        leftArm.position.set(-1.0, 0.8, 0);
        group.add(leftArm);
        group.userData.pieces.leftArm = leftArm;

        const rightArm = new THREE.Mesh(armGeo, suitMat);
        rightArm.position.set(1.0, 0.8, 0);
        group.add(rightArm);
        group.userData.pieces.rightArm = rightArm;

        const legGeo = new THREE.BoxGeometry(0.6, 2.0, 0.6);
        const leftLeg = new THREE.Mesh(legGeo, suitMat);
        leftLeg.position.set(-0.4, -1.1, 0);
        group.add(leftLeg);
        group.userData.pieces.leftLeg = leftLeg;

        const rightLeg = new THREE.Mesh(legGeo, suitMat);
        rightLeg.position.set(0.4, -1.1, 0);
        group.add(rightLeg);
        group.userData.pieces.rightLeg = rightLeg;

        return group;
    }

    const config = ARMORS[formKey] || ARMORS.mark3;
    const scaleFactor = config.scale || 1.0;

    const primaryMat = new THREE.MeshStandardMaterial({
        color: config.color,
        metalness: 0.85,
        roughness: 0.25,
        emissive: config.color,
        emissiveIntensity: 0.08
    });

    const accentMat = new THREE.MeshStandardMaterial({
        color: config.accent,
        metalness: 0.9,
        roughness: 0.2,
        emissive: config.accent,
        emissiveIntensity: 0.15
    });

    const jointMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.4 });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });

    // Helmet
    const headGroup = new THREE.Group();
    const helmetMesh = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.0), primaryMat);
    helmetMesh.position.y = 2.2;
    headGroup.add(helmetMesh);

    const faceplateMesh = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.8, 0.2), accentMat);
    faceplateMesh.position.set(0, 2.2, 0.45);
    headGroup.add(faceplateMesh);

    const eyeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.05), glowMat);
    eyeMesh.position.set(0, 2.3, 0.56);
    headGroup.add(eyeMesh);

    group.add(headGroup);
    group.userData.pieces.helmet = headGroup;

    // Torso
    const torsoGroup = new THREE.Group();
    const chestMesh = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.2, 1.2), primaryMat);
    chestMesh.position.y = 0.8;
    torsoGroup.add(chestMesh);

    const absMesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 1.25), accentMat);
    absMesh.position.y = 0.5;
    torsoGroup.add(absMesh);

    const reactorGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 24);
    reactorGeo.rotateX(Math.PI / 2);
    const reactorMesh = new THREE.Mesh(reactorGeo, glowMat);
    reactorMesh.position.set(0, 1.1, 0.62);
    torsoGroup.add(reactorMesh);

    if (config.hasGatling) {
        const cannonGroup = new THREE.Group();
        const mountMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 1.2), jointMat);
        mountMesh.position.set(-1.1, 2.2, 0);
        cannonGroup.add(mountMesh);

        const barrelMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.5, 12), jointMat);
        barrelMesh.rotateX(Math.PI / 2);
        barrelMesh.position.set(-1.1, 2.2, 0.8);
        cannonGroup.add(barrelMesh);
        torsoGroup.add(cannonGroup);
    }

    group.add(torsoGroup);
    group.userData.pieces.torso = torsoGroup;

    // Left Arm
    const leftArmGroup = new THREE.Group();
    const lShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 16), accentMat);
    lShoulder.position.set(-1.3, 1.6, 0);
    leftArmGroup.add(lShoulder);

    const lArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.8, 0.6), primaryMat);
    lArmMesh.position.set(-1.3, 0.7, 0);
    leftArmGroup.add(lArmMesh);

    const lRepulsor = new THREE.Mesh(new THREE.CircleGeometry(0.2, 16), glowMat);
    lRepulsor.position.set(-1.3, -0.2, 0.31);
    leftArmGroup.add(lRepulsor);
    group.add(leftArmGroup);
    group.userData.pieces.leftArm = leftArmGroup;

    // Right Arm
    const rightArmGroup = new THREE.Group();
    const rShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 16), accentMat);
    rShoulder.position.set(1.3, 1.6, 0);
    rightArmGroup.add(rShoulder);

    const rArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.8, 0.6), primaryMat);
    rArmMesh.position.set(1.3, 0.7, 0);
    rightArmGroup.add(rArmMesh);

    const rRepulsor = new THREE.Mesh(new THREE.CircleGeometry(0.2, 16), glowMat);
    rRepulsor.position.set(1.3, -0.2, 0.31);
    rightArmGroup.add(rRepulsor);
    group.add(rightArmGroup);
    group.userData.pieces.rightArm = rightArmGroup;

    // Left Leg
    const leftLegGroup = new THREE.Group();
    const lLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.0, 0.7), primaryMat);
    lLegMesh.position.set(-0.5, -1.2, 0);
    leftLegGroup.add(lLegMesh);

    const lKnee = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.4, 0.75), accentMat);
    lKnee.position.set(-0.5, -1.0, 0.1);
    leftLegGroup.add(lKnee);

    const lBoot = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 1.0), jointMat);
    lBoot.position.set(-0.5, -2.2, 0.15);
    leftLegGroup.add(lBoot);
    group.add(leftLegGroup);
    group.userData.pieces.leftLeg = leftLegGroup;

    // Right Leg
    const rightLegGroup = new THREE.Group();
    const rLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.0, 0.7), primaryMat);
    rLegMesh.position.set(0.5, -1.2, 0);
    rightLegGroup.add(rLegMesh);

    const rKnee = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.4, 0.75), accentMat);
    rKnee.position.set(0.5, -1.0, 0.1);
    rightLegGroup.add(rKnee);

    const rBoot = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 1.0), jointMat);
    rBoot.position.set(0.5, -2.2, 0.15);
    rightLegGroup.add(rBoot);
    group.add(rightLegGroup);
    group.userData.pieces.rightLeg = rightLegGroup;

    group.scale.set(scaleFactor, scaleFactor, scaleFactor);
    return group;
}

function setPlayerForm(formKey) {
    currentForm = formKey;
    while (player.children.length > 0) {
        player.remove(player.children[0]);
    }

    const mesh = createModularCharacterMesh(formKey);
    player.add(mesh);

    suitIntegrity = 100;
    updateHUD();

    const suitText = document.getElementById('suit-state-text');
    if (suitText) {
        if (formKey === 'tony') {
            suitText.textContent = 'Form: Tony Stark (Civilian)';
        } else {
            const cfg = ARMORS[formKey];
            suitText.textContent = `Suit: ${cfg ? cfg.name : formKey.toUpperCase()}`;
        }
    }
}

// --- SUIT ASSEMBLY ANIMATION SYSTEM ---
function triggerSuitCall(suitKey) {
    if (suitKey === 'legion') {
        activateIronLegion();
        return;
    }

    // Check if there is already a standing suit nearby
    let existingSuitIndex = -1;
    for (let i = 0; i < standingSuits.length; i++) {
        if (standingSuits[i].userData.formKey === suitKey) {
            existingSuitIndex = i;
            break;
        }
    }

    if (existingSuitIndex !== -1) {
        // Fly standing suit straight to player
        const targetSuit = standingSuits[existingSuitIndex];
        standingSuits.splice(existingSuitIndex, 1);
        playSound('assemble');
        jarvisSpeak(`${ARMORS[suitKey].name} flying to your position.`);

        // Animate suit flying to player
        activeAssemblyAnimation = {
            type: 'fly_to_player',
            mesh: targetSuit,
            suitKey: suitKey,
            timer: 0
        };
        return;
    }

    const config = ARMORS[suitKey] || ARMORS.mark3;

    if (config.type === 'suitcase' || suitKey === 'mark5') {
        // HAPPY HOGAN BRIEFCASE DELIVERY
        playSound('car');
        jarvisSpeak("Happy Hogan is arriving with your Mark V briefcase!");

        // Spawn Happy's Audi Car
        const car = new THREE.Group();
        const carBody = new THREE.Mesh(new THREE.BoxGeometry(4, 1.5, 7), new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 }));
        carBody.position.y = 0.8;
        car.add(carBody);

        const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16);
        wheelGeo.rotateZ(Math.PI / 2);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });

        const w1 = new THREE.Mesh(wheelGeo, wheelMat); w1.position.set(-2, 0.5, 2); car.add(w1);
        const w2 = new THREE.Mesh(wheelGeo, wheelMat); w2.position.set(2, 0.5, 2); car.add(w2);
        const w3 = new THREE.Mesh(wheelGeo, wheelMat); w3.position.set(-2, 0.5, -2); car.add(w3);
        const w4 = new THREE.Mesh(wheelGeo, wheelMat); w4.position.set(2, 0.5, -2); car.add(w4);

        // Start off to the side
        const spawnPos = player.position.clone().add(new THREE.Vector3(-35, 0, 0));
        car.position.copy(spawnPos);
        scene.add(car);

        activeAssemblyAnimation = {
            type: 'happy_car',
            car: car,
            suitKey: suitKey,
            stage: 0,
            timer: 0
        };
    } else if (config.type === 'autonomous' || suitKey === 'mark42') {
        // AUTONOMOUS FLYING PIECES
        playSound('assemble');
        jarvisSpeak("Mark XLII piece-by-piece assembly engaged.");

        activeAssemblyAnimation = {
            type: 'autonomous_pieces',
            suitKey: suitKey,
            timer: 0,
            piecesSpawned: false
        };
    } else if (config.type === 'nanotech' || suitKey === 'bleeding') {
        // NANOTECH FLUID EXPANSION
        playSound('unibeam');
        jarvisSpeak("Bleeding Edge nanotech fluid expanding.");

        setPlayerForm(suitKey);
        createParticle(player.position.clone().add(new THREE.Vector3(0, 1, 0)), 0x00f0ff, 30);
    } else {
        // GANTRY MECHANICAL ARMS / DROP POD
        playSound('assemble');
        jarvisSpeak(`Deploying ${config.name} via Stark Gantry.`);

        setPlayerForm(suitKey);
        createParticle(player.position.clone().add(new THREE.Vector3(0, 2, 0)), 0xffd700, 25);
    }
}

// --- IRON LEGION SQUAD SYSTEM ---
function activateIronLegion() {
    jarvisSpeak("Iron Legion Protocol Activated. All armors deployed in squad formation.");
    playSound('assemble');

    // Clear old squad
    ironLegionSquad.forEach(s => scene.remove(s));
    ironLegionSquad = [];

    const armorKeys = Object.keys(ARMORS);
    const radius = 6;

    armorKeys.forEach((key, idx) => {
        const suitMesh = createModularCharacterMesh(key);
        const angle = (idx / armorKeys.length) * Math.PI * 2;
        const offset = new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
        suitMesh.position.copy(player.position).add(offset);

        scene.add(suitMesh);
        ironLegionSquad.push(suitMesh);
    });
}

// --- EJECT (`N`), SELF-DESTRUCT (`X`), ENTER SUIT (`Q`) ---
function ejectSuitSafely() {
    if (currentForm === 'tony') return;

    const oldForm = currentForm;
    jarvisSpeak(`Ejecting from ${ARMORS[oldForm] ? ARMORS[oldForm].name : 'Suit'}. Entering standby mode.`);
    playSound('click');

    // Spawn standing suit at player position
    const standingMesh = createModularCharacterMesh(oldForm);
    standingMesh.position.copy(player.position);
    scene.add(standingMesh);
    standingSuits.push(standingMesh);

    // Switch player back to Tony
    setPlayerForm('tony');
    isFlying = false;
}

function selfDestructSuitLego() {
    if (currentForm === 'tony') return;

    const oldForm = currentForm;
    jarvisSpeak("Suit self-destruct initiated. Lego breakdown.");
    playSound('explosion');

    // Create Lego falling debris particles
    const pos = player.position.clone();
    for (let i = 0; i < 20; i++) {
        const geo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const mat = new THREE.MeshStandardMaterial({ color: ARMORS[oldForm] ? ARMORS[oldForm].color : 0xff0000 });
        const p = new THREE.Mesh(geo, mat);
        p.position.copy(pos).add(new THREE.Vector3((Math.random() - 0.5) * 2, Math.random() * 2, (Math.random() - 0.5) * 2));
        p.userData.velocity = new THREE.Vector3((Math.random() - 0.5) * 0.4, Math.random() * 0.3 + 0.1, (Math.random() - 0.5) * 0.4);
        p.userData.life = 60;
        scene.add(p);
        particles.push(p);
    }

    setPlayerForm('tony');
    isFlying = false;
}

function tryEnterNearbySuit() {
    if (currentForm !== 'tony') return false;

    for (let i = 0; i < standingSuits.length; i++) {
        const suit = standingSuits[i];
        if (suit.position.distanceTo(player.position) < 4.0) {
            const formKey = suit.userData.formKey;
            scene.remove(suit);
            standingSuits.splice(i, 1);

            setPlayerForm(formKey);
            playSound('assemble');
            jarvisSpeak(`Entered ${ARMORS[formKey] ? ARMORS[formKey].name : 'Suit'}.`);
            return true;
        }
    }
    return false;
}

// Global scope registration for step 2
window.triggerSuitCall = triggerSuitCall;
window.activateIronLegion = activateIronLegion;
window.ejectSuitSafely = ejectSuitSafely;
window.selfDestructSuitLego = selfDestructSuitLego;
window.tryEnterNearbySuit = tryEnterNearbySuit;


// --- COMBAT ABILITIES: REPULSORS, UNIBEAM, MICRO-MISSILES ---
function fireRepulsor(isLeftHand = true) {
    if (energy < 4 && !settings.babyMode) return;
    if (!settings.babyMode) energy -= 4;
    updateHUD();

    playSound('repulsor');

    const projGeo = new THREE.SphereGeometry(0.4, 16, 16);
    const projMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const projectile = new THREE.Mesh(projGeo, projMat);

    // Hand offset position based on orientation
    const offset = isLeftHand ? new THREE.Vector3(-1.2, 0.8, 0.5) : new THREE.Vector3(1.2, 0.8, 0.5);
    offset.applyQuaternion(player.quaternion);
    projectile.position.copy(player.position).add(offset);

    // Aim direction based on camera forward
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    projectile.userData.velocity = direction.multiplyScalar(2.2);
    projectile.userData.life = 70;
    projectile.userData.damage = currentForm === 'tony' ? 15 : 35 * (ARMORS[currentForm] ? ARMORS[currentForm].power : 1.0);
    projectile.userData.isPlayer = true;

    scene.add(projectile);
    projectiles.push(projectile);

    // Muzzle flash particle
    createParticle(projectile.position.clone(), 0x00ffff, 6);
}

function fireUnibeam() {
    if (currentForm === 'tony') return;
    if (energy < 25 && !settings.babyMode) return;
    if (!settings.babyMode) energy -= 25;
    updateHUD();

    playSound('unibeam');

    const beamGeo = new THREE.CylinderGeometry(0.8, 2.5, 60, 16);
    beamGeo.rotateX(Math.PI / 2);
    const beamMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.85 });

    const beam = new THREE.Mesh(beamGeo, beamMat);
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    beam.position.copy(player.position).add(direction.clone().multiplyScalar(30));
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);

    beam.userData.life = 12;
    beam.userData.isBeam = true;
    beam.userData.damage = 100;

    scene.add(beam);
    projectiles.push(beam);
}

function fireSmartMicroMissiles() {
    if (currentForm === 'tony') return;
    if (energy < 15 && !settings.babyMode) return;
    if (!settings.babyMode) energy -= 15;
    updateHUD();

    playSound('missile');
    jarvisSpeak("Micro-missiles swarming active targets.");

    // Target up to 4 nearby enemies
    let targets = enemies.slice(0, 4);
    if (targets.length === 0) {
        // Fire forward dummy volley if no lock
        targets = [null, null, null];
    }

    targets.forEach((target, i) => {
        const mGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.8, 8);
        mGeo.rotateX(Math.PI / 2);
        const mMat = new THREE.MeshStandardMaterial({ color: 0xff3300, emissive: 0xff1100 });
        const missile = new THREE.Mesh(mGeo, mMat);

        missile.position.copy(player.position).add(new THREE.Vector3((i - 1) * 0.8, 1.8, 0));
        missile.userData.target = target;
        missile.userData.life = 120;
        missile.userData.damage = 60;
        missile.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.8,
            Math.random() * 0.5 + 0.5,
            (Math.random() - 0.5) * 0.8
        );

        scene.add(missile);
        projectiles.push(missile);
    });
}

// --- SUIT DAMAGE BREAKDOWN MECHANIC ---
function applyPlayerDamage(amount) {
    if (settings.babyMode) amount *= 0.1; // Reduced in baby mode

    if (currentForm !== 'tony') {
        const armorConfig = ARMORS[currentForm] || ARMORS.mark3;
        const defenseFactor = armorConfig.defense || 1.0;
        const netDamage = amount / defenseFactor;

        suitIntegrity -= netDamage;

        // Piece detachment logic under heavy damage
        if (suitIntegrity < 75 && player.children[0] && player.children[0].userData.pieces.leftArm) {
            player.children[0].userData.pieces.leftArm.visible = false;
            createParticle(player.position.clone().add(new THREE.Vector3(-1, 1, 0)), 0xff8800, 10);
        }
        if (suitIntegrity < 50 && player.children[0] && player.children[0].userData.pieces.rightArm) {
            player.children[0].userData.pieces.rightArm.visible = false;
            createParticle(player.position.clone().add(new THREE.Vector3(1, 1, 0)), 0xff8800, 10);
        }
        if (suitIntegrity < 25 && player.children[0] && player.children[0].userData.pieces.helmet) {
            player.children[0].userData.pieces.helmet.visible = false;
            createParticle(player.position.clone().add(new THREE.Vector3(0, 2, 0)), 0xff0000, 12);
        }

        if (suitIntegrity <= 0) {
            suitIntegrity = 0;
            jarvisSpeak("Suit integrity critical! Armor collapsing!");
            selfDestructSuitLego();
        }
    } else {
        playerHealth -= amount;
        if (playerHealth <= 0) {
            playerHealth = 100;
            player.position.set(0, 2, 0);
            jarvisSpeak("Health restored at Stark Tower emergency bay.");
        }
    }
    updateHUD();
}

window.fireRepulsor = fireRepulsor;
window.fireUnibeam = fireUnibeam;
window.fireSmartMicroMissiles = fireSmartMicroMissiles;


// --- ENEMY DRONES & TITAN MECH BOSS ---
function spawnDroneWave() {
    jarvisSpeak("Warning: Hostile rogue drones detected in city airspace.");

    for (let i = 0; i < 5; i++) {
        const drone = new THREE.Group();

        const bodyMesh = new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0xff0044, metalness: 0.8, roughness: 0.2 })
        );
        drone.add(bodyMesh);

        // Ring
        const ringMesh = new THREE.Mesh(
            new THREE.TorusGeometry(1.8, 0.15, 8, 24),
            new THREE.MeshStandardMaterial({ color: 0x222222 })
        );
        ringMesh.rotateX(Math.PI / 2);
        drone.add(ringMesh);

        // Eye glow
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
        eye.position.z = 1.0;
        drone.add(eye);

        const x = (Math.random() - 0.5) * 200;
        const z = (Math.random() - 0.5) * 200;
        drone.position.set(x, Math.random() * 20 + 15, z);

        drone.userData.health = 80;
        drone.userData.maxHealth = 80;
        drone.userData.isDrone = true;

        scene.add(drone);
        enemies.push(drone);
    }
}

function spawnTitanMechBoss() {
    jarvisSpeak("CRITICAL WARNING: Titan Mech Commander has entered the field!");
    playSound('explosion');

    const boss = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff0055, metalness: 0.9, roughness: 0.1 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 });

    // Main Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(6, 8, 5), bodyMat);
    torso.position.y = 8;
    boss.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), darkMat);
    head.position.y = 13.5;
    boss.add(head);

    // Visor
    const visor = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.6, 0.5), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    visor.position.set(0, 13.5, 1.5);
    boss.add(visor);

    // Arms
    const armGeo = new THREE.BoxGeometry(2, 7, 2);
    const lArm = new THREE.Mesh(armGeo, bodyMat);
    lArm.position.set(-4.5, 7, 0);
    boss.add(lArm);

    const rArm = new THREE.Mesh(armGeo, bodyMat);
    rArm.position.set(4.5, 7, 0);
    boss.add(rArm);

    boss.position.set(0, 0, -60);
    boss.userData.health = 1000;
    boss.userData.maxHealth = 1000;
    boss.userData.isBoss = true;

    scene.add(boss);
    enemies.push(boss);

    const bossHud = document.getElementById('boss-hud');
    if (bossHud) bossHud.style.display = 'flex';
}

window.spawnDroneWave = spawnDroneWave;
window.spawnTitanMechBoss = spawnTitanMechBoss;


// --- HUD & MINIMAP RADAR UPDATER ---
function updateHUD() {
    const healthFill = document.getElementById('health-fill');
    const healthText = document.getElementById('health-text');
    if (healthFill && healthText) {
        healthFill.style.width = `${Math.max(0, playerHealth)}%`;
        healthText.textContent = `${Math.round(playerHealth)} / 100`;
    }

    const integrityFill = document.getElementById('integrity-fill');
    const integrityText = document.getElementById('integrity-text');
    if (integrityFill && integrityText) {
        integrityFill.style.width = `${Math.max(0, suitIntegrity)}%`;
        integrityText.textContent = currentForm === 'tony' ? 'SUITED: OFF' : `${Math.round(suitIntegrity)}%`;
    }

    const energyFill = document.getElementById('energy-fill');
    const energyText = document.getElementById('energy-text');
    if (energyFill && energyText) {
        energyFill.style.width = `${Math.max(0, energy)}%`;
        energyText.textContent = `${Math.round(energy)} / 100`;
    }

    const scoreText = document.getElementById('hero-score-text');
    if (scoreText) {
        scoreText.textContent = `Hero Score: ${heroScore}`;
    }

    // Check interaction prompt
    const prompt = document.getElementById('interaction-prompt');
    if (prompt) {
        let showPrompt = false;
        if (currentForm === 'tony') {
            for (let s of standingSuits) {
                if (s.position.distanceTo(player.position) < 4.0) {
                    showPrompt = true;
                    break;
                }
            }
        }
        prompt.style.display = showPrompt ? 'block' : 'none';
    }
}

function updateMinimap() {
    const miniCanvas = document.getElementById('minimap-canvas');
    if (!miniCanvas) return;
    const ctx = miniCanvas.getContext('2d');
    const w = miniCanvas.width;
    const h = miniCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = 0.4;

    ctx.clearRect(0, 0, w, h);

    // Background radar grid
    ctx.fillStyle = 'rgba(0, 20, 40, 0.9)';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
    ctx.arc(cx, cy, (cx - 2) * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    // Player Blip
    ctx.fillStyle = '#00ffcc';
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();

    // Enemies Blips
    ctx.fillStyle = '#ff0055';
    enemies.forEach(e => {
        const dx = (e.position.x - player.position.x) * scale;
        const dz = (e.position.z - player.position.z) * scale;
        if (Math.hypot(dx, dz) < cx - 5) {
            ctx.beginPath();
            ctx.arc(cx + dx, cy + dz, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

function createParticle(pos, color, count = 5) {
    for (let i = 0; i < count; i++) {
        const geo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const mat = new THREE.MeshBasicMaterial({ color: color });
        const p = new THREE.Mesh(geo, mat);
        p.position.copy(pos);
        p.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.6,
            Math.random() * 0.4,
            (Math.random() - 0.5) * 0.6
        );
        p.userData.life = 30 + Math.random() * 20;
        scene.add(p);
        particles.push(p);
    }
}

// --- MAIN ANIMATION & PHYSICS LOOP ---
function animate() {
    requestAnimationFrame(animate);

    // Update Suit Assembly Animation if active
    if (activeAssemblyAnimation) {
        const anim = activeAssemblyAnimation;
        anim.timer++;

        if (anim.type === 'fly_to_player') {
            anim.mesh.position.lerp(player.position, 0.15);
            if (anim.mesh.position.distanceTo(player.position) < 1.5) {
                scene.remove(anim.mesh);
                setPlayerForm(anim.suitKey);
                activeAssemblyAnimation = null;
            }
        } else if (anim.type === 'happy_car') {
            const car = anim.car;
            const targetPos = player.position.clone().add(new THREE.Vector3(3, 0, 0));
            car.position.lerp(targetPos, 0.1);

            if (car.position.distanceTo(targetPos) < 2.0 && anim.stage === 0) {
                anim.stage = 1;
                // Happy throws briefcase
                setPlayerForm(anim.suitKey);
                jarvisSpeak("Mark V briefcase caught! Transforming!");
                createParticle(player.position.clone().add(new THREE.Vector3(0, 1, 0)), 0xff0000, 20);

                setTimeout(() => {
                    scene.remove(car);
                    activeAssemblyAnimation = null;
                }, 2000);
            }
        } else if (anim.type === 'autonomous_pieces') {
            if (anim.timer > 30) {
                setPlayerForm(anim.suitKey);
                createParticle(player.position.clone().add(new THREE.Vector3(0, 1, 0)), 0xffd700, 30);
                activeAssemblyAnimation = null;
            }
        }
    }

    // Player Physics & Controls
    const speed = currentForm === 'tony' ? 0.3 : (ARMORS[currentForm] ? ARMORS[currentForm].speed * 0.5 : 0.5);
    const sprintFactor = isSprinting ? 1.8 : 1.0;

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

    if (keys['KeyW'] || keys['ArrowUp']) velocity.add(forward.multiplyScalar(speed * sprintFactor * 0.15));
    if (keys['KeyS'] || keys['ArrowDown']) velocity.add(forward.multiplyScalar(-speed * sprintFactor * 0.15));
    if (keys['KeyA'] || keys['ArrowLeft']) velocity.add(right.multiplyScalar(-speed * sprintFactor * 0.15));
    if (keys['KeyD'] || keys['ArrowRight']) velocity.add(right.multiplyScalar(speed * sprintFactor * 0.15));

    if (isFlying && currentForm !== 'tony') {
        if (keys['Space']) velocity.y += speed * 0.15;
        if (keys['ControlLeft'] || keys['KeyC']) velocity.y -= speed * 0.15;

        // Thruster particles
        if (Math.random() > 0.4) {
            createParticle(player.position.clone().add(new THREE.Vector3(0, -1.8, 0)), 0x00f0ff, 2);
        }
    } else {
        if (keys['Space'] && player.position.y <= 2.1) {
            velocity.y = 0.4;
        }
    }

    player.position.add(velocity);
    velocity.multiplyScalar(0.88);

    // Gravity
    if (!isFlying && player.position.y > 2.0) {
        velocity.y -= 0.02;
    }
    if (player.position.y < 2.0) {
        player.position.y = 2.0;
        velocity.y = 0;
    }

    // Energy recovery
    if (energy < 100) {
        energy += 0.15;
    }

    // Iron Legion squad follow
    ironLegionSquad.forEach((member, i) => {
        const offsetAngle = (i / Math.max(1, ironLegionSquad.length)) * Math.PI * 2;
        const targetPos = player.position.clone().add(new THREE.Vector3(Math.cos(offsetAngle) * 5, 0, Math.sin(offsetAngle) * 5));
        member.position.lerp(targetPos, 0.05);
        member.lookAt(player.position);
    });

    // Civilian movement
    pedestrians.forEach(p => {
        p.position.x += p.userData.vx;
        p.position.z += p.userData.vz;
        if (Math.abs(p.position.x) > 200) p.userData.vx *= -1;
        if (Math.abs(p.position.z) > 200) p.userData.vz *= -1;
    });

    // Enemy Drones & Boss AI
    enemies.forEach((e, idx) => {
        if (e.userData.isDrone) {
            e.position.x += Math.sin(Date.now() * 0.002 + idx) * 0.2;
            e.position.z += Math.cos(Date.now() * 0.002 + idx) * 0.2;

            // Attack player
            if (Math.random() < 0.015 && e.position.distanceTo(player.position) < 80) {
                const laserGeo = new THREE.SphereGeometry(0.3, 8, 8);
                const laserMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
                const laser = new THREE.Mesh(laserGeo, laserMat);
                laser.position.copy(e.position);

                const dir = player.position.clone().sub(e.position).normalize();
                laser.userData.velocity = dir.multiplyScalar(1.5);
                laser.userData.life = 60;
                laser.userData.isEnemy = true;
                scene.add(laser);
                projectiles.push(laser);
            }
        } else if (e.userData.isBoss) {
            e.lookAt(player.position);
            const bossFill = document.getElementById('boss-health-fill');
            const bossText = document.getElementById('boss-health-text');
            if (bossFill && bossText) {
                const pct = (e.userData.health / e.userData.maxHealth) * 100;
                bossFill.style.width = `${Math.max(0, pct)}%`;
                bossText.textContent = `${Math.round(e.userData.health)} / ${e.userData.maxHealth}`;
            }

            // Boss attack wave
            if (Math.random() < 0.02) {
                const bProj = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), new THREE.MeshBasicMaterial({ color: 0xff0055 }));
                bProj.position.copy(e.position).add(new THREE.Vector3(0, 8, 0));

                const dir = player.position.clone().sub(e.position).normalize();
                bProj.userData.velocity = dir.multiplyScalar(1.8);
                bProj.userData.life = 80;
                bProj.userData.isEnemy = true;
                bProj.userData.damage = 25;
                scene.add(bProj);
                projectiles.push(bProj);
            }
        }
    });

    // BABY MODE & JARVIS ASSIST AUTO COMBAT
    if ((settings.babyMode || settings.jarvisAssist) && currentForm !== 'tony' && enemies.length > 0) {
        const nearestEnemy = enemies[0];
        if (nearestEnemy && nearestEnemy.position.distanceTo(player.position) < 60) {
            if (Math.random() < 0.02) {
                fireRepulsor(Math.random() > 0.5);
            }
        }
    }

    // Update Projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        if (p.userData.isBeam) {
            p.userData.life--;
            // Beam damage
            enemies.forEach(e => {
                if (p.position.distanceTo(e.position) < 20) {
                    e.userData.health -= 8;
                }
            });
            if (p.userData.life <= 0) {
                scene.remove(p);
                projectiles.splice(i, 1);
            }
            continue;
        }

        // Homing missile logic
        if (p.userData.target && p.userData.target.parent) {
            const targetDir = p.userData.target.position.clone().sub(p.position).normalize();
            p.userData.velocity.lerp(targetDir.multiplyScalar(2.0), 0.15);
        }

        p.position.add(p.userData.velocity);
        p.userData.life--;

        // Collision check
        if (p.userData.isPlayer) {
            for (let j = enemies.length - 1; j >= 0; j--) {
                const e = enemies[j];
                if (p.position.distanceTo(e.position) < 4) {
                    e.userData.health -= p.userData.damage || 30;
                    createParticle(p.position, 0xffff00, 8);
                    p.userData.life = 0;

                    if (e.userData.health <= 0) {
                        jarvisSpeak("Target destroyed. Threat neutralised.");
                        playSound('explosion');
                        createParticle(e.position, 0xff0000, 25);
                        scene.remove(e);
                        enemies.splice(j, 1);
                        heroScore += 100;

                        if (e.userData.isBoss) {
                            const bossHud = document.getElementById('boss-hud');
                            if (bossHud) bossHud.style.display = 'none';
                            jarvisSpeak("TITAN MECH COMMANDER DEFEATED! Excellent work Mr. Stark!");
                        }
                    }
                    break;
                }
            }
        } else if (p.userData.isEnemy) {
            if (p.position.distanceTo(player.position) < 2.5) {
                applyPlayerDamage(p.userData.damage || 12);
                createParticle(p.position, 0xff0000, 6);
                p.userData.life = 0;
            }
        }

        if (p.userData.life <= 0 || p.position.y < 0) {
            scene.remove(p);
            projectiles.splice(i, 1);
        }
    }

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.position.add(p.userData.velocity);
        p.userData.life--;
        p.scale.multiplyScalar(0.96);
        if (p.userData.life <= 0) {
            scene.remove(p);
            particles.splice(i, 1);
        }
    }

    // Camera follow
    const camOffset = new THREE.Vector3(0, 6, 20);
    camOffset.applyQuaternion(player.quaternion);
    const targetCamPos = player.position.clone().add(camOffset);
    camera.position.lerp(targetCamPos, 0.1);
    camera.lookAt(player.position.clone().add(new THREE.Vector3(0, 2, 0)));

    updateHUD();
    updateMinimap();
    renderer.render(scene, camera);
}

// --- INPUT EVENT HANDLERS ---
function onKeyDown(e) {
    keys[e.code] = true;

    if (e.code === 'KeyG') {
        toggleSuitMenuModal();
    } else if (e.code === 'KeyF' && currentForm !== 'tony') {
        isFlying = !isFlying;
        jarvisSpeak(isFlying ? "Flight thrusters engaged." : "Flight thrusters offline.");
        playSound('click');
    } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        isSprinting = true;
    } else if (e.code === 'KeyQ') {
        if (currentForm === 'tony') {
            tryEnterNearbySuit();
        } else {
            fireRepulsor(true);
        }
    } else if (e.code === 'KeyE' && currentForm !== 'tony') {
        fireRepulsor(false);
    } else if (e.code === 'KeyZ') {
        fireSmartMicroMissiles();
    } else if (e.code === 'KeyN') {
        ejectSuitSafely();
    } else if (e.code === 'KeyX') {
        selfDestructSuitLego();
    } else if (e.code === 'KeyB') {
        spawnTitanMechBoss();
    }
}

function onKeyUp(e) {
    keys[e.code] = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        isSprinting = false;
    }
}

function onMouseMove(e) {
    if (e.buttons === 1) { // Dragging mouse orbits player
        player.rotation.y -= e.movementX * 0.005;
    }
}

function onMouseDown(e) {
    if (e.button === 0 && currentForm !== 'tony') {
        fireRepulsor(true);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// UI Modal Helpers
function toggleSuitMenuModal() {
    const modal = document.getElementById('suit-menu-modal');
    if (modal) {
        modal.classList.toggle('active');
        playSound('click');
    }
}

function closeSuitMenuModal() {
    const modal = document.getElementById('suit-menu-modal');
    if (modal) modal.classList.remove('active');
}

function selectSuitCall(suitKey) {
    closeSuitMenuModal();
    triggerSuitCall(suitKey);
}

function toggleSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.classList.toggle('active');
        playSound('click');
    }
}

function updateSettings() {
    settings.jarvisAssist = document.getElementById('toggle-jarvis-assist').checked;
    settings.babyMode = document.getElementById('toggle-baby-mode').checked;
    settings.speechEnabled = document.getElementById('toggle-speech').checked;
    settings.sfxEnabled = document.getElementById('toggle-sfx').checked;

    if (settings.babyMode) {
        jarvisSpeak("Baby Mode Activated. Reduced damage and auto lock-on engaged.");
    }
}

window.toggleSuitMenuModal = toggleSuitMenuModal;
window.closeSuitMenuModal = closeSuitMenuModal;
window.selectSuitCall = selectSuitCall;
window.toggleSettingsModal = toggleSettingsModal;
window.updateSettings = updateSettings;

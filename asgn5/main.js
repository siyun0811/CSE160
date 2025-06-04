import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.158.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'https://unpkg.com/three@0.158.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.158.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://unpkg.com/three@0.158.0/examples/jsm/postprocessing/UnrealBloomPass.js';

let scene, camera, renderer;
let cubes = [], rhombuses = [];
let fireworks = [];
let exploded = false;
let score = 0;
let countdown = 30;
let countdownActive = false;
let state = 'scene1';
const clock = new THREE.Clock();
const activeTrails = [];
const clickableFireworks = [];
let starModel;
let activeStars = [];
let controls;
let composer;
const BLOOM_LAYER = 1;
const darkMaterial = new THREE.MeshBasicMaterial({ color: 'black' });
const materials = {};


const trailGeometry = new THREE.SphereGeometry(0.05, 4, 4);
const trailMaterials = Array.from({ length: 12 }, (_, i) =>
  new THREE.MeshBasicMaterial({
    color: new THREE.Color(`hsl(${i * 30}, 100%, 60%)`),
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  })
);

const heartShape = createHeartShape();
const heartGeometry = new THREE.ExtrudeGeometry(heartShape, { depth: 0.2, bevelEnabled: false });
const heartMaterial = new THREE.MeshBasicMaterial({ color: 0xff66aa, transparent: true, opacity: 0.5, depthWrite: false });

const scoreElem = document.getElementById('score');
const timeElem = document.getElementById('time');
const boomBtn = document.getElementById('explodeBtn');

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

document.addEventListener('click', onClick, false);

init();
setTimeout(() => {
  animate();
}, 0);

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 10;

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer = new EffectComposer(renderer);

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
  bloomPass.threshold = 0;
  bloomPass.strength = 1.5;
  bloomPass.radius = 0.2;
  composer.addPass(bloomPass);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  document.body.appendChild(renderer.domElement);
  document.getElementById('startGameBtn').addEventListener('click', () => {
  startGame();
});

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);

  const pointLight = new THREE.PointLight(0xffaa88, 1, 100);
  pointLight.position.set(0, 2, 5);
  scene.add(pointLight);
  controls.enableDamping = true;

}

function startGame() {
  document.getElementById('gameIntro').style.display = 'none';
  state = 'scene1';
  score = 0;
  countdown = 30;
  countdownActive = true;
  scoreElem.textContent = `Score: ${score}`;
  timeElem.textContent = `Time: ${countdown}`;

  const loader = new THREE.CubeTextureLoader();
  const basePath = 'textures/';
  const fileNames = [
    'space_px.jpg', 'space_nx.jpg',
    'space_py.jpg', 'space_ny.jpg',
    'space_pz.jpg', 'space_nz.jpg',
  ];
  scene.background = loader.setPath(basePath).load(fileNames);

  const geometry = new THREE.OctahedronGeometry(0.2);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ccff });

  for (let i = 0; i < 100; i++) {
    const rhombus = new THREE.Mesh(geometry, material.clone());
    rhombus.position.set(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 5,
      (Math.random() - 0.5) * 5
    );
    rhombus.userData.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.01,
      (Math.random() - 0.5) * 0.01,
      0
    );
    rhombuses.push(rhombus);
    clickableFireworks.push(rhombus);
    scene.add(rhombus);
  }

  startCountdown();
}

function startCountdown() {
  const timer = setInterval(() => {
    if (!countdownActive) {
      clearInterval(timer);
      return;
    }

    countdown--;
    if (timeElem) {
      timeElem.textContent = `Time: ${countdown}`;
    }

    if (countdown <= 0) {
      clearInterval(timer);
      endGame();
    }
  }, 1000);
}


function endGame() {
  rhombuses.forEach(r => scene.remove(r));
  rhombuses.length = 0;

  scene.background = new THREE.Color(0x000000);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ccff });
  const cubeSize = 0.3;
  const spacing = 0.2;
  const offset = (10 - 1) / 2;
  for (let x = 0; x < 10; x++) {
    for (let y = 0; y < 10; y++) {
      for (let z = 0; z < 10; z++) {
        const cube = new THREE.Mesh(new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize), material.clone());
        cube.position.set((x - offset) * spacing, (y - offset) * spacing, (z - offset) * spacing);
        scene.add(cube);
        cubes.push(cube);
      }
    }
  }

  boomBtn.style.display = 'block';
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);

  controls.reset();

  state = 'scene2';
  countdownActive = false;
}


boomBtn.addEventListener('click', () => {
  if (!exploded && state === 'scene2') {
    boomBtn.style.display = 'none';
    explode();
    exploded = true;
  }
});

function explode() {
  const material = new THREE.MeshBasicMaterial({ color: 0x00ccff });
  const cubeSize = 0.3;
  const spacing = 0.2;
  const offset = (10 - 1) / 2;
  for (let x = 0; x < 10; x++) {
    for (let y = 0; y < 10; y++) {
      for (let z = 0; z < 10; z++) {
        const cube = new THREE.Mesh(new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize), material.clone());
        cube.position.set((x - offset) * spacing, (y - offset) * spacing, (z - offset) * spacing);
        scene.add(cube);
        cubes.push(cube);
      }
    }
  }

  cubes.forEach(cube => {
    const dir = cube.position.clone().normalize().multiplyScalar(0.1 + Math.random() * 0.2);
    const rotSpeed = (Math.random() - 0.5) * 0.2;
    cube.userData.velocity = dir;
    cube.userData.rotSpeed = rotSpeed;
  });

  setTimeout(() => {
    cubes.forEach(cube => {
      if (cube.position.distanceTo(new THREE.Vector3(0, 0, 0)) < 2.5) {
        scene.remove(cube);
      }
    });
    generateWOW();
    spawnStar(-11);
    spawnStar(11);
  }, 2000);
}

function generateWOW() {
  const glowMaterial = new THREE.MeshStandardMaterial({
    color: 0xff66ff,
    emissive: 0xff66ff,
    emissiveIntensity: 10.0,
    metalness: 0.2,
    roughness: 0.3
  });

  const spacing = 0.75;
  const baseY = -1.5;
  const baseX = -2;

  const W_POINTS = [
    [0, 0], [0, 1], [0, 2], [0, 3], [0, 4],
    [1, 0], [2, 1], [3, 2], [3, 3],
    [4, 1], [5, 0], [6, 0], [6, 1], [6, 2], [6, 3], [6, 4],
  ];

  const O_POINTS = [
    [0, 1], [0, 2], [0, 3],
    [1, 0], [1, 4],
    [2, 0], [2, 4],
    [3, 0], [3, 4],
    [4, 0], [4, 4],
    [5, 1], [5, 2], [5, 3],
  ];

  const WOW_POSITIONS = [
    ...W_POINTS.map(([x, y]) => [x - 9, y]),
    ...O_POINTS.map(([x, y]) => [x, y]),
    ...W_POINTS.map(([x, y]) => [x + 8, y]),
  ];

  WOW_POSITIONS.forEach(([gx, gy]) => {
    const cube = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), glowMaterial.clone());
    cube.position.set(baseX + gx * spacing, baseY + gy * spacing, 0);
    cube.layers.set(0);
    cube.layers.enable(BLOOM_LAYER);
    scene.add(cube);
  });
}

function spawnStar(x) {
  const loader = new GLTFLoader();
  loader.load('textures/Star.glb', gltf => {
    const star = gltf.scene;
    star.scale.set(0.5, 0.5, 0.5);
    star.position.set(x, -2, 0);
    star.userData.velocity = new THREE.Vector3(0, 0.01, 0);

    star.traverse(child => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: 0xffcc00,
          emissive: 0xffcc00,
          emissiveIntensity: 2,
          metalness: 0.5,
          roughness: 0.3
        });
      }
    });

    const starLight = new THREE.PointLight(0xffcc00, 1.5, 5);
    starLight.position.set(0, 0, 0);
    star.add(starLight);

    scene.add(star);
    activeStars.push(star);
  });
}

function createHeartShape() {
  const x = 0, y = 0;
  const shape = new THREE.Shape();
  shape.moveTo(x + 5, y + 5);
  shape.bezierCurveTo(x + 5, y + 5, x + 4, y, x, y);
  shape.bezierCurveTo(x - 6, y, x - 6, y + 7, x - 6, y + 7);
  shape.bezierCurveTo(x - 6, y + 11, x - 3, y + 15.4, x + 5, y + 19);
  shape.bezierCurveTo(x + 12, y + 15.4, x + 16, y + 11, x + 16, y + 7);
  shape.bezierCurveTo(x + 16, y + 7, x + 16, y, x + 10, y);
  shape.bezierCurveTo(x + 7, y, x + 5, y + 5, x + 5, y + 5);
  return shape;
}

function onClick(event) {
  if (state !== 'scene1' || !countdownActive) return;
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(clickableFireworks, false);
  if (intersects.length > 0) {
    const obj = intersects[0].object;
    scene.remove(obj);
    clickableFireworks.splice(clickableFireworks.indexOf(obj), 1);
    score += 5;
    scoreElem.textContent = `Score: ${score}`;
  }
}

function animate() {
  controls.update(); // 更新相机控制器（需要 enableDamping 才生效）
  requestAnimationFrame(animate);
  const now = performance.now();

  if (state === 'scene1') {
    rhombuses.forEach(r => {
      r.position.add(r.userData.velocity);
      if (r.position.x < -5 || r.position.x > 5) r.userData.velocity.x *= -1;
      if (r.position.y < -3 || r.position.y > 3) r.userData.velocity.y *= -1;
    });

    if (countdownActive) {
      timeElem.textContent = `Time: ${Math.max(0, Math.floor(countdown))}`;
      if (countdown <= 0) endGame();
    }
  }

  if (state === 'scene2') {
    cubes.forEach((cube, index) => {
      if (cube.userData.velocity) {
        cube.position.add(cube.userData.velocity);
        cube.rotation.x += cube.userData.rotSpeed;
        cube.rotation.y += cube.userData.rotSpeed;

        if (index % 20 === 0) {
          const colorIndex = Math.floor((cube.position.length() * 2 + now * 0.01) % trailMaterials.length);
          const trail = new THREE.Mesh(trailGeometry, trailMaterials[colorIndex]);
          trail.position.copy(cube.position);
          trail.userData.birth = now;
          activeTrails.push(trail);
          scene.add(trail);
        }
      }
    });

    activeStars.forEach(star => {
      if (star.position.y < 2) {
        star.position.add(star.userData.velocity);
        const heart = new THREE.Mesh(heartGeometry, heartMaterial.clone());
        heart.position.copy(star.position);
        heart.scale.set(0.01, 0.01, 0.01);
        heart.rotation.z = Math.random() * Math.PI;
        heart.userData.birth = now;
        activeTrails.push(heart);
        scene.add(heart);
      }
    });

    for (let i = activeTrails.length - 1; i >= 0; i--) {
      if (now - activeTrails[i].userData.birth > 800) {
        scene.remove(activeTrails[i]);
        activeTrails.splice(i, 1);
      }
    }
  }

  composer.render();

}




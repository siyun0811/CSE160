let gl, canvas;
let a_Position, a_TexCoord;
let u_ModelMatrix, u_ViewMatrix, u_ProjectionMatrix, u_texColorWeight, u_Sampler, u_baseColor;
let camera;
let textures = {};
let texturesLoaded = 0;
let u_selectedTexture;
let highlightCoord = null;
let frameCount = 0;
setInterval(() => {
  console.log("FPS:", frameCount);
  frameCount = 0;
}, 1000);

const requiredTextures = 8;
const wallHeights = [1, 2, 3, 4];

const map = [];
for (let z = 0; z < 32; z++) {
  map[z] = [];
  for (let x = 0; x < 32; x++) {
    map[z][x] = {
      h: 1,
      t: 0
    };
  }
}

map[16][16].h = 6;
map[16][16].t = 0;

generateBrickWalls();
const wallPattern = [
  { x: 5, zStart: 5, height: 1 },
  { x: 6, zStart: 5, height: 2 },
  { x: 7, zStart: 5, height: 3 },
  { x: 8, zStart: 5, height: 4 },
  { x: 5, zStart: 10, height: 4 },
  { x: 6, zStart: 10, height: 3 },
  { x: 7, zStart: 10, height: 2 },
  { x: 8, zStart: 10, height: 1 },
  { z: 15, xStart: 12, height: 4 },
  { z: 16, xStart: 12, height: 3 },
  { z: 17, xStart: 12, height: 2 },
  { z: 18, xStart: 12, height: 1 },
];

for (const wall of wallPattern) {
  if (wall.x !== undefined && wall.zStart !== undefined) {
    for (let z = wall.zStart; z < wall.zStart + 3; z++) {
      map[z][wall.x].h = wall.height;
      map[z][wall.x].t = 0;
    }
  } else if (wall.z !== undefined && wall.xStart !== undefined) {
    for (let x = wall.xStart; x < wall.xStart + 3; x++) {
      map[wall.z][x].h = wall.height;
      map[wall.z][x].t = 0;
    }
  }
}

let cubs = [];
let rescuedCount = 0;
let totalCubs = 5;
let timeLeft = 120;
let lastUpdateTime = Date.now();
let gameOver = false;
let gameStarted = false;
let victory = false;

function placeCubs() {
  while (cubs.length < totalCubs) {
    const x = Math.floor(Math.random() * 32);
    const z = Math.floor(Math.random() * 32);
    if (map[z][x].h === 1) {
      cubs.push({ x, z, rescued: false });
    }
  }
}

function updateGameTime() {
  if (!gameStarted || gameOver || victory) return;
  const now = Date.now();
  if (now - lastUpdateTime >= 1000) {
    timeLeft--;
    lastUpdateTime = now;
    if (timeLeft <= 0) {
      gameOver = true;
      showMessage("Time's up! Game over.");
    } else if (rescuedCount === totalCubs) {
      victory = true;
      showMessage("All cubs rescued! You win!");
    }
  }
}

function generateBrickWalls() {
  for (let z = 2; z < 30; z += 2) {
    for (let x = 2; x < 30; x += 2) {
      map[z][x].h = wallHeights[(x + z) % wallHeights.length];
      map[z][x].t = 0;
    }
  }

  for (let z = 4; z <= 28; z += 4) {
    for (let x = 2; x <= 28; x += 4) {
      const h = wallHeights[(x * z) % wallHeights.length];
      for (let i = 0; i < 3; i++) {
        const px = x + i;
        if (px < 32) {
          map[z][px].h = h;
          map[z][px].t = 0;
        }
      }
    }
  }

  for (let x = 2; x <= 28; x += 4) {
    for (let z = 6; z <= 28; z += 5) {
      const h = wallHeights[(x + z) % wallHeights.length];
      for (let i = 0; i < 3; i++) {
        const pz = z + i;
        if (pz < 32) {
          map[pz][x].h = h;
          map[pz][x].t = 0;
        }
      }
    }
  }

  for (let i = 0; i < 12; i++) {
    const x = i + 10;
    const z = i + 3;
    if (x < 32 && z < 32) {
      map[z][x].h = (i % 4) + 1;
      map[z][x].t = 0;
    }
  }
}


function main() {
  canvas = document.getElementById("webgl");
  gl = canvas.getContext("webgl");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (!gl) {
    console.error("WebGL not supported.");
    return;
  }

  const vsSource = document.getElementById("shader-vs").textContent;
  const fsSource = document.getElementById("shader-fs").textContent;

  if (!initShaders(gl, vsSource, fsSource)) {
    console.error("Failed to initialize shaders.");
    return;
  }

  camera = new Camera();
  setup();

  document.addEventListener("keydown", handleKeyDown);
  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    camera.updateProjectionMatrix();
    drawScene();
  });

  canvas.addEventListener("click", () => {
    if (document.pointerLockElement === canvas) {
      document.exitPointerLock();
    } else {
      canvas.requestPointerLock();
    }
  });

  document.addEventListener("mousemove", (e) => {
    if (document.pointerLockElement === canvas) {
      const sensitivity = 0.2;
      camera.panRight(-e.movementX * sensitivity);
      drawScene();
    }
  });

  document.addEventListener("pointerlockchange", () => {
    if (document.pointerLockElement === canvas) {
      console.log("Entered camera control mode");
    } else {
      console.log("Exited camera control mode");
    }
  });
  placeCubs();
  gameLoop(); 
}

function handleSafeZoneDrop() {
  const dist = Math.sqrt(camera.eye.elements[0]**2 + camera.eye.elements[2]**2);
  if (dist < 2) {
    for (const cub of cubs) {
      if (cub.rescued && !cub.delivered) {
        cub.delivered = true;
        rescuedCount++;
        showMessage(`Returned to Safe Zone! (${rescuedCount}/${totalCubs})`);
      }
    }
  }
}

function resetGame() {
  rescuedCount = 0;
  timeLeft = 120;
  gameOver = false;
  victory = false;
  gameStarted = false;
  cubs = [];
  placeCubs();
  drawScene();
  showMessage("Game restarted");
}


function showMessage(text, duration = 2000) {
  const msgBox = document.getElementById("messageBox");
  if (!msgBox) return;
  msgBox.innerText = text;
  msgBox.style.display = "block";
  setTimeout(() => {
    msgBox.style.display = "none";
  }, duration);
}

function loadTexture(name, url) {
  const tex = gl.createTexture();
  const img = new Image();
  img.onload = function () {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    textures[name] = tex;
    texturesLoaded++;
    drawScene();
  };
  img.onerror = function () {
    console.warn("Texture loading failed：", name, url);
    textures[name] = null;
    drawScene();
  };
  img.src = url;
}

function setup() {
  gl.useProgram(gl.program);
  u_selectedTexture = gl.getUniformLocation(gl.program, "u_selectedTexture");

  const verticesTexCoords = new Float32Array([
    // Front face
    -0.5, -0.5,  0.5, 0.0, 0.0,
     0.5, -0.5,  0.5, 1.0, 0.0,
     0.5,  0.5,  0.5, 1.0, 1.0,
    -0.5,  0.5,  0.5, 0.0, 1.0,
  
    // Back face
     0.5, -0.5, -0.5, 0.0, 0.0,
    -0.5, -0.5, -0.5, 1.0, 0.0,
    -0.5,  0.5, -0.5, 1.0, 1.0,
     0.5,  0.5, -0.5, 0.0, 1.0,
  
    // Top face
    -0.5,  0.5,  0.5, 0.0, 0.0,
     0.5,  0.5,  0.5, 1.0, 0.0,
     0.5,  0.5, -0.5, 1.0, 1.0,
    -0.5,  0.5, -0.5, 0.0, 1.0,
  
    // Bottom face
    -0.5, -0.5, -0.5, 0.0, 0.0,
     0.5, -0.5, -0.5, 1.0, 0.0,
     0.5, -0.5,  0.5, 1.0, 1.0,
    -0.5, -0.5,  0.5, 0.0, 1.0,
  
    // Right face
     0.5, -0.5,  0.5, 0.0, 0.0,
     0.5, -0.5, -0.5, 1.0, 0.0,
     0.5,  0.5, -0.5, 1.0, 1.0,
     0.5,  0.5,  0.5, 0.0, 1.0,
  
    // Left face
    -0.5, -0.5, -0.5, 0.0, 0.0,
    -0.5, -0.5,  0.5, 1.0, 0.0,
    -0.5,  0.5,  0.5, 1.0, 1.0,
    -0.5,  0.5, -0.5, 0.0, 1.0
  ]);
  
  const indices = new Uint8Array([
     0,  1,  2,   0,  2,  3,
     4,  5,  6,   4,  6,  7,
     8,  9, 10,   8, 10, 11,
    12, 13, 14,  12, 14, 15,
    16, 17, 18,  16, 18, 19,
    20, 21, 22,  20, 22, 23
  ]);
  
  const vertexBuffer = gl.createBuffer();
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesTexCoords, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  const FSIZE = verticesTexCoords.BYTES_PER_ELEMENT;
  a_Position = gl.getAttribLocation(gl.program, "a_Position");
  a_TexCoord = gl.getAttribLocation(gl.program, "a_TexCoord");
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 5, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 5, FSIZE * 3);
  gl.enableVertexAttribArray(a_TexCoord);

  u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  u_ViewMatrix = gl.getUniformLocation(gl.program, "u_ViewMatrix");
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, "u_ProjectionMatrix");
  u_texColorWeight = gl.getUniformLocation(gl.program, "u_texColorWeight");
  u_Sampler = gl.getUniformLocation(gl.program, "u_Sampler");
  u_baseColor = gl.getUniformLocation(gl.program, "u_baseColor");

  loadTexture("brick", "textures/brick.png");
  loadTexture("grass", "textures/grass.png");
  loadTexture("sky_right", "textures/sky_right.png");
  loadTexture("sky_left", "textures/sky_left.png");
  loadTexture("sky_top", "textures/sky_top.png");
  loadTexture("sky_bottom", "textures/sky_bottom.png");
  loadTexture("sky_front", "textures/sky_front.png");
  loadTexture("sky_back", "textures/sky_back.png");
}

function drawSkybox() {
  const size = 100;
  const faces = [
    { name: "sky_right", tx: 1, ry: 90 },
    { name: "sky_left", tx: -1, ry: -90 },
    { name: "sky_top", ty: 1, rx: -90 },
    { name: "sky_bottom", ty: -1, rx: 90 },
    { name: "sky_front", tz: 1, ry: 0 },
    { name: "sky_back", tz: -1, ry: 180 },
  ];

  gl.depthMask(false);
  for (let i = 0; i < faces.length; i++) {
    const face = faces[i];
    if (!textures[face.name]) continue;

    const modelMatrix = new Matrix4();
    modelMatrix.setTranslate(...camera.eye.elements);
    if (face.ry) modelMatrix.rotate(face.ry, 0, 1, 0);
    if (face.rx) modelMatrix.rotate(face.rx, 1, 0, 0);
    modelMatrix.translate(face.tx || 0, face.ty || 0, face.tz || 0);
    modelMatrix.scale(size, size, size);

    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.activeTexture(gl.TEXTURE2 + i);
    gl.bindTexture(gl.TEXTURE_2D, textures[face.name]);
    gl.uniform1i(u_Sampler, 2 + i);
    gl.uniform1f(u_texColorWeight, 1.0);
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 0);
  }
  gl.depthMask(true);
}

function drawGround() {
  const modelMatrix = new Matrix4().setTranslate(0, -1.51, 0);
  modelMatrix.scale(50, 0.05, 50);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  if (textures["grass"]) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textures["grass"]);
    gl.uniform1i(u_Sampler, 0);
    gl.uniform1f(u_texColorWeight, 1.0);
  } else {
    gl.uniform1f(u_texColorWeight, 0.0);
    gl.uniform4f(u_baseColor, 0.2, 0.6, 0.2, 1.0);
  }

  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 0);
}


function drawMapWorld() {
  const camX = Math.floor(camera.eye.elements[0] + 16);
  const camZ = Math.floor(camera.eye.elements[2] + 16);
  const range = 12; 

  for (let z = Math.max(0, camZ - range); z < Math.min(32, camZ + range); z++) {
    for (let x = Math.max(0, camX - range); x < Math.min(32, camX + range); x++) {
      const cell = map[z][x];
      for (let y = 0; y < cell.h; y++) {
        const modelMatrix = new Matrix4().setTranslate(x - 16, y - 2, z - 16);
        gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

        const texName = cell.t === 0 ? "brick" : "grass";
        const tex = textures[texName];

        if (tex) {
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.uniform1i(u_Sampler, 0);
          gl.uniform1f(u_texColorWeight, 1.0);
        } else {
          gl.uniform1f(u_texColorWeight, 0.0);
          gl.uniform4f(u_baseColor, 0.7, 0.4, 0.2, 1.0);
        }

        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 0);
      }
    }
  }
}

function drawCubs() {
  for (const cub of cubs) {
    if (cub.rescued) continue;
    const modelMatrix = new Matrix4().setTranslate(cub.x - 16, 0, cub.z - 16);
    modelMatrix.scale(0.5, 0.5, 0.5);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.uniform1f(u_texColorWeight, 0.0);
    gl.uniform4f(u_baseColor, 1.0, 1.0, 0.0, 1.0);
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 0);
  }
}

function drawSafeZone() {
  const modelMatrix = new Matrix4().setTranslate(0 - 16, 0, 0 - 16);
  modelMatrix.scale(1.2, 0.1, 1.2);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniform1f(u_texColorWeight, 0.0);
  gl.uniform4f(u_baseColor, 0.0, 1.0, 1.0, 1.0);
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 0);
}

function handleCubsPickup() {
  if (!highlightCoord) return;
  for (const cub of cubs) {
    if (!cub.rescued && Math.abs(cub.x - highlightCoord.x) <= 1 && Math.abs(cub.z - highlightCoord.z) <= 1) {
      cub.rescued = true;
      rescuedCount++;
      showMessage(`You rescued a cub! (${rescuedCount}/${totalCubs})`);
      break;
    }
  }
}

function updateHighlightCoord() {
  const dx = camera.at.elements[0] - camera.eye.elements[0];
  const dz = camera.at.elements[2] - camera.eye.elements[2];
  const len = Math.sqrt(dx * dx + dz * dz);
  const dirX = dx / len;
  const dirZ = dz / len;

  highlightCoord = null;

  for (let t = 0.05; t < 6; t += 0.05) {
    const fx = camera.eye.elements[0] + dirX * t;
    const fz = camera.eye.elements[2] + dirZ * t;
    const tx = Math.floor(fx + 16);
    const tz = Math.floor(fz + 16);

    if (tx < 0 || tx >= 32 || tz < 0 || tz >= 32) continue;
    if (map[tz] && map[tz][tx] && map[tz][tx].h > 0) {
      highlightCoord = { x: tx, z: tz };
      break;
    }
  }
}

function drawScene() {
  updateHighlightCoord();
  gl.clearColor(0.6, 0.8, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);

  drawSkybox();
  drawGround();
  drawMapWorld();
  drawSafeZone();
  drawCubs();

  if (highlightCoord) {
    const { x, z } = highlightCoord;
    const h = map[z][x].h;
    const modelMatrix = new Matrix4().setTranslate(x - 16, h - 2, z - 16);
    modelMatrix.scale(1.01, 1.01, 1.01);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.uniform1f(u_texColorWeight, 0.0);
    gl.uniform4f(u_baseColor, 1.0, 0.0, 0.0, 0.5);
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 0);
  }

  updateGameTime();
  const msg = victory
    ? "You Win!"
    : gameOver
    ? "Game Over"
    : `🐾 Cubs: ${rescuedCount}/${totalCubs} ⏳ Time: ${timeLeft}s`;
  const box = document.getElementById("messageBox");
  if (box) {
    box.innerText = msg;
    box.style.display = "block";
  }
}

function gameLoop() {
  updateGameTime();
  drawScene();
  requestAnimationFrame(gameLoop);
  frameCount++;
}


function handleKeyDown(event) {
  if (!gameStarted) {
    gameStarted = true;
    lastUpdateTime = Date.now();
  }
  const key = event.key.toLowerCase();
  const speed = 0.3;
  const angle = 3;
  switch (key) {
    case "w": camera.moveForward(speed); break;
    case "s": camera.moveBackwards(speed); break;
    case "a": camera.moveLeft(speed); break;
    case "d": camera.moveRight(speed); break;
    case "q": camera.panLeft(angle); break;
    case "e": camera.panRight(angle); break;
    case "h": if (gameOver || victory) resetGame();break;
    case "t": handleCubsPickup(); break;
    case "r": camera.eye.elements[1] += speed; camera.at.elements[1] += speed; camera.updateViewMatrix(); break;
    case "f": camera.eye.elements[1] -= speed; camera.at.elements[1] -= speed; camera.updateViewMatrix(); break;
    case "b": {
      if (highlightCoord) {
        const { x, z } = highlightCoord;
        if (map[z][x].h < 6) {
          map[z][x].h += 1;
          map[z][x].t = 0;
          drawScene();
        } else {
          showMessage("The cube has reached its maximum height.");
        }
      } else {
        showMessage("No squares hit, can't be added");
      }
      break;
    }
    case "n": {
      if (highlightCoord) {
        const { x, z } = highlightCoord;
        if (map[z][x].h > 0) {
          map[z][x].h -= 1;
          drawScene();
        } else {
          showMessage("The cube has been deleted.");
        }
      } else {
        showMessage("No squares hit, can't be deleted");
      }
      break;
    }
    default: return;
  }
  drawScene();
}

main();

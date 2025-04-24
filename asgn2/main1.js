let canvas, gl;
let a_Position, u_ModelMatrix, u_GlobalRotation, u_ProjectionMatrix, u_ViewMatrix, u_Color;
let g_time = 0;
let g_tailAngles = [0, 0, 0];
let g_legAngle = 0;
let g_jawAngle = 0;
let g_pokeStartTime = -1;
let g_rotX = 0;
let g_rotY = 0;
let g_specialAction = null;
let keyPressed = {};
let g_thighAngle = 0, g_thighLocked = false;
let g_calfAngle  = 0, g_calfLocked = false;
let g_footAngle  = 0, g_footLocked = false;
let gAnimalGlobalRotation = 0;
let g_animation = false;
let g_poke = false;
let g_autoThighAngle = 0;
let g_autoCalfAngle = 0;
let g_autoFootAngle = 0;
let g_mouseDown = false;
let g_mouseLastX = 0;
let g_mouseLastY = 0;
let g_bodyTilt = 0;
let g_pokeLegAngle = 0;
let g_animationOn = false;
let g_lastTime = performance.now();
let g_fps = 0;



function main() {
  canvas = document.getElementById("webgl");
  gl = canvas.getContext("webgl");
  gl.enable(gl.DEPTH_TEST);

  const vs = `
    attribute vec4 a_Position;

    uniform mat4 u_ModelMatrix;
    uniform mat4 u_GlobalRotation;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjectionMatrix;

    void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotation * u_ModelMatrix * a_Position;
    }
 `;
  const fs = `
    precision mediump float;
    uniform vec4 u_Color;
    void main() {
      gl_FragColor = u_Color;
    }
  `;
  canvas.addEventListener("mousedown", (e) => {
    g_mouseDown = true;
    g_mouseLastX = e.clientX;
    g_mouseLastY = e.clientY;
  });
  
  canvas.addEventListener("mouseup", () => {
    g_mouseDown = false;
  });
  
  canvas.addEventListener("mousemove", (e) => {
    if (!g_mouseDown) return;
    const dx = e.clientX - g_mouseLastX;
    const dy = e.clientY - g_mouseLastY;
    g_rotY += dx * 0.5;
    g_rotX += dy * 0.5;
    g_mouseLastX = e.clientX;
    g_mouseLastY = e.clientY;
  });
  
  if (!initShaders(gl, vs, fs)) {
    console.error("Failed to initialize shaders");
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_GlobalRotation = gl.getUniformLocation(gl.program, 'u_GlobalRotation');
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_Color = gl.getUniformLocation(gl.program, 'u_Color');

  canvas.addEventListener("click", (e) => {
    if (e.shiftKey) {
      g_pokeStartTime = g_time;
    } else if (keyPressed["f"]) {
      g_specialAction = "liftFrontLeg";
      setTimeout(() => g_specialAction = null, 1000);
    }
  });

  document.addEventListener("keydown", (e) => keyPressed[e.key.toLowerCase()] = true);
  document.addEventListener("keyup", (e) => keyPressed[e.key.toLowerCase()] = false);
  document.getElementById("resetBtn").onclick = resetAll;
  document.getElementById("startAnimBtn").onclick = () => { g_animationOn = true;};
  document.getElementById("stopAnimBtn").onclick = () => { g_animationOn = false;};
  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
    let t = g_time;
    if (!g_thighLocked) g_thighAngle = 15 * Math.sin(t * 3);
    if (!g_calfLocked)  g_calfAngle  = 15 * Math.sin(t * 2);
    if (!g_footLocked)  g_footAngle  = 10 * Math.sin(t * 5);
  
    for (let i = 0; i < g_tailAngles.length; i++) {
      g_tailAngles[i] = 20 * Math.sin(t * (4 + i));
    }
  }
  

function tick(now) {
    g_time = now / 1000.0;
    // --- FPS  ---
    const elapsed = now - g_lastTime;
    g_fps = 1000 / elapsed;
    g_lastTime = now;

    const fpsDisplay = document.getElementById("fps");
    if (fpsDisplay) fpsDisplay.textContent = g_fps.toFixed(1);
    updateAnimation();
    renderScene();
    requestAnimationFrame(tick);

  }
  function updateAnimation() {
    if (g_animationOn) {
      if (!g_thighLocked) g_thighAngle = 15 * Math.sin(g_time * 3);
      if (!g_calfLocked)  g_calfAngle  = 15 * Math.sin(g_time * 2);
      if (!g_footLocked)  g_footAngle  = 10 * Math.sin(g_time * 5);
  
      for (let i = 0; i < g_tailAngles.length; i++) {
        g_tailAngles[i] = 20 * Math.sin(g_time * (4 + i));
      }
    }

    if (g_specialAction === "liftFrontLeg") {
      g_thighLocked = true;
      g_thighAngle = 45;
      setTimeout(() => {
        g_specialAction = null;
        g_thighLocked = false;
      }, 1000);
    }
  
    if (g_pokeStartTime > 0) {
      const pokeElapsed = g_time - g_pokeStartTime;
      if (pokeElapsed < 1.5) {
        g_jawAngle = -30 * Math.sin(pokeElapsed * Math.PI);
        g_bodyTilt = -10 * Math.sin(pokeElapsed * Math.PI);
        g_pokeLegAngle = 30 * Math.sin(pokeElapsed * Math.PI);
      } else {
        g_jawAngle = 0;
        g_bodyTilt = 0;
        g_pokeLegAngle = 0;
        g_pokeStartTime = -1;
      }
    }
  }
  
  


function renderScene() {
    const projectionMatrix = new Matrix4().setPerspective(60, canvas.width / canvas.height, 0.1, 100);
    const viewMatrix = new Matrix4().setLookAt(0, 2, 7, 0, 0, 0, 0, 1, 0).rotate(g_rotX, 1, 0, 0).rotate(g_rotY, 0, 1, 0);
    const globalRot = new Matrix4().rotate(-65, 0, 1, 0).rotate(gAnimalGlobalRotation, 0, 1, 0);
  
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projectionMatrix.elements);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    gl.uniformMatrix4fv(u_GlobalRotation, false, globalRot.elements);
  
    const body = new Matrix4().translate(0, 0.5, 0).rotate(g_bodyTilt, 1, 0, 0).scale(2.5, 1, 1);
    drawCube(body, [0.3, 0.3, 0.3, 1]);
  
    buildHead(new Matrix4(body).translate(0.8, 0.6, 0));     // Head
    buildTail(new Matrix4(body).translate(-0.2, 0.3, 0));    // Tail
  
    buildLegStructured(new Matrix4(body).translate( 0.6, -0.5,  0.5), g_thighAngle, g_calfAngle, g_footAngle); // Front right
    buildLegStructured(new Matrix4(body).translate( 0.6, -0.5, -0.5), g_thighAngle, g_calfAngle, g_footAngle); // Front left
    buildLegStructured(new Matrix4(body).translate(-0.6, -0.5,  0.5), g_thighAngle, g_calfAngle, g_footAngle); // Back right
    buildLegStructured(new Matrix4(body).translate(-0.6, -0.5, -0.5), g_thighAngle, g_calfAngle, g_footAngle); // Back left
    
  }
  

  function buildLegStructured(baseMatrix, thighAngle, calfAngle, footAngle) {
    // (Shift + Click）
    let finalThighAngle = g_pokeStartTime > 0 ? g_pokeLegAngle : thighAngle;
    let finalCalfAngle = g_pokeStartTime > 0 ? g_pokeLegAngle : calfAngle;
    let finalFootAngle = g_pokeStartTime > 0 ? g_pokeLegAngle : footAngle;
  
    const thighMatrix = new Matrix4(baseMatrix);
    thighMatrix.rotate(finalThighAngle, 0, 0, 1);
    const thighDraw = new Matrix4(thighMatrix).scale(0.4, 0.6, 0.4);
    drawCube(thighDraw, [1.0, 1.0, 1.0, 1.0]);
  
    const kneeMatrix = new Matrix4(thighMatrix).translate(0, -0.6, 0);
    drawRealCylinder(new Matrix4(kneeMatrix).scale(0.3, 0.3, 0.3), [0, 0, 0, 1]);

    const calfMatrix = new Matrix4(kneeMatrix);
    calfMatrix.rotate(finalCalfAngle, 0, 0, 1); 
    const calfDraw = new Matrix4(calfMatrix).translate(0, -0.3, 0).scale(0.3, 0.6, 0.3);
    drawCube(calfDraw, [0.4, 0.4, 0.4, 1]);
  
    const ankleMatrix = new Matrix4(calfMatrix).translate(0, -0.6, 0);
    drawRealCylinder(new Matrix4(ankleMatrix).scale(0.3, 0.3, 0.3), [0.2, 0.2, 0.2, 1]);
  
    const footMatrix = new Matrix4(ankleMatrix);
    footMatrix.rotate(finalFootAngle, 0, 0, 1);
    const footDraw = new Matrix4(footMatrix).translate(0, -0.1, 0).scale(0.4, 0.2, 0.4);
    drawCube(footDraw, [0.2, 0.2, 0.2, 1]);
  }
  
  
  
  

function buildHead(base) {
    const head = new Matrix4(base).scale(0.8, 1, 1.6);
    drawCube(head, [0.3, 0.3, 0.3, 1]);

    const nose = new Matrix4(head)
    .translate(0.8, -0.25, 0)
    .scale(0.15, 0.15, 0.15);
    drawCube(nose, [0, 0, 0, 1]);

    const tongue = new Matrix4(head)
    .translate(0.7, -0.6, 0)
    .scale(0.15, 0.05, 0.2);
    drawCube(tongue, [1.0, 0.2, 0.2, 1]);

    const jaw = new Matrix4(head).translate(0.6, -0.4, 0).scale(0.5, 0.2, 0.4);
    drawCube(jaw, [0.2, 0.2, 0.2, 1]);

    const eyeL = new Matrix4(base).translate(0.4, 0.4, 0.4).scale(0.1, 0.1, 0.1);
    const eyeR = new Matrix4(base).translate(0.4, 0.4, -0.4).scale(0.1, 0.1, 0.1);
    drawCube(eyeL, [0, 0, 0, 1]);
    drawCube(eyeR, [0, 0, 0, 1]);

    drawCube(new Matrix4(head).translate(0.1, 0.7, 0.3).scale(0.3, 0.5, 0.2), [0.3, 0.3, 0.3, 1]);
    drawCube(new Matrix4(head).translate(0.1, 0.7, -0.3).scale(0.3, 0.5, 0.2), [0.3, 0.3, 0.3, 1]);
}

function buildTail(baseMatrix) {
  let tail = new Matrix4(baseMatrix);
  for (let i = 0; i < g_tailAngles.length; i++) {
    tail.rotate(g_tailAngles[i], 0, 1, 0);
    drawRealCylinder(new Matrix4(tail).scale(0.1, 0.1, 0.1), [0.1, 0.1, 0.1, 1]);
    tail.translate(-0.3, 0, 0);
    drawCube(new Matrix4(tail).scale(0.2, 0.2, 0.2), [0.3, 0.3, 0.3, 1]);
    tail.translate(-0.2, 0, 0);
  }
}

function buildLegAnimated(base, front) {
  const thigh = new Matrix4(base).rotate(front ? g_legAngle : -g_legAngle, 1, 0, 0).scale(0.4, 0.6, 0.4);
  drawCube(thigh, [0.5, 0.3, 0.2, 1]);
  drawRealCylinder(new Matrix4(base).translate(0, -0.6, 0).scale(0.2, 0.2, 0.2), [0.1, 0.1, 0.1, 1]);

  const calf = new Matrix4(base).translate(0, -0.9, 0).rotate(front ? -g_legAngle : g_legAngle, 1, 0, 0).scale(0.3, 0.6, 0.3);
  drawCube(calf, [0.6, 0.4, 0.2, 1]);
  drawRealCylinder(new Matrix4(base).translate(0, -1.2, 0).scale(0.2, 0.2, 0.2), [0.1, 0.1, 0.1, 1]);

  const foot = new Matrix4(base).translate(0, -1.4, 0).scale(0.4, 0.2, 0.4);
  drawCube(foot, [0.3, 0.2, 0.1, 1]);
}

function drawRealCylinder(modelMatrix, color) {
    const numSides = 12;
    const vertices = [];
  
    const height = 1;
    const radius = 0.5;
  
    for (let i = 0; i < numSides; i++) {
      const angle1 = (i / numSides) * 2 * Math.PI;
      const angle2 = ((i + 1) / numSides) * 2 * Math.PI;
  
      const x1 = Math.cos(angle1) * radius;
      const z1 = Math.sin(angle1) * radius;
      const x2 = Math.cos(angle2) * radius;
      const z2 = Math.sin(angle2) * radius;

      vertices.push(
        x1, -height/2, z1,
        x2, -height/2, z2,
        x1,  height/2, z1,
  
        x1,  height/2, z1,
        x2, -height/2, z2,
        x2,  height/2, z2
      );
    }
  
    const vertArray = new Float32Array(vertices);
  
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertArray, gl.STATIC_DRAW);
  
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
  
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.uniform4fv(u_Color, color);
  
    gl.drawArrays(gl.TRIANGLES, 0, vertArray.length / 3);
  }
  

function resetAll() {
    g_thighAngle = 0;
    g_calfAngle = 0;
    g_footAngle = 0;
  
    g_thighLocked = false;
    g_calfLocked = false;
    g_footLocked = false;
  
    g_legAngle = 0;
    g_tailAngles = [0, 0, 0];
    g_jawAngle = 0;
    g_specialAction = null;
    g_pokeStartTime = -1;
    gAnimalGlobalRotation = 0;

    g_rotX = 0;
    g_rotY = 0;
  
    document.getElementById("thighSlider").value = 0;
    document.getElementById("calfSlider").value = 0;
    document.getElementById("footSlider").value = 0;
  }
  


let cubeBuffer = null;

function drawCube(modelMatrix, color) {
  if (!cubeBuffer) {
    const vertices = new Float32Array([
      -0.5, -0.5,  0.5,   0.5, -0.5,  0.5,   0.5,  0.5,  0.5,
      -0.5, -0.5,  0.5,   0.5,  0.5,  0.5,  -0.5,  0.5,  0.5,

      -0.5, -0.5, -0.5,  -0.5,  0.5, -0.5,   0.5,  0.5, -0.5,
      -0.5, -0.5, -0.5,   0.5,  0.5, -0.5,   0.5, -0.5, -0.5,

      -0.5,  0.5, -0.5,  -0.5,  0.5,  0.5,   0.5,  0.5,  0.5,
      -0.5,  0.5, -0.5,   0.5,  0.5,  0.5,   0.5,  0.5, -0.5,

      -0.5, -0.5, -0.5,   0.5, -0.5, -0.5,   0.5, -0.5,  0.5,
      -0.5, -0.5, -0.5,   0.5, -0.5,  0.5,  -0.5, -0.5,  0.5,

       0.5, -0.5, -0.5,   0.5,  0.5, -0.5,   0.5,  0.5,  0.5,
       0.5, -0.5, -0.5,   0.5,  0.5,  0.5,   0.5, -0.5,  0.5,

      -0.5, -0.5, -0.5,  -0.5, -0.5,  0.5,  -0.5,  0.5,  0.5,
      -0.5, -0.5, -0.5,  -0.5,  0.5,  0.5,  -0.5,  0.5, -0.5
    ]);

    cubeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniform4fv(u_Color, color);

  gl.drawArrays(gl.TRIANGLES, 0, 36);
}


function drawSphere(modelMatrix, color, latitudeBands = 12, longitudeBands = 12) {
    const vertices = [];
    for (let lat = 0; lat <= latitudeBands; ++lat) {
      const theta = lat * Math.PI / latitudeBands;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
  
      for (let lon = 0; lon <= longitudeBands; ++lon) {
        const phi = lon * 2 * Math.PI / longitudeBands;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);
  
        const x = cosPhi * sinTheta;
        const y = cosTheta;
        const z = sinPhi * sinTheta;
        vertices.push(x, y, z);
      }
    }
  
    const positions = [];
    for (let lat = 0; lat < latitudeBands; ++lat) {
      for (let lon = 0; lon < longitudeBands; ++lon) {
        const first = (lat * (longitudeBands + 1)) + lon;
        const second = first + longitudeBands + 1;
  
        positions.push(
          vertices[first * 3], vertices[first * 3 + 1], vertices[first * 3 + 2],
          vertices[second * 3], vertices[second * 3 + 1], vertices[second * 3 + 2],
          vertices[first + 1 * 3], vertices[first + 1 * 3 + 1], vertices[first + 1 * 3 + 2],
  
          vertices[second * 3], vertices[second * 3 + 1], vertices[second * 3 + 2],
          vertices[second + 1 * 3], vertices[second + 1 * 3 + 1], vertices[second + 1 * 3 + 2],
          vertices[first + 1 * 3], vertices[first + 1 * 3 + 1], vertices[first + 1 * 3 + 2]
        );
      }
    }
  
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
  
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.uniform4fv(u_Color, color);
    gl.drawArrays(gl.TRIANGLES, 0, positions.length / 3);
  }
  
let gl;
let shaderProgram;
let teapotDrawingInfo;
let teapotBuffers;
let a_Position, a_Normal;
let u_ModelMatrix, u_ViewMatrix, u_ProjMatrix, u_NormalMatrix;
let u_LightPos, u_LightingEnabled, u_NormalVisual;
let lightingEnabled = true;
let normalVisual = false;
let lightPos = [0, 2, 2];
let angle = 0;
let sphereVertexCount = 0;
let sphereBuffers = {};
let groundWallBuffers = {};
let a_TexCoord;
let cubeUVBuffer;
let spotlightEnabled = true;
let u_SpotPos, u_SpotDir, u_SpotCutoff, u_SpotlightEnabled;

const modelMatrix = mat4.create();
const viewMatrix = mat4.create();
const projMatrix = mat4.create();
const normalMatrix = mat4.create();

let groundTexture, wallTexture;
let u_Texture;

let cubeBuffer;
let cubeNormalBuffer;
let cubeIndexBuffer;

window.onload = async function () {
    const canvas = document.getElementById("webgl");
    gl = canvas.getContext("webgl");
    if (!gl) {
        alert("WebGL not supported!");
        return;
    }

    const vertSrc = await fetch('shaders/vertex.glsl').then(res => res.text());
    const fragSrc = await fetch('shaders/fragment.glsl').then(res => res.text());

    shaderProgram = createProgram(vertSrc, fragSrc);
    gl.useProgram(shaderProgram);

    locateUniformsAndAttribs();

    createCube();
    createGroundAndWalls();
    createSphereWithUV();

    initControls();
    gl.enable(gl.DEPTH_TEST);
    await loadTeapot();
    requestAnimationFrame(tick);

    u_Texture = gl.getUniformLocation(shaderProgram, "u_Texture");

    groundTexture = loadTexture("grass.png", gl.TEXTURE0);
    wallTexture = loadTexture("brick.png", gl.TEXTURE1);

    gl.uniform3fv(u_SpotPos, [5.0, 3.0, 0.0]);
    gl.uniform3fv(u_SpotDir, [-2.0, -3.0, 0.0]);
    gl.uniform1f(u_SpotCutoff, Math.cos(20 * Math.PI / 180));
    gl.uniform1i(u_SpotlightEnabled, spotlightEnabled);

    const btn = document.createElement("button");
    btn.innerText = "Toggle Spotlight";
    btn.onclick = () => {
        spotlightEnabled = !spotlightEnabled;
        gl.uniform1i(u_SpotlightEnabled, spotlightEnabled);
    };
    console.log("Toggle Spotlight:", spotlightEnabled, u_SpotlightEnabled);

    document.getElementById("controls").appendChild(btn);
};

function locateUniformsAndAttribs() {
    a_Position = gl.getAttribLocation(shaderProgram, "a_Position");
    a_Normal = gl.getAttribLocation(shaderProgram, "a_Normal");
    a_TexCoord = gl.getAttribLocation(shaderProgram, "a_TexCoord");

    u_ModelMatrix = gl.getUniformLocation(shaderProgram, "u_ModelMatrix");
    u_ViewMatrix = gl.getUniformLocation(shaderProgram, "u_ViewMatrix");
    u_ProjMatrix = gl.getUniformLocation(shaderProgram, "u_ProjMatrix");
    u_NormalMatrix = gl.getUniformLocation(shaderProgram, "u_NormalMatrix");

    u_LightPos = gl.getUniformLocation(shaderProgram, "u_LightPos");
    u_LightingEnabled = gl.getUniformLocation(shaderProgram, "u_LightingEnabled");
    u_NormalVisual = gl.getUniformLocation(shaderProgram, "u_NormalVisual");
    u_Texture = gl.getUniformLocation(shaderProgram, "u_Texture");

    u_SpotPos = gl.getUniformLocation(shaderProgram, "u_SpotPos");
    u_SpotDir = gl.getUniformLocation(shaderProgram, "u_SpotDir");
    u_SpotCutoff = gl.getUniformLocation(shaderProgram, "u_SpotCutoff");
    u_SpotlightEnabled = gl.getUniformLocation(shaderProgram, "u_SpotlightEnabled");
}

function createCube() {
  const positions = new Float32Array([
      // Front face
      -1, -1, 1,   1, -1, 1,   1, 1, 1,   -1, 1, 1,
      // Back face
      -1, -1, -1,  -1, 1, -1,   1, 1, -1,   1, -1, -1,
      // Top face
      -1, 1, -1,  -1, 1, 1,   1, 1, 1,   1, 1, -1,
      // Bottom face
      -1, -1, -1,   1, -1, -1,   1, -1, 1,  -1, -1, 1,
      // Right face
      1, -1, -1,   1, 1, -1,   1, 1, 1,   1, -1, 1,
      // Left face
      -1, -1, -1,  -1, -1, 1,  -1, 1, 1,  -1, 1, -1,
  ]);

  const normals = new Float32Array([
      // One normal per vertex per face
      0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
      0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1,
      0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
      0, -1, 0,  0, -1, 0,  0, -1, 0,  0, -1, 0,
      1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
      -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0,
  ]);

  const fakeUVs = new Float32Array(24 * 2).fill(0); // 24 vertices × 2 = 48

  const indices = new Uint16Array([
      0, 1, 2,  0, 2, 3,        // front
      4, 5, 6,  4, 6, 7,        // back
      8, 9,10,  8,10,11,        // top
      12,13,14, 12,14,15,       // bottom
      16,17,18, 16,18,19,       // right
      20,21,22, 20,22,23        // left
  ]);

  cubeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  cubeNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

  cubeUVBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeUVBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, fakeUVs, gl.STATIC_DRAW);

  cubeIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
}

class Vector3 {
  constructor(x = 0, y = 0, z = 0) {
      this.x = x;
      this.y = y;
      this.z = z;
  }

  subtract(v) {
      return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  cross(v) {
      return new Vector3(
          this.y * v.z - this.z * v.y,
          this.z * v.x - this.x * v.z,
          this.x * v.y - this.y * v.x
      );
  }

  normalize() {
      const len = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
      if (len > 0.00001) {
          this.x /= len;
          this.y /= len;
          this.z /= len;
      }
      return this;
  }

  toArray() {
      return [this.x, this.y, this.z];
  }
}

function createGroundAndWalls() {
    const positions = [
        // Ground (Y = -1, facing up)
        -5, -1, -5,   5, -1, -5,   5, -1,  5,  -5, -1,  5,
        // Wall 1 (Z = -5, facing forward)
        -5, -1, -5,  -5,  4, -5,   5,  4, -5,   5, -1, -5,
        // Wall 2 (X = -5, facing right)
        -5, -1,  5,  -5,  4,  5,  -5,  4, -5,  -5, -1, -5,
    ];

    const normals = [
        // Ground (normal up)
        0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
        // Wall 1 (normal toward +Z)
        0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
        // Wall 2 (normal toward +X)
        1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
    ];

    const uvs = [
        // Ground
        0, 0,  1, 0,  1, 1,  0, 1,
        // Wall 1
        0, 0,  0, 1,  1, 1,  1, 0,
        // Wall 2
        0, 0,  0, 1,  1, 1,  1, 0,
    ];

    const indices = [
        0, 1, 2,   0, 2, 3,     // Ground
        4, 5, 6,   4, 6, 7,     // Wall 1
        8, 9,10,   8,10,11,     // Wall 2
    ];

    // Positions
    groundWallBuffers.position = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, groundWallBuffers.position);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Normals
    groundWallBuffers.normal = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, groundWallBuffers.normal);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

    // UVs
    groundWallBuffers.uv = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, groundWallBuffers.uv);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);

    // Indices
    groundWallBuffers.index = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, groundWallBuffers.index);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    groundWallBuffers.count = indices.length;
}

function createSphereWithUV(latBands = 30, longBands = 30, radius = 1) {
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    for (let lat = 0; lat <= latBands; lat++) {
        const theta = lat * Math.PI / latBands;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        for (let lon = 0; lon <= longBands; lon++) {
            const phi = lon * 2 * Math.PI / longBands;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);

            const x = cosPhi * sinTheta;
            const y = cosTheta;
            const z = sinPhi * sinTheta;

            positions.push(radius * x, radius * y, radius * z);
            normals.push(x, y, z);

            // UV: u = [0,1] left to right, v = [0,1] bottom to top
            const u = lon / longBands;
            const v = 1 - lat / latBands;
            uvs.push(u, v);
        }
    }

    for (let lat = 0; lat < latBands; lat++) {
        for (let lon = 0; lon < longBands; lon++) {
            const first = lat * (longBands + 1) + lon;
            const second = first + longBands + 1;

            indices.push(first, second, first + 1);
            indices.push(second, second + 1, first + 1);
        }
    }

    sphereVertexCount = indices.length;

    sphereBuffers.position = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffers.position);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    sphereBuffers.normal = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffers.normal);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

    sphereBuffers.uv = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffers.uv);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);

    sphereBuffers.index = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereBuffers.index);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
}



function bindArrayBuffer(data, attrib, size) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.vertexAttribPointer(attrib, size, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attrib);
}

function tick() {
    const time = performance.now() * 0.001;
    const radius = 5.0;

    const x = radius * Math.cos(time);
    const z = radius * Math.sin(time);
    const y = 3.0;
    const dir = [-x + 3.0, -y, -z];

    gl.uniform3fv(u_SpotPos, [x, y, z]);
    gl.uniform3fv(u_SpotDir, dir);

    gl.uniform1i(u_SpotlightEnabled, spotlightEnabled);

    console.log("spotPos", x.toFixed(2), y.toFixed(2), z.toFixed(2));
    console.log("spotDir", dir.map(d => d.toFixed(2)));

    angle += 0.01;
    lightPos[0] = 2 * Math.sin(angle);
    lightPos[2] = 2 * Math.cos(angle);
    drawScene();
    requestAnimationFrame(tick);
}

function drawScene() {
  gl.clearColor(0.2, 0.2, 0.2, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const cameraAngle = parseFloat(document.getElementById("cameraSlider").value);
  mat4.lookAt(viewMatrix, [5 * Math.sin(cameraAngle * Math.PI / 180), 2, 5 * Math.cos(cameraAngle * Math.PI / 180)], [0, 0, 0], [0, 1, 0]);
  mat4.perspective(projMatrix, 45 * Math.PI / 180, gl.canvas.width / gl.canvas.height, 0.1, 100);

  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix);
  gl.uniform3fv(u_LightPos, lightPos);
  gl.uniform1i(u_LightingEnabled, lightingEnabled);
  gl.uniform1i(u_NormalVisual, normalVisual);

  // === 绘制主 cube ===
  mat4.identity(modelMatrix);
  mat4.invert(normalMatrix, modelMatrix);
  mat4.transpose(normalMatrix, normalMatrix);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix);
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix);

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalBuffer);
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Normal);

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeUVBuffer);
  gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_TexCoord);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
  gl.activeTexture(gl.TEXTURE1); // 示例用 brick
  gl.bindTexture(gl.TEXTURE_2D, wallTexture);
  gl.uniform1i(u_Texture, 1);
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

  // === 绘制 sphere ===
  mat4.identity(modelMatrix);
  mat4.translate(modelMatrix, modelMatrix, [3, 0, 0]);
  mat4.invert(normalMatrix, modelMatrix);
  mat4.transpose(normalMatrix, normalMatrix);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix);
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix);

  gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffers.position);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffers.normal);
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Normal);

  gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffers.uv);
  gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_TexCoord);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereBuffers.index);
  gl.activeTexture(gl.TEXTURE1); // 示例也用 brick
  gl.bindTexture(gl.TEXTURE_2D, wallTexture);
  gl.uniform1i(u_Texture, 1);
  gl.drawElements(gl.TRIANGLES, sphereVertexCount, gl.UNSIGNED_SHORT, 0);

  // === 绘制 light cube（没有贴图）===
  gl.disableVertexAttribArray(a_TexCoord); // ❗ 必须关闭或绑定虚拟 UV，否则报错

  mat4.identity(modelMatrix);
  mat4.translate(modelMatrix, modelMatrix, lightPos);
  mat4.scale(modelMatrix, modelMatrix, [0.2, 0.2, 0.2]);
  mat4.invert(normalMatrix, modelMatrix);
  mat4.transpose(normalMatrix, normalMatrix);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix);
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix);

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalBuffer);
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Normal);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

  // === 绘制 ground & walls（地面、墙体）===
  gl.enableVertexAttribArray(a_TexCoord); // 重新启用贴图
  gl.bindBuffer(gl.ARRAY_BUFFER, groundWallBuffers.position);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, groundWallBuffers.normal);
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, groundWallBuffers.uv);
  gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, groundWallBuffers.index);

  // 地面
  mat4.identity(modelMatrix);
  mat4.invert(normalMatrix, modelMatrix);
  mat4.transpose(normalMatrix, normalMatrix);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix);
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, groundTexture);
  gl.uniform1i(u_Texture, 0);
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

  // 墙1
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, wallTexture);
  gl.uniform1i(u_Texture, 1);
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 6 * 2);

  // 墙2
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 12 * 2);

  if (teapotBuffers) {
    mat4.identity(modelMatrix);
    mat4.translate(modelMatrix, modelMatrix, [-3, 0, 0]);
    mat4.scale(modelMatrix, modelMatrix, [0.8, 0.8, 0.8]);
    mat4.invert(normalMatrix, modelMatrix);
    mat4.transpose(normalMatrix, normalMatrix);
  
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix);
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix);
  
    gl.bindBuffer(gl.ARRAY_BUFFER, teapotBuffers.position);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
  
    gl.bindBuffer(gl.ARRAY_BUFFER, teapotBuffers.normal);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);
  
    gl.disableVertexAttribArray(a_TexCoord); // OBJ 不需要贴图坐标
    gl.drawArrays(gl.TRIANGLES, 0, teapotBuffers.count);
  }
  
}


function initControls() {
    document.getElementById("toggleLightingBtn").onclick = () => {
        lightingEnabled = !lightingEnabled;
    };
    document.getElementById("toggleNormalBtn").onclick = () => {
        normalVisual = !normalVisual;
    };
    document.getElementById("lightSlider").oninput = (e) => {
        lightPos[1] = parseFloat(e.target.value);
    };
}

function loadTexture(url, textureUnit) {
  const texture = gl.createTexture();
  const image = new Image();
  image.onload = function () {
      gl.activeTexture(textureUnit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  };
  image.src = url;
  return texture;
}


// ---------- Shader Helper ----------
function createProgram(vsrc, fsrc) {
    const vshader = compileShader(gl.VERTEX_SHADER, vsrc);
    const fshader = compileShader(gl.FRAGMENT_SHADER, fsrc);
    const program = gl.createProgram();
    gl.attachShader(program, vshader);
    gl.attachShader(program, fshader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Program failed to link:", gl.getProgramInfoLog(program));
    }
    return program;
}

function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile failed:", gl.getShaderInfoLog(shader));
    }
    return shader;
}


function initModelBuffers(drawingInfo) {
  const buffers = {};

  buffers.position = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(drawingInfo.vertices), gl.STATIC_DRAW);

  buffers.normal = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(drawingInfo.normals), gl.STATIC_DRAW);

  buffers.count = drawingInfo.vertices.length / 3;

  return buffers;
}

async function loadTeapot() {
  const loader = new OBJLoader("teapot.obj");
  await loader.parseModel();
  teapotDrawingInfo = loader.getModelData();
  teapotBuffers = initModelBuffers(teapotDrawingInfo);
}

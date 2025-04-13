// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform float u_PointSize;\n' +
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '  gl_PointSize = u_PointSize;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';

var gl, canvas;
var a_Position, u_FragColor, u_PointSize;
var currentShape = 'point';
var brushSize = 10;
var segmentCount = 10;
var currentColor = [1.0, 1.0, 1.0, 1.0];
var shapesList = [];

function main() {
  canvas = document.getElementById('webgl');
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get WebGL context');
    return;
  }

  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders');
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_PointSize = gl.getUniformLocation(gl.program, 'u_PointSize');

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  setupUI();
  canvas.onmousedown = function(ev) { handleClick(ev); };
  canvas.onmousemove = function(ev) { if (ev.buttons === 1) handleClick(ev); };
}

function setupUI() {
  document.getElementById('clear').onclick = function() {
    shapesList = [];
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  };

  document.getElementById('square').onclick = function() { currentShape = 'square'; };
  document.getElementById('triangle').onclick = function() { currentShape = 'triangle'; };
  document.getElementById('circle').onclick = function() { currentShape = 'circle'; };

  document.getElementById('drawPicture').onclick = function() {
    drawTrianglePicture();
  };  

  document.getElementById('sizeSlider').oninput = function(e) {
    brushSize = parseFloat(e.target.value);
  };

  document.getElementById('segmentSlider').oninput = function(e) {
    segmentCount = parseInt(e.target.value);
  };

  function updateColor() {
    var r = parseInt(document.getElementById("redSlider").value) / 100;
    var g = parseInt(document.getElementById("greenSlider").value) / 100;
    var b = parseInt(document.getElementById("blueSlider").value) / 100;
    currentColor = [r, g, b, 1.0];
  }

  document.getElementById("redSlider").oninput = updateColor;
  document.getElementById("greenSlider").oninput = updateColor;
  document.getElementById("blueSlider").oninput = updateColor;
}

function handleClick(ev) {
  var rect = canvas.getBoundingClientRect();
  var x = (ev.clientX - rect.left - canvas.width / 2) / (canvas.width / 2);
  var y = (canvas.height / 2 - (ev.clientY - rect.top)) / (canvas.height / 2);

  var shape;
  if (currentShape === 'point' || currentShape === 'square') {
    shape = new Square(x, y, brushSize, currentColor.slice());
  } else if (currentShape === 'triangle') {
    shape = new Triangle(x, y, brushSize, currentColor.slice());
  } else if (currentShape === 'circle') {
    shape = new Circle(x, y, brushSize, currentColor.slice(), segmentCount);
  }

  shapesList.push(shape);
  renderAllShapes();
}

function renderAllShapes() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  for (var i = 0; i < shapesList.length; i++) {
    shapesList[i].render();
  }
}

// Shape Classes

function Square(x, y, size, color) {
  this.type = 'square';
  this.x = x;
  this.y = y;
  this.size = size;
  this.color = color;

  this.render = function() {
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    gl.uniform1f(u_PointSize, this.size);

    var half = this.size / 400;
    var vertices = new Float32Array([
      this.x - half, this.y - half,
      this.x + half, this.y - half,
      this.x + half, this.y + half,
      this.x - half, this.y + half
    ]);
    drawTriangleFan(vertices, 4);
  };
}

function Triangle(x, y, size, color) {
  this.type = 'triangle';
  this.x = x;
  this.y = y;
  this.size = size;
  this.color = color;

  this.render = function() {
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);

    gl.uniform1f(u_PointSize, this.size);

    var h = this.size / 2.0;
    var vertices = new Float32Array([
      this.x, this.y + h,
      this.x - h, this.y - h,
      this.x + h, this.y - h
    ]);
    drawTriangleFan(vertices, 3);
  };
}

function Circle(x, y, size, color, segments) {
  this.type = 'circle';
  this.x = x;
  this.y = y;
  this.size = size;
  this.color = color;
  this.segments = segments;

  this.render = function() {
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    gl.uniform1f(u_PointSize, this.size);

    var verts = [this.x, this.y];
    for (var i = 0; i <= this.segments; i++) {
      var angle = i * 2 * Math.PI / this.segments;
      verts.push(this.x + Math.cos(angle) * this.size / 400);
      verts.push(this.y + Math.sin(angle) * this.size / 400);
    }
    drawTriangleFan(new Float32Array(verts), this.segments + 2);
  };
}

function drawTriangleFan(vertices, n) {
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, n);
}

function drawTrianglePicture() {
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  shapesList = []; // clear previous drawing

  const S = 0.3; // base size scaling unit
  const foxTriangles = [
    new Triangle(-0.5, 0.5, S, [1.0, 0.5, 0.0, 1.0]),
    new Triangle( 0.5, 0.5, S, [1.0, 0.5, 0.0, 1.0]),
    new Triangle(-0.5, 0.6, S * 0.6, [1.0, 0.7, 0.3, 1.0]),
    new Triangle( 0.5, 0.6, S * 0.6, [1.0, 0.7, 0.3, 1.0]),
    new Triangle( 0.0, -0.2, S * 4.0, [1.0, 0.5, 0.0, 1.0]),
    new Triangle(-0.3, 0.0, S * 1.2, [1.0, 0.4, 0.0, 1.0]),
    new Triangle( 0.3, 0.0, S * 1.2, [1.0, 0.4, 0.0, 1.0]),
    new Triangle(-0.2, -0.1, S * 0.2, [0.0, 0.0, 0.0, 1.0]),
    new Triangle( 0.2, -0.1, S * 0.2, [0.0, 0.0, 0.0, 1.0]),
    new Triangle( 0.0, -0.45, S * 0.25, [0.0, 0.0, 0.0, 1.0]),
    new Triangle(-0.15, -0.25, S * 0.8, [1.0, 0.4, 0.0, 1.0]),
    new Triangle( 0.15, -0.25, S * 0.8, [1.0, 0.4, 0.0, 1.0]),
    new Triangle(-0.1, 0.1, S * 0.6, [1.0, 0.6, 0.2, 1.0]),
    new Triangle( 0.1, 0.1, S * 0.6, [1.0, 0.6, 0.2, 1.0])
  ];

  shapesList.push(...foxTriangles);
  renderAllShapes();
}

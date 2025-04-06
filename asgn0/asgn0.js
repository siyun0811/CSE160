let canvas, ctx;
//DrawRectangle.js
function main() {

	// Retrieve <canvas> element
  var canvas = document.getElementById('example');
  if (!canvas) {
  	console.log('Failed to tretrieve the <canvas> element');
  	return;
  }

  // Get the rendering context for 2DCG
   var ctx = canvas.getContext('2d');

  // Draw a black rectangle
   ctx.fillStyle = 'black';
   ctx.fillRect(0, 0, canvas.width, canvas.height);

   // Create the initial vector v1 and draw it
   let v1 = new Vector3([1, 1, 0]);
   drawVector(canvas, ctx, v1, 'red');

   window._canvas = canvas;
   window._ctx = ctx;
}

// Function to draw a vector from the center of the canvas
function drawVector(canvas, ctx, v, color) {
    const originX = canvas.width / 2;
    const originY = canvas.height / 2;

    // Draw the vector line
    ctx.beginPath();
    ctx.moveTo(originX, originY); // Start at the center
    ctx.lineTo(
        originX + v.elements[0] * 20,
        originY - v.elements[1] * 20  // Invert y because canvas y-axis goes down
    );
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
}

// Called when the user clicks the "Draw Vector" button
function handleDrawEvent() {
  	const canvas = window._canvas;
    const ctx = window._ctx;

  // Clear canvas and reset background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);


  // Get v1 input
    const x1 = parseFloat(document.getElementById('x1-coord').value);
    const y1 = parseFloat(document.getElementById('y1-coord').value);

  // Get v2 input
    const x2 = parseFloat(document.getElementById('x2-coord').value);
    const y2 = parseFloat(document.getElementById('y2-coord').value);

  // Validate inputs
    if ([x1, y1, x2, y2].some(isNaN)) {
      alert("Please enter valid numbers for all vector components.");
      return;
    }

  // Create vectors
    let v1 = new Vector3([x1, y1, 0]);
    let v2 = new Vector3([x2, y2, 0]);

  // Draw both vectors
    drawVector(canvas, ctx, v1, 'red');
    drawVector(canvas, ctx, v2, 'blue');

}

function angleBetween(v1, v2) {
  const dotVal = Vector3.dot(v1, v2);
  const mag1 = v1.magnitude();
  const mag2 = v2.magnitude();

  if (mag1 === 0 || mag2 === 0) return null;

  // cos(θ) = dot / (|v1||v2|)
  const cosTheta = dotVal / (mag1 * mag2);

  const clampedCos = Math.max(-1, Math.min(1, cosTheta));
  const radians = Math.acos(clampedCos);
  const degrees = radians * (180 / Math.PI);
  return degrees;
}

function areaTriangle(v1, v2) {
    const cross = Vector3.cross(v1, v2);
    const areaParallelogram = cross.magnitude();  // |v1 x v2|
    const areaTriangle = 0.5 * areaParallelogram;
    return areaTriangle;
}


function handleDrawOperationEvent() {
	const canvas = window._canvas;
    const ctx = window._ctx;

  // Clear canvas and reset background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Get v1 input
    const x1 = parseFloat(document.getElementById('x1-coord').value);
    const y1 = parseFloat(document.getElementById('y1-coord').value);

  // Get v2 input
    const x2 = parseFloat(document.getElementById('x2-coord').value);
    const y2 = parseFloat(document.getElementById('y2-coord').value);

  // Validate inputs
    if ([x1, y1, x2, y2].some(isNaN)) {
      alert("Please enter valid numbers for all vector components.");
      return;
    }

  	const v1 = new Vector3([x1, y1, 0])
  	const v2 = new Vector3([x2, y2, 0])
  
  // Draw both vectors
  	drawVector(canvas, ctx, v1, 'red');
  	drawVector(canvas, ctx, v2, 'blue');

  	const operation = document.getElementById('operation-select').value;
  	const scalar = parseFloat(document.getElementById('scalar-value').value);

 // Draw green put
    if (operation === 'add') {
    window.v3 = new Vector3([x1, y1, 0]).add(new Vector3([x2, y2, 0]));
    drawVector(canvas, ctx, window.v3, 'green');
  } else if (operation === 'sub') {
    window.v3 = new Vector3([x1, y1, 0]).sub(new Vector3([x2, y2, 0]));
    drawVector(canvas, ctx, window.v3, 'green');
  } else if (operation === 'mul') {
    if (isNaN(scalar)) {
      alert("Please enter a valid scalar for the multiplication!");
      return;
    }
    window.v3 = new Vector3([x1, y1, 0]).mul(scalar);
    window.v4 = new Vector3([x2, y2, 0]).mul(scalar);

    drawVector(canvas, ctx, window.v3, 'green');
    drawVector(canvas, ctx, window.v4, 'green');
  } else if (operation === 'div') {
    if (isNaN(scalar) || scalar === 0) {
      alert("Please enter a valid non-zero scalar for the division!");
      return;
    }
    window.v3 = new Vector3([x1, y1, 0]).div(scalar);
    window.v4 = new Vector3([x2, y2, 0]).div(scalar);

    drawVector(canvas, ctx, window.v3, 'green');
    drawVector(canvas, ctx, window.v4, 'green');
  } else if(operation === 'magnitude') {
  	window.v1 = new Vector3([x1, y1, 0]);
  	window.v2 = new Vector3([x2, y2, 0]);
  	window.mag1 = v1.magnitude();
  	window.mag2 = v2.magnitude();
  	console.log("Magnitude v1:", window.mag1.toFixed(4));
    console.log("Magnitude v2:", window.mag2.toFixed(4));
  } else if (operation === 'normalize') {
  	window.v1 = new Vector3([x1, y1, 0]);
  	window.v2 = new Vector3([x2, y2, 0]);
  	window.nv1 = new Vector3([x1, y1, 0]).normalize();
  	window.nv2 = new Vector3([x2, y2, 0]).normalize();
  	drawVector(canvas, ctx, window.nv1, 'green');
  	drawVector(canvas, ctx, window.nv2, 'green');
  } else if (operation === 'angle') {
  	window.v1 = new Vector3([x1, y1, 0]);
  	window.v2 = new Vector3([x2, y2, 0]);
  	window.angle = angleBetween(v1, v2);
  	console.log("Angle:", angle.toFixed(2));
  }else if (operation === 'area') {
  	window.v1 = new Vector3([x1, y1, 0]);
  	window.v2 = new Vector3([x2, y2, 0]);
    window.area = areaTriangle(v1, v2);
    console.log("Area of triangle:", area.toFixed(4));
  }


}
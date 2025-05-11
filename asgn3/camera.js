class Camera {
  constructor() {
    this.fov = 60;
    this.eye = new Vector3([0, 0, 5]);
    this.at = new Vector3([0, 0, 0]);
    this.up = new Vector3([0, 1, 0]);
    this.viewMatrix = new Matrix4();
    this.projectionMatrix = new Matrix4();
    this.updateViewMatrix();
    this.updateProjectionMatrix();
  }

  getSafeDirection(from, to) {
    let dir = new Vector3();
    dir.set(to);
    dir.sub(from);

    let len = Math.sqrt(
      dir.elements[0] * dir.elements[0] +
      dir.elements[1] * dir.elements[1] +
      dir.elements[2] * dir.elements[2]
    );

    if (len < 1e-6) return null;
    dir.elements[0] /= len;
    dir.elements[1] /= len;
    dir.elements[2] /= len;
    return dir;
  }

  updateViewMatrix() {
    let dir = this.getSafeDirection(this.eye, this.at);
    if (!dir) {
      this.at = new Vector3([this.eye.elements[0], this.eye.elements[1], this.eye.elements[2] - 1]);
    }
    this.viewMatrix.setLookAt(
      this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
      this.at.elements[0], this.at.elements[1], this.at.elements[2],
      this.up.elements[0], this.up.elements[1], this.up.elements[2]
    );
  }

  updateProjectionMatrix() {
    this.projectionMatrix.setPerspective(this.fov, canvas.width / canvas.height, 0.1, 100);
  }

  moveForward(speed) {
    let dir = this.getSafeDirection(this.eye, this.at);
    if (!dir) return;
  
    const nextX = this.eye.elements[0] + dir.elements[0] * speed;
    const nextZ = this.eye.elements[2] + dir.elements[2] * speed;
  
    if (!this.canMoveTo(nextX, this.eye.elements[1], nextZ)) return;
  
    this.eye.elements[0] = nextX;
    this.eye.elements[2] = nextZ;
    this.at.elements[0] += dir.elements[0] * speed;
    this.at.elements[2] += dir.elements[2] * speed;
  
    this.updateViewMatrix();
  }
  
  moveBackwards(speed) {
    let dir = this.getSafeDirection(this.at, this.eye);
    if (!dir) return;
  
    const nextX = this.eye.elements[0] + dir.elements[0] * speed;
    const nextZ = this.eye.elements[2] + dir.elements[2] * speed;
  
    if (!this.canMoveTo(nextX, this.eye.elements[1], nextZ)) return;
  
    this.eye.elements[0] = nextX;
    this.eye.elements[2] = nextZ;
    this.at.elements[0] += dir.elements[0] * speed;
    this.at.elements[2] += dir.elements[2] * speed;
  
    this.updateViewMatrix();
  }
  

  moveLeft(speed) {
    let forward = this.getSafeDirection(this.eye, this.at);
    if (!forward) return;

    let left = Vector3.cross(this.up, forward);
    let len = Math.sqrt(left.elements[0] ** 2 + left.elements[1] ** 2 + left.elements[2] ** 2);
    if (len < 1e-6) return;

    left.elements[0] /= len;
    left.elements[1] /= len;
    left.elements[2] /= len;

    left.elements[0] *= speed;
    left.elements[1] *= speed;
    left.elements[2] *= speed;

    for (let i = 0; i < 3; i++) {
      this.eye.elements[i] += left.elements[i];
      this.at.elements[i] += left.elements[i];
    }

    this.updateViewMatrix();
  }

  moveRight(speed) {
    let forward = this.getSafeDirection(this.eye, this.at);
    if (!forward) return;

    let right = Vector3.cross(forward, this.up);
    let len = Math.sqrt(right.elements[0] ** 2 + right.elements[1] ** 2 + right.elements[2] ** 2);
    if (len < 1e-6) return;

    right.elements[0] /= len;
    right.elements[1] /= len;
    right.elements[2] /= len;

    right.elements[0] *= speed;
    right.elements[1] *= speed;
    right.elements[2] *= speed;

    for (let i = 0; i < 3; i++) {
      this.eye.elements[i] += right.elements[i];
      this.at.elements[i] += right.elements[i];
    }

    this.updateViewMatrix();
  }

  canMoveTo(x, y, z) {
    const gridX = Math.floor(x + 16);
    const gridZ = Math.floor(z + 16);
    if (gridX < 0 || gridX >= 32 || gridZ < 0 || gridZ >= 32) return false;
    const brickHeight = map[gridZ][gridX].h;
    return brickHeight < 2;
  }
  

  panLeft(angle) {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);

    let rotMat = new Matrix4();
    rotMat.setRotate(angle, this.up.elements[0], this.up.elements[1], this.up.elements[2]);

    let f_prime = rotMat.multiplyVector3(f);
    this.at = new Vector3([this.eye.elements[0] + f_prime.elements[0],
                           this.eye.elements[1] + f_prime.elements[1],
                           this.eye.elements[2] + f_prime.elements[2]]);
    this.updateViewMatrix();
  }

  panRight(angle) {
    this.panLeft(-angle);
  }
}

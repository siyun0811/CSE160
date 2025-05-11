precision mediump float;

uniform sampler2D u_Texture0;  // brick
uniform sampler2D u_Texture1;  // grass
uniform int u_selectedTexture;
uniform float u_texColorWeight;
uniform vec4 u_baseColor;

varying vec2 v_TexCoord;

void main() {
  vec4 texColor;
  if (u_selectedTexture == 0) {
    texColor = texture2D(u_Texture0, v_TexCoord);
  } else if (u_selectedTexture == 1) {
    texColor = texture2D(u_Texture1, v_TexCoord);
  } else {
    texColor = vec4(1.0, 0.0, 1.0, 1.0); // fallback pink for error
  }

  gl_FragColor = mix(u_baseColor, texColor, u_texColorWeight);
}

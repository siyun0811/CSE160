attribute vec3 a_Position;
attribute vec3 a_Normal;
attribute vec2 a_TexCoord;

uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjMatrix;
uniform mat4 u_NormalMatrix;
uniform vec3 u_LightPos;
uniform vec3 u_SpotPos;

varying vec3 v_Normal;
varying vec3 v_LightDir;
varying vec3 v_Position;
varying vec2 v_TexCoord;
varying vec3 v_SpotLightDir;

void main() {
    vec4 worldPos = u_ModelMatrix * vec4(a_Position, 1.0);
    v_Position = worldPos.xyz;
    v_Normal = normalize(mat3(u_NormalMatrix) * a_Normal);
    v_LightDir = normalize(u_LightPos - v_Position);
    v_TexCoord = a_TexCoord;
    v_SpotLightDir = normalize(worldPos.xyz - u_SpotPos);

    gl_Position = u_ProjMatrix * u_ViewMatrix * worldPos;
}

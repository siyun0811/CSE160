precision mediump float;

varying vec3 v_Normal;
varying vec3 v_LightDir;
varying vec3 v_Position;
varying vec2 v_TexCoord;
varying vec3 v_SpotLightDir;

uniform bool u_LightingEnabled;
uniform bool u_NormalVisual;

uniform vec3 u_SpotPos;
uniform vec3 u_SpotDir;
uniform float u_SpotCutoff;
uniform bool u_SpotlightEnabled;

uniform sampler2D u_Texture;

void main() {
    if (u_NormalVisual) {
        gl_FragColor = vec4(normalize(v_Normal) * 0.5 + 0.5, 1.0);
        return;
    }

    vec3 baseColor = texture2D(u_Texture, v_TexCoord).rgb;

    if (!u_LightingEnabled) {
        gl_FragColor = vec4(baseColor, 1.0);
        return;
    }

    vec3 N = normalize(v_Normal);
    vec3 L = normalize(v_LightDir);
    vec3 V = normalize(vec3(0.0, 0.0, 1.0));
    vec3 R = reflect(-L, N);

    float diff = max(dot(N, L), 0.0);
    float spec = pow(max(dot(R, V), 0.0), 32.0);

    vec3 ambient = 0.2 * baseColor;
    vec3 diffuse = diff * baseColor;
    vec3 specular = 0.3 * spec * vec3(1.0);

    vec3 spotDiffuse = vec3(0.0);
    vec3 spotSpecular = vec3(0.0);

    if (u_SpotlightEnabled) {
        float theta = dot(normalize(-u_SpotDir), normalize(v_SpotLightDir));
        float spotEffect = step(u_SpotCutoff, theta);
        spotDiffuse = spotEffect * diff * baseColor;
        spotSpecular = spotEffect * spec * vec3(1.0);
    }

    vec3 color = ambient + diffuse + specular + spotDiffuse + spotSpecular;
    gl_FragColor = vec4(color, 1.0);
}

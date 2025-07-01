uniform float uTime;
uniform float uRadius;
uniform float uStartAngle;
uniform float uScale;

varying vec2 vUv;

float inverseLerp(float a, float b, float v) {
    return (v - a) / (b - a);
}

float remap(float inMin, float inMax, float outMin, float outMax, float v) {
    float t = inverseLerp(inMin, inMax, v);
    return mix(outMin, outMax, t);
}

mat3 rotY(float a) {
    float s = sin(a);
    float c = cos(a);

    return mat3(
        c, 0, s,
        0, 1, 0,
        -s, 0, c);
}

void main() {
    vec3 newPosition = position * uScale;

    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);

    modelPosition.x += cos(uStartAngle - uTime * 0.05) * uRadius;
    modelPosition.z += sin(uStartAngle - uTime * 0.05) * uRadius;
    modelPosition.y += uTime * 1.2;

    modelPosition.xyz *= rotY(uTime * 0.07);

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;
    vUv = uv;
}
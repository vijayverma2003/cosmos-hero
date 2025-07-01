import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import vertexShader from "./shaders/vertex.glsl?raw";
import fragmentShader from "./shaders/fragment.glsl?raw";

const canvas = document.querySelector<HTMLCanvasElement>("#three-canvas");

if (!canvas) throw new Error("Canvas not found!");

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const clock = new THREE.Clock();
const spawnInterval = 0.8;
let lastSpawn = 0;

// Textures

let currentMesh = 0;
let currentTexture = 0;
const texturesCount = 24;

const textureLoader = new THREE.TextureLoader();
const textures: THREE.Texture[] = [];

for (let i = 0; i < texturesCount; i++) {
  const texture = textureLoader.load(`/creations/${i + 1}.png`);
  textures.push(texture);
}

function getTexture() {
  currentTexture = currentTexture === texturesCount ? 0 : currentTexture + 1;
  return textures[currentTexture];
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.01,
  1000
);

camera.position.z = 0;
camera.position.y = 20;

camera.lookAt(0, 0, 0);
scene.add(camera);

// Meshes

const parameters = {
  branches: 5,
  scale: 3,
  opacity: 0.5,
  radius: 15,
};

const geometry = new THREE.PlaneGeometry(1.5, 1.5);
const planes: {
  material: THREE.ShaderMaterial;
  mesh: THREE.Mesh;
  startTime: number;
}[] = [];

for (let i = 0; i < parameters.branches; i++) {
  const angle = ((i % parameters.branches) / parameters.branches) * Math.PI * 2;
  spawnPlane(angle);
}

// Renderer

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(window.devicePixelRatio);

// OrbitControls

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// Animation Loop

const animate = () => {
  const elapsedTime = clock.getElapsedTime();

  controls.update();
  renderer.render(scene, camera);

  if (elapsedTime - lastSpawn > spawnInterval) {
    for (let i = 0; i < parameters.branches; i++) {
      const angle =
        ((i % parameters.branches) / parameters.branches) * Math.PI * 2;
      spawnPlane(angle);
      lastSpawn = elapsedTime;
    }
  }

  planes.forEach((plane, index) => {
    const passedTime = elapsedTime - plane.startTime;
    plane.material.uniforms.uTime.value = passedTime;
    plane.material.uniforms.uOpacity.value = Math.min(0.7, passedTime * 0.2);

    const radius = plane.material.uniforms.uRadius.value;

    plane.material.uniforms.uScale.value =
      parameters.scale * Math.pow(radius / parameters.radius, 2);

    plane.material.uniforms.uRadius.value +=
      0.23 * (passedTime * 0.09) - Math.pow(passedTime * 0.1, 2);

    if (plane.material.uniforms.uRadius.value <= 1.5) {
      scene.remove(plane.mesh);
      plane.material.dispose();
      plane.mesh.geometry.dispose();
      planes.splice(index, 1);
    }
  });

  window.requestAnimationFrame(animate);
};

animate();

function spawnPlane(angle: number) {
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide,
    alphaTest: 0.1,
    uniforms: {
      uRadius: { value: parameters.radius },
      uTime: { value: 0 },
      uStartAngle: { value: angle },
      uScale: { value: parameters.scale },
      uOpacity: { value: parameters.opacity },
      uTexture: { value: getTexture() },
    },
    transparent: true,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -5;
  mesh.renderOrder = currentMesh;
  currentMesh--;
  scene.add(mesh);

  planes.push({
    mesh,
    material,
    startTime: clock.getElapsedTime(),
  });
}

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  canvas.width = sizes.width;
  canvas.height = sizes.height;

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(window.devicePixelRatio);

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
});

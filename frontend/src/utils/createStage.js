import {
    CircleGeometry, Color, DirectionalLight, GridHelper, HemisphereLight, Mesh, MeshStandardMaterial,
    PerspectiveCamera, Scene, SRGBColorSpace, Timer, WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const BACKGROUND = '#F8F8F8';
const TARGET_Y = 0.9;

const createFloor = (scene) => {
    const floor = new Mesh(
        new CircleGeometry(1.4, 48),
        new MeshStandardMaterial({ color: '#E2E2E2', roughness: 1 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    const grid = new GridHelper(2.8, 14, '#C39AD3', '#D9D9D9');
    grid.position.y = 0.001;
    scene.add(grid);
};

const createLights = (scene) => {
    scene.add(new HemisphereLight('#FFFFFF', '#B8A9BF', 1.6));
    const sun = new DirectionalLight('#FFFFFF', 2.2);
    sun.position.set(2, 4, 3);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -1.5;
    sun.shadow.camera.right = 1.5;
    sun.shadow.camera.top = 2.2;
    sun.shadow.camera.bottom = -0.5;
    scene.add(sun);
};

export const createStage = (container) => {
    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const scene = new Scene();
    scene.background = new Color(BACKGROUND);
    createLights(scene);
    createFloor(scene);

    const camera = new PerspectiveCamera(35, 1, 0.05, 50);
    camera.position.set(1.8, 1.5, 3.6);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, TARGET_Y, 0);
    controls.enableDamping = true;
    controls.minDistance = 1;
    controls.maxDistance = 7;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.update();

    const resize = () => {
        const { clientWidth, clientHeight } = container;
        if (!clientWidth || !clientHeight) return;
        renderer.setSize(clientWidth, clientHeight);
        camera.aspect = clientWidth / clientHeight;
        camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    const timer = new Timer();
    timer.connect(document);

    const start = (onFrame) => {
        renderer.setAnimationLoop(() => {
            timer.update();
            onFrame(timer.getDelta());
            controls.update();
            renderer.render(scene, camera);
        });
    };

    const dispose = () => {
        renderer.setAnimationLoop(null);
        observer.disconnect();
        timer.dispose();
        controls.dispose();
        scene.traverse((object) => {
            if (object.isMesh) {
                object.geometry.dispose();
                object.material.dispose();
            }
        });
        renderer.dispose();
        renderer.domElement.remove();
    };

    return { scene, start, dispose };
};

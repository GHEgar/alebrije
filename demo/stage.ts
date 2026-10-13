import {
    CircleGeometry, Color, DirectionalLight, GridHelper, HemisphereLight, Mesh, MeshStandardMaterial,
    PerspectiveCamera, Scene, SRGBColorSpace, Timer, WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export interface Stage {
    scene: Scene;
    start: (onFrame: (delta: number) => void) => void;
    dispose: () => void;
}

const createFloor = (scene: Scene): void => {
    const floor = new Mesh(new CircleGeometry(1.4, 48), new MeshStandardMaterial({ color: '#dfe5ea', roughness: 1 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    const grid = new GridHelper(2.8, 14, '#94a3b8', '#cbd5e1');
    grid.position.y = 0.001;
    scene.add(grid);
};

const createLights = (scene: Scene): void => {
    scene.add(new HemisphereLight('#ffffff', '#a8b5c2', 1.6));
    const sun = new DirectionalLight('#ffffff', 2.2);
    sun.position.set(2, 4, 3);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -1.5, right: 1.5, top: 2.2, bottom: -0.5 });
    scene.add(sun);
};

export const createStage = (container: HTMLElement): Stage => {
    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const scene = new Scene();
    scene.background = new Color('#f1f5f9');
    createLights(scene);
    createFloor(scene);

    const camera = new PerspectiveCamera(35, 1, 0.05, 50);
    camera.position.set(1.8, 1.5, 3.6);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.9, 0);
    controls.enableDamping = true;
    controls.minDistance = 1;
    controls.maxDistance = 7;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.update();

    const resize = (): void => {
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

    return {
        scene,
        start(onFrame) {
            renderer.setAnimationLoop(() => {
                timer.update();
                onFrame(timer.getDelta());
                controls.update();
                renderer.render(scene, camera);
            });
        },
        dispose() {
            renderer.setAnimationLoop(null);
            observer.disconnect();
            timer.dispose();
            controls.dispose();
            renderer.dispose();
            renderer.domElement.remove();
        },
    };
};
